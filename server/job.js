const util = require('util');
const { EventEmitter } = require('events');

var Job = function () {
    var self = this;

    this.start = function () {
        self.emit('start', process.pid);
    }

    this.stop = function () {
        self.emit('stop', process.pid);
    }
}

util.inherits(Job, EventEmitter);
module.exports = Job;