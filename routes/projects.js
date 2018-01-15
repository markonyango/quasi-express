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
        const uid = req.session.passport.user;
        cb(null, '[' + uid + ',' + Date.now() + ']-' + file.originalname)
    }
});
const upload = multer({ storage: storage });


router.get('/', function (req, res) {
    const uid = req.session.passport.user;

    if (req.query.json === 'true') {
        Project.find({ uid: uid }, function (error, projects) {
            if (error) {
                res.send(500).json(error);
            } else {
                res.status(200).json(projects);
            }
        });
    } else {
        Project.find({ uid: uid }, function (error, projects) {
            if (error) {
                res.render('projects', { title: 'Projects', error: error });
            } else {
                res.render('projects', { title: 'Projects', projects: projects, script: 'js/projects.js' });
            }
        });
    }
});


router.post('/upload', upload.array('files'), function (req, res) {

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

    for (const file of files) {
        project.files.push(file.filename);
    }

    project.save()
        .then(res.sendStatus(200))
        .catch(error => res.send(500).json(error));
});


router.get('/:id', async function (req, res) {
    // View project details
    const id = req.params.id;
    if (req.query.json === 'true') {
        const project = await Project.findOne({_id: id});
        res.status(200).json(project);
    } else {
        Project.findOne({ _id: id })
            .then(async project => {
                console.log('Before');
                await project.startjob();
                console.log('After')
                res.render('project', { title: 'Project', project: project });
            })
            .catch(error => {
                req.flash('error', error.message);
                res.redirect('/projects');
            });
    }

});

router.put('/:id', function (req, res) {
    // Project child process spawning stuff 
    // Process status updating - start, stop aka cancel
    res.redirect('/');
});


module.exports = router;