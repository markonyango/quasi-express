const mongoose = require('../server')
const { save, remove, comparePassword } = require('./utils/UserMethods')

var Schema = mongoose.Schema
var userSchema = new Schema({
    username: {
        type: String,
        lowercase: true
    },
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['User', 'Admin'],
        default: 'User'
    },
    settings: {
        savePath: { type: String }
    }
})

userSchema.pre('save', save)
userSchema.pre('remove', remove)
userSchema.methods.comparePassword = comparePassword

module.exports = mongoose.model('User', userSchema)