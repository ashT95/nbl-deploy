const $ = require('jquery');
const socket = require('socket.io-client')('/overhang',{
  'reconnection': true,
  'reconnectionDelay': 500,
  'reconnectionAttempts': Infinity
});

require('gsap'); // not really a module; exposes TweenMax, TimelineLite, etc. to window fortunately/unfortunately
const animations = require('../../shared/js/animations');
const switcher = require('../../shared/js/switcher');

var currentContent = -1;
var readyForContent = true;
var mode = 'touch_interface';
var videos = document.getElementsByTagName('video');

initialize();

// SOCKET.IO

// joins overhang server's room
socket.on('connect', function (){
  console.log('[log] connected, join room');
  socket.emit('room',{t_name:'web view',room:'overhangclient_room'});
});


// got message to log
socket.on('console', function(data){
  console.log('In:', data)
  idleTime = 0;
  switch(data.msg.cmd) {
    case "wakeup": {
      exitAttractMode();
      break;
    }
    case "start_docent": {
      // change to docent mode
      break;
    }
    case "stop_docent": {
      // stop docent mode
      break;
    }
    case "set_topic": {
      idleTime = 0;
      if (readyForContent) {

        exitAttractMode();
        // readyForContent = false;
        setTimeout(resetScreenControl, 60000 * 3);
        currentContent = data.msg.topicId;
      
        var box = $('.contentsbox[data-for=' + currentContent + ']');

        //console.log('box', box);
        
        if (box.length > 1) {
          console.error('Uh oh, there are ' + box.length + ' .contentsboxes for the topic ID `' + currentContent + '`. Only top one will display.')
        }

        switcher.reveal(box);

        //if there is a video - auto play it
        vid = box.find('video')[0];
        if (vid) {
          vid.play()
        }

      }
      else {
        // do nothing, received a message from a screen not in control
      }
      break;
    }

    case "close_topic": {
      if (currentContent ===  data.msg.topicId) {
        switcher.hideAll();
      }
      break;
    }
    case "docent_slide": {
      // show docent slide data.slidId
      break;

    }
    default: {
      console.log("[in(" + data.t_name + ")]", data.msg);
      //code block
    }
  }

})


socket.on('sensor', function(data){
  var log = "[s_msg("+data.t_name+")] state:"+data.sensor;
})

function resetScreenControl() {
  // TODO: decide if this is universal thing (one topic activated, guaranteed 30 secs of display)
  // or eclusive privileges for a screen at a time (once control granted to screen, guaranteed for 1 min)
  readyForContent = true;
}

//globals vars
//shader
var m_renderer;
var m_ps;
var render_queue;

//idle timeout
var idleTime = 0;



function initialize() {
  // $('.contentsbox').hide();

  const theme = {
    default: 0,
    yellow: 1,
    blue: 2,
    green: 3,
  };

  m_renderer = new shared_renderer();
  m_renderer.append_renderer_to_dom( document.body );
  m_ps = new ps_03(m_renderer);
  m_ps.set_theme(theme.blue);
  render_queue = [m_ps.update.bind(m_ps, m_renderer)];
  m_renderer.render(render_queue);
  enterAttractMode();
}

function showInstruction() {
  $('.trigger-instruction').removeClass('hidden')
}
function hideInstruction() {
  $('.trigger-instruction').addClass('hidden')

}

function enterAttractMode() {
  currentContent = -1;
  switcher.hideAll();
  const ps = m_ps;
  if (!ps.is_attract) {
    ps.trigger_attract_mode();
    showInstruction();
    idleTime = 0;
  } else {
    console.warn('Already in attract mode!')
  }
}

function exitAttractMode() {
  idleTime = 0;
  const ps = m_ps;
  if (ps.is_attract) {
    ps.trigger_attract_mode();
    hideInstruction()
  } else {
    console.warn('Already out of attract mode!')
  }

}


// Timeout after screen is idle move back to attract mode
$(document).ready(function () {
  //Increment the idle time counter every minute.
  var idleInterval = setInterval(timerIncrement, 60000); // 1 minute
  //Zero the idle timer on action.
  $(document.body).bind('mousemove keydown click touch touchmove mousedown',function (e) {
    idleTime = 0;
  });
});

function timerIncrement() {
  idleTime = idleTime + 1;
  if (idleTime > 10) { // 10 minutes
    // deactivateAllTopics(true);
    // enter attract mode back
    enterAttractMode();
  }
}


// TODO: remove in prod, useful for accessing things in console
window.$ = $;
window.animations = animations;
