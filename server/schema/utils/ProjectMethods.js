const { fork } = require('child_process')
const path = require('path')
const color = require('colors')
const fs = require('fs-extra')
const rimraf = require('rimraf')
const { uploadPath } = require('../../../settings')
const printOut = require('../../../printOut')


function stopjob() {
    var project = this
    return new Promise((resolve, reject) => {
        project.status = 'stopped'
        project.pid = null
        process.emit('stop', project._id)
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

function startjob() {
    var project = this
    var job_handler

    // Which Executor should be forked, according to the project type
    switch (project.projecttype) {
        case 'qa':
            job_handler = path.join(__dirname, '../executors/qa.js')
            break
        case 'dea':
            job_handler = path.join(__dirname, '../executors/qa.js')
            break
        case 'align':
            job_handler = path.join(__dirname, '../executors/align.js')
            break
        default:
            return Error('Could not identify the project type of the project to be started.')
    }


    // Fork Executor into new Node instance. IPC channel will be opened
    const forked = fork(job_handler)

    // Send this document via IPC to the forked child
    // but populate the 'uid' path with the user settings first
    forked.send({
        msg: 'project',
        document: project
    })


    // Create the listener that will respond to user-triggered stop events
    // This sends 'stop' to the child which will exit with code 0 as this premature
    // stopping of the project was intended by the user
    process.on('stop', function (pID) {
        if ((pID.toString() === project._id.toString()) && project.status === 'running') {
            forked.send({ msg: 'stop' })
        } else {
            console.error(`${printOut(__filename)} There is no process with that ID hence it can not be stopped!`.red)
        }
    })

    // Creating the listener that will catch any errors from the child_process
    forked.on('error', (msg) => {
        project.status = 'failed'
        project.save()
            .then(project => {
                console.error(`${printOut(__filename)} Something went wrong while trying to start the child_process: ${msg}`.red)
            })
            .catch(error => {
                console.error(`${printOut(__filename)} Something went wrong while updating projects status to failed: ${error}`.red)
            })
    })

    // Create the listener that reacts to messages from the child
    forked.on('message', async function (msg) {
        switch (msg.msg) {
            case 'done':
                console.log(`${printOut(__filename)} Recieved 'done'`.cyan)
                forked.send({ msg: 'stop' })
                project.status = 'done'
                project.pid = null
                project.save()
                    .then(project => {
                        console.log(`${printOut(__filename)} Saving project status: ${project.status}`.cyan)
                    })
                    .catch(error => {
                        console.error(`${printOut(__filename)} Something went wrong while updating projects status to failed: ${error}`.red)
                    })
                break
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
                break
            default:
                break
        }
    })

    return new Promise((resolve, reject) => {
        project.pid = forked.pid
        project.status = 'running'
        project.save()
            .then(project => {

                forked.send({ msg: 'start' })
                resolve(project)
            })
            .catch(error => {
                console.error(`${printOut(__filename)} Something went wrong while starting project ${project._id}: ${error}`.red)
                reject(error)
            })
    })
}

function remove(next) {
    let project = this

    if (project.status === 'running') {
        console.log(`${printOut(__filename)} Stopping project before deletion...`.cyan)
        process.emit('stop', project._id)
    }

    // Remove the projects folder
    rimraf(project.savePath, (error) => {
        if (error) {
            console.error(`${printOut(__filename)} Could not delete project folder: ${project.savePath}: ${error}`.red)
            next(Error(`${printOut(__filename)} Could not delete project folder: ${project.savePath}: ${error}`))
        } else {
            console.error(`${printOut(__filename)} Deleted project folder: ${project.savePath}`.cyan)
            next()
        }
    })
}

function savejob(next) {
    var project = this
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
    let project = this
    return new Promise((resolve, reject) => {
        if (project.status === 'done') {
            // Let's append the path to the logfile to the response json
            // View will make it available as download
            //let projectDirectory = project.savePath
            let errorFile = fs.readFile(path.join(project.savePath, 'error.txt'), 'utf8')
            let logFile = fs.readFile(path.join(project.savePath, 'logfile.txt'), 'utf8')
            Promise.all([errorFile, logFile])
                .then(([error, log]) => {
                    resolve(Object.assign({ ...project }._doc, { logfiles: [error, log] }))
                })
                .catch(error => {
                    console.error(`${printOut(__filename)} Could not read the logfiles for project ${project._id}: ${error}`.red)
                    reject(error)
                })
        } else {
            resolve(project)
        }
    })

}



module.exports = {
    startjob,
    stopjob,
    remove,
    savejob,
    getData
}