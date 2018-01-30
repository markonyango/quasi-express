const mongoose = require('../server');
const { fork } = require('child_process');
const path = require('path');
const to = require('../../catchError');
const colors = require('colors');

const types = new Map([
    ['qa', 'Quality Assessment'],
    ['dea', 'Differential Expression Analysis']
]);

var Schema = mongoose.Schema;
var project = new Schema({
    projectname: {
        type: String,
        required: true
    },
    projecttype: {
        type: String,
        required: true
    },
    settings: {
        type: [],
        required: true
    },
    files: {
        type: [],
        required: true
    },
    status: {
        type: String,
        enum: ['running', 'queued', 'done', 'failed', 'stopped'],
        required: true
    },
    uid: {
        type: Schema.Types.ObjectId,
        required: true
    },
    pid: {
        type: Number,
        default: 0
    },
    created: {
        type: Date,
        default: Date.now
    }
});

project.pre('save',
    function (next) {
        var project = this;
        if (types.has(project.projecttype)) {
            project.projecttype = types.get(project.projecttype);
        }

        next();
    }, error => {
        console.log(error);
    });

project.methods.startjob = async function () {
    var forked;
    var project = this;

    const job_handler = path.join(__dirname, '../run_project.js');
    forked = fork(job_handler);
    forked.send('start');


    // Create the listener that will respond to user-triggered stop events
    process.on('stop', function (project_id) {
        project_id.toString() === project._id.toString() ? forked.send('stop') : null;
    });

    // Creating the listener that will wait until the child_process is done
    forked.on('exit', async (code, signal) => {
        if (code === 0) {
            project.status = 'done';
            let [error, result] = await to(project.save());
            error ? console.log('Something went wrong while updating projects status to done: ' + error) : null;
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
            console.log(msg);
        }
    })

    project.pid = forked.pid;
    project.status = 'running';
    let [error, res] = await to(project.save());

    return error ? error : res;
}

project.methods.stopjob = async function () {
    var project = this;

    project.status = 'stopped';
    project.pid = null;
    process.emit('stop', project._id);

    let [error, res] = await to(project.save());

    error ? console.log('Something went wrong while trying to stop your project: ' + error) : console.log(`${project._id} stopped`.red);

    return error ? error : res;
}

project.methods.removejob = async function () {
    var project = this;

    if (project.status === 'running') {
        console.log('Stopping project before deletion...')
        process.emit('stop', project._id);
    }

    let [error, res] = await to(project.remove());

    return error ? error : res;
}

module.exports = mongoose.model('Project', project);