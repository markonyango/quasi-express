const chaiHttp = require('chai-http')
const chai = require('chai')
const { assert, expect } = require('chai')
const server = require('./server/server')
const app = require('./app')

chai.use(chaiHttp)

let sessionID = ''
let projectID = ''

describe('App', function() {
  it('should create an open connection to the MongoDB server', () =>
    assert.strictEqual(server.connection.readyState, 1))
  describe('Profile functions', function() {
    it('should be able to register test user', () => {
      return chai
        .request(app)
        .post('/users/register?json=true')
        .set('content-type', 'application/json')
        .send({ email: 'test@user.com', password: 'password' })
        .then(res => {
          assert.hasAllKeys(res.body, ['__v', '_id', 'email', 'password', 'settings', 'role'])
          assert.equal(res.body.email, 'test@user.com', 'eMail does not match!')
          assert.equal(res.body.role, 'User', 'Role does not match!')
        })
    })
    it('should be able to login', () => {
      return chai
        .request(app)
        .post('/users/login')
        .send({ email: 'test@user.com', password: 'password', json: 'true' })
        .then(res => {
          assert.strictEqual(res.status, 200)
          assert.isObject(res.body)
          assert.isNotEmpty(res.body)
          assert.strictEqual(res.body.email, 'test@user.com')
          assert.strictEqual(res.body.role, 'User')
          expect(res).to.have.cookie('connect.sid')
          sessionID = res.header['set-cookie']
        })
    })
    it('should be able to remove test user', () => {
      return chai
        .request(app)
        .post('/users/remove?json=true')
        .set('cookie', sessionID)
        .send()
        .then(res => {
          assert.isObject(res.body)
          assert.hasAllKeys(res.body, ['_id', 'email', 'password', 'settings', '__v', 'role'])
        })
    })
  })

  describe('Projects', function() {
    before(function(done) {
      let agent = chai.request.agent(app)

      agent
        .post('/users/register?json=true')
        .set('content-type', 'application/json')
        .send({ email: 'test@user.com', password: 'password' })
        .then(res => {
          agent
            .post('/users/login')
            .send({ email: 'test@user.com', password: 'password', json: 'true' })
            .then(res => {
              sessionID = res.header['set-cookie']
              expect(res).to.have.status(200)
              done()
            })
        })
    })
    context('Project management routes', function() {
      it('should be able to upload a new project', function() {
        return chai
          .request(app)
          .post('/projects/upload')
          .set('cookie', sessionID)
          .field('projectname', 'Test Project')
          .field('projecttype', 'qa')
          .field('settings', 'null')
          .field('status', 'queued')
          .attach('files', './public/test/test.fastq', { filename: 'test.fastq' })
          .attach('files', './public/test/test2.fastq', { filename: 'test2.fastq' })
          .then(res => {
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('object')
            expect(res.body).to.have.property('_id')
            expect(res.body).to.have.property('projectname')
            expect(res.body).to.have.property('projecttype')
            expect(res.body).to.have.property('status')
            expect(res.body).to.have.property('pid')
            expect(res.body).to.have.property('files')
          })
      })
      it('should be able to get list of testusers projects', function() {
        return chai
          .request(app)
          .get('/projects?json=true')
          .set('cookie', sessionID)
          .then(res => {
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('array')
            expect(res.body).to.have.length.greaterThan(0)
            projectID = res.body[0]._id
          })
      })
      it('should be able to get projects stats', function() {
        return chai
          .request(app)
          .get(`/projects/${projectID}?json=true`)
          .set('cookie', sessionID)
          .then(res => {
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('object')
            expect(res.body._id).to.equal(projectID)
          })
      })
      it('should be able to start the project', function(done) {
        // Give the job time to finish
        this.timeout(5000)
        chai
          .request(app)
          .put(`/projects/${projectID}/start`)
          .set('cookie', sessionID)
          .then(res => {
            expect(res).to.have.status(200)
            expect(res.body).to.have.property('_id')
            expect(res.body).to.have.property('status')
            expect(res.body._id).to.equal(projectID)
            expect(res.body.status).to.equal('running')
            // Give the job time to finish
            setTimeout(() => {
              done()
            }, 3500)
          })
      })
      it('should be able to get the projects results', function() {
        this.retries(3)
        return chai
          .request(app)
          .get(`/projects/${projectID}?json=true`)
          .set('cookie', sessionID)
          .then(res => {
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('object')
            expect(['failed', 'queued', 'running']).to.not.include(res.body.status)
            expect(res.body.status).to.equal('done')
            expect(res.body.logfiles).to.be.an('array')
          })
      })
    })

    context('Alignment module', function(done) {
      it('should be able to create and start a new alignment project', function() {
        this.timeout(5000)
        chai
          .request(app)
          .post('/projects/upload')
          .set('cookie', sessionID)
          .field('projectname', 'Test Project2')
          .field('projecttype', 'align')
          .field('settings[numCores]', '1')
          .field('settings[mismatches]', '0')
          .field('settings[preTrim]', '0')
          .field('settings[postTrim]', '0')
          .field('settings[writeUnaligned]', true)
          .field('settings[reference]', 'testReference.fasta')
          .field('status', 'queued')
          .attach('files', './public/test/test.fastq', 'test.fastq')
          .attach('files', './public/test/test2.fastq', 'test2.fastq')
          .then(res => {
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('object')
            expect(res.body).to.have.property('_id')
            projectID = res.body._id
            expect(res.body.projecttype).to.equal('align')
            expect(res.body.files).to.be.an('array')
            expect(res.body.files).to.have.length.greaterThan(0)

            return chai
              .request(app)
              .put(`/projects/${projectID}/start`)
              .set('cookie', sessionID)
              .then(res => {
                expect(res).to.have.status(200)
                expect(res.body.status).to.equal('running')

                // Give the job time to finish
                setTimeout(() => {
                  done()
                }, 3500);
              })
          })
      })
      it('should be able to recieve alignment results', function() {
        this.retries(3)
        return chai
          .request(app)
          .get(`/projects/${projectID}?json=true`)
          .set('cookie', sessionID)
          .then(res => {
            expect(res).to.have.status(200)
            expect(res.body._id).to.equal(projectID)
            expect(['failed', 'queued', 'running']).to.not.include(res.body.status)
            expect(res.body.logfiles).to.be.an('array')
          })
      })
    })
    after(function(done) {
      this.timeout(5000)
      setTimeout(() => {
        chai
          .request(app)
          .post('/users/remove?json=true')
          .set('cookie', sessionID)
          .then(res => {
            assert.hasAllKeys(res.body, ['_id', 'email', 'password', 'settings', '__v', 'role'])
          })
          .then(done, done)
      }, 3500)
    })
  })

  after(() => server.disconnect())
})
