const { parent2child, onExit, startSubject, projectSubject } = require('./parent2child');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const Rx = require('rxjs/Rx');
const colors = require('colors');
const path = require('path');
const Job = require('../utils/Job');
const { uploadPath, alignReferenceFolder } = require('../../../settings');


// This event listener will handle all commands that are sent to this child via IPC
process.on('message', parent2child);

// This even listener will handle exit behavior
process.on('exit', onExit)

// Since we don't know when the settings will be transmitted (usually shortly after the fork),
// we will 'observe' the Subjects for changes. $ marks Observables
var projectObservable$ = new Rx.Observable.from(projectSubject);
var startObservable$ = new Rx.Observable.from(startSubject);


// Observables have to be subscribed to, to make them hot observables
// Use Observable.zip to combine the two observables into a new one
Rx.Observable.zip(
  projectObservable$,
  startObservable$,
  (project) => (project)
)
  .subscribe(
    async document => {
      const job = new Job(document);
      let check = await job.preFlight();
      let settings = job.document.settings;
      let savePath = job.savePath;
      let preTrim = settings.preTrim || 0;
      let postTrim = settings.postTrim || 0;
      let mismatches = settings.mismatches || 0;
      let cores = await detectCores() || 1;
      let writeUnaligned = settings.writeUnaligned || null;
      let reference = settings.reference;

      // Create absolute path to alignReferenceFolder + reference filename
      reference = path.join(alignReferenceFolder, path.basename(reference, '.fasta'))

      if (check) {
        for (var file of document.files) {
          try {
            // Get the absolute path to the file
            const filePath = path.join(uploadPath, file);

            // Get the basename and extension of the file
            const ext = path.extname(filePath);
            const basename = path.basename(filePath, ext);

            // Execute the Quality Assessment for this file
            // Output gets written to stdout AFTER the program finishes
            let cmd = `bowtie -3 ${preTrim} -5 ${postTrim} -v ${mismatches} -y -p ${cores} -m 1 --norc --best -S `;

            if (writeUnaligned) {
              cmd += `--un ${savePath}/unaligned_${basename}.fq `;
            }
            cmd += `${reference} ${filePath} ${savePath}/${basename}.sam`
            job.logfile.write(`Executing bowtie for for file ${file} with cmd ${cmd}`);
            const { stderr } = await exec(cmd);

            job.logfile.write(stderr + '\n');

            // Move output files to the savePath folder
            await job.saveOutput();

          } catch (error) {
            job.logfile.write(error.toString());
            process.send({ msg: 'error', error: `saveOutput: ${error}` });
            return
          }
        }

        // Tell the parent that we are done with the job
        process.send({ msg: 'done' });

        // Properly close the logfile at the end
        job.logfile.end();
      } else {
        process.send({ msg: 'error', error: `Encountered an error during project execution pre-flight!` });
      }
    },
    error => console.error(new Error(error))
  )


function detectCores() {
  return exec('grep -c ^processor /proc/cpuinfo').then(res => Number.parseInt(res.stdout))
}