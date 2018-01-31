const project_routes = require('./tests/project-routes');
const user_routes = require('./tests/user-routes');

describe('App', function () {
  describe('Routes', function () {
    describe('Users', user_routes);
    describe('Projects', project_routes);
  });
});


