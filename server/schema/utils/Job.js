const fs = require('fs-extra')
const path = require('path');
const { uploadPath } = require('../../../settings');

module.exports = Job = function (document) {

  this.document = document;
  this.savePath = '';
  this.files = document.files;

  this.setSaveFolder = async function () {
    let projectSavePath = path.join(this.document.uid.settings.savePath, this.document._id);
    try {
      let existsPath = await fs.pathExists(projectSavePath);
      if (existsPath) {
        try {
          await fs.ensureDir(projectSavePath);
          this.savePath = projectSavePath;
          return true;
        } catch (error) {
          process.send({ msg: 'error', error: `savePath: ${error}` });
          return false;
        }
      } else {
        try {
          await fs.mkdir(projectSavePath);
          await fs.ensureDir(projectSavePath);
          this.savePath = projectSavePath;
          return true;
        } catch (error) {
          process.send({ msg: 'error', error: `mkdirp: ${error}` })
          return false;
        }
      }
    } catch (error) {
      process.send({ msg: 'error', error: `pathExists: ${error}` })
      return false;
    }

  }

  this.setLogFile = function () {
    if (this.savePath != '') {
      const date = Date.now().toString();
      this.logfile = fs.createWriteStream(path.join(
        this.savePath,
        date + '-' + this.document.projecttype + '-log.txt')
      );
      return true;
    } else {
      process.send({ msg: 'error', error: `Can't create logfile because the save Folder does not exist/is not writable!` });
      return false;
    }
  }

  this.saveOutput = async function (...files) {
    for (let file of files) {
      let filename = file.substring(file.lastIndexOf('/') + 1);
      console.log(`Moving ${filename} to the save folder...`);
      await fs.move(
        file,
        path.join(this.savePath, filename)
      );
    }
  }
}