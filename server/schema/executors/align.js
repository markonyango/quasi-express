const { parent2child, onExit, startSubject, projectSubject } = require('./parent2child')
const { exec } = require('child_process')
const Rx = require('rxjs/Rx')
const colors = require('colors')
const path = require('path')
const os = require('os')
const Job = require('../utils/Job')
const { uploadPath, alignReferenceFolder } = require('../../../settings')


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
  .subscribe(document => {
    const job = new Job(document)
    let check = job.preFlight()
    let {
      preTrim,
      postTrim,
      mismatches,
      writeUnaligned,
      reference
    } = job.document.settings
    let cores = os.cpus().length


    // Create absolute path to alignReferenceFolder + reference filename
    reference = path.join(alignReferenceFolder, path.basename(reference, '.fasta'))

    if (check) {
      for (var file of document.files) {
        // Get the absolute path to the file
        const filePath = path.join(job.savePath, file)

        // Get the basename and extension of the file
        const ext = path.extname(filePath)
        const basename = path.basename(filePath, ext)

        let cmd = `bowtie -3 ${preTrim} -5 ${postTrim} -v ${mismatches} -y -p ${cores} -m 1 --norc --best -S `

        if (writeUnaligned) {
          cmd += `--un ${job.savePath}/unaligned_${basename}.fq `
        }
        cmd += `${reference} ${filePath} ${job.savePath}/${basename}.sam`
        job.logfile.write(`Executing bowtie for for file ${file} with cmd ${cmd}`)
        exec(cmd, function (error, stdout, stderr) {
          // Don't ask wether stderr has data as some programs output non-errors to stderr for whatever reason....
          if ((error && stderr) || stdout === undefined) {
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

            // Tell the parent that we are done with the job
            process.send({ msg: 'done' })
          }
        })
      }
    } else {
      process.send({ msg: 'error', error: `Encountered an error during project execution pre-flight!` })
    }
  },
    error => console.error(new Error(error))
  )
