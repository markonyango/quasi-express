const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const mongoose = require('mongoose');
const to = require('../catchError');

const User = require('../server/schema/user');

/* GET users listing. */
router.get('/register', function (req, res) {
  res.render('register', { title: 'Registration' });
});

router.post('/register', function (req, res) {
  const email = req.body.email;
  const password = req.body.password;

  // Validation
  req.check('email', 'Invalid email address').isEmail();
  req.check('password', 'Password must be at least 6 characters long').isLength({ min: 6 });

  var errors = req.validationErrors();
  if (errors) {
    var error_msg = '';
    errors.forEach(err => error_msg += err.msg + '; ');
    req.flash('error_msg', error_msg);
    res.redirect('/users/register');
  } else {

    // newUser is the document that will enter the 'users' collection
    const newUser = new User({ email: email, password: password });

    let [error, res] = to(newUser.save());

    if (error) {
      req.flash('error_msg', 'Something went wrong while registering you: ' + error);
      res.redirect('/register');
    } else {
      res.render('register', { title: 'Registration', data: newUser.email });
    }
  }

});

router.get('/login', function (req, res) {
  res.render('login', { title: 'Login' })
});

passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, function (email, password, done) {
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
  done(null, user);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

router.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/users/login', failureFlash: true }),
  function (req, res, next) {

    res.redirect('/');

  });

router.get('/logout', function (req, res) {
  req.logout();
  req.flash('success_msg', 'You are now logged out');
  res.redirect('/users/login');
});



module.exports = router;
