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


router.get('/', function (req, res) {
    Project.find({}, function (error, projects) {
        if (error) {
            res.render('projects', { title: 'Projects', error: error });
        } else {
            res.render('projects', { title: 'Projects', projects: projects, script: 'js/add_project.js' });
        }
    });
});


router.post('/upload', upload.array('qa_files'), function(req, res) {
    // console.log(req.body, req.files, req.file);
    // req.flash('success_msg',req.body);
    res.status(200).json(req.body);
});

module.exports = router;