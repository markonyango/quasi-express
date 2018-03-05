const { fork } = require('child_process');
const path = require('path');
const color = require('colors');
const fs = require('fs-extra');
const { uploadPath } = require('../../../settings');
const printOut = require('../../../printOut');

const types = new Map([
    ['qa', 'Quality Assessment'],
    ['dea', 'Differential Expression Analysis'],
    ['align', 'Alignment']
]);


function stopjob () {
    var project = this;

    project.status = 'stopped';
    project.pid = null;
    process.emit('stop', project._id);

    return new Promise((resolve, reject) => {
        project.save()
            .then(project => {
                console.log(`${project._id} stopped`.red)
                resolve(project)
            })
            .catch(error => {
                console.error(`${printOut(__filename)} Something went wrong while stopping project ${project._id}: ${error}`.red)
                reject(error)
            })
    })
}

function startjob () {
    var project = this;
    var job_handler;

    // Which Executor should be forked, according to the project type
    switch (project.projecttype) {
        case 'qa':
            job_handler = path.join(__dirname, '../executors/qa.js');
            break;
        case 'dea':
            job_handler = path.join(__dirname, '../executors/qa.js');
            break;
        case 'align':
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
    forked.send({
        msg: 'project',
        document: project
    });


    // Create the listener that will respond to user-triggered stop events
    // This sends 'stop' to the child which will exit with code 0 as this premature
    // stopping of the project was intended by the user
    process.on('stop', function (pID) {
        if ((pID.toString() === project._id.toString()) && project.status === 'running') {
            forked.send({ msg: 'stop' })
        } else {
            console.error(`${printOut(__filename)} There is no process with that ID hence it can not be stopped!`.red)
        }
    });

    // Creating the listener that will catch any errors from the child_process
    forked.on('error', (msg) => {
        project.status = 'failed';
        project.save()
            .then(project => {
                console.error(`${printOut(__filename)} Something went wrong while trying to start the child_process: ${msg}`.red)
            })
            .catch(error => {
                console.error(`${printOut(__filename)} Something went wrong while updating projects status to failed: ${error}`.red)
            })
    });

    // Create the listener that reacts to messages from the child
    forked.on('message', async function (msg) {
        switch (msg.msg) {
            case 'done':
                console.log(`${printOut(__filename)} Recieved 'done'`.cyan);
                forked.send({ msg: 'stop' });
                project.status = 'done';
                project.pid = null;
                project.save()
                    .then(project => {
                        console.log(`${printOut(__filename)} Saving project status: ${project.status}`.cyan)
                    })
                    .catch(error => {
                        console.error(`${printOut(__filename)} Something went wrong while updating projects status to failed: ${error}`.red)
                    })
                break;
            case 'error':
                console.error(`${printOut(__filename)} Recieved 'error': ${msg.error}. Killing job`.red)
                forked.send({ msg: 'kill' })
                project.status = 'failed'
                project.pid = null
                project.save()
                    .then(project => {
                        console.error(`${printOut(__filename)} Saving project status: ${project.status}`.cyan)
                    })
                    .catch(error => {
                        console.error(`${printOut(__filename)} Something went wrong while updating projects status to failed: ${error}`.red)
                    })
                break;
            default:
                break;
        }
    })

    project.pid = forked.pid;
    project.status = 'running';

    return new Promise((resolve, reject) => {
        project.save()
            .then(project => {

                forked.send({ msg: 'start' });
                resolve(project)
            })
            .catch(error => {
                console.error(`${printOut(__filename)} Something went wrong while starting project ${project._id}: ${error}`.red)
                reject(error)
            })
    })



    return error ? error : res;
}

function removejob() {
    let project = this;

    if (project.status === 'running') {
        console.log(`${printOut(__filename)} Stopping project before deletion...`.cyan)
        process.emit('stop', project._id);
    }

    return new Promise((resolve, reject) => {
        project.remove()
            .then(project => resolve(project))
            .catch(error => {
                console.error(`${printOut(__filename)} Something went wrong while removing project document ${project._id}: ${error}`.red)
                reject(error)
            })
    })
}

function savejob(next) {
    var project = this;
    if (project.isNew) {
        // Build users directory path
        let savePath = path.join(uploadPath, project.uid.toString(), project._id.toString())
        fs.mkdir(savePath)
            .then(res => fs.createFile(path.join(savePath, 'logfile.txt')))
            .then(res => fs.createFile(path.join(savePath, 'error.txt')))
            .then(res => {
                console.log(`${printOut(__filename)} New project directory has been created: ${savePath}.`.cyan)
                project.savePath = savePath
                next()
            })
            .catch(error => {
                console.error(`${printOut(__filename)} Something went wrong during project folder creation for project ${project._id}: ${error}`.red)
                next(`${printOut(__filename)} Something went wrong during project folder creation for project ${project._id}: ${error}`)
            })
    } else {
        next()
    }
}

function getData() {
    let project = this;
    return new Promise((resolve, reject) => {
        if (project.status === 'done') {
            // Let's append the path to the logfile to the response json
            // View will make it available as download
            let projectDirectory = project.savePath
            let logfile = fs.readdir(projectDirectory, (error, files) => {
                if (error) {
                    console.error(`Something went wrong while appending logfiles of project ${project._id} path to response JSON : ${error}`)
                    reject(error)
                } else {
                    let logfiles = files.filter(file => (file.indexOf('log') >= 0 || file.indexOf('error') >= 0) ? true : false)
                    // Since project is a MongoDB document we need to extract the _doc object and then merge it 
                    // with the logfiles array
                    resolve(Object.assign({ ...project }._doc, { logfiles: logfiles }))
                }
            })
        } else {
            resolve(project)
        }
    })

}



module.exports = {
    startjob,
    stopjob,
    removejob,
    savejob,
    getData
}