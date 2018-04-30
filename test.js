const chaiHttp = require('chai-http')
const chai = require('chai')
const { assert, expect } = require('chai')
const server = require('./server/server')
const app = require('./app')

chai.use(chaiHttp)

let sessionID = ''

describe('App', function() {
  it('should create an open connection to the MongoDB server', () =>
    assert.strictEqual(server.connection.readyState, 1))
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

  after(() => server.disconnect())
})
