const path = require('path')
const os = require('os')

module.exports = {
    uploadPath: path.join(__dirname, 'uploads'),
    mongoDB: '127.0.0.1',
    alignReferenceFolder: path.join(os.homedir().toString(), 'references')
}