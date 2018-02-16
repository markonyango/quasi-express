const Rx = require('rxjs/Rx');
const colors = require('colors');

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
      console.log(`${getTime()} Bogus message recieved (msg: ${payload.msg})! Exiting immediately!`.red.bold.bgBlack);
      process.exit(1);
      break;
  }
}

function getTime() {
  let date = new Date()

  let options = {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    minute: '2-digit',
    hour: '2-digit',
    second: '2-digit'
  }

  return `[ ${date.toLocaleDateString('de',options)} ]`
}

module.exports = {
  parent2child,
  projectSubject,
  startSubject
}