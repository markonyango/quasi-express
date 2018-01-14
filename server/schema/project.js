const mongoose = require('../server');
const { spawn } = require('child_process');
const cp = require('child_process');

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

project.methods.startjob = async function () {
    const child = spawn('node',['test.js']);
    console.log(child.pid);
    
    child.stdout.on('data', (data) => {
        console.log(`data: ${data.toString()}`);
        if(data.includes('5')) {
            if(process.platform.search('^win') !== -1){
                try {
                    cp.exec('taskkill /PID ' + child.pid + '/F /T', function (error, stdout, sterr){
                        console.log(`error: ${error}`);
                        console.log(`stdout: ${stdout}`);
                        console.log(`stderr: ${stderr}`);
                    });
                } catch (error) {
                    console.log(error);
                }
                
            } else {
                process.kill(child.pid, 'SIGKILL');
            }
        }
    });
    child.on('exit', (status) => console.log(`child exit status: ${status}`));
    child.on('close', (code, signal) => console.log(`child closed with code ${code} and signal ${signal}`));
    child.on('error', (error) => console.log(`child exited with error: ${error}`));
}

const Project = module.exports = mongoose.model('Project', project);