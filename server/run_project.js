
const payload = {
  msg: '',
  result: 0
}

process.on('message', function (msg) {

  switch (msg) {
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

    default:
      console.log('Nothing to do here...Exiting');
      process.exit(1);
      break;
  }
});


const start_job = function () {
  setTimeout(() => {

    payload.msg = 'Done'
    payload.result = 0;

    process.send(payload)
  }, 5000);
}
