const project_routes = require('./tests/project-routes');
const user_routes = require('./tests/user-routes');
const project_execution = require('./tests/project-execution');
const server = require('./server/server')

describe('App', function () {
  describe('Routes', function () {
    describe('Users', user_routes);
    describe('Projects', project_routes);
  });

  describe('Project Execution', project_execution);

  after(function(){
    server.disconnect();
    server.connection.close();
  });
});


