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
    process_id: {
        type: Number,
        default: 0
    },
    created: {
        type: Date,
        default: Date.now
    }
});

project.pre('save',
    function(next)  {
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

    project.status = 'running';
    const res = await project.save();
    console.log(res);
    
    const job_handler = path.join(__dirname,'../run_project.js');
    forked = fork(job_handler);
    forked.send('Hello');
}

module.exports = mongoose.model('Project', project);