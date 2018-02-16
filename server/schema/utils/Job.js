const fs = require('fs-extra')
const path = require('path');
const { uploadPath } = require('../../../settings');

module.exports = function (document) {

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
          process.send({ msg: 'error', error: `savePath does not seem to be a directory: ${error}` });
          return false;
        }
      } else {
        try {
          await fs.mkdir(projectSavePath);
          this.savePath = projectSavePath;
          return true;
        } catch (error) {
          process.send({ msg: 'error', error: `Couldn't create the save folder: ${error}` })
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
      return false;
    }
  }

  this.saveOutput = async function () {
    // Grab the output files by project ID from the servers upload folder
    try {
      let files = await fs.readdir(uploadPath);
      files.filter(file => file.indexOf(this.document._id) >= 0 ? true : false);

      // Move ever file one by one - TODO: Move files in parallel
      for (let file of files) {
        try {
          await fs.move(path.join(uploadPath, file), path.join(this.savePath, file));
        } catch (error) {
          process.send({ msg: 'error', error: `Couldn't move ouput files to your save folder: ${error}` });
        }
      }
    } catch (error) {
      this.logfile.write(error.toString());
      process.send({ msg: 'error', error: `Couldn't grab your output files from the server: ${error}` });
    }
  }

  this.preFlight = async function() {
    const checkSaveFolder = await this.setSaveFolder();
    if(!checkSaveFolder) {
      console.error(`Couldn't access your chosen save path. Make sure the permissions are set accordingly!`.red);
      return false;
    }
    
    const checkLogFile = await this.setLogFile();
    if(!checkLogFile){
      console.error(`Couldn't create logfile because the save Folder does not exist/is not writable!`.red)
      process.send({ msg: 'error', error: `Can't create logfile because the save Folder does not exist/is not writable!` });
      return false;
    }

    return true;
  }
}