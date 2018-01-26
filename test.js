const app = require('./app');
const { assert } = require('chai');
const path = require('path');

describe('App', function() {
  it('should have view folder', function() {
    const result = app.settings.views;
    assert.equal(path.join(__dirname, 'views'), result);
  });

  describe('Routes', function() {
    it('Project Route GET / returns MongoDB object', function() {
      //blahbla
    });
  });
});