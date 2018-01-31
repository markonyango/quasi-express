const { assert } = require('chai');
const fetch = require('node-fetch');
const FormData = require('form-data');
const to = require('../catchError');

const User = require('../server/schema/user')
const server = require('../server/server')

const testuser = 'test@user.com'
const password = 'testuser'


function user_routes() {
  it('User Route POST /users/register should return Testuser as MongoDB document', async function () {
    var body = {
      email: testuser,
      password: password
    }

    let [error, result] = await to(fetch('http://localhost:3000/users/register?json=true', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    }))

    assert.isNull(error, error);
    result = await result.json();
    assert.hasAllKeys(result, ['__v', '_id', 'email', 'password', 'role']);
    assert.equal(result.email, testuser);
  });

  it('Testuser can successfully login', function () {
    var body = { 'email': testuser, 'password': password }

    fetch('http://localhost:3000/users/login', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.text())
      .then(res => {
        assert.isTrue(/Hello\, welcome to QUASI\-Express/.test(res), 'Could not login')
      })
      .catch(error => assert.isNull(error, error))
  })

  it('Testuser can successfully be removed again', async function () {
    const user = await User.findOne({ email: testuser });
    if (user) {
      var body = { uid: user._id }

      const res = await fetch('http://localhost:3000/users/remove?json=true', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      })
      assert.equal(res.status, 200)
    } else {
      new Error('No such user found')
    }
  })

  after(function(){
    server.disconnect();
    server.connection.close();
  });
}

module.exports = user_routes;