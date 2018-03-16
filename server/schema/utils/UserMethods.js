const { uploadPath } = require('../../../settings')
const fs = require('fs-extra')
const path = require('path')
const printOut = require('../../../helpers/printOut')
const color = require('colors')
const bcrypt = require('bcryptjs')
const rimraf = require('rimraf')
const Project = require('../ProjectSchema')
const User = require('../UserSchema')

function save(next) {
  let user = this
  
  if (user.isNew) {
    // Let's create the user folder in the servers upload directory
    let userDir = path.join(uploadPath, user._id.toString())
    fs.mkdir(userDir, (error) => {
      if (error) {
        console.error(`${printOut(__filename)} Could not create a directory on the server for ${user.email}: ${error}`.red)
        next(Error(`${printOut(__filename)} Could not create a directory on the server for ${user.email}: ${error}`))
      } else {
        console.log(`${printOut(__filename)} New users directory has been created: ${userDir}.`.cyan)
        user.settings['savePath'] = userDir
      }
    })

    // We MUST encrypt the password for database storage
    bcrypt.hash(user.password, 10, function (err, hash) {
      user.password = hash
      next()
    })
  }


}

function remove(next) {
  let user = this
  // We must destroy all remaining projects and the users upload folder on the server
  Project.find({ uid: user._id }).exec()
    .then(projects => {
      if (projects.length === 0) {
        return projects
      } else {
        projects.forEach(project => {
          project.remove()
            .catch(error => next(Error(`${printOut(__filename)} Could not delete ${project._id}: ${error}`)))
        })
      }

    })
    .catch(error => next(error))
    .then(() => {
      // Now we remove his upload folder
      let userDir = path.join(uploadPath, user._id.toString())
      rimraf(userDir, (error) => {
        if (error) {
          console.error(`${printOut(__filename)} Could not delete ${user.email}'s upload folder: ${error}`.red)
          next(Error(`${printOut(__filename)} Could not delete ${user.email}'s upload folder: ${error}`))
        } else {
          console.error(`${printOut(__filename)} Deleted ${user.email}'s upload folder`.cyan)
          next()
        }
      })
    })
}

function comparePassword(password, cb) {
  bcrypt.compare(password, this.password, function (err, isMatch) {
    err ? cb(err) : cb(null, isMatch)
  })
}

// ####### VALIDATION METHODS #######
function emailUnique(email) {
  return new Promise((resolve, reject) => {
    this.model('User').count({email}).exec()
    .then(count => resolve(!count))
    .catch(reject)
  })
}

module.exports = {
  save,
  remove,
  comparePassword,
  emailUnique
}