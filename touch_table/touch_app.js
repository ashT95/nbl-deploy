const express = require('express');
const path  = require ('path');
const app = express();
const exphbs = require('express-handlebars')

const fs = require('fs');
const multer = require('multer');
const bodyParser = require('body-parser');
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;
let HOMECONTENT = require('../shared/config/content.json');
const DOCENTCONTENT = require('../shared/config/docent_data.json');
const CONFIG = require('../shared/config/touch_server_config.json');

var notify;
// for development on mac
try {
  notify = require('sd-notify');
} catch (ex) {
  console.log('sd-notify is not loaded! If you are using the NUC this is an error!')
}

const port = CONFIG.serverport;

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
  res.render('home', HOMECONTENT.screens[CONFIG.name]);
})
app.get('/docent', function (req, res) {
  res.render('docent', HOMECONTENT);
})
app.get('/console',function(req,res){
  res.sendFile(path.join(__dirname, './static', 'console.html'))
})

app.post('/preview-content', (req,res)=>{
  let data = JSON.parse(req.body.content);
  HOMECONTENT = JSON.parse(JSON.stringify(data));
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

app.post('/save-content', (req,res)=>{


  let data = JSON.parse(req.body.content);
  HOMECONTENT = JSON.parse(JSON.stringify(data));
  //console.log(data, JSON.stringify(data));
  let json = JSON.stringify(data,null,2);
  let filepath = __dirname +'/../shared/config/content.json';

  fs.writeFile(filepath, json, (err)=>{
    if ( err ) console.log("[fail to overwrite contentjson]");
    else {
      console.log("[success to overwrite contentjson]");

      //spawn("cd", [__dirname, '&&', 'git', 'add', filepath,"&&", "git","commit","-m", "content updated","&&","git","push"]);


	//

  exec('rm .git/hooks/pre-push', {cwd: path.join(__dirname, '/..') }, function(err,stdout,stderr){
     //console.log('removed file');

    exec('git add shared/config/content.json && git commit -m "update content via CMS" && git push', {cwd: path.join(__dirname, '/..') }, function(err,stdout,stderr){
      console.log('done pushing to git');
      setTimeout(()=>{
        spawn("xdotool","search --onlyvisible --class Chrome windowfocus key ctrl+r".split(" "),{detached:true});//}{stdio:['inherit','inherit','inherit']});
      },1500);
    });
    
  });



	

    }
  });


  res.jsonp({success:true});
});

app.get('/', function (req, res) {
  //HOMECONTENT = require('../shared/config/content.json');

  fs.readFile('./shared/config/content.json', "utf8", function read(err, data) {
    if (err) {
      //throw err;
      res.render('home', HOMECONTENT.screens[CONFIG.name]);
      return;
    }
    //console.log(data);
    HOMECONTENT = JSON.parse(data);
    res.render('home', HOMECONTENT.screens[CONFIG.name]);
  });

  
})

app.use(express.static(path.join(__dirname, 'static')))
app.use(express.static(path.join(__dirname,'../shared')))
app.use(express.static(path.join(__dirname,'../shared/assets')))
app.use(express.static(path.join(__dirname,'../assets')))

const webserver = app.listen(port,'0.0.0.0', function(err) {
  if (notify) notify.ready();
  if (err) {
    return console.log(err);
  }
  if (notify) notify.startWatchdogMode(2800);
  console.log("[TouchServer] started listening to "+port);

});

var sensor_state = 'not_connected';

const io = require('socket.io')(webserver);
const touch_server = io.of('/touch');
const touchclient_room = "touchclient_room";
const sensorclient_room ="sensorclient_room";

touch_server.on('connection', function(socket) {
  socket.on('disconnect', function() {
    // socket.connect()
  });
  socket.on('connect_failed', function() {
    // console.log('connection failed. reconnecting...')
    // socket.connect()
  });

  // from sensor node
  socket.on('sensor_1', function(data) {
    if (sensor_state != data.state) {
      console.log('[Sensor] State from '+sensor_state+" to " + data.state );
      sensor_state = data.state;
      hangover_client.emit('d_msg',{t_name:CONFIG.name, sensor:data.state});
    }
    touch_server.to(touchclient_room).emit('sensor_data', data);
  })


  // to hangover screen server
  // send broadcast msg to overhang
  socket.on('b_msg', function(data) {
    console.log('[broadcast msg]' + data.cmd);
    hangover_client.emit('b_msg', {
      t_name: CONFIG.name,
      msg: data
    });
  });

  // send direct msg to overhang
  socket.on('d_msg', function(data){
    console.log('[direct msg]'+data.cmd);
    hangover_client.emit('d_msg', {
      t_name:CONFIG.name,
      msg: data
    });
  });

  // join client to room they want
  socket.on('room', function(room){
    console.log('[room] client joined '+room);
    socket.join(room)
  })
});


const hangover_io = require('socket.io-client');
const hangover_client = hangover_io.connect(CONFIG.overhangip+'/overhang' );

// on connected to over hang server,
hangover_client.on('connect', function () {
  console.log("["+CONFIG.name+"] connected to overhang server");
  hangover_client.emit('room', {t_name:CONFIG.name, room:'touchtable_room'});
});

// pass over broadcast message from over hang to web client
hangover_client.on('broadcast_msg', function(data){
	console.log("[b_msg("+data.t_name+")]"+data.msg);
  touch_server.to(touchclient_room).emit('b_msg',data);
  // client.emit('fromtouch',{msg:"TOUCH SCREEN says: clicked"});
});

// see https://github.com/remy/nodemon/issues/1025#issuecomment-308049864
process.on('SIGINT', () => { console.log("Felt a SIGINT in the Force. Terminating…"); process.exit(); });
