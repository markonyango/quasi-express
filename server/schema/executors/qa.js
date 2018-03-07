const { parent2child, onExit, startSubject, projectSubject } = require('./parent2child')
const { exec } = require('child_process')
const Rx = require('rxjs/Rx')
const colors = require('colors')
const path = require('path')
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
Rx.Observable.zip(
  projectObservable$,
  startObservable$,
  (project) => (project)
)
  .subscribe(
    projectDocument => {
      const job = new Job(projectDocument)
      let check = job.preFlight()

      if (check) {
        exec(`${path.join(__dirname, '/R/qa.R')} ${job.savePath} ${[...projectDocument.files]}`, (error, stdout, stderr) => {
          // Don't ask wether stderr has data as some programs output non-errors to stderr for whatever reason....
          if ((error && stderr) ||  stdout === undefined) {
            console.error(error.yellow)
            job.errorfile.write(stderr)
            job.errorfile.write(error)
            stdout ? job.logfile.write(stdout) : ''
            job.errorfile.end()
            job.logfile.end()
            process.send({ msg: 'error', error: error })
          } else {
            console.log(stdout.yellow)
            job.logfile.write(stdout)
            job.errorfile.end()
            job.logfile.end()
            process.send({ msg: 'done' })            
          }
        })
      } else {
        process.send({ msg: 'error', error: `Encountered an error during project execution pre-flight!` })
      }
    },
    error => console.error(new Error(error))
  )
