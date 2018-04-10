let concat = require('gulp-concat')
let cleanCSS = require('gulp-clean-css')
let autoprefixer = require('gulp-autoprefixer')
let nodemon = require('gulp-nodemon')
let gulp = require('gulp')

gulp.task('css', function(done) {
  gulp
    .src('css/*.css')
    .pipe(cleanCSS())
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest('public/css'))
  done()
})

gulp.task('start', function() {
  nodemon({
    script: './bin/www',
    tasks: ['css'],
    ext: 'hbs js css',
    ignore: ['public/css/style.min.css', 'gulpfile.js', '*.txt', 'uploads/*', 'node-modules/*'],
    verbose: false
  })
})
