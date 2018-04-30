const chaiHttp = require('chai-http')
const chai = require('chai')
const { assert, expect } = require('chai')
const server = require('./server/server')
const app = require('./app')

chai.use(chaiHttp)

describe('App', function() {
  it('should create an open connection to the MongoDB server', () => assert.strictEqual(server.connection.readyState, 1))
  it('should be able to login', () => {
    return chai
      .request(app)
      .post('/users/login')
      .send({ email: 'mark@gmail.com', password: 'vegeta12', json: 'true' })
      .then(res => {
        assert.strictEqual(res.status, 200)
        assert.isObject(res.body)
        assert.isNotEmpty(res.body)
        assert.strictEqual(res.body.email, 'mark@gmail.com')
        assert.strictEqual(res.body.role, 'User')
        expect(res).to.have.cookie('connect.sid')
      })
  })

  after(() => server.disconnect())
})
