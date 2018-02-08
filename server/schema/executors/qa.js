const { parent2child, startSubject, projectSubject } = require('./parent2child');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const Rx = require('rxjs/Rx');
const colors = require('colors');
const path = require('path');
const fs = require('fs');



// This even listener will handle all commands that are sent to this child via IPC
process.on('message', parent2child);

// Since we don't know when the settings will be transmitted (usually shortly after the fork),
// we will 'observe' the Subjects for changes. $ marks Observables
var projectObservable$ = new Rx.Observable.from(projectSubject);
var startObservable$ = new Rx.Observable.from(startSubject);


// Observables have to be subscribed to, to make them hot observables
// Use Observable.zip to combine the two observables into a new one
var sub = Rx.Observable.zip(
    projectObservable$,
    startObservable$,
    (project) => (project)
)
    .subscribe(
    document => {
        (async () => {
            for (var file of document.files) {
                try {
                    // TODO: Only if folder does not exist
                    const savePath = path.join(document.uid.settings.save_path,'qa');
                    fs.mkdirSync(path.join(savePath,'qa'));
                    const filePath = path.join(__dirname,'../../../uploads',file)
                    const { stdout } = await exec('cd ' + savePath + '&& qa ' + filePath)
                    const date = Date.now().toString();
                    const logfile = fs.createWriteStream(path.join(savePath,date+'-log.txt'));
                    logfile.write(stdout);
                    logfile.end();
                    console.log(stdout.yellow)
                    process.send({ msg: 'done' });
                } catch (error) {
                    console.log(error)
                    process.exit(1);
                }
            }
        })()
    },
    error => console.log(new Error(error))
    )


process.on('exit', function (code) {
    sub.unsubscribe();
    if (code) {
        console.log(`Process ${process.pid} is exiting with code ${code}`.red.bold)
    } else {
        console.log(`Process ${process.pid} is exiting gracefully`.green.bold)
    }
})