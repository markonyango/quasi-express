const fs = require('fs-extra')
const path = require('path')
const printOut = require('../../../printOut')

function Job(projectDocument) {

  this.projectDocument = projectDocument
  this.files = projectDocument.files
  this.savePath = projectDocument.savePath
  this.logfile = ''
  this.errorfile = ''
}

Job.prototype.setLogFile = function () {
  this.logfile = fs.createWriteStream(path.join(this.savePath, 'logfile.txt'))
  this.errorfile = fs.createWriteStream(path.join(this.savePath, 'error.txt'))
}

Job.prototype.preFlight = function () {
  const checkSaveFolder = fs.existsSync(this.savePath)
  if (!checkSaveFolder || checkSaveFolder == undefined) {
    console.log(this.savePath)
    console.error(`${printOut(__filename)} Couldn't access your chosen save path (${this.savePath}). Make sure the permissions are set accordingly!`.red)
    return false
  }

  this.setLogFile()
  if (!(this.logfile instanceof fs.WriteStream)) {
    console.error(`${printOut(__filename)} Logfile is not an instance of WriteStream!`.red)
    process.send({ msg: 'error', error: `Logfile is not an instance of WriteStream!` })
    return false
  }
  if (!(this.errorfile instanceof fs.WriteStream)) {
    console.error(`${printOut(__filename)} Errorfile is not an instance of WriteStream!`.red)
    process.send({ msg: 'error', error: `Errorfile is not an instance of WriteStream!` })
    return false
  }

  return true
}

module.exports = Job