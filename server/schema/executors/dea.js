const { parent2child, onExit, startSubject, projectSubject } = require('./parent2child')
const exec = require('util').promisify(require('child_process').exec)
const Rx = require('rxjs/Rx')
const path = require('path')
const fs = require('fs-extra')
const Job = require('../utils/Job')

// This event listener will handle all commands that are sent to this child via IPC
process.on('message', parent2child)

// This even listener will handle exit behavior
process.on('exit', onExit)

// Since we don't know when the settings will be transmitted (usually shortly after the fork),
// we will 'observe' the Subjects for changes. $ marks Observables
var projectObservable$ = new Rx.Observable.from(projectSubject)
var startObservable$ = new Rx.Observable.from(startSubject)

// Observables have to be subscribed to, to make them hot observables
// Use Observable.zip to combine the two observables into a new one
Rx.Observable.zip(projectObservable$, startObservable$, project => project).subscribe(
  projectDocument => {
    const job = new Job(projectDocument)
    let check = job.preFlight()
    let { countMatrixFile, conditions, pairwise, correlateSamples, significanceLevel } = job.settings
    let pkg = job.settings.package /* Since package is a reserved keword we need to extract it here */
    let matrixFile = path.join(path.dirname(job.savePath),countMatrixFile,'matrix.txt')

    if (check) {
      exec(`${path.join(__dirname, '/R/dea.R')} ${job.savePath} ${matrixFile} "${conditions}" "${pairwise}" ${pkg} ${correlateSamples} ${significanceLevel}`, 
        (error, stdout, stderr) => {
          job.logfile.end(stdout)
          job.errorfile.end(stderr)
          process.send({ msg: 'done'})
      })
    } else {
      process.send({
        msg: 'error',
        error: `Encountered an error during project execution pre-flight!`
      })
    }
  },
  error => console.error(new Error(error))
)
