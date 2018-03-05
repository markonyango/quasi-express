const path = require('path')
const fs = require('fs-extra')
const mongoose = require('../server')
const { uploadPath } = require('../../settings')
const { startjob, stopjob, removejob, savejob, getData } = require('./utils/ProjectMethods')

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
    },
    savePath: {
        type: String, 
        default: ''
    }
});

project.pre('save', savejob, error => console.log(error))

project.methods.startjob = startjob
project.methods.stopjob = stopjob
project.methods.removejob = removejob
project.methods.getData = getData

module.exports = mongoose.model('Project', project)