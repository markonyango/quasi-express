const mongoose = require('../server');
const { fork } = require('child_process');
const path = require('path');

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

    forked.on('exit', () => {
        project.status = 'done';
        project.save()
    });

    project.pid = forked.pid;
    project.status = 'running';
    const res = await project.save();

    return res;
}

project.methods.stopjob = async function () {
    var project = this;

    project.status = 'stopped';
    project.pid = 0;
    const res = await project.save();

    return res;
}

project.methods.remove = async function () {
    var project = this;

    project.remove()
}

module.exports = mongoose.model('Project', project);