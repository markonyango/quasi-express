let concat = require('gulp-concat')
let cleanCSS = require('gulp-clean-css')
let autoprefixer = require('gulp-autoprefixer')
let gulp = require('gulp')

function buildCSS() {
  return gulp
    .src('css/*.css')
    .pipe(cleanCSS())
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9'))
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest('public/css'))
}

let build = gulp.series(buildCSS)

gulp.task('css', build)

gulp.task('css:watch', function() {
  gulp.watch('./css/*.css', build)
})
