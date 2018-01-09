const mongoose = require('../server');

var Schema = mongoose.Schema;
var userSchema = new Schema({
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
    }
});

var User = mongoose.model('User', userSchema);

module.exports = User;