const mongoose = require('mongoose')
const { mongoDB } = require('../settings')

mongoose.Promise = global.Promise
mongoose.connect(`mongodb://${mongoDB}:27017/quasi-express`, (err) => {
    err ? console.errror(`Catastrophic MongoDB error detected:\n ${err}`) :
        console.log(`Connected to MongoDB (${mongoDB})`)
})

mongoose.connection.on('disconnected', () => console.log('MongoDB connection shut down.'))

module.exports = mongoose