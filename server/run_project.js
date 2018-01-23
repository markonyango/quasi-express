// const path = require('path');
// const fs = require('fs');

process.on('message', function (msg) {
  console.log(msg);
  process.exit(0);
});

process.on('exit', function (code, signal) {
  switch(code) {
    case 0:
    console.log(`child closed with code ${code} and signal ${signal}`);
    break;

    default:
    console.log(`child (${process.pid}) did not go down quietly! Exit code was ${code} - ${signal}`);
    break;
}
});