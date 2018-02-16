const Rx = require('rxjs/Rx');
const colors = require('colors');
const getTime = require('../utils/getTime');

var projectSubject = new Rx.ReplaySubject();
var startSubject = new Rx.Subject();

var parent2child = function (payload) {
  switch (payload.msg) {
    case 'start':
      projectSubject.subscribe(doc => {
        console.log(`${getTime()} Starting job ${doc._id}...`.magenta);
        startSubject.next(1);
      })
      break;
    case 'stop':
      projectSubject.subscribe(doc => {
        console.log(`${getTime()} Stopping job ${doc._id}...`.magenta);
        process.exit(0);
      })
      break;
    case 'project':
      console.log(`${getTime()} Recieved Project (${payload.document._id} - ${payload.document.projecttype} - ${payload.document.projectname})`.magenta);
      projectSubject.next(payload.document);
      break;
    case 'kill':
      console.error(`${getTime()} Killing myself...`.magenta);
      process.exit(1);
    default:
      console.log(`${getTime()} Bogus message recieved (msg: ${payload.msg})! Exiting immediately!`.red.bgBlack);
      process.exit(1);
      break;
  }
}

var onExit = function (code) {
  if (code) {
    console.log(`${getTime()} Process ${process.pid} is exiting with code ${code}`.red)
  } else {
    console.log(`${getTime()} Process ${process.pid} is exiting gracefully`.green)
  }
}

module.exports = {
  parent2child,
  onExit,
  projectSubject,
  startSubject
}