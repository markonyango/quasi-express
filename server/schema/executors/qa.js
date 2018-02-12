const { parent2child, startSubject, projectSubject } = require('./parent2child');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const Rx = require('rxjs/Rx');
const colors = require('colors');
const path = require('path');
const fs = require('fs-extra');



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
    async document => {
      // Create the logfile for this job
      const savePath = document.uid.settings.save_path;
      try{
        await fs.ensureDir(savePath);
      } catch(error){
        console.error('Can\'t create save folder. Check your permissions!')
        process.send({msg: 'error'});
      }
      const date = Date.now().toString();
      const logfile = fs.createWriteStream(path.join(savePath, date + '-qa-log.txt'));

      for (var file of document.files) {
        try {
          // Get the absolute path to the file
          const filePath = path.join(__dirname, '../../../uploads', file);

          // Execute the Quality Assessment for this file
          // Output gets saved to stdout AFTER the program finishes
          const { stdout } = await exec('qa ' + filePath);
          logfile.write(stdout);

          // Move output files to the savePath folder
          await fs.move(filePath + '_base_dist.txt', path.join(savePath, file + '_base_dist.txt'));
          await fs.move(filePath + '_boxplotdata.txt', path.join(savePath, file + '_boxplotdata.txt'));
          await fs.move(filePath + '_length_dist.txt', path.join(savePath, file + '_length_dist.txt'));
          await fs.move(filePath + '_phred_dist.txt', path.join(savePath, file + '_phred_dist.txt'));

          // Delete original files from the uploads folder
          await fs.remove(filePath);
        } catch (error) {
          logfile.write(error);
          process.send({ msg: 'error' });
        }
      }

      // Tell the parent that we are done with the job
      // TODO: Make sure this can only be reached if every
      // file was truly processed
      process.send({ msg: 'done' });

      // Properly close the logfile at the end
      logfile.end();
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