const mongoose = require('../server');

var Schema = mongoose.Schema;
var project = new Schema({
    name: {
        type: String,
        lowercase: true,
        required: true
    },
    settings: { 
        type: String, 
        required: true 
    }
});

var Project = mongoose.model('Project', project);

module.exports = Project;