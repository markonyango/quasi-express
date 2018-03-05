const assert = chai.assert;

const testuser = 'test@user.com';
const password = 'testuser';
let uid = '';
let project_id = '';

describe('App', function () {
  this.slow(500)
  this.timeout(10000)
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
      context('Users', function () {
        it('We should be able to register a test user', function () {
          return fetch('http://localhost:3000/users/register?json=true', {
            method: 'POST',
            body: JSON.stringify({
              "email": testuser,
              "password": password
            }),
            headers: {
              'content-type': 'application/json'
            }
          })
            .then(result => {
              assert.equal(result.status, 200, 'Response status is not 200!')
              return result.json()
            })
            .then(result => {
              assert.hasAllKeys(result, [
                '__v',
                '_id',
                'email',
                'password',
                'settings',
                'role'
              ])
              assert.equal(result.email, testuser, 'eMail does not match!')
              assert.equal(result.role, 'User', 'Role does not match!')
            })
            .catch(error => {
              assert.isNull(error, 'Could not register testuser: ' + error)
            })
        });

        it('We should be able to login with our new testuser', function () {
          return fetch('http://localhost:3000/users/login', {
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
          })
            .then(result => {
              assert.equal(result.status, 200, 'Response status is not 200!')
              return result.json()
            })
            .then(result => {
              assert.hasAllKeys(result, ['_id', 'email', 'role'])
              assert.isNotNull(result._id)
              assert.equal(result.email, testuser)
              uid = result._id;
            })
            .catch(error => {
              assert.isNull(error, 'Could not log in: ' + error)
            })
        });

        it('We should be able to remove the testuser again', function () {
          return fetch('http://localhost:3000/users/remove?json=true', {
            method: 'POST',
            credentials: 'include'
          })
            .then(result => {
              assert.equal(result.status, 200, 'Response status is not 200!')
              return result.json()
            })
            .then(result => {
              assert.isObject(result)
              assert.hasAllKeys(result, [
                '_id',
                'email',
                'password',
                'settings',
                '__v',
                'role'
              ])
            })
            .catch(error => {
              assert.isNull(error, 'Could not remove user: ' + error)
            })
        })
      });
    })


    describe('Projects', function () {
      before(function () {
        // First we make the new user again
        return fetch('http://localhost:3000/users/register?json=true', {
          method: 'POST',
          body: JSON.stringify({
            "email": testuser,
            "password": password
          }),
          headers: {
            'content-type': 'application/json'
          }
        })
          .then(result => {
            assert.equal(result.status, 200, 'Response status is not 200!')
            return result.json()
          })
          .then(result => {
            assert.hasAllKeys(result, [
              '__v',
              '_id',
              'email',
              'password',
              'settings',
              'role'
            ])
            assert.equal(result.email, testuser, 'eMail does not match!')
            assert.equal(result.role, 'User', 'Role does not match!')
          })
          .catch(error => {
            assert.isNull(error, 'Could not register testuser: ' + error)
          })
          .then(login => {

            // Then we obviously have to log in to create a new user session on the server
            return fetch('http://localhost:3000/users/login', {
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
            })
          })
          .then(result => {
            assert.equal(result.status, 200, 'Response status is not 200!')
            return result.json()
          })
          .then(result => {
            assert.hasAllKeys(result, ['_id', 'email', 'role'])
            assert.isNotNull(result._id)
            assert.equal(result.email, testuser)
            uid = result._id;
          })
          .catch(error => {
            assert.isNull(error, 'Could not log in: ' + error)
          })
      })

      context('Projects', function () {

        it('We should be able to create a new project for the testuser', function () {

          const form = new FormData;
          form.append('projectname', 'Test Project');
          form.append('projecttype', 'qa');
          form.append('settings', 'null');
          form.append('status', 'queued');
          form.append('uid', uid);
          let file = new File(['files'], '/home/mark/Dokumente/quasi-express/test.fastq')
          form.append('files', file, 'test.fastq')

          return fetch('http://localhost:3000/projects/upload',
            {
              method: 'POST',
              body: form,
              credentials: 'include'
            })
            .then(result => {
              assert.equal(result.status, 200, 'Response status is not 200!')
              return result.json()
            })
            .then(result => {
              assert.exists(result._id, 'Project does not seem to have an Object ID')
              project_id = result._id
              assert.equal(result.projectname, 'Test Project', 'Projectname does not match')
              assert.equal(result.projecttype, 'qa', 'Projecttype does not match')
              assert.equal(result.status, 'queued', 'Projects initial status should be "queued"')
              assert.equal(result.pid, 0, 'Projects initial process id should be 0')
              assert.isAbove(result.files.length, 0, 'Project does not seem to have any files associated with it')
            })
            .catch(error => {
              assert.isNull(error, 'Could not upload new project data: ' + error)
            })
        })

        it('We should be able to fetch a list of projects for the testuser', function () {

          return fetch('http://localhost:3000/projects?json=true', {
            credentials: 'include'
          })
            .then(result => {
              assert.equal(result.status, 200)
              return result.json()
            })
            .then(result => {
              assert.isArray(result, 'Response is not an array but should be')
              assert.isAbove(result.length, 0, 'List of projects has length 0 but should be 1')
              assert.equal(result.length, 1, 'List of projects should be of length 1')
            })
            .catch(error => {
              assert.isNull(error, 'Could not fetch list of projects: ' + error)
            })
        })

        it('We should be able to get the projects stats', function () {
          return fetch('http://localhost:3000/projects/' + project_id + '?json=true', {
            credentials: 'include'
          })
            .then(result => {
              assert.equal(result.status, 200, 'Response status is not 200!')
              assert.notEqual(result.status, 400, 'Bad request')
              return result.json()
            })
            .then(result => {
              assert.isObject(result, 'Response is not an Object but should be')
              assert.equal(result._id, project_id, 'Response contains the wrong project')
            })
            .catch(error => {
              assert.isNull(error, 'Could not fetch the test projects stats: ' + error)
            })
        })

        it('We should be able to start the project', function () {

          return fetch('http://localhost:3000/projects/' + project_id + '/start', {
            credentials: 'include',
            method: 'PUT'
          })
            .then(result => {
              assert.equal(result.status, 200, 'Response status is not 200!')
              assert.notEqual(result.status, 400, 'Bad request')
              return result.json()
            })
            .then(result => {
              assert.isObject(result, 'Response is not an Object but should be')
              assert.equal(result._id, project_id, 'Response contains the wrong project')
              assert.equal(result.status, 'running', 'Project does not seem to be running')
            })
            .catch(error => {
              assert.isNull(error, 'Could not start the test project: ' + error)
            })
        })

        it('The started project should either still be running or finished', function(done) {
          fetch('http://localhost:3000/projects/' + project_id + '?json=true', {
            credentials: 'include'
          })
            .then(result => {
              assert.equal(result.status, 200, 'Response status is not 200!')
              assert.notEqual(result.status, 400, 'Bad request')
              return result.json()
            })
            .then(result => {
              assert.isObject(result, 'Response is not an Object but should be')
              assert.equal(result._id, project_id, 'Response contains the wrong project')
              assert.notEqual(result.status, 'failed', 'The projects execution seems to have failed somehow')
              assert.notEqual(result.status, 'queued', 'The project was never started')
            })
            .catch(error => {
              assert.isNull(error, 'Could not fetch the test projects stats: ' + error)
            })
            .then(function() {
              // Aparently Mocha does not wait for every it() to complete before running the after() hook
              setTimeout(() => {
                done()
              }, 1000);
            }, done)
        })
      });

      describe('Output files', function(){
        it('Logfile should exist in users folder', function(){
          this.retries(3)
          return fetch('http://localhost:3000/projects/' + project_id + '?json=true', {
            credentials: 'include'
          })
            .then(result => {
              assert.equal(result.status, 200, 'Response status is not 200!')
              assert.notEqual(result.status, 400, 'Bad request')
              return result.json()
            })
            .then(result => {
              assert.isObject(result, 'Response is not an Object but should be')
              assert.equal(result._id, project_id, 'Response contains the wrong project')
              assert.notEqual(result.status, 'failed', 'The projects execution seems to have failed somehow')
              assert.notEqual(result.status, 'queued', 'The project was never started')
              assert.equal(result.status, 'done', 'The project did not finish yet')
              assert.isArray(result.logfiles, 'The logfiles property is not an array')
            })
            .catch(error => {
              assert.isNull(error, 'Could not fetch the test projects stats: ' + error)
            })
        })
      })
    });
  })

  after(function (done) {
    setTimeout(() => {
      fetch('http://localhost:3000/users/remove?json=true', {
          method: 'POST',
          credentials: 'include'
        })
          .then(result => {
            assert.equal(result.status, 200, 'Response status is not 200!')
            return result.json()
          })
          .then(result => {
            assert.isObject(result)
            assert.hasAllKeys(result, [
              '_id',
              'email',
              'password',
              'settings',
              '__v',
              'role'
            ])
          })
          .catch(error => {
            assert.isNull(error, 'Could not remove user: ' + error)
          })
          .then(done, done)
    }, 9000);
      })
});



