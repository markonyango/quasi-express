var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', routePath: 'home' });
});

router.get('/login', function(req, res, next) {
  res.render('login', {title: 'Login', routePath: 'login'})
});

router.get('/register', function(req, res, next) {
  res.render('register', {title: 'Registration', routePath: 'register'});
});

module.exports = router;
