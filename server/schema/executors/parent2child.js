const Rx = require('rxjs/Rx')
const colors = require('colors')
const printOut = require('../../../helpers/printOut')

var projectSubject = new Rx.ReplaySubject()
var startSubject = new Rx.Subject()

var parent2child = function (payload) {
  switch (payload.msg) {
    case 'start':
      projectSubject.subscribe(doc => {
        console.log(`${printOut(__filename)} Starting job ${doc._id}...`.magenta)
        startSubject.next(1)
      })
      break
    case 'stop':
      projectSubject.subscribe(doc => {
        console.log(`${printOut(__filename)} Stopping job ${doc._id}...`.magenta)
        process.exit(0)
      })
      break
    case 'project':
      console.log(`${printOut(__filename)} Recieved Project (${payload.document._id} - ${payload.document.projecttype} - ${payload.document.projectname})`.magenta)
      projectSubject.next(payload.document)
      break
    case 'kill':
      console.error(`${printOut(__filename)} Killing myself...`.magenta)
      process.exit(1)
      break
    default:
      console.log(`${printOut(__filename)} Bogus message recieved (msg: ${payload.msg})! Exiting immediately!`.red.bgBlack)
      process.exit(1)
      break
  }
}

var onExit = function (code) {
  if (code) {
    console.log(`${printOut(__filename)} Process ${process.pid} is exiting with code ${code}`.red)
  } else {
    console.log(`${printOut(__filename)} Process ${process.pid} is exiting gracefully`.green)
  }
}

module.exports = {
  parent2child,
  onExit,
  projectSubject,
  startSubject
}