const Rx = require('rxjs/Rx');
const colors = require('colors');

var settingsSubject = new Rx.Subject();
var projectSubject = new Rx.Subject();
var startSubject = new Rx.Subject();

var parent2child = function (payload) {
  switch (payload.msg) {
    case 'start':
      console.log('Starting the job...'.magenta);
      startSubject.next(1);
      break;
    case 'stop':
      console.log('Stopping the job...'.magenta);
      process.exit(0);
      break;
    case 'project':
      console.log('Recieved Project Document'.magenta);
      projectSubject.next(payload.document);
      break;
    case 'kill':
      console.error('Killing myself...'.magenta);
      process.exit(1);
    default:
      console.log(`Bogus message recieved (msg: ${payload.msg})! Exiting immediately!`.red.bold.bgBlack);
      process.exit(1);
      break;
  }
}

module.exports = {
  parent2child,
  projectSubject,
  startSubject
}