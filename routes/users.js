const express = require('express')
const router = express.Router()
const passport = require('passport')
const LocalStrategy = require('passport-local')
const printOut = require('../helpers/printOut')

const User = require('../server/schema/UserSchema')

/* GET users listing. */
router.get('/register', function (req, res) {
  res.render('register', { title: 'Registration' })
  req.session.destroy()
})

router.post('/register', function (req, res, next) {
  const email = req.body.email
  const password = req.body.password

  // Validation
  req.check('email', 'Email address is empty').isLength({ min: 1 })
  req.check('email', 'Invalid email address').isEmail()
  req.check('password', 'Password must be at least 6 characters long').isLength({ min: 6 })

  let errors = req.validationErrors()
  if (errors) {
    let error_msg = ''
    errors.forEach(err => error_msg += err.msg + '; ')
    if (req.query.json === 'true') {
      res.status(400).json(error_msg)
    } else {
      req.flash('error_msg', error_msg)
      res.redirect('/users/register')
    }
  } else {

    // newUser is the document that will enter the 'users' collection
    const newUser = new User({ email: email, password: password })
    
    if (req.query.json === 'true') {
      // Save the new user to the MongoDB
      newUser.save()
        .then(user => {
          req.session.destroy()
          res.status(200).json(user)
        })
        .catch(error => {
          console.error(`Could not register new user ${newUser.email}: ${error}`)
          req.session.destroy()
          res.status(500).json(error)
        })
    } else {
      newUser.save()
        .then(user => {
          req.flash('success_msg', `${user.email} successfully registered`)
          res.redirect(200, 'login')
        })
        .catch(error => {
          console.error(`${printOut(__filename)} Could not register new user ${newUser.email}: ${error}`.red)
          req.flash('error_msg', 'Something went wrong while registering you: ' + error)
          res.redirect('register')
        })
    }
  }
})

router.get('/login', function (req, res) {
  res.render('login', { title: 'Login' })
})

passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, function (email, password, done) {
  User.findOne({ email: email }, function (err, user) {
    if (err) return done(err)
    if (!user) {
      return done(null, false, { message: 'Wrong credentials' })
    }
    user.comparePassword(password, function (err, isMatch) {
      if (err) return done(err)
      if (isMatch) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Wrong credentials' })
      }
    })
  })
})
)

passport.serializeUser(function (user, done) {
  done(null, user)
})

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user)
  })
})

router.post('/login', passport.authenticate('local', { failWithError: true, failureFlash: true }),
  function (req, res) {

    if (req.body.json) {
      let { _id, email, role } = req.user
      res.json({ _id, email, role })
    } else {
      res.redirect('/')
    }


  })

router.get('/logout', function (req, res) {
  req.logout()
  res.clearCookie('connect.sid')
  req.flash('success_msg', 'You are now logged out')
  req.session.destroy()
  res.redirect('/')
})

router.post('/remove', function (req, res) {
  const uid = req.user._id
  // User remove pre-hooks only fire when remove is called on the document
  // Thus we can not call Model.remove(...)

  // If JSON was requested
  if (req.query.json === 'true') {
    User.findById(uid).exec()
      .then(user => user.remove())
      .then(user => {
        req.session.destroy()
        req.logout()
        res.clearCookie('connect.sid')
        res.status(200).json(user)


      })
      .catch(error => res.status(500).json(error))
  } else {
    User.findById(uid).exec()
      .then(user => user.remove())
      .then(() => {
        req.logout()
        req.session.destroy()
        res.clearCookie('connect.sid')
        req.flash('success_msg', 'Successfully remove your account')
        res.redirect('/')
      })
      .catch(error => {
        req.flash('error_msg', `Could not find the user you want to remove: ${error}`)
        res.redirect(500, '/')
      })

  }
})

module.exports = router
