const { assert } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');
const User = require('../server/schema/user');
const Project = require('../server/schema/project');
const FormData = require('form-data');
const to = require('../catchError');
const { uploadPath } = require('../settings');

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
    form.append('files', fs.createReadStream('test.fastq'));

    var res = await makeGetRequest('http://localhost:3000/projects/upload?uid='+uid+'', 'POST', form);
    project_id = res._id;
    assert.equal(res.projectname, 'Test Project')
    assert.equal(res.status, 'queued')
    assert.equal(res.pid, 0);
    project = await Project.findOne({ _id: res._id }).populate('uid', 'settings');
  });

  after(async () => {
    var projects = await Project.deleteMany({ uid: uid });
    assert.equal(projects.deletedCount, 1, 'Number of projectes to be cleaned up should be 1...');
  });

  it('Save folder exists and is readable', async function () {
    fs.open(project.uid.settings.savePath, 'r', (err, fd) => {
      assert.isNull(err, 'Upload folder seems unreadable');
      assert.notEqual(err, 'ENOENT', 'Upload folder does not exist');
    });
  });

  it('Output files are being written to the save folder', function (done) {
    this.timeout(10000);
    makeGetRequest('http://localhost:3000/projects/' + project._id + '/start?uid='+uid+'', 'PUT')
      .then(res => {
        assert.equal(res.status, 'running', 'Project should be running but isn\'t');
        setTimeout(() => {

          fs.readdir(path.join(res.uid.settings.savePath, res._id))
            .then(files => {
              assert.isAbove(files.length, 0, 'There are no output files in the save folder.');
            })
            .catch(error => assert.isNull(error, 'Something went wrong while reading the output folder!'))

          done()

        }, 1500);
      })
      .catch(error => assert.isNull(error, 'Something went wrong with makeGetRequest!'));
  });

  it('Servers upload folder is void of any file belonging to the test project', async function () {
    let files = await fs.readdir(uploadPath);
    files.filter(file => file.indexOf(project._id) >= 0 ? true : false)
    assert.isEmpty(files);
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