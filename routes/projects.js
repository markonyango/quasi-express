const express = require('express');
const router = express.Router();
const multer = require('multer');
const to = require('../catchError');

const Project = require('../server/schema/project');


// Where do the file uploads go to
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        // 
        // TODO: DO NOT FORGET TO DELETE TEST QUERY PARAMETER OPTION - UNSAFE !!!!!!!!
        //
        var uid
        if (!req.session.passport) {
            uid = 'test';
        } else {
            uid = req.session.passport.user._id;
        }

        cb(null, '[' + uid + ',' + Date.now() + ']-' + file.originalname)
    }
});
const upload = multer({ storage: storage });


router.get('/', async function (req, res) {
    // 
    // TODO: DO NOT FORGET TO DELETE TEST QUERY PARAMETER OPTION - UNSAFE !!!!!!!!
    // 
    const uid = req.query.test === 'true' ? '5a54c8c217cdf72718ca1420' : req.session.passport.user;

    if (req.query.json === 'true') {
        let error, projects;
        [error, projects] = await to(Project.find({ uid: uid }));

        if (error) {
            res.send(500).json(error)
        } else {
            res.status(200).json(projects);
        }
    } else {
        let error, projects;
        [error, projects] = await to(Project.find({ uid: uid }));
        if (error) {
            req.flash('error_msg', 'Something went wrong while getting the list of projects: ' + error);
            res.redirect('/projects');
        } else {
            res.render('projects', { title: 'Projects', projects: projects, script: 'js/projects.js' });
        }
    }
});


router.post('/upload', upload.array('files'), async function (req, res) {

    const files = req.files;
    const projectname = req.body.projectname;
    const projecttype = req.body.projecttype;
    const settings = ['option1', 'option2'];
    const status = 'queued';
    const uid = req.body.uid;

    var project = new Project({
        projectname: projectname,
        projecttype: projecttype,
        settings: settings,
        status: status,
        files: [],
        uid: uid,
        created: Date.now()
    });


    for (let file of files) {
        project.files.push(file.filename);
    }

    let error, result;
    [error, result] = await to(project.save());
    error ? res.status(500).json(error) : res.status(200).json(result);
});


router.get('/:id', async function (req, res) {

    // 
    // TODO: DO NOT FORGET TO DELETE TEST QUERY PARAMETER OPTION - UNSAFE !!!!!!!!
    // 
    const uid = req.query.test === 'true' ? '5a54c8c217cdf72718ca1420' : req.session.passport.user;

    // View project details
    const id = req.params.id;
    if (req.query.json === 'true') {

        var [error, project] = await to(Project.findOne({ _id: id, uid: uid }));

        if (error) {
            res.json(error)
        } else {
            res.status(200).json(project);
        }
    } else {
        let error, project;
        [error, project] = await to(Project.findOne({ _id: id, uid: uid }));
        if (error) {
            req.flash('error', error);
            res.redirect('/projects');
        } else {
            res.render('project', { title: 'Project', project: project });
        }
    }

});

router.put('/:id/:action', async function (req, res) {

    // 
    // TODO: DO NOT FORGET TO DELETE TEST QUERY PARAMETER OPTION - UNSAFE !!!!!!!!
    // 
    const uid = req.query.test === 'true' ? '5a54c8c217cdf72718ca1420' : req.session.passport.user;

    const pid = req.params.id;
    const action = req.params.action;

    let error, project;
    [error, project] = await to(Project.findOne({ _id: pid, uid: uid }));

    if (error) {
        req.flash('error_msg', 'There was a mistake with your PUT request: ' + error)
        res.redirect('/projects');
    } else {
        let error, result;
        switch (action) {
            case 'start':
                [error, result] = await to(project.startjob());
                error ? res.json(error) : res.json(result);
                break;
            case 'stop':
                [error, result] = await to(project.stopjob());
                error ? res.json(error) : res.json(result);
                break;
            case 'remove':                
                [error, result] = await to(project.removejob());
                
                error ? res.json(error) : res.json(result);
                break;
            default:
                error = 'Could not identify the requested change action: ';
                res.json(error + action);
        }
    }
});


module.exports = router;