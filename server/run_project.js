var projectsettings;
var usersettings;

process.on('message', function (payload) {

  switch (payload.msg) {
    case 'start':
      console.log('Starting the job...');
      start_job();
      break;
    case 'stop':
      console.log('Stopping the job...');
      process.exit(0);
      break;
    case 'ping':
      console.log('pong');
      break;
    case 'settings':
      projectsettings = payload.projectsettings;
      usersettings = payload.usersettings;
      break;
    default:
      console.log('Nothing to do here...Exiting');
      process.exit(1);
      break;
  }
});


const start_job = function () {
  
  const payload = {
    msg: '',
    result: 0
  }

  setTimeout(() => {

    payload.msg = 'Done'
    payload.result = 0;

    process.send(payload)
  }, 5000);
}
