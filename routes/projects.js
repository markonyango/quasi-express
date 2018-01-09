const express = require('express');
const router = express.Router();

const Project = require('../server/schema/project');

router.get('/', function(req, res) {
    Project.find({}, function (error, projects) {
        if (error) {
            console.log("Something went wrong here");
        } else {
            console.log(projects);
            res.render('projects', {title: 'Projects', routePath: 'projects', data: projects});
        }
    });
});

module.exports = router;