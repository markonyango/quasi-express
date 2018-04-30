const chaiHttp = require('chai-http')
const chai, { assert, expect } = require('chai')
const { mongoDB } = require('./settings')
const mongoose = require('mongoose')
const app = require('./app')

chai.use(chaiHttp)

describe('App', function() {
  before(function() {
    return mongoose
      .connect(`mongodb://${mongoDB}:27017/quasi-express`)
      .then(
        ({ connection }) =>
          assert.isAbove(connection.readyState, 0) && assert.isNumber(connection.readyState)
      )
      .catch(error => assert.isNull(error, error.message))
  })

  it('should create an open connection to the MongoDB server', () =>
    assert.strictEqual(mongoose.connection.readyState, 1))
  it('should be able to login', () => {
    let agent = chai.request.agent(app)
    return agent
      .post('/users/login')
      .send({ email: 'mark@gmail.com', password: 'vegeta12', json: 'true' })
      .then(res => {
        return expect(res).to.have.cookie('connect.sid')
      })
      .then(() => {
        console.log('stop')
        agent.close()
      })
  })

  after(() => mongoose.disconnect().catch(error => assert.isNull(error, error.message)))
})
