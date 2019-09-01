var gulp = require('gulp'),
    minifyCSS = require('gulp-minify-css'),
    concat = require('gulp-concat')
    uglify = require('gulp-uglify')
    prefix = require('gulp-autoprefixer')

gulp.task('css', function(){
    return gulp.src('themes/mediaglasses/static/css/*.css')
    .pipe(concat('site.css'))
    .pipe(minifyCSS())
    .pipe(prefix('last 2 versions'))
    .pipe(gulp.dest('themes/mediaglasses/static/built/'))
});

gulp.task('default', function() {
    gulp.run('css')
});