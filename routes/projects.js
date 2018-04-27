const express = require('express')
const router = express.Router()
const multer = require('multer')
const { alignReferenceFolder, uploadPath } = require('../settings')
const fs = require('fs-extra')
const path = require('path')
const { exec } = require('child_process')
const printOut = require('../helpers/printOut')

const Project = require('../server/schema/ProjectSchema')

// Where do the file uploads go to
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    let savePath = req.user.settings.savePath
    cb(null, savePath)
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname)
  }
})
const upload = multer({ storage: storage })

router.get('/', function(req, res) {
  let uid = req.user._id

  if (req.query.json === 'true') {
    Project.find({ uid: uid })
      .exec()
      .then(projects => {
        res.status(200).json(projects)
      })
      .catch(error => {
        console.error(`Could not fetch the list of projects for ${uid}: ${error}`)
        res.send(500).json(error)
      })
  } else {
    Project.find({ uid: uid })
      .exec()
      .then(projects => {
        res.render('projects', { title: 'Projects', projects: projects })
      })
      .catch(error => {
        req.flash('error_msg', 'Something went wrong while getting the list of projects: ' + error)
        res.redirect('/projects')
      })
  }
})

router.post('/upload', upload.array('files'), function(req, res) {
  const files = req.files
  const projectname = req.body.projectname
  const projecttype = req.body.projecttype
  const settings = req.body.settings || {}
  const status = 'queued'
  const uid = req.user._id

  if (!files || !projectname || !projecttype || !uid) {
    console.error('Invalid POST request to project upload route!')
    res.status(400).json({ message: 'Invalid POST request to project upload route', body: req.body })
  } else {
    const project = new Project({
      projectname: projectname,
      projecttype: projecttype,
      settings: settings,
      status: status,
      files: [],
      uid: uid,
      created: Date.now()
    })
    
    for (let file of files) {
      project.files.push(file.filename)
    }

    project
      .save()
      .then(result => res.status(200).json(result))
      .catch(error => {
        console.error(`${printOut(__filename)} Something went wrong while saving project ${project._id}: ${error}`.red)
        res.status(500).json(error)
      })
  }
})

router.get('/references', function(req, res) {
  fs.readdir(alignReferenceFolder, (err, files) => {
    if (err) {
      res.status(500).json(err)
    } else {
      files = files.filter(file => /\.fasta$/.test(file))
      res.status(200).json(files)
    }
  })
})

router.get('/countfiles', function(req, res) {
  const uid = req.user._id
  const userPath = path.join(uploadPath.toString(), uid.toString())

  exec(`find ${userPath} -name 'matrix.txt'`, function(error, stdout, stderr) {
    if (error) {
      res.status(500).json({ error, stderr })
    } else {
      let files = stdout.trim().split('\n')
      let projectIDs = files
        .map(file => path.basename(path.dirname(file)))
        .filter(file => file !== '.')
      let projects = []
      projects = projectIDs.map(id => {
        return Project.findOne({ _id: id, uid: uid })
      })
      Promise.all(projects).then(projectArray => res.status(200).json(projectArray))
    }
  })
})

router.get('/:id', function(req, res) {
  // View project details
  const id = req.params.id
  const uid = req.user._id

  if (req.query.json === 'true') {
    Project.findOne({ _id: id, uid: uid })
      .exec()
      .then(project => project.getData())
      .then(project => res.status(200).json(project))
      .catch(error => res.status(500).json(error))
  } else {
    Project.findOne({ _id: id, uid: uid })
      .exec()
      .then(project => project.getData())
      .then(project =>
        res.render(`results/${project.projecttype}`, {
          title: 'Project',
          project: project
        })
      )
      .catch(error => {
        req.flash('error', error.message)
        res.redirect(500, '/projects')
      })
  }
})

router.get('/:id/:file', function(req, res) {
  const uid = req.user._id
  const { id, file } = req.params

  Project.findOne({ _id: id, uid: uid })
    .exec()
    .then(project => {
      let filePath = `${project.savePath}/${file}`
      res.sendFile(filePath)
    })
    .catch(error => {
      console.error(
        `${printOut(
          __filename
        )} There was a mistake with a request for ${uploadPath}/${uid}/${id}/${file}: ${error}`.red
      )
      res.status(500).json(error)
    })
})

router.put('/:id/:action', function(req, res) {
  const uid = req.user._id
  const { id, action } = req.params

  Project.findOne({ _id: id, uid: uid })
    .exec()
    .then(project => {
      switch (action) {
        case 'start':
          project
            .startjob()
            .then(project => res.status(200).json(project))
            .catch(error => res.status(500).json(error))
          break
        case 'stop':
          project
            .stopjob()
            .then(project => res.status(200).json(project))
            .catch(error => res.status(500).json(error))
          break
        case 'remove':
          project
            .remove()
            .then(project => res.status(200).json(project))
            .catch(error => res.status(500).json(error))
          break
        default:
          res.json(400, 'Could not identify the requested change action: ' + action)
      }
    })
    .catch(error => {
      console.error(
        `${printOut(
          __filename
        )} There was a mistake with your PUT request to start project ${id}: ${error}`.red
      )
      res.status(500).json(error)
    })
})

module.exports = router
