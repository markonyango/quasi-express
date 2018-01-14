const mongoose = require('../server');
const spawn = require('child_process');

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
        enum: ['running','queued','done','failed'],
        required: true
    },
    uid: {
        type: Schema.Types.ObjectId,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

project.pre('save', function(next) {
    var project = this;
    project.projecttype = types.get(project.projecttype);

    next();
});

project.methods.start = function () {
    console.log(`project start output:\n${this}`);
}

var Project = mongoose.model('Project', project);

module.exports = Project;