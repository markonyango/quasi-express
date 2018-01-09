const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const fs = require('fs');
const compression = require('compression');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');

// Passport requirements
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;


// Import Routes
const index = require('./routes/index');
const users = require('./routes/users');
const projects = require('./routes/projects');

// Initialize Express App
var app = express();

// view engine setup
hbs.registerPartials(__dirname + '/views/partials');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Use GZip compression on responses
app.use(compression());

// Bodyparser and Cookieparser middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Express session - this must come after the cookieParser()
app.use(session({
  secret: 'supermegasecretkeythatnobodyshalleverfindout',
  saveUninitialized: false,
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

app.use('/', index);
app.use('/users', users);
app.use('/projects', projects);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
