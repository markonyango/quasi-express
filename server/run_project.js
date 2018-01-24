const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const job = spawn()

process.on('message', function (msg) {

  console.log(msg);
  setTimeout(() => {
    process.exit(0);
  }, 10000);
});

process.on('exit', function (code, signal) {
  switch (code) {
    case 0:
      console.log(`child closed with code ${code} and signal ${signal}`);
      break;

    default:
      console.log(`child (${process.pid}) did not go down quietly! Exit code was ${code} - ${signal}`);
      break;
  }
});

const quality_assessment = function () {

}

const start_job = function(){

}

const kill_job = function(pid) {
  job.kill('SIGKILL')
}