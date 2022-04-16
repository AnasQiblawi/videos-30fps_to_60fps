// Dependencies
const express = require('express');
const fs = require('fs')
const cliProgress = require('cli-progress');

// Global variables
global.ProgressBar = 0;

// Setup express ---------------------------------------------------------------
const app = express();

// Setting Server --------------------------------------------------------------
const port = process.env.PORT || 80;
app.listen(port);
app.set('view engine', 'ejs');
console.log(`Server is Running on port : ${port}`);




// Download converted file
app.use('/download', express.static(__dirname + '/files/output.mp4'))


// Home Page --------------------------------------------------------------------
app.get('/', function (req, res) {
    console.log('Home Page');
    res.sendFile(__dirname + "/views/index.html");
})

// Start --------------------------------------------------------------------
app.get('/start', function (req, res) {
    console.log('Start')
    convert();
    res.redirect('/')
})


// ProgressBar --------------------------------------------------------------------
app.get('/status', function (req, res) {
  // if output file doens't exist then value == 0
  const path = "./files/output.mp4"
  if (!fs.existsSync(path)) ProgressBar = 0;
  // Response
  res.json({
    ProgressBar: Number(ProgressBar?.toFixed(2))
  })
})





// ---- 1st Method ------
// Dependencies
// const fluent = require('fluent-ffmpeg');
/// https://stackoverflow.com/questions/45555960/nodejs-fluent-ffmpeg-cannot-find-ffmpeg
// const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { path: ffmpegPath, version: ffmpegVersion } = require('@ffmpeg-installer/ffmpeg');
const fluent = require('fluent-ffmpeg');
console.log(ffmpegPath, ffmpegVersion);
fluent.setFfmpegPath(ffmpegPath);

// Code
function convert() {
    
    // Delete old output file
    const path = "./files/output.mp4"
    try {
      fs.unlinkSync(path)
      //file removed
    } catch(err) {
      // console.error(err)
    }

    // create a new progress bar instance and use shades_classic theme
    const Bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    // Start Converting
    fluent('./files/input.mp4')
        // Offmpeg option that will convet videos to 60FPS
        .videoFilters('minterpolate=fps=60')
        //.inputOptions('-filter:v "minterpolate=fps=60"')

        // Output location
        .output('./files/output.mp4')
        //.output(stream)

        // Display Codec data
        .on('codecData', function (data) {
            console.log('Input is ' + data.audio + ' audio ' +
                'with ' + data.video + ' video');
        })

        // Start
        .on('start', function (commandLine) {
            console.log('Started processing: ' + commandLine);
            Bar.start(100, 0);
        })

        // Progress
        .on('progress', function (progress) {
            // process.stdout.write('Processing: ' + progress.percent?.toFixed(2) + '%  \r');
            Bar.update(progress.percent);
            ProgressBar = progress.percent;
        })

        //  .on('stderr', function(stderrLine) {
        //    console.log('Stderr output: ' + stderrLine);
        //  })

        // Error
        .on('error', function (err, stdout, stderr) {
            console.log('Cannot process video: ' + err.message);
        })

        // end
        .on('end', function () {
            console.log('Finished processing.');
            Bar.update(100);
            ProgressBar = 100;
            Bar.stop();
        })

        //
        .run();

};


// ---- 2nd Method ------
// const ffmpeg = require('ffmpeg');


// try {
// 	var process = new ffmpeg('./files/input.mp4');
// 	process.then(video => {

//     video
//       .addCommand('-filter:v "minterpolate=fps=60"')
//       .save('./files/1.mp4', (error, file) => {
// 			if (!error)
// 				console.log('Video file: ' + file);
// 		});

// 	}, function (err) {
// 		console.log('Error: ' + err);
// 	});
// } catch (e) {
// 	console.log(e.code);
// 	console.log(e.msg);
// }

