const express = require('express');
const router = express.Router();

const Project = require('../server/schema/project');

router.get('/', function(req, res) {
    Project.find({}, function (error, projects) {
        if (error) {
            console.log("Something went wrong here");
        } else {
            req.flash('success_msg','Viewing all projects');
            // res.redirect('/');
            res.render('projects', {title: 'Projects', routePath: 'projects', message: req.flash('success_msg')});
        }
    });
});

module.exports = router;