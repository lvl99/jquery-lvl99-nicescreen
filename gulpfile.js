var gulp        = require('gulp'),
    gutil       = require('gulp-util'),
    browserify  = require('browserify'),
    browsersync = require('browser-sync'),
    buffer      = require('vinyl-buffer'),
    concat      = require('gulp-concat'),
    del         = require('del'),
    less        = require('gulp-less'),
    modernizr   = require('gulp-modernizr'),
    prefix      = require('gulp-autoprefixer'),
    rename      = require('gulp-rename'),
    source      = require('vinyl-source-stream'),
    sourcemaps  = require('gulp-sourcemaps'),
    transform   = require('vinyl-transform'),
    uglify      = require('gulp-uglify'),
    uglifycss   = require('gulp-uglifycss'),
    watch       = require('gulp-watch'),
    watchify    = require('watchify');

// Fix gulp's error handling
// See: https://github.com/gulpjs/gulp/issues/71
var origSrc = gulp.src;
gulp.src = function () {
    return fixPipe(origSrc.apply(this, arguments));
};
function fixPipe(stream) {
  var origPipe = stream.pipe;
  stream.pipe = function (dest) {
    arguments[0] = dest.on('error', function (error) {
      var nextStreams = dest._nextStreams;
      if (nextStreams) {
        nextStreams.forEach(function (nextStream) {
          nextStream.emit('error', error);
        });
      } else if (dest.listeners('error').length === 1) {
        throw error;
      }
    });
    var nextStream = fixPipe(origPipe.apply(this, arguments));
    (this._nextStreams || (this._nextStreams = [])).push(nextStream);
    return nextStream;
  };
  return stream;
}

/*
 * Task recipes
 */

gulp.task('default',    ['build', 'watch']);
gulp.task('watch',      ['browsersync', 'watchfiles']);
gulp.task('build',      ['copy', 'less', 'modernizr', 'main']);
gulp.task('compress',   ['compresscss', 'compressjs']);
gulp.task('production', ['build', 'compress']);

/*
 * JS Bundler
 */
function Bundler( src, file, dest ) {
  var self = this;

  // Properties
  self.src = src || './src/js';
  self.file = file || 'jquery-lvl99-nicescreen.js';
  self.dest = dest || './dist';
  self.watchify = watchify( browserify( self.src + '/' + self.file, watchify.args ) );

  // Method
  self.bundle = function () {
    return self.watchify.bundle()
      .on( 'error', gutil.log.bind( gutil, 'Browserify Error' ) )
      .pipe( source( self.file ) )
      // Sourcemaps
        .pipe( buffer() )
        .pipe( sourcemaps.init({ loadMaps: true }) )
        .pipe( sourcemaps.write('./') )
      //
      .pipe( rename('jquery-lvl99-nicescreen.js') )
      .pipe( gulp.dest(self.dest) );
  };

  // Events
  self.watchify.on( 'update', self.bundle );
  self.watchify.on( 'log', gutil.log );
}

// JavaScript bundlers
var app = new Bundler();
gulp.task('main', app.bundle);

/*
 * Tasks
 */

// HTML documentation
gulp.task( 'copy', function () {
  return gulp.src( ['./src/demos/**/*'])
    .pipe( gulp.dest('./dist/demos') );
});

// Modernizr
gulp.task( 'modernizr', function () {
  return gulp.src( ['./dist/jquery-lvl99-nicescreen.css',
                    './src/js/jquery-lvl99-nicescreen.js'] )
    .pipe( modernizr({
      options: ["setClasses",
                "addTest",
                "html5printshiv",
                "testProp",
                "fnBind"]
    }) )
    .pipe( gulp.dest('./src/js') );
});

// LESS
gulp.task('less', function () {
  return gulp.src(['./src/css/jquery-lvl99-nicescreen.less',
                   './src/demos/**/*.less'])
    .pipe( less() )
    .pipe( prefix({
      browsers: [ 'last 2 versions', '> 1%' ],
      cascade:  true
    }) )
    .pipe( gulp.dest('./dist') );
});

// Compress for production
gulp.task('compressjs', ['main'], function () {
  return gulp.src('./dist/jquery-lvl99-nicescreen.js')
    .pipe( uglify() )
    .pipe( rename({
      extname: '.min.js'
    }) )
    .pipe( gulp.dest('./dist') );
});

gulp.task('compresscss', ['less'], function () {
  return gulp.src('./dist/jquery-lvl99-nicescreen.css')
    .pipe( uglifycss() )
    .pipe( rename({
      extname: '.min.css'
    }) )
    .pipe( gulp.dest('./dist') );
});

// Watch Files
gulp.task('watchfiles', ['browsersync'], function () {
  var watchcss    = gulp.watch( './src/**/*.less', ['less', browsersync.reload] );
  var watchjs     = gulp.watch( './src/**/*.js', ['main', browsersync.reload] );
  var watchdemos  = gulp.watch( './src/demos/**/*', ['copy', browsersync.reload] );
});

// Web Server
gulp.task('browsersync', function() {
  browsersync.init({
    server: './dist'
  });
});