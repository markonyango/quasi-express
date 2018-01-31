const fetch = require('node-fetch');
const project_routes = require('./tests/project-routes');
const user_routes = require('./tests/user-routes');
const createUser = require('./tests/createUser');

describe('App', function () {

  var cookie;

  before(createUser);

  describe('Routes', function () {
    describe('Users', user_routes);
    describe('Projects', project_routes);
  });
});


