const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://192.168.0.248:27017/quasi-express',
    {
        useMongoClient: true
    }, 
    function(err) {
        err ? console.log(`Catastrophic MongoDB error detected:\n ${err}`) : console.log('Connected to MongoDB');
    }
);

module.exports = mongoose;