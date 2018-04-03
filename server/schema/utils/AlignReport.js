const fs = require('fs-extra')
const path = require('path')

function AlignReport(projectDocument) {
  this.files = projectDocument.files
  this.savePath = projectDocument.savePath

  this.samstatFiles = []
}

AlignReport.prototype.generateReport = function() {
  let reportFile = path.join(this.savePath, 'report.txt')
  try {
    let buff = fs.readFileSync(reportFile, { encoding: 'utf-8', flag: 'r' })
    let json = JSON.parse(buff)

    this.samstatFiles = json.samstatFiles
  } catch (error) {
    this.samstatFiles = fs.readdirSync(this.savePath).filter(file => file.indexOf('samstat.html') !== -1)
    
    fs.writeFile(
      reportFile,
      JSON.stringify({ samstatFiles: this.samstatFiles }),
      error => (error ? console.log(error) : '')
    )
  }

  return {
    samstatFiles: this.samstatFiles
  }
}

module.exports = AlignReport