const express = require('express');
const router = express.Router();
const multer = require('multer');

const Project = require('../server/schema/project');


// Where do the file uploads go to
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, '[' + Date.now() + ']-' + file.originalname)
    }
});
const upload = multer({ storage: storage });


router.get('/', async function (req, res) {
    var prom = await test();
    console.log(prom);
    Project.find({}, function (error, projects) {
        if (error) {
            res.render('projects', { title: 'Projects', error: error });
        } else {
            res.render('projects', { title: 'Projects', projects: projects, script: 'js/add_project.js' });
        }
    });
});


router.post('/upload', upload.array('qa_files'), function (req, res) {
    res.status(500).json(err);
});


const test = function () {
    return new Promise(resolve => {
        Project.find({}, function (error, projects) {
            resolve(projects);
        });
    });
}

module.exports = router;