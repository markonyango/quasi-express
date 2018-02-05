const { assert } = require('chai');
const fs = require('fs');
const fetch = require('node-fetch');
const User = require('../server/schema/user');
const Project = require('../server/schema/project');
const FormData = require('form-data');
const to = require('../catchError');

const opts = {
  headers: {
    cookie: ''
  }
}
var project;
const uid = '5a54c8c217cdf72718ca1420';

function project_execution() {
  before(async () => {
    const form = new FormData;
    form.append('projectname', 'Test Project');
    form.append('projecttype', 'dea');
    form.append('settings', 'null');
    form.append('status', 'queued');
    form.append('uid', uid);
    form.append('files', fs.createReadStream('test.R'));

    var res = await makeGetRequest('http://localhost:3000/projects/upload', 'POST', form);
    project_id = res._id;
    assert.equal(res.projectname, 'Test Project')
    assert.equal(res.status, 'queued')
    assert.equal(res.pid, 0);
    project = await Project.findOne({_id: res._id}).populate('uid','settings');
  });

  after( async() => {
    var projects = await Project.deleteMany({uid: uid});
    assert.equal(projects.deletedCount, 1, 'Number of projectes to be cleaned up should be 1...');
  });

  it('Save folder exists and is readable', async function () {
    fs.open(project.uid.settings.save_path, 'r', (err, fd) => {
      assert.isNull(err, 'Upload folder seems unreadable');
      assert.notEqual(err, 'ENOENT', 'Upload folder does not exist');
    });
  });


  async function makeGetRequest(url, method, body, headers) {
    let [error, res] = await to(fetch(url, { method: method, body: body, headers: headers }));
    await assert.isNull(error, 'There was an error while making the request to the API (' + url + '): ' + error);
    await assert.equal(res.status, 200);
    res = await res.json()
    return await res
  }
}

module.exports = project_execution;