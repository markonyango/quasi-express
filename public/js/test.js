const assert = chai.assert;

const testuser = 'test@user.com';
const password = 'testuser';
let   uid = '';

describe('App', function () {
  describe('Routes', function () {
    describe('Index', function () {
      it('Should get back GET 200 on localhost:3000', async function () {
        try {
          let res = await fetch('http://localhost:3000', { observe: 'response' })

          assert.exists(res.headers, 'Response does not seem to have a header object!');
          assert.strictEqual(res.status, 200, 'Response status is not 200!');
        } catch (error) {
          assert.isNull(error, 'Fetch somehow failed: ' + error)
        }
      });
    });


    describe('Users', function () {
      it('We should be able to register a test user', async function () {
        try {
          let result = await fetch('http://localhost:3000/users/register?json=true', {
            method: 'POST',
            body: JSON.stringify({
              "email": testuser,
              "password": password
            }),
            headers: {
              'content-type': 'application/json'
            }
          });

          result = await result.json()
          assert.hasAllKeys(result, [
            '__v',
            '_id',
            'email',
            'password',
            'role'
          ])
          assert.equal(result.email, testuser, 'eMail does not match!')
          assert.equal(result.role, 'User', 'Role does not match!')
        } catch (error) {
          assert.isNull(error, 'Could not register testuser: ' + error)
        }
      });

      it('We should be able to login with our new testuser', async function() {
        try {
          let result = await fetch('http://localhost:3000/users/login', {
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              "email": testuser,
              "password": password,
              "json": true
            })
          });
          
          result = await result.json()
          assert.hasAllKeys(result, ['_id', 'email', 'role'])
          assert.isNotNull(result._id)
          assert.equal(result.email, testuser)
          uid = result._id;
        } catch (error) {
          assert.isNull(error, 'Could not log in: ' + error)
        }
      });

      it('We should be able to remove the testuser again', async function() {
        try {
          let result = await fetch('http://localhost:3000/users/remove?json=true', {
            method: 'POST',
            body: JSON.stringify({
              uid: uid
            }),
            headers: {
              'content-type': 'application/json'
            },
            credentials: 'include'
          });
          
          result = await result.json()

          assert.hasAllKeys(result, [
            'email',
            '_id',
            'role'
          ])
          assert.equal(result.email, testuser, 'Removed wrong user!')
        } catch (error) {
          assert.isNull(error, 'Could not remove user: ' + error)
        }
      })
    });


    describe('Projects', function () {

    });
  });

  describe('Project Execution', function () {

  });
});



