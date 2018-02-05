const { fork } = require('child_process');
const path = require('path');
const to = require('../../catchError');


var stopjob = async function () {
    var project = this;

    project.status = 'stopped';
    project.pid = null;
    process.emit('stop', project._id);

    let [error, res] = await to(project.save());

    error ? console.log('Something went wrong while trying to stop your project: ' + error) : console.log(`${project._id} stopped`.red);

    return error ? error : res;
}

var startjob = async function (usersettings) {
    var project = this;
    const job_handler = path.join(__dirname, '../run_project.js');
    const forked = fork(job_handler);
    forked.send({ 
        msg: 'settings', 
        projectsettings: project.settings, 
        usersettings: usersettings
    });
    forked.send({ msg: 'start' });


    // Create the listener that will respond to user-triggered stop events
    process.on('stop', function (project_id) {
        project_id.toString() === project._id.toString() ? forked.send({ msg: 'stop' }) : null;
    });

    // Creating the listener that will wait until the child_process is done
    forked.on('exit', async (code, signal) => {
        if (code === 0) {
            project.status = 'done';
            let [error, result] = await to(project.save());
            error ? console.log('Something went wrong while updating projects status to done: ' + error) : '';
        } else {
            project.status = 'failed';
            let [error, result] = await to(project.save());
            error ? console.log('Something went wrong while updating projects status to done: ' + error) : null;
            console.log(`child ${forked.pid} closed with code ${code} and signal ${signal}`);
        }
    });

    // Creating the listener that will catch any errors from the child_process
    forked.on('error', async (msg) => {
        project.status = 'failed';
        let [error, result] = await to(project.save());
        error ? console.log('Something went wrong while updating projects status to failed: ' + error) : null;

        console.log('Something went wrong while trying to start the child_process: ' + msg);
    });

    // Create the listener that reacts to messages from the child
    forked.on('message', async function (msg) {
        if (msg.msg && msg.msg === 'Done') {
            console.log('Recieved \'done\'')
            forked.send({ msg: 'stop' })
        }
    })

    project.pid = forked.pid;
    project.status = 'running';
    let [error, res] = await to(project.save());

    return error ? error : res;
}

var removejob = async function () {
    var project = this;

    if (project.status === 'running') {
        console.log('Stopping project before deletion...')
        process.emit('stop', project._id);
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