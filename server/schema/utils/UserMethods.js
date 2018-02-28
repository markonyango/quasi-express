const { uploadPath } = require('../../../settings');
const fs = require('fs-extra');
const path = require('path');
const getTime = require('./getTime');
const color = require('colors');
const bcrypt = require('bcryptjs');

function save(next) {
  var user = this;
  bcrypt.hash(user.password, 10, function (err, hash) {
    user.password = hash;
    next();
  });
}

function comparePassword(password, cb) {
  bcrypt.compare(password, this.password, function (err, isMatch) {
    err ? cb(err) : cb(null, isMatch);
  });
}

function initializeUser() {
  var user = this;

  // Create a new directory in the servers uploadPath for the user
  let userDir = path.join(uploadPath, user._id);
  fs.mkdirp(userDir)
    .then(res => console.log(`${getTime()} New users directory has been created: ${userDir}.`.cyan))
    .catch(error => console.error(`${getTime()} Could not create a directory on the server for ${user.email}: ${error}`))
}

module.exports = {
  save,
  comparePassword,
  initializeUser
}