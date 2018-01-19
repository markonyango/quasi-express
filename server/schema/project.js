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

project.methods.startjob = function () {
    var child,
        project = this;

    if (process.platform.search('^win') !== -1) {
        child = spawn('ping', ['-n 10 heise.de'], { shell: true });
    } else {
        child = spawn('ping', ['-c 10 heise.de'], { shell: true });
    }

    child.once('data', () => { project.status = 'running'; project.save() });

    const fs = require('fs');
    const out = fs.createWriteStream(path.join(__dirname, 'outfile.txt'));

    //child.stdout.pipe(out);

    out.on('error', (error) => console.log(`Error occured:\n${error}`));
    out.on('pipe', (src) => console.log(src + 'piped'));
    out.on('unpipe', (src) => console.log(src + 'unpiped'));
    out.on('finish', () => console.log('Out: finish'));
    out.on('end', () => console.log('Out: end'));


    child.stdout.on('data', (data) => {
        process.stdout.write(`data (${data.toString().length} | ${data.byteLength}): ${data.toString()}`);
        out.write(data);
        if (data.includes('5')) {
            if (process.platform.search('^win') !== -1 && !child.killed) {
                try {
                    exec('taskkill /PID ' + child.pid + ' /F /T', function (error, stdout, stderr) {
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
    // child.on('exit', (code, signal) => console.log(`child exit code: ${code} and signal ${signal}`));
    child.on('exit', (code, signal) => {
        switch(code) {
            case 0:
            out.write(`child closed with code ${code} and signal ${signal}`,(data) => console.log(`write function: ${data}`));
            out.close();
            break;

            default:
            out.write(`child (${child.pid}) did not go down quietly! Exit code was ${code} - ${signal}`,(data) => console.log(data));
            out.close();
            break;
        }
            
        
    });
    child.on('error', (error) => console.log(`child exited with error: ${error}`));
}

module.exports = mongoose.model('Project', project);