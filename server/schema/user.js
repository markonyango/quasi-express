const mongoose = require('../server');
const bcrypt = require('bcryptjs');

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

userSchema.pre('save', function(next) {
    var user = this;
    bcrypt.hash(user.password, 10, function(err, hash) {
        user.password = hash;
        next();
    });
});

userSchema.methods.comparePassword = function(password, cb) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        err ? cb(err) : cb(null, isMatch);
    });
}

const User = module.exports = mongoose.model('User', userSchema);