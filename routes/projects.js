const express = require('express');
const router = express.Router();

const Project = require('../server/schema/project');

router.get('/', function (req, res) {
    Project.find({}, function (error, projects) {
        if (error) {
            res.render('projects', { title: 'Projects', error: error });
        } else {
            res.render('projects', { title: 'Projects', projects: projects, script: 'js/add_project.js' });
        }
    });
});

module.exports = router;