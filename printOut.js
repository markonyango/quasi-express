const path = require('path')

module.exports = function printOut(filename = '') {
  let date = new Date()

  let options = {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    minute: '2-digit',
    hour: '2-digit',
    second: '2-digit'
  }

  return `[ ${date.toLocaleDateString('de',options)} - ${process.pid} - ${path.basename(filename)}]`
}