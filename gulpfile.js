let concat = require('gulp-concat')
let cleanCSS = require('gulp-clean-css')
let autoprefixer = require('gulp-autoprefixer')
let nodemon = require('gulp-nodemon')
let gulp = require('gulp')

gulp.task('css', function() {
  let stream = gulp
    .src('css/*.css')
    .pipe(cleanCSS())
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest('public/css'))
  return stream
})

gulp.task('start', function() {
  let stream = nodemon({
    script: './bin/www',
    tasks: ['css'],
    ext: 'hbs js css',

    ignore: [
      'public/css',
      'gulpfile.js',
      'uploads',
      '.git'
    ],
    verbose: true
  })
  return stream
})
