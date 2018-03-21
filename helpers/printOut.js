const path = require('path')

/**
 * This function prefixes a log message with the following string
 * [date - process id - filename]
 * @param {fileanme} filename The filename from which this function will be called
 * @returns {String} Prefix string for the log message
 */
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