var gulp = require('gulp');
// 能省略不打require，但對gulp開頭的套件才有用，省略require的套件前方都要加上$.  
//注意:因為用了gulp-load-plugins，所以要寫成駝峰式
var $ = require('gulp-load-plugins')();
// var jade = require('gulp-jade');
// var sass = require('gulp-sass');
// var plumber = require('gulp-plumber');
// var postcss = require('gulp-postcss');   //npm install --save-dev gulp-postcss
const autoprefixer = require('autoprefixer');  // npm install --save-dev gulp-postcss autoprefixer
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var minimist = require('minimist')
var envOptions = {
    string: 'env',
    default: { env: 'develop' }
};
var options = minimist(process.argv.slice(2), envOptions);
console.log(options);
var watch = require('gulp-watch');   // npm install --save-dev gulp-watch

gulp.task('clean', function () {
    return gulp.src(['./.tmp', './public'], { read: false })
        .pipe($.clean());
});

gulp.task('copyHTML', function () {  //gulp.task() => 設置任務名稱，及要做的事情
    return gulp.src('./source/**/*.html')  //gulp.src() =>檔案來源； copy /source底所有的html到public資料夾底下
        .pipe(gulp.dest('./public/'))   //gulp.dest() => 輸出到某目的地
})

gulp.task('jade', function () {
    return gulp.src('./source/*.jade')
        .pipe($.plumber())  //寫在.src()後，可避免產生錯誤時而停止
        .pipe($.jade({  //執行jade
            pretty: true  //true代表沒有壓縮
        }))
        .pipe(gulp.dest('./public/'))
        .pipe(browserSync.stream());
});


gulp.task('sass', function () {
    var plugin = [           //postcss的延伸套件
        autoprefixer({ browsers: ['last 3 version', '>5%', 'ie 8'] })
    ];

    return gulp.src('./source/scss/**/*.scss')
        .pipe($.plumber())  //寫在.src()後，可避免產生錯誤時而停止
        .pipe($.sourcemaps.init())
        .pipe($.sass().on('error', $.sass.logError))
        //sass此時已經編譯成css
        .pipe($.postcss(plugin))  //postcss可以載入大量插件，autoprefixer只是其中一個，能自動處理前綴字
        .pipe($.if(options.env === 'production', $.minifyCss())) //利用gulp.if(條件,要做的事)設條件，如果是production環境才會進行壓縮css
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest('./public/scss'))
        .pipe(browserSync.stream());
});

// npm install --save gulp-sourcemaps gulp-babel gulp-concat
//還需要安裝 npm install --save-dev gulp-babel @babel/core @babel/preset-env
gulp.task('babel', function () {
    return gulp.src('./source/js/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['@babel/env']
        }))
        .pipe($.concat('all.js'))
        .pipe($.if(options.env === 'production', $.uglify({     //uglify可以壓縮js，且可以設定drop_console: true，把所有的console.log移除
            compress: {
                drop_console: true
            }
        })))
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream());
});

gulp.task('image-min', () =>
    gulp.src('./source/img/*')
        .pipe($.if(options.env === 'production', $.imagemin()))  //在production時才需要壓縮
        .pipe(gulp.dest('./public/img'))
);

gulp.task('bower', function () {
    return gulp.src(mainBowerFiles())       //此步驟需要時間處理，因此任務排程如果沒有用gulp.series('bower','vendorJs')表示，會變成vendorJs比bower先處理完而導致結果不對
        .pipe(gulp.dest('./.tmp/vendors'))   //建立暫存的資料夾
});

gulp.task('vendorJs', function () {
    return gulp.src('./.tmp/vendors/**/**.js')
        .pipe($.concat('vendors.js'))   //把.tmp內的檔案(jquery、bootstrap)合併到vendors.js
        .pipe($.if(options.env === 'production', $.uglify()))
        .pipe(gulp.dest('./public/js'))   //再輸出到public/js
});

// Static server
gulp.task('browser-sync', function () {
    browserSync.init({
        server: {
            baseDir: "./public"
        }
    });
});

gulp.task('watch', function () {
    gulp.watch('./source/scss/**/*.scss', gulp.parallel('sass'));
    gulp.watch('./source/*.jade', gulp.parallel('jade'));
    gulp.watch('./source/js/**/*.js', gulp.parallel('babel'));
});

// watch('./source/scss/**/*.scss', function(){ gulp.start('sass')});
// watch('./source/*.jade', function(){ gulp.start('jade')});

var test = gulp.series('clean', gulp.parallel('jade', 'sass', 'babel', gulp.series('bower', 'vendorJs'), 'browser-sync', 'watch'));   //因為 series 是同步依序處理，如果遇到需要監聽的將會無法運行可以試著替換成 parallel
gulp.task('default', test);

gulp.task('build', gulp.series('clean', gulp.parallel('jade', 'sass', 'babel', 'image-min', gulp.series('bower', 'vendorJs'))));



// ----------------------------
// const { watch, series, parallel  } = require('gulp');
// const { src, dest } = require('gulp');

// function jade() {
//     return src('./source/*.jade')
//         .pipe(plumber())  //寫在.src()後，可避免產生錯誤時而停止
//         .pipe(jade({  //執行jade
//             pretty: true  //true代表沒有壓縮
//         }))
//         .pipe(dest('./public/'))
// };


// function sass() {
//     return src('./source/scss/**/*.scss')
//         .pipe(plumber())  //寫在.src()後，可避免產生錯誤時而停止
//         .pipe(sass().on('error', sass.logError))
//         .pipe(dest('./public/scss'));
// };
// watch('./source/scss/**/*.scss', sass);
// watch('./source/*.jade', jade);


// exports.jade = jade;
// exports.sass = sass;
// exports.watch = watch;
// exports.default = parallel ('jade', 'sass', 'watch');
