const mongoose = require('../server')
const { startjob, stopjob, remove, savejob, getData } = require('./utils/ProjectMethods')

var Schema = mongoose.Schema
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
})

project.pre('save', savejob)
project.pre('remove', remove)

project.methods.startjob = startjob
project.methods.stopjob = stopjob
project.methods.getData = getData

module.exports = mongoose.model('Project', project)