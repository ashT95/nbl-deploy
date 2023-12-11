const express = require('express');
const path  = require ('path');
const app = express();
const exphbs = require('express-handlebars')

const fs = require('fs');
const multer = require('multer');
const bodyParser = require('body-parser');
const spawn = require('child_process').spawn;

const ALLDATA = {
  HOMECONTENT: require('../shared/config/content.json'),
  // DOCENTCONTENT: require('../shared/config/docent_data.json')
}

//TODO: set this to be the path of videos on NUC
const VIDEOS_PATH = "/usr/local/bin/nokia_videos"; //'../../../assets/videos'

var notify;
try {
  notify = require('sd-notify');
} catch (ex) {
  console.log('sd-notify is not loaded! If you are using the NUC this is an error!')
}

/*
***************
****Browser****
***************
*/
const port = 3000;

// Use Handlebars renderer
app.engine('handlebars', exphbs({
  partialsDir: path.join(__dirname, '../shared/templates'),
  defaultLayout: false // opinionated express-handlebars structure; we're not using
  // NOTE: Right now we aren't using any Hbs helpers. If we want them, they would go here
  // al la https://github.com/ericf/express-handlebars#helpers
}));
app.set('views', path.join(__dirname, '../shared/templates'));
app.set('view engine', 'handlebars');
app.use( bodyParser.urlencoded({ extended: false }) );
app.use( bodyParser.json() );

app.get('/normal', function (req, res) {
  res.render('overhang_all', ALLDATA);
})

app.get('/', function (req, res) {

  fs.readFile('./shared/config/content.json', "utf8", function read(err, data) {
    if (err) {
      //throw err;
      res.render('home', ALLDATA.HOMECONTENT);
      return;
    }
    //console.log(data);
    ALLDATA.HOMECONTENT = JSON.parse(data);
    res.render('home', ALLDATA.HOMECONTENT);
  });

})

app.post('/preview-content', (req,res)=>{
  let data = JSON.parse(req.body.content);
  ALLDATA.HOMECONTENT = JSON.parse(JSON.stringify(data));
  //console.log(data, JSON.stringify(data));
  let json = JSON.stringify(data,null,2);
  let filepath = __dirname +'/../shared/config/content.json';
  fs.writeFile(filepath, json, (err)=>{
    if ( err ) console.log("[fail to overwrite contentjson]");
    else {
      console.log("[success to overwrite contentjson]");
      setTimeout(()=>{
        spawn("xdotool","search --onlyvisible --class Chrome windowfocus key ctrl+r".split(" "),{detached:true});//}{stdio:['inherit','inherit','inherit']});
      }, 1500);
	   
    }
  });


  res.jsonp({success:true});
});

app.get('/console',function(req,res){
  res.sendFile(path.join(__dirname, './static','console.html'))
})

app.use(express.static(path.join(__dirname, 'static')))
app.use(express.static(path.join(__dirname,'../shared')))
app.use(express.static(path.join(__dirname,'../shared/assets')))
app.use(express.static(VIDEOS_PATH))


const server = app.listen(port, function(err) {
  if (notify) notify.ready();
  if (err) {
    return console.log(err);
  }
  if (notify) notify.startWatchdogMode(2800);
  console.log("[OverhangServer] started listening to "+port)
});



/*
******************
****TouchTable****
******************
*/

const io = require('socket.io')(server);
const overhang_server = io.of('/overhang');
overhang_server.on('connection', function(socket) {
  socket.on('disconnect', function() {
    // socket.connect()
  });
  socket.on('connect_failed', function() {
    // console.log('connection failed. reconnecting...')
    // socket.connect()
  });



  // from touch tables

  // join client to room they want
  socket.on('room', function(data){
    var log = '[room] client('+data.t_name+') joined '+data.room;
    console.log(log);

    socket.join(data.room);
    socket.to('overhangclient_room').emit('console', log);

  })

  // got broadcast msg, pass it to web client and other touch tables
  socket.on('b_msg', function(data){
    var log = '[b_msg] client('+data.t_name+') sent '+data.msg.cmd;
    console.log(log);
    socket.broadcast.to('touchtable_room').emit('broadcast_msg', data);
    socket.to('overhangclient_room').emit('console', data);
    //io.sockets.emit('broadcast',{msg:"BROADCASTING msg from "+socket.id+":"+data.msg})

  })

  // got direct msg, pass it to web client
  socket.on('d_msg', function(data){
    if(data.hasOwnProperty('sensor')){
      socket.to('overhangclient_room').emit('sensor', data);
    }else {
      socket.to('overhangclient_room').emit('console', data);
      var log = '[d_msg] client('+data.t_name+') sent '+data.msg.cmd;
      console.log(log);
    }
  })
});

// see https://github.com/remy/nodemon/issues/1025#issuecomment-308049864
process.on('SIGINT', () => { console.log("Felt a SIGINT in the Force. Terminating…"); process.exit(); });
