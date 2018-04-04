const express = require('express')
const path = require('path')
const logger = require('morgan')
const bodyParser = require('body-parser')
const hbs = require('hbs')
const fs = require('fs-extra')
const compression = require('compression')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const expressValidator = require('express-validator')
const favicon = require('serve-favicon')
const cors = require('cors')
const helmet = require('helmet')
const { mongoDB } = require('./settings')
const printOut = require('./helpers/printOut')


// Register Custom HandlebarsHelpers
require('./helpers/handlebar_helpers')

// Passport requirements
const passport = require('passport')
// const LocalStrategy = require('passport-local').Strategy;

// Import Routes
const index = require('./routes/index')
const users = require('./routes/users')
const projects = require('./routes/projects')
const settings = require('./routes/settings')

// Initialize Express App
var app = express()

// Make sure CORS is enabled on this server
//let whitelist = ['http://localhost:3000', 'http://localhost:4200', 'http://127.0.0.1:5500', 'localhost:3000']
app.use(cors({
  credentials: true,
  origin: /localhost|127\.0\.0\.1/
}
))

// Use HelmetJS to secure Express server by setting various HTTP headers
app.use(helmet({
  noCache: true
}))

// view engine setup
hbs.registerPartials(__dirname + '/views/partials')
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')

// Use GZip compression on responses
app.use(compression())

// Morgan middleware setup
const morganlog = fs.createWriteStream(path.join(__dirname, 'morganlog.txt'), { flags: 'a' })
app.use(logger('dev', {
  stream: morganlog,
  skip: function (req) {
    return /^\/js|^\/css|^\/ico/.test(req.url)
  }
}))
// app.use(logger('dev', {
//   skip: function (req) { return /^\/js|^\/css|^\/ico/.test(req.url) }
// }));

// Bodyparser and Cookieparser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(expressValidator())

// Express session - this must come after the cookieParser()
app.use(session({
  secret: 'supermegasecretkeythatnobodyshalleverfindout',
  saveUninitialized: false,
  resave: false,
  store: new MongoStore({
    url: `mongodb://${mongoDB}:27017/quasi-express`,
    touchAfter: 24 * 3600,
    ttl: 2 * 24 * 3600
  }),
  cookie: {
    httpOnly: false
  }
}))

// Passport initialization
app.use(passport.initialize())
app.use(passport.session())

// Connect Flash middleware
app.use(flash())

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.error = req.flash('error')
  res.locals.user = req.user || null
  // Make server stats available
  if(req.user){
    res.locals.stats = {
      memoryUsage: {
        heapTotal: Math.trunc(process.memoryUsage().heapTotal / 1024 / 1024),
        heapUsed: Math.trunc(process.memoryUsage().heapUsed / 1024 / 1024),
        rss: Math.trunc(process.memoryUsage().rss / 1024 / 1024)
      },
      cpuUsage: {
        user: process.cpuUsage().user / 1e6,
        system: process.cpuUsage().system / 1e6
      },
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform
    }
  }
  next()
})

// Set static public folder
app.use(express.static(path.join(__dirname, 'public')))

// Favicon middleware
app.use(favicon(path.join(__dirname, 'public', 'ico', 'favicon.ico')))

app.use('/', index)
app.use('/users', users)
app.use('/settings', ensureAuthenticated, settings)
app.use('/projects', ensureAuthenticated, projects)
app.use('/test', function (req, res) {
  res.render('test', { title: 'QUASI-Express App Testsuite', css: 'https://cdnjs.cloudflare.com/ajax/libs/mocha/5.0.1/mocha.min.css' })
})

// Middleware that ensure the visitor is authenticated to view secured areas
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next()
  } else {
    let json = req.query.json || req.body.json || false
    console.error(`Detected unauthorized access attempt from ${req.ip} - ${req.hostname} @ URL: ${req.originalUrl}`.red)
    if (!json) {
      req.flash('error_msg', 'You are not logged in')
      res.redirect('/users/login')
    } else {
      res.status(403).json('You are not logged in')
      res.end()
    }
  }
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error(`Requested route (${req.originalUrl}) could not be found!`)
  err.status = 404
  next(err)
})

// error handler
// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)

  req.body.json ? res.json(err) : res.render('error')
})

function gracefulExit(signal) {
  require('./server/server').connection.close()
    .then(() => {
      console.log(`Recieved signal: ${signal}. Killing myself...`)
      signal === 'SIGUSR2' ? process.kill(process.pid, 'SIGUSR2') : process.kill(process.pid, signal)
    })
    .catch(error =>  {
      console.error(`${printOut(__filename)} Could not close the connection to the MongoDB server: ${error}`.red)
      process.kill(process.pid, 'SIGKILL')
    })
}

process
  .once('SIGINT', gracefulExit)
  .once('SIGTERM', gracefulExit)
  .once('SIGUSR2', gracefulExit)

module.exports = app
