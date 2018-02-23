const { assert } = require('chai');
const fetch = require('node-fetch');
const to = require('../catchError');
const fs = require('fs');
const FormData = require('form-data');
const createUser = require('./createUser');


// Set up some global test variables
const uid = '5a54c8c217cdf72718ca1420';
var project_id = '';


async function project_routes() {

  after(async () => {
    const Project = require('../server/schema/project');
    var projects = await Project.deleteMany({ uid: uid });
    assert.equal(projects.deletedCount, 0, 'Leftover documents from the testrun were found!');
  });

  it('Project Route POST /projects/upload creates test project', async function () {
    const form = new FormData;
    form.append('projectname', 'Test Project');
    form.append('projecttype', 'qa');
    form.append('settings', 'null');
    form.append('status', 'queued');
    form.append('uid', uid);
    form.append('files', fs.createReadStream('test.fastq'));

    var res = await makeGetRequest('http://localhost:3000/projects/upload?uid='+uid+'', 'POST', form);
    project_id = res._id;
    assert.equal(res.projectname, 'Test Project')
    assert.equal(res.status, 'queued')
    assert.equal(res.pid, 0);
  });

  it('Project Route GET /projects returns at least one MongoDB object with all respective schema properties', async function () {
    var res = await makeGetRequest('http://localhost:3000/projects?json=true&uid='+uid+'', 'GET');
    assert.hasAllKeys(res[0], ['__v', '_id', 'uid', 'created', 'projectname', 'projecttype', 'status', 'pid', 'files', 'settings']);
  });

  it('Project Route GET /projects/:id?json=true returns test project', async function () {
    var res = await makeGetRequest('http://localhost:3000/projects/' + project_id + '?json=true&uid='+uid+'', 'GET');
    assert.hasAllKeys(res, ['__v', '_id', 'uid', 'created', 'projectname', 'projecttype', 'status', 'pid', 'files', 'settings']);
  });

  it('Project Route PUT /projects/:id/start starts job', async function () {  
    try {
      // Start the project and make sure the status is 'running'
      let res = await makeGetRequest('http://localhost:3000/projects/' + project_id + '/start?uid='+uid+'', 'PUT')
      assert.equal(res.status, 'running', 'Project is not running but it should be!');
    } catch (error) {
      assert.isNull(error, 'makeGetRequest failed! ' + error);
    }

  });

  it('Project Route PUT /projects/:id/:action can remove test project', function (done) {
    makeGetRequest('http://localhost:3000/projects/' + project_id + '/remove?uid='+uid+'', 'PUT')
    .then(res => {
      assert.hasAllKeys(res, ['__v', '_id', 'uid', 'created', 'projectname', 'projecttype', 'status', 'pid', 'files', 'settings'])
      done()
    })
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