var gulp = require('gulp'),
  streamqueue = require('streamqueue'),
  templateCache = require('gulp-angular-templatecache'),
  concat = require('gulp-concat'),
  jade   = require('gulp-jade'),
  rename = require('gulp-rename'),
  umd    = require('gulp-umd'),
  uglify = require('gulp-uglify');

gulp.task('minify', function() {
  var stream = streamqueue({objectMode: true});
  stream.queue(
    gulp.src('./src/decorators/bootstrap/*.jade')
      .pipe(jade())
      .pipe(templateCache({
        module: 'schemaForm',
        root: 'decorators/bootstrap/'
      }))
  );
  stream.queue(gulp.src('./src/**/*.js'));

  stream.done()
  .pipe(concat('angular-schema-form-someof.js'))
  .pipe(umd({
      dependencies: function() {
          return [
            {name: 'lodash', param: '_', global: '_'},
            {name: 'angular-schema-form', param: 'angularSchemaForm', global: 'angularSchemaForm'},
            {name: 'angular-schema-form-bootstrap', param: 'schemaFormBootStrap', global: 'schemaFormBootstrap'}
          ];
      },
      exports: function() { return 'schemaFormSomeOf'; },
      namespace: function() { return 'schemaFormSomeOf'; }
  }))
  .pipe(gulp.dest('./dist/'))
  .pipe(uglify())
  .pipe(rename('angular-schema-form-someof.min.js'))
  .pipe(gulp.dest('./dist/'));

});