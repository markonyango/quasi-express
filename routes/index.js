var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', function(req, res) {
  req.session.destroy()
  res.render('index', { title: 'QUASI-Express' })
})

module.exports = router
