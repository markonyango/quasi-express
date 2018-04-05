const fs = require('fs-extra')
const path = require('path')

function AlignReport(projectDocument) {
  this.files = projectDocument.files
  this.savePath = projectDocument.savePath

  this.resultFiles = []
}

AlignReport.prototype.generateReport = function() {
  let reportFile = path.join(this.savePath, 'report.txt')
  try {
    let buff = fs.readFileSync(reportFile, { encoding: 'utf-8', flag: 'r' })
    let json = JSON.parse(buff)

    this.resultFiles = json.resultFiles
  } catch (error) {
    let fileFilter = ['report.txt', 'logfile.txt', 'error.txt', ...this.files]
    this.resultFiles = fs.readdirSync(this.savePath).filter(file => !fileFilter.includes(file))

    fs.writeFile(
      reportFile,
      JSON.stringify({ resultFiles: this.resultFiles }),
      error => (error ? console.log(error) : '')
    )
  }

  return {
    resultFiles: this.resultFiles
  }
}

module.exports = AlignReport
