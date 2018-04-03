const { parent2child, onExit, startSubject, projectSubject } = require('./parent2child')
const exec = require('util').promisify(require('child_process').exec)
const Rx = require('rxjs/Rx')
const path = require('path')
const os = require('os')
const Job = require('../utils/Job')
const sequentialPromises = require('../../../helpers/sequentialPromises')
const { alignReferenceFolder } = require('../../../settings')


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
  .subscribe(projectDocument => {
    const job = new Job(projectDocument)
    let check = job.preFlight()
    let {
      preTrim,
      postTrim,
      mismatches,
      writeUnaligned,
      reference
    } = job.settings
    let cores = os.cpus().length


    // Create absolute path to alignReferenceFolder + reference filename
    reference = path.join(alignReferenceFolder, path.basename(reference, '.fasta'))

    if (check) {
      let promiseArray = job.files.map(file => {
        // Get the absolute path to the file
        const filePath = path.join(job.savePath, '..', file)

        // Get the basename and extension of the file
        const ext = path.extname(filePath)
        const basename = path.basename(filePath, ext)

        let cmd = `bowtie --verbose -3 ${preTrim} -5 ${postTrim} -v ${mismatches} -y -p ${cores} -m 1 --norc --best -S `

        if (writeUnaligned) {
          cmd += `--un ${job.savePath}/unaligned_${basename}.fq `
        }
        cmd += `${reference} ${filePath} ${job.savePath}/${basename}.sam`

        // Push exec-Promisefunction into array for later sequential execution
        return (() => exec(cmd))
      })

      // Run samstat on the resulting SAM files
      let samstatArray = job.files.map(file => {
        let ext = path.extname(file)
        let SAMfile = file.replace(ext, '.sam')
        SAMfile = path.join(job.savePath, SAMfile)
        return (() => exec(`samstat ${SAMfile}`))
      })

      // Execute all Promises that are stored in the Promisearray
      sequentialPromises([...promiseArray,...samstatArray])
        // Make one single string out of all the returned stdouts and stderrs  
        .then(res => res.reduce((acc, curr) => {
          acc.stdout += curr.stdout
          acc.stderr += curr.stderr
          return acc
        }))
        .then(({ stdout, stderr }) => {
          /* Bowtie and samstat write to stderr for whatever reason...
          * Just in case something should ever be written to stdout
          * we are going to log it as well
          */
          job.logfile.write(stdout)
          job.logfile.write(stderr)
          job.logfile.end('End of logfile')
          job.errorfile.end()
          process.send({ msg: 'done' })
        })
        .catch(error => {
          job.errorfile.write(error.message)
          job.errorfile.end('End of errorfile')
          job.logfile.write('Error occured!')
          job.logfile.end('End of logfile')
          process.send({ msg: 'error', error: error.message })
        })
    } else {
      process.send({ msg: 'error', error: `Encountered an error during project execution pre-flight!` })
    }
  },
    error => console.error(new Error(error))
  )
