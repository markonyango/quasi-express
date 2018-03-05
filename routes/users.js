const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const mongoose = require('mongoose');
const { MongooseDocument } = require('mongoose');
const fs = require('fs-extra');
const path = require('path');
const { uploadPath } = require('../settings');

const User = require('../server/schema/UserSchema');
const Project = require('../server/schema/ProjectSchema');

/* GET users listing. */
router.get('/register', function (req, res) {
  res.render('register', { title: 'Registration' });
});

router.post('/register', function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  // Validation
  req.check('email', 'Email address is empty').isLength({ min: 1 });
  req.check('email', 'Invalid email address').isEmail();
  req.check('password', 'Password must be at least 6 characters long').isLength({ min: 6 });

  let errors = req.validationErrors();
  if (errors) {
    let error_msg = '';
    errors.forEach(err => error_msg += err.msg + '; ');
    if (req.query.json === 'true') {
      res.json(error_msg);
    } else {
      req.flash('error_msg', error_msg);
      res.redirect('/users/register');
    }
  } else {

    // newUser is the document that will enter the 'users' collection
    const newUser = new User({ email: email, password: password })

    if (req.query.json === 'true') {
      // Save the new user to the MongoDB
      newUser.save()
        .then(user => res.json(user))
        .catch(error => {
          console.error(`Could not register new user ${newUser.email}: ${error}`)
          res.status(500).json(error)
        })
    } else {
      newUser.save()
        .then(user => res.render('register', { title: 'Registration', data: user.email }))
        .catch(error => {
          console.error(`Could not regist new user ${newUser.email}: ${error}`)
          req.flash('error_msg', 'Something went wrong while registering you: ' + error)
          res.redirect('/register')
        })
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

router.post('/login', passport.authenticate('local', { failureRedirect: '/users/login', failureFlash: true }),
  function (req, res, next) {

    if (req.body.json) {
      let { _id, email, role } = req.user
      res.json({ _id, email, role })
    } else {
      res.redirect('/')
    }


  });

router.get('/logout', function (req, res, next) {
  req.logout();
  res.clearCookie('connect.sid')
  req.flash('success_msg', 'You are now logged out');
  res.redirect('/users/login');
});

router.post('/remove', function (req, res, next) {
  const uid = req.user._id;
  // User remove pre-hooks only fire when remove is called on the document
  // Thus we can not call Model.remove(...)

  // If JSON was requested
  if (req.query.json === 'true') {
    User.findById(uid, (err, user) => {
      if (err) {
        console.error(`Could not find the user you want to remove: ${err}`.red)
        res.status(500).json(err)
      } else {
        user.remove()
          .then(user => {
            req.logout();
            res.clearCookie('connect.sid');
            res.json(user)
          })
          .catch(error => {
            console.error(`Could not delete the user: ${error}`.red)
            res.status(500).json(error.message)
          })
      }
    })
  } else {
    User.findById(uid, (err, user) => {
      if (err) {
        console.error(`Could not find the user you want to remove: ${err}`.red)
        req.flash('error_msg', `Could not find the user you want to remove: ${err}`)
        res.redirect(500, '/')
      } else {
        user.remove()
          .then(user => {
            req.logout()
            res.clearCookie('connect.sid')
            req.flash('success_msg', 'Successfully remove your account')
            res.redirect('/')
          })
      }
    })
  }
});

module.exports = router;
