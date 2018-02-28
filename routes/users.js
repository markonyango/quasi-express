const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const mongoose = require('mongoose');
const to = require('../catchError');

const User = require('../server/schema/user');
const Project = require('../server/schema/project');

/* GET users listing. */
router.get('/register', function (req, res) {
  res.render('register', { title: 'Registration' });
});

router.post('/register', async function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;

  // Validation
  req.check('email', 'Email address is empty').isLength({ min: 1 });
  req.check('email', 'Invalid email address').isEmail();
  req.check('password', 'Password must be at least 6 characters long').isLength({ min: 6 });

  var errors = req.validationErrors();
  if (errors) {
    var error_msg = '';
    errors.forEach(err => error_msg += err.msg + '; ');
    if (req.query.json === 'true') {
      res.json(error_msg);
    } else {
      req.flash('error_msg', error_msg);
      res.redirect('/users/register');
    }
  } else {

    // newUser is the document that will enter the 'users' collection
    const newUser = new User({ email: email, password: password });

    try {
      let result = await newUser.save();

      if (req.query.json === 'true') {
        res.json(result)
      } else {
        res.render('register', { title: 'Registration', data: newUser.email });
      }
    } catch (error) {
      if (req.query.json === 'true') {
        console.error(error)
        res.json(error)
      } else {
        req.flash('error_msg', 'Something went wrong while registering you: ' + error);
        res.redirect('/register');
      }
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
      let { _id, email, role } = req.session.passport.user
      res.json({ _id, email, role })
    } else {
      res.redirect('/')
    }


  });

router.get('/logout', function (req, res) {
  req.logout();
  req.flash('success_msg', 'You are now logged out');
  res.redirect('/users/login');
});

router.post('/remove', async function (req, res) {

  // If JSON was requested
  if (req.query.json === 'true') {
    const uid = req.body.uid;

    try {
      let deleteProjects = await Project.deleteMany({ uid: mongoose.Types.ObjectId(uid) })
      let deleteUser = await User.findOneAndRemove({ _id: mongoose.Types.ObjectId(uid) })
      req.clearCookie = true
      let {email, _id, role} = deleteUser
      res.json({email, _id, role})
      req.session.destroy()
    } catch (error) {
      res.json(error)
    }
  } else {

    const uid = req.session.passport.user._id;
    let [error, deleteProjects] = await to(Project.deleteMany({ uid: mongoose.Types.ObjectId(uid) }));

    if (error) {
      req.flash('error_msg', 'Something went wrong while deleting your projects: ' + error);
      res.redirect('/');
    } else {
      let ret;
      [error, ret] = await to(User.findByIdAndRemove(uid));

      if (error) {
        req.flash('error_msg', 'Something went wrong while deleting your profile: ' + error);
        res.redirect('/');
      } else {
        req.clearCookie = true;
        req.flash('success_msg', 'Your account has been successfully deleted.');
        res.redirect('/');
        req.session.destroy();
      }
    }
  }
});



module.exports = router;
