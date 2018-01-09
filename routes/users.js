const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local');

const User = require('../server/schema/user');

/* GET users listing. */
router.get('/register', function (req, res, next) {
  res.render('register', { title: 'Registration', routePath: 'register' });
});

router.post('/register', function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  // Validation - later maybe

  // newUser is the document that will enter the 'users' collection
  const newUser = new User({
    email: email,
    password: password
  });

  newUser.save(function (err) {
    if (err) {
      res.status(500).json({ error: err });
    } else {
      res.render('register', { title: 'Registration', routePath: 'register', data: newUser.email });
    }
  });

});

router.get('/login', function (req, res, next) {
  res.render('login', { title: 'Login', routePath: 'login' })
});

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
},
  function (email, password, done) {
    User.findOne({ email: email }, function (err, user) {
      if (err) return done(err);
      if (!user) {
        return done(null, false, { message: 'Wrong credentials' });
      }
      user.comparePassword(password, function (err, isMatch) {
        if (err) return done(err);
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Wrong credentials' });
        }
      });
    });
  })
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

verbose = function (req, res, next) {
  console.log(req.body);
  next();
}

router.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }), verbose,
  function (req, res, next) {

    res.redirect('/');

    // const email = req.body.email;
    // const password = req.body.password;


  });

router.get('/logout', function (req, res) {
  req.logout();
  req.flash('success_msg', 'You are now logged out');
  res.redirect('/users/login');
});

module.exports = router;
