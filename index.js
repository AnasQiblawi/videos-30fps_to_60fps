// Dependencies
const express = require('express');
const fs = require('fs')
const cliProgress = require('cli-progress');
const { v4: uuidv4 } = require('uuid');

// Global variables
global.ProgressBar = 0;
global.wsProgress;


// Setup express ---------------------------------------------------------------
const app = express();
const expressWs = require('express-ws')(app);

// Setting Server --------------------------------------------------------------
const port = process.env.PORT || 80;
app.listen(port, () => { 
  console.log(`Server is Running on port : ${port}`);
});
app.set('view engine', 'ejs');




// Download converted file
app.use('/download', express.static(__dirname + '/files/output.mp4'))





// Routes ---------------------------------------------------------------
// Home Page 
app.get('/', function (req, res) {
  console.log('Home Page');
  res.sendFile(__dirname + "/views/index.html");
})

// Start 
app.get('/start', function (req, res) {
  console.log('Start')
  convert();
  res.redirect('/')
})




// --------------------------------------------------------------------------
// WebSockets
app.ws('*', function (ws, req, next){
  // console.log(req.socket)

  // Add new Clients
  addClient(ws)
  // Delete Clients closed connections
  ws.on("close", () => {
    console.log('Closed: ' + clients.get(ws))
    clients.delete(ws);
  });

  // console.log(clients)

  next()
})

// ---
app.ws('/progress', function (ws, req, next) {
  wsProgress = ws;
  console.log('ws connection');
  

  wsProgressUpdater();

  ws.on('message', function (msg) {
    console.log(msg);
    // wsProgressUpdater();
  });

});


// Functions -------------------------------------------------------------------
// ws Progress Updater
function wsProgressUpdater() {
  // if output file doens't exist then value == 0
  const path = "./files/output.mp4"
  if (!fs.existsSync(path)) ProgressBar = 0;
  // Send
  // wsProgress.send(JSON.stringify({
  //   ProgressBar: Number(ProgressBar?.toFixed(2))
  // }));
  // Send Update to all Clients connections
  clients.forEach((id, client) => { 
    // console.log(id)
    client.send(JSON.stringify({
      ProgressBar: Number(ProgressBar?.toFixed(2))
    }));
  });

};

// Clients
var clients = new Map()
function addClient(ws){
  const id = uuidv4();
  console.log('New :' + id)
  clients.set(ws, id);
};



// ---- 1st Method ------
// Dependencies
// const fluent = require('fluent-ffmpeg');
/// https://stackoverflow.com/questions/45555960/nodejs-fluent-ffmpeg-cannot-find-ffmpeg
// const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { path: ffmpegPath, version: ffmpegVersion } = require('@ffmpeg-installer/ffmpeg');
const fluent = require('fluent-ffmpeg');
console.log(ffmpegPath, ffmpegVersion);
fluent.setFfmpegPath(ffmpegPath);

// Ffmpeg Code
function convert() {

  // Delete old output file
  const path = "./files/output.mp4"
  try {
    //file removed
    fs.unlinkSync(path)
  } catch (err) {
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

      // Websockets
      wsProgressUpdater();

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
      // Websockets
      wsProgressUpdater();

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

