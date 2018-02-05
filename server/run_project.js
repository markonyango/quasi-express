const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const colors = require('colors');

var projectsettings;
var usersettings;

process.stdout.on('data', data => console.log(data.toString().magenta))
process.on('message', function (payload) {

  switch (payload.msg) {
    case 'start':
      console.log('Starting the job...'.magenta);
      start_job();
      break;
    case 'stop':
      console.log('Stopping the job...'.magenta);
      process.exit(0);
      break;
    case 'settings':
      projectsettings = payload.projectsettings;
      usersettings = payload.usersettings;
      break;
    default:
      console.log('Nothing to do here...Exiting'.magenta);
      process.exit(1);
      break;
  }
});


const start_job = function () {

  const payload = {
    msg: '',
    result: 0
  }

  let r_path = usersettings.r_path;
  let save_path = usersettings.save_path;

  fs.open(save_path, 'r', (err, fd) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.error(save_path + ' does not exist'.red);
        return;
      }

      throw err;
    }

    console.log(`${save_path} is readable`.cyan);
    const out = spawn(path.join(__dirname, '../test.R'));
    const logfile = fs.createWriteStream(path.join(save_path, 'logfile.txt'), {flags: 'a', encoding: 'utf8'});

    // All stdout will go into this logfile in 'append' mode
    out.stdout.pipe(logfile);

    out.stderr.on('data', (data) => console.log(data.toString()));
    out.stdout.on('data', (data) => console.log(data.toString().cyan));
    out.on('exit', (code, signal) => console.log(`Exiting with code ${code} and signal ${signal}`.magenta));
    out.on('close', (code) => {
      console.log(`Exiting with code ${code}`.magenta)

      payload.msg = 'Done'
      payload.result = 0;
      process.send(payload)

    });
    out.on('error', (error) => console.log(error));
  });
}
