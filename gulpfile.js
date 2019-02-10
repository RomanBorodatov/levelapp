"use strict";

// Load plugins
const autoprefixer = require("autoprefixer");
const browsersync = require("browser-sync").create();
const cssnano = require("cssnano");
const del = require("del");
const eslint = require("gulp-eslint");
const gulp = require("gulp");
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");
const plumber = require("gulp-plumber");
const postcss = require("gulp-postcss");
const rename = require("gulp-rename");
const sass = require("gulp-sass");

const paths = {
    src: {
        html: 'src/**/*.html',
        styles: 'src/scss/**/*.scss',
        scripts: 'src/js/**/*.js',
        img: 'src/img/**/*.*',
    },
    dist: {
        html: 'dist/',
        styles: 'dist/css/',
        scripts: 'dist/js/',
        img: 'dist/img/',
    },
    watch: {
        html: 'src/**/*.html',
        js: 'src/js/**/*.js',
        style: 'src/style/**/*.scss',
        img: 'src/img/**/*.*',
    },
    clean: './dist',
};

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "dist/"
    },
    port: 3000
  });
  done();
}

// BrowserSync Reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Clean assets
function clean() {
  return del([paths.clean]);
}

function html() {
    return gulp
        .src(paths.src.html)
        .pipe(gulp.dest(paths.dist.html))
}

// Optimize Images
function images() {
  return gulp
    .src(paths.src.img)
    .pipe(newer(paths.dist.img))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: false,
              collapseGroups: true
            }
          ]
        })
      ])
    )
    .pipe(gulp.dest(paths.dist.img));
}

// CSS task
function css() {
  return gulp
    .src(paths.src.styles)
    .pipe(plumber())
    .pipe(sass({ outputStyle: "expanded" }))
    .pipe(gulp.dest(paths.dist.styles))
    .pipe(rename({ suffix: ".min" }))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(gulp.dest(paths.dist.styles))
    .pipe(browsersync.stream());
}

// Lint scripts
function scriptsLint() {
  return gulp
    .src([paths.src.scripts, "./gulpfile.js"])
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

// Transpile, concatenate and minify scripts
function scripts() {
  return (
    gulp
      .src([paths.src.scripts])
      .pipe(plumber())
      .pipe(gulp.dest(paths.dist.scripts))
      .pipe(browsersync.stream())
  );
}

// Watch files
function watchFiles() {
  gulp.watch(paths.src.styles, css);
  gulp.watch(paths.src.scripts, gulp.series(scriptsLint, scripts));
  gulp.watch(paths.src.html, gulp.series(html, browserSyncReload));
  gulp.watch(paths.src.img, images);
}

// define complex tasks
const js = gulp.series(scriptsLint, scripts);
const build = gulp.series(clean, gulp.parallel(html, css, images, js));
const watch = gulp.parallel(watchFiles, browserSync);
const dev = gulp.series(gulp.parallel(html, css, images, js), watch);

// export tasks
exports.images = images;
exports.css = css;
exports.js = js;
exports.html = html;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = dev;