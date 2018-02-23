const express = require('express');
const router = express.Router();
const multer = require('multer');
const to = require('../catchError');
const { alignReferenceFolder } = require('../settings');
const fs = require('fs-extra');
const path = require('path');

const Project = require('../server/schema/project');
const User = require('../server/schema/user');


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

        cb(null, '[' + uid + '_' + Date.now() + ']-' + file.originalname)
    }
});
const upload = multer({ storage: storage });


router.get('/', async function (req, res) {
    // 
    // TODO: DO NOT FORGET TO DELETE TEST QUERY PARAMETER OPTION - UNSAFE !!!!!!!!
    //
    let uid;
    try {
        uid = req.query.uid ? req.query.uid : req.session.passport.user;
    } catch (error) {
        console.error('Invalid user session!');
        res.status(500).json(error);
        return;
    }

    if (req.query.json === 'true') {
        try {
            let projects = await Project.find({ uid: uid });
            res.status(200).json(projects);
        } catch (error) {
            console.log(error)
            res.send(500).json(error)
        }
    } else {
        try {
            let projects = await Project.find({ uid: uid });
            res.render('projects', { title: 'Projects', projects: projects, script: 'js/projects.js' });
        } catch (error) {
            req.flash('error_msg', 'Something went wrong while getting the list of projects: ' + error);
            res.redirect('/projects');
        }
    }
});


router.post('/upload', upload.array('files'), async function (req, res) {

    const files = req.files;
    const projectname = req.body.projectname;
    const projecttype = req.body.projecttype;
    const settings = req.body.settings || {};
    const status = 'queued';
    const uid = req.query.uid ? req.query.uid : req.session.passport.user._id;

    if (!files || !projectname || !projecttype || !uid) {
        res.status(400).json('Invalid POST request!');
        return
    }

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

    try {
        const result = await project.save();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json(error);
    }
});

router.get('/references', function (req, res) {
    if (!req.session.passport) {
        res.status(403).json(req.session);
    } else {
        fs.readdir(alignReferenceFolder, (err, files) => {
            if (err) {
                res.status(500).json(err);
            } else {
                files = files.filter(file => {
                    return file.indexOf('.fasta') >= 0 ? true : false
                });
                res.status(200).json(files);
            }
        });
    }
});


router.get('/:id', async function (req, res) {

    // 
    // TODO: DO NOT FORGET TO DELETE TEST QUERY PARAMETER OPTION - UNSAFE !!!!!!!!
    // 
    const uid = req.query.uid ? req.query.uid : req.session.passport.user;

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
        try {
            let project = await Project.findOne({ _id: id, uid: uid });
            if (project.status === 'done') {
                await project.populate('uid', 'settings').execPopulate();
                const savePath = project.uid.settings.savePath;
                const id = project._id.toString();
                // TODO: Make sure the output folder exists
                let files = fs.readdirSync(path.join(savePath, id));
                files = files.filter(file => file.indexOf('log') >= 0 ? true : false);
                if (files.length != 1) {
                    req.flash('error', 'This project has more than 1 logfile');
                    res.redirect('/projects');
                    return
                } else {
                    let logfile = fs.readFileSync(path.join(savePath, id, files[0]), {encoding: 'utf8'}).toString();
                    res.render('project', { title: 'Project', project: project, log: logfile });
                }
            } else {
                res.render('project', { title: 'Project', project: project });
            }
        } catch (error) {
            req.flash('error', error.toString());
            res.redirect('/projects');
        }
    }

});

router.put('/:id/:action', async function (req, res) {

    // 
    // TODO: DO NOT FORGET TO DELETE TEST QUERY PARAMETER OPTION - UNSAFE !!!!!!!!
    // 
    const uid = req.query.uid ? req.query.uid : req.session.passport.user;

    const pid = req.params.id;
    const action = req.params.action;

    let [error, project] = await to(Project.findOne({ _id: pid, uid: uid }));

    if (error) {
        req.flash('error_msg', 'There was a mistake with your PUT request: ' + error)
        res.redirect('/projects');
    } else {
        let error, result;
        switch (action) {
            case 'start':
                try {
                    result = await project.startjob();
                    res.json(result);
                } catch (error) {
                    res.json(error)
                }
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