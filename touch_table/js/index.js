const $ = jQuery = require('jquery');
const socket = require('socket.io-client')('/touch', {
  'reconnection': true,
  'reconnectionDelay': 500,
  'reconnectionAttempts': Infinity
});
const Hammer = require('hammerjs');

const animations = require('../../shared/js/animations');
const transmit = require('../../shared/js/transmit');

const JscrollPane = require('jscrollpane');


$.fn.extend({
  /*
   * Determine if the first element in the set of
   * matched elements currently has a vertical scrollbar
   */
  hasScrollBar: function() {
    if ( this.get(0) ) {
      return this.innerHeight() < this.get(0).scrollHeight;
    } else {
      return false;
    }
  }
})

const clickEvents = "click touch mousedown";


// SOCKET.IO

// join touchclient room
socket.on('connect', function(){
  socket.emit('room','touchclient_room');
});

// call back for receiving sensor data message
var sensor_state = "not_connected"
socket.on('sensor_data',function(data){
  if( escape(sensor_state) != escape(data.state)){
    console.log("[Sensor] "+sensor_state+"->"+data.state); //socketdebug; override with function
    sensor_state = data.state;
    if (data.state=="IN_RANGE") {
      transmit.broadcast('wakeup');
      exitAttractMode()
    }
  }
});

// call back for receiving broadcast message.
// message can be of type: 'wakeup', 'start_docent', 'stop_docent', 'docent_slide'
socket.on('b_msg',function(data){
  switch(data.msg.cmd) {
    case "wakeup": {
      exitAttractMode()
      break;
    }
    case "start_docent": {
      changeToDocent();
      break;
    }
    case "stop_docent": {
      window.location = '/';
      break;
    }
    default: {
      console.log("[in(" + data.t_name + ")]", data.msg);
    }
  }
});


// for now - comment out docent mode

// // Change to docent mode on 5 taps
// // TODO: test this with many users on touch screen. make sure it's not too easy to trigger but also not impossible
// // TODO: we probably want to switch this to be something that triggers a code pad, or shows another button in a corner
// var mc = new Hammer.Manager(document.body);
// mc.add( new Hammer.Tap({
//   event: 'fivetaps',
//   taps: 5, // Amount of taps required.
//   interval :800, //Maximum time in ms between multiple taps.
//   time:800, // Maximum press time in ms.
//   threshold: 2, // While doing a tap some small movement is allowed.
//   posThreshold:100 // The maximum position difference between multiple taps.
// }) );
// mc.on("fivetaps", triggerDocent);

function triggerDocent() {
  // broadcast a message to all touch tables and overhang - docent start
  transmit.broadcast("start_docent")
  //locally change to docent view
  changeToDocent();
}

function changeToDocent() {
  window.location = '/docent';
}


// APERTURES

/*
 * id: string containing topicId, as from assets/content.json
 */
function activateTopic(id) {
  $('body').attr('data-activated', id);
  setBodyState('topic-active');
  var $aperture = $('.aperture[data-for=' + id + ']');
  var box = $('.contentsbox[data-for=' + id + ']');
  box.addClass('active');
  animations.contentsBoxReveal(box);
  animations.topicFloaterHide( $('a.topic.float') );

  var api = box.find('.deepdive').data('jsp');

  api.scrollTo(0,0);

  $('header a.topic[data-activates=' + id + ']').addClass('active');
  openAperture($aperture);
  // TODO: debug why this is sending twice
  transmit.direct('set_topic', {topicId: id});
}

/*
 * use noStateSwitch if you are immediately swithing to antoher topic
 */
function deactivateAllTopics(noStateSwitch = false) {
  if (noStateSwitch) {
    closeAperture($('.aperture.open'));
  } else {
    setBodyState('main-menu');
    animations.topicFloaterReveal( $('a.topic.float') );
    closeAperture($('.aperture')); // kinda like a hard reset
  }
  $('body').attr('data-activated', '');
  $('.contentsbox').removeClass('active');
  $('header a.topic[data-activates]').removeClass('active');
}


/*
 * $aperture: jQuery Object of <svg> elements in which to open an aperture
 */
function openAperture($aperture) {
  // TODO: fix bug where activating currently active aperture closes background force
  const diam = $aperture.data('diameter');
  $aperture.each(function(i, el) {
    const apertureId = el.dataset.registeredAperture;
    if (el.dataset.registeredAperture) {
      m_ps.open_aperture(apertureId);
      apertures[apertureId].open();
    } else {
      console.error('Error: no particle aperture registered for ' + el);
    }
    el.classList.add('open');
  });
}

function closeAperture($aperture) {
  $($aperture) // causes TypeError if you don't, for some reason
  .each(function(i, el) {
    const apertureId = el.dataset.registeredAperture;
    if (el.dataset.registeredAperture) {
      apertures[apertureId].close();
      m_ps.close_aperture(apertureId);
    } else {
      console.error('Error: no particle aperture registered for ' + el);
    }
    el.classList.remove('open');
  })
}

/*
 * Find and register all apertures with the particle BG
 */

function registerAllApertures() {
  $('.aperture').each(function(i, el) {
    const d = parseFloat(el.dataset.diameter) || 0;
    const centerX = parseFloat(el.dataset.x);
    const centerY = parseFloat(el.dataset.y);
    const forceMultiplier = d / 85 || 15;
    // map x in [0-1920] to y [0-0.5]
    const apertureSize = ((d/1.5)/1920)*0.5;
    const openEl = document.getElementById('topic-' + el.dataset.for);
    m_ps.register_aperture_open_crtl(i, openEl, centerX , centerY, forceMultiplier);
    const m_aperture = new aperture(m_renderer, centerX, centerY, apertureSize)
        render_queue.push(m_aperture.update.bind(m_aperture, m_renderer));
    apertures.push(m_aperture);
    el.dataset.registeredAperture = i;
  });
}

function enterAttractMode() {
   const ps = m_ps;
   if (!ps.is_attract) {
     deactivateAllTopics(true);
     ps.trigger_attract_mode();
     animations.topicFloaterHide($('a.topic.float'));
     animations.chapterHide($('.chapter-bar'));
     $('.trigger-instruction').removeClass('hidden');
     setBodyState('attract');
     // exit on click/tap anywhere
     $('body').bind(clickEvents, function() {
       transmit.broadcast("wakeup")
       exitAttractMode();
     })
   } else {
     console.warn('Already in attract mode!')
   }
}

function exitAttractMode() {
   const ps = m_ps;
   if (ps.is_attract) {
     ps.trigger_attract_mode();
     animations.chapterReveal($('.chapter-bar'));
     animations.topicFloaterReveal($('a.topic.float'));
     $('.trigger-instruction').addClass('hidden');
     // disarm body click detection
     $('body').off(clickEvents);
     // reset timeout
     idleTime = 0;
   } else {
     console.warn('Already out of attract mode!')
   }
}

function setBodyState(state) {
  $('body').attr('data-state', state);
}


// ON DOCUMENT READY

let $activators = $('[data-activates]'); // may need to be refreshed?
let $apertures = $('.aperture');

if ($apertures.length > 4) {
  console.warn("Warning: AV's particle code only supports up to 4 apertures. This page appears to have " + $apertures.length);
}

$activators.bind(clickEvents, function(e) {
  deactivateAllTopics(true); // don't fade in extra stuff
  let target = $(e.target);
  activateTopic( target.data('activates') );
});

$('.close').bind(clickEvents, function(e) {
  deactivateAllTopics();
  var id = $(e.target).data('closes')
  transmit.broadcast('close_topic',{topicId: id});
})

animations.topicFloaterInit($('.topic.float'));
animations.chapterInit($('.chapter-bar'));

//Background render
const theme = {
  default: 0,
  yellow: 1,
  blue: 2,
  green: 3,
};

var apertures = [];

var m_renderer = new shared_renderer();
m_renderer.append_renderer_to_dom( document.body );

var m_ps = new ps_03(m_renderer);
m_ps.set_theme(theme.blue);

var render_queue = [m_ps.update.bind(m_ps, m_renderer)];

registerAllApertures();

m_renderer.render(render_queue);

enterAttractMode();

// Timeout after screen is idle move back to attract mode
var idleTime = 0;
$(document).ready(function () {
  //Increment the idle time counter every minute.
  var idleInterval = setInterval(timerIncrement, 60000); // 1 minute

  //Zero the idle timer on action.
  $(document.body).bind('mousemove keydown click touch touchmove mousedown',function (e) {
    idleTime = 0;
  });
});

function initScroll() {
  $('.scroll-pane').jScrollPane(
    {
      verticalDragMinHeight: 25,
      verticalDragMaxHeight: 25,
      hideFocus:true,
    }
  );
  BindScrollBarEvents();
}

function init() {
  var boxes= $('.contentsbox');

  // add scrollbar class
  boxes.each(function() {
    var box = $(this);
    console.log(box);
    if ( box.find('.deepdive').hasScrollBar() ) {
      box.addClass('has-scrollbar');
    }
  });


  // initialize only after videos are loaded
  if ($('video').length > 0) {
    $('video').on('loadeddata', function () {
      initScroll()
    })
  }
  else {
    initScroll()
  }
}


$(function() {
  init();
});




function timerIncrement() {
  idleTime = idleTime + 1;
  if (idleTime > 10) { // 20 minutes
    console.log('idle 10 minute!')
    deactivateAllTopics(true);
    // enter attract mode back
    enterAttractMode();
  }
}

function BindScrollBarEvents() {
  var startY,
    touchStartY,
    moved,
    api,
    moving = false;

  $(".jspDrag").unbind("touchstart.jsp touchmove.jsp touchend.jsp click.jsp-touchclick").bind(
    "touchstart.jsp touchstart",
    function (e) {
      var touch = e.originalEvent.touches[0];
      startY = $(e.target).position().top;
      touchStartY = touch.pageY;
      moved = false;
      moving = true;
      api = $(e.target).parents('.scroll-pane').data('jsp');

    }
  ).bind(
    "touchmove.jsp touchmove",
    function (ev) {
      if (!moving) {
        return false;
      }

      $(ev.target).addClass("jspActive");
      api.positionDragY(ev.originalEvent.touches[0].pageY - touchStartY + startY, false);

      return false;
    }
  ).bind(
    "touchend.jsp touchend",
    function (e) {
      moving = false;
      $(e.target).removeClass("jspActive");
    }
  ).bind(
    "click.jsp-touchclick touchclick touch",
    function () {
      if (moved) {
        moved = false;
      }
      return false;
    }
  );
}

// TODO: remove in prod, useful for accessing things in console
window.$ = $;
window.transmit = transmit;
window.enterAttractMode = enterAttractMode;
window.exitAttractMode = exitAttractMode;
window.m_ps = m_ps;
window.animations = animations;

