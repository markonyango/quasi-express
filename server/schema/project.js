const mongoose = require('../server');
const { fork } = require('child_process');
const path = require('path');
const to = require('../../catchError');
const { startjob, stopjob, removejob, setSettings, getSettings } = require('./utils/JobMethods');

const types = new Map([
    ['qa', 'Quality Assessment'],
    ['dea', 'Differential Expression Analysis'],
    ['align', 'Alignment']
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
        type: {},
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
        type: Schema.ObjectId,
        required: true,
        ref: 'User'
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

project.methods.startjob = startjob;
project.methods.stopjob = stopjob;
project.methods.removejob = removejob;
project.methods.setSettings = setSettings;
project.methods.getSettings = getSettings;

module.exports = mongoose.model('Project', project);