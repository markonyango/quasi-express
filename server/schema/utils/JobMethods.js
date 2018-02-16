const { fork } = require('child_process');
const path = require('path');
const to = require('../../../catchError');
const color = require('colors');
const fs = require('fs-extra');
const { uploadPath } = require('../../../settings');


var stopjob = async function () {
    var project = this;

    project.status = 'stopped';
    project.pid = null;
    process.emit('stop', project._id);

    let [error, res] = await to(project.save());

    error ? console.log(`Something went wrong while trying to stop your project: ${error}`.red) : console.log(`${project._id} stopped`.red);

    return error ? error : res;
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
        default:
            const error = new Error('Could not identify the project type of the project to be started.')
            return error;
    }


    // Fork Executor into new Node instance. IPC channel will be opened
    const forked = fork(job_handler);

    // Send this document via IPC to the forked child
    // but populate the 'uid' path with the user settings first
    try {
        await project.populate('uid', 'settings').execPopulate()
    } catch (error) {
        console.error(`Could not populate document: ${error}`.red)
    }
    forked.send({
        msg: 'project',
        document: project
    });

    // Create the listener that will respond to user-triggered stop events
    process.on('stop', function (project_id) {
        project_id.toString() === project._id.toString() ? forked.send({ msg: 'stop' }) : null;
    });

    // Creating the listener that will catch any errors from the child_process
    forked.on('error', async (msg) => {
        project.status = 'failed';
        let [error, result] = await to(project.save());
        error ?
            console.log(`Something went wrong while updating projects status to failed: ${error}`.red) : 
            console.log(`Something went wrong while trying to start the child_process: ${msg}`.red);
    });

    // Create the listener that reacts to messages from the child
    forked.on('message', async function (msg) {
        switch (msg.msg) {
            case 'done':
                console.log('Recieved \'done\'');
                forked.send({ msg: 'stop' });
                project.status = 'done';
                try {
                    await project.save();
                } catch (error) {
                    console.log(`Something went wrong while updating projects status to failed: ${error}`.red);
                }
                break;
            case 'error':
                console.error(`Recieved 'error': ${msg.error}. Killing job`.red);
                forked.send({ msg: 'kill' });
                project.status = 'failed';
                try {
                    await project.save();
                } catch (error) {
                    console.log(`Something went wrong while updating projects status to failed: ${error}`.red);
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
        console.log('Stopping project before deletion...'.red)
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
            console.error(`Something went wrong while cleaning up the project ${project._id}: ${error}`.red)
            return error;
        }

    } catch (error) {
        console.error(`Something went wrong while cleaning up the project ${project._id}: ${error}`.red);
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