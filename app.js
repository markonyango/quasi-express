const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const fs = require('fs-extra');
const compression = require('compression');
// const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const expressValidator = require('express-validator');
const favicon = require('serve-favicon');
const cors = require('cors');

// Register Custom HandlebarsHelpers
require('./handlebar_helpers');

// Passport requirements
const passport = require('passport');
// const LocalStrategy = require('passport-local').Strategy;


// Import Routes
const index = require('./routes/index');
const users = require('./routes/users');
const projects = require('./routes/projects');
const settings = require('./routes/settings');

// Initialize Express App
var app = express();

// Make sure CORS is enabled on this server
app.use(cors());

// view engine setup
hbs.registerPartials(__dirname + '/views/partials');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Use GZip compression on responses
app.use(compression());

// Morgan middleware setup
// const morganlog = fs.createWriteStream(path.join(__dirname, 'morganlog.txt'), { flags: 'a' });
// app.use(logger('dev', { stream: morganlog }));
app.use(logger('dev', {
  skip: function (req, res) { return /^\/js|^\/css|^\/ico/.test(req.url) }
}));
// Bodyparser and Cookieparser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressValidator());

// Express session - this must come after the cookieParser()
app.use(session({
  secret: 'supermegasecretkeythatnobodyshalleverfindout',
  saveUninitialized: true,
  resave: true,
  store: new MongoStore({
    url: 'mongodb://192.168.0.248:27017/quasi-express',
    touchAfter: 24 * 3600,
    ttl: 2 * 24 * 3600
  })
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Connect Flash middleware
app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// Set static public folder
app.use(express.static(path.join(__dirname, 'public')));

// Favicon middleware
app.use(favicon(path.join(__dirname, 'public', 'ico', 'favicon.ico')));

app.use('/', index);
app.use('/users', users);
app.use('/settings', ensureAuthenticated, settings)
app.use('/projects', projects);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error(`Requested route (${req.originalUrl}) could not be found!`);
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Middleware that ensure the visitor is authenticated to view secured areas
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.flash('error_msg', 'You are not logged in');
    res.redirect('/users/login');
  }
}

var gracefulExit = function () {
  require('./server/server').connection.close(function () {
    console.log('Mongoose connection shut down by killing the Node app.');
    process.exit(0);
  })
}

process
  .on('SIGINT', gracefulExit)
  .on('SIGTERM', gracefulExit)
  .on('SIGUSR2', gracefulExit)

module.exports = app;
