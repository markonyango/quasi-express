const { assert } = require('chai');
const fetch = require('node-fetch');
const to = require('../catchError');
const fs = require('fs');
const FormData = require('form-data');
const createUser = require('./createUser');


// Set up some global test variables
const uid = '5a54c8c217cdf72718ca1420';
var project_id = '';
const opts = {
  headers: {
    cookie: ''
  }
}

async function project_routes() {
  
  // 
  before(async () => {
    opts.headers.cookie = await createUser();
  });

  after( async () => {
    const Project = require ('../server/schema/project');
    var projects = await Project.deleteMany({uid: uid});
    assert.equal(projects.deletedCount,0, 'Leftover documents from the testrun were found!');
  });

  it('Project Route POST /projects/upload creates test project', async function () {
    const form = new FormData;
    form.append('projectname', 'Test Project');
    form.append('projecttype', 'dea');
    form.append('settings', 'null');
    form.append('status', 'queued');
    form.append('uid', uid);
    form.append('files', fs.createReadStream('test.js'));

    var res = await makeGetRequest('http://localhost:3000/projects/upload', 'POST', form);
    project_id = res._id;
    assert.equal(res.projectname, 'Test Project')
    assert.equal(res.status, 'queued')
    assert.equal(res.pid, 0);
  });

  it('Project Route GET /projects returns at least one MongoDB object with all respective schema properties', async function () {
    var res = await makeGetRequest('http://localhost:3000/projects?json=true&test=true', 'GET');
    assert.hasAllKeys(res[0], ['__v', '_id', 'uid', 'created', 'projectname', 'projecttype', 'status', 'pid', 'files', 'settings']);
  });

  it('Project Route GET /projects/:id?json=true returns test project', async function () {
    var res = await makeGetRequest('http://localhost:3000/projects/' + project_id + '?json=true&test=true', 'GET');
    assert.hasAllKeys(res, ['__v', '_id', 'uid', 'created', 'projectname', 'projecttype', 'status', 'pid', 'files', 'settings']);
  });

  it('Project Route PUT /projects/:id/start starts job', function (done) {
    // Since we are adding a timeout at the end of this test, we need to increase max. timeout
    this.timeout(2500);
    makeGetRequest('http://localhost:3000/projects/' + project_id + '/start?test=true', 'PUT')
    .then(res => {
      assert.hasAllKeys(res, ['__v', '_id', 'uid', 'created', 'projectname', 'projecttype', 'status', 'pid', 'files', 'settings']);
      setTimeout(() => {
        // Give the test operation time to finish on its own before the next test is started
        done()
      },200)
    })
    .catch(error => assert.isNull(error))
  });

  it('Project Route PUT /projects/:id/:action can remove test project', async function () {
    var res = await makeGetRequest('http://localhost:3000/projects/' + project_id + '/remove?test=true', 'PUT');
    assert.hasAllKeys(res, ['__v', '_id', 'uid', 'created', 'projectname', 'projecttype', 'status', 'pid', 'files', 'settings']);
  });


  async function makeGetRequest(url, method, body, headers) {
    let [error, res] = await to(fetch(url, { method: method, body: body, headers: headers }));
    await assert.isNull(error, 'There was an error while making the request to the API (' + url + '): ' + error);
    await assert.equal(res.status, 200);
    res = await res.json()
    return await res
  }

}

module.exports = project_routes;