var gulp = require('gulp');
var babel = require('gulp-babel');

gulp.task('default', function() {
  return gulp.src('src/**/*.js')
    .pipe(babel({
      presets: [
        'es2015',
        'stage-0'
      ],
      plugins: [
        'syntax-flow',
        'transform-flow-strip-types',
        'transform-runtime'
      ]
    }))
    .pipe(gulp.dest('bin'));
});
