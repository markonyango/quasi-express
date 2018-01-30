const { assert } = require('chai');
const fetch = require('node-fetch');
const to = require('./catchError');
const fs = require('fs');
const FormData = require('form-data');

const project_routes = require('./tests/project-routes');
const user_routes = require('./tests/user-routes');

describe('App', function () {
  describe('Routes', function () {
    describe('Users', user_routes);
    describe('Projects', project_routes);
  });
});


