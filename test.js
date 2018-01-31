const fetch = require('node-fetch');
const project_routes = require('./tests/project-routes');
const user_routes = require('./tests/user-routes');

describe('App', function () {

  var cookie;

  before(async function () {
    console.log('Logging in test user to fetch session cookie')
    
    var body = { 'email': 'mark', 'password': 'mark' }
    
    var res = await fetch('http://localhost:3000/users/login', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    res = await res.headers._headers['set-cookie'][0];
    cookie = await res.split(';', 1)[0]
  });

  describe('Routes', function () {
    describe('Users', user_routes);
    describe('Projects', project_routes);
  });
});


