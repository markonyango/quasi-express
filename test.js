const fetch = require('node-fetch');
const project_routes = require('./tests/project-routes');
const user_routes = require('./tests/user-routes');
const server = require('./server/server')

describe('App', function () {
  describe('Routes', function () {
    describe('Users', user_routes);
    describe('Projects', project_routes);
  });

  after(function(){
    server.disconnect();
    server.connection.close();
  });
});


