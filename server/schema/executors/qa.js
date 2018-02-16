const { parent2child, startSubject, projectSubject } = require('./parent2child');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const Rx = require('rxjs/Rx');
const colors = require('colors');
const path = require('path');
const Job = require('../utils/Job');
const { uploadPath } = require('../../../settings');


// This event listener will handle all commands that are sent to this child via IPC
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
    async document => {
      const job = new Job(document);
      let check = true;

      check = check ? await job.setSaveFolder() : false;
      check = check ? await job.setLogFile() : false;

      if (check) {
        for (var file of document.files) {
          try {
            // Get the absolute path to the file
            const filePath = path.join(uploadPath, file);

            // Execute the Quality Assessment for this file
            // Output gets saved to stdout AFTER the program finishes
            const { stdout } = await exec('qa ' + filePath);
            job.logfile.write(stdout);

            // Move output files to the savePath folder
            await job.saveOutput(
              filePath,
              filePath + '_base_dist.txt',
              filePath + '_boxplotdata.txt',
              filePath + '_length_dist.txt',
              filePath + '_phred_dist.txt',
            );

          } catch (error) {
            job.logfile.write(error.toString());
            process.send({ msg: 'error', error: `${error}` });
          }
        }
        
        // Tell the parent that we are done with the job
        process.send({ msg: 'done' });

        // Properly close the logfile at the end
        job.logfile.end();
      } else {
        process.send({ msg: 'error', error: 'Could not set up logfile. Check your permissions!' });
      }
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