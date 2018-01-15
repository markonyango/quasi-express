const mongoose = require('../server');
const { spawn } = require('child_process');
const { exec } = require('child_process');
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
        enum: ['running','queued','done','failed'],
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

project.pre('save', function(next) {
    var project = this;
    project.projecttype = types.get(project.projecttype);

    next();
});

project.methods.startjob = function () {
    var child;
    if(process.platform.search('^win') !== -1) {
        child = spawn('ping',['-n 10 heise.de'],{shell: true});
    } else {
        child = spawn('ping',['-c 10 heise.de']);
    }

    const fs = require('fs');
    const out = fs.createWriteStream(path.join(__dirname, 'outfile.txt'));

    child.stdout.pipe(out);
    
    child.stdout.on('data', (data) => {
        console.log(`data (${data.toString().length} | ${data.byteLength}): ${data.toString()}`);
        if(data.includes('5')) {
            if(process.platform.search('^win') !== -1 && !child.killed){
                try {
                    exec('taskkill /PID ' + child.pid + ' /F /T', function (error, stdout, stderr){
                        error ? console.log(`error: ${error}`) : '';
                        stdout ? console.log(`stdout: ${stdout}`) : '';
                        stderr ? console.log(`stderr: ${stderr}`) : '';
                    });
                } catch (error) {
                    console.log(error);
                }
                
            } else {
                process.kill(child.pid, 'SIGKILL');
            }
        }
    });
    child.on('exit', (status, signal) => console.log(`child exit status: ${status} and signal ${signal}`));
    child.on('close', (code, signal) => console.log(`child closed with code ${code} and signal ${signal}`));
    child.on('error', (error) => console.log(`child exited with error: ${error}`));
}

module.exports = mongoose.model('Project', project);