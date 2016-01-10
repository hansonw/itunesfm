const gulp = require('gulp');
const babel = require('gulp-babel');

gulp.task('default', () => {
  return gulp.src('src/*.js')
    .pipe(babel({
      presets: [
        'es2015',
        'stage-0',
      ],
      plugins: [
        'syntax-flow',
        'transform-flow-strip-types',
        'transform-runtime',
      ],
    }))
    .pipe(gulp.dest('bin'));
});
