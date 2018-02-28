const mongoose = require('../server');
const { save, comparePassword, initializeUser } = require('./utils/UserMethods')

var Schema = mongoose.Schema;
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
        rPath: { type: String },
        savePath: { type: String }
    }
});

userSchema.pre('save', save);
userSchema.methods.comparePassword = comparePassword;
userSchema.methods.initializeUser = initializeUser;

module.exports = mongoose.model('User', userSchema);