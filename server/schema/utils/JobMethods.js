const { fork } = require('child_process');
const path = require('path');
const to = require('../../../catchError');
const color = require('colors');
const fs = require('fs-extra');
const { uploadPath } = require('../../../settings');
const getTime = require('./getTime');


var stopjob = async function () {
    var project = this;

    project.status = 'stopped';
    project.pid = null;
    process.emit('stop', project._id);

    try{
        await to(project.save());
        console.log(`${project._id} stopped`.red);
    } catch(error) {
        console.error(`${getTime()} Something went wrong while trying to stop your project: ${error}`.red)
        return error
    }
    
    return res
}

var startjob = async function () {
    var project = this;
    var job_handler;

    // Which Executor should be forked, according to the project type
    switch (project.projecttype) {
        case 'Quality Assessment':
            job_handler = path.join(__dirname, '../executors/qa.js');
            break;
        case 'Differential Expression Analysis':
            job_handler = path.join(__dirname, '../executors/qa.js');
            break;
        case 'Alignment':
            job_handler = path.join(__dirname, '../executors/align.js');
            break;
        default:
            const error = new Error('Could not identify the project type of the project to be started.')
            return error;
    }


    // Fork Executor into new Node instance. IPC channel will be opened
    const forked = fork(job_handler);

    // Send this document via IPC to the forked child
    // but populate the 'uid' path with the user settings first
    try {
        await project.populate('uid', 'settings').execPopulate();

        forked.send({
            msg: 'project',
            document: project
        });
    } catch (error) {
        console.error(`${getTime()} Could not populate document: ${error}`.red);
        return error
    }
    

    // Create the listener that will respond to user-triggered stop events
    process.on('stop', function (project_id) {
        if ((project_id.toString() === project._id.toString()) && project.status === 'running') {
            forked.send({ msg: 'stop' })
        } else { 
            console.error(`${getTime()} There is no process with that ID hence it can not be stopped!`.red)
         }
    });

    // Creating the listener that will catch any errors from the child_process
    forked.on('error', async (msg) => {
        project.status = 'failed';
        let error = await to(project.save());
        error ?
            console.error(`${getTime()} Something went wrong while updating projects status to failed: ${error}`.red) :
            console.error(`${getTime()} Something went wrong while trying to start the child_process: ${msg}`.red);
    });

    // Create the listener that reacts to messages from the child
    forked.on('message', async function (msg) {
        switch (msg.msg) {
            case 'done':
                console.log(`${getTime()} Recieved 'done'`.cyan);
                forked.send({ msg: 'stop' });
                project.status = 'done';
                project.pid = null;
                try {
                    await project.save();
                    console.log(`${getTime()} Saving project status: ${project.status}`.cyan);
                } catch (error) {
                    console.error(`${getTime()} Something went wrong while updating projects status to failed: ${error}`.red);
                }
                break;
            case 'error':
                console.error(`${getTime()} Recieved 'error': ${msg.error}. Killing job`.red);
                forked.send({ msg: 'kill' });
                project.status = 'failed';
                project.pid = null;
                try {
                    await project.save();
                    console.error(`${getTime()} Saving project status: ${project.status}`.cyan);
                } catch (error) {
                    console.error(`${getTime()} Something went wrong while updating projects status to failed: ${error}`.red);
                }
                break;
            default:
                break;
        }
    })

    project.pid = forked.pid;
    project.status = 'running';
    let [error, res] = await to(project.save());

    // Give the forked child the 'go-ahead'
    // Send start here so we don't create race conditions
    // for project.save() with the EventListeners
    forked.send({ msg: 'start' });

    return error ? error : res;
}

var removejob = async function () {
    var project = this;

    if (project.status === 'running') {
        console.log(`${getTime()} Stopping project before deletion...`.cyan)
        process.emit('stop', project._id);
    }

    // Remove every file in the servers upload folder belonging to that project
    try {
        let files = await fs.readdir(uploadPath);
        files.filter(file => file.indexOf(project._id) >= 0 ? true : false)
        let promiseArray = [];
        for (let file of files) {
            promiseArray.push(fs.remove(path.join(uploadPath, file)))
        }

        try {
            await Promise.all(promiseArray)
        } catch (error) {
            console.error(`${getTime()} Something went wrong while cleaning up the project ${project._id}: ${error}`.red)
            return error;
        }

    } catch (error) {
        console.error(`${getTime()} Something went wrong while cleaning up the project ${project._id}: ${error}`.red);
        return error;
    }

    let [error, res] = await to(project.remove());

    return error ? error : res;
}

/*
    @description Sets the settings of the current project document and saves the changes
    @param {object} Object containing projects settings
    @return Promise of the save function
*/
var setSettings = async function (settings) {
    var project = this;

    project.settings = settings;
    return await project.save();
}

/*
    @description Gets the settings of the current project document
    @return Object containing the settings of the project document
*/
var getSettings = async function () {
    var project = this;
    return project.settings
}

module.exports = {
    startjob,
    stopjob,
    removejob,
    setSettings,
    getSettings
}