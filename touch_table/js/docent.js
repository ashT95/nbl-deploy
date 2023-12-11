const $ = require('jquery');
const transmit = require('../../shared/js/transmit');

const socket = require('socket.io-client')('/touch', {
  'reconnection': true,
  'reconnectionDelay': 500,
  'reconnectionAttempts': Infinity
});

// join touchclient room
socket.on('connect', function(){
  socket.emit('room','touchclient_room');
});


// call back for receiving broadcast message.
// message can be of type: 'wakeup', 'start_docent', 'stop_docent', 'docent_slide'
socket.on('b_msg',function(data){
  switch(data.msg) {
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
    case "docent_slide": {
      updateSelected(data.slideId)
    }
    default: {
      console.log(("[in(" + data.t_name + ")]" + data.msg));
      //code block
    }
  }
});


var selected = 0;
var selectedIndex = 0;

var currScreenIndex = -1;


const images = $(".thumbnail");
const imagesArr = images.toArray();

const screens = $(".screen");
const screensLinks = $(".screen-link");

updateSelected(images[0].id);

const events = 'click touch touchstart';
//assign functions
$('.close-button').on(events, closeDocent);
$('.screen-link').on(events, function() {
  console.log(this.id);
    const thisIndex = this.id.split('-')[2];
    const firstSlideId = $('#screen-'+thisIndex).find('.thumbnail')[0].id;
    console.log(firstSlideId)
    updateSelected(firstSlideId);
});
$('.thumbnail').on(events, function() {thumbClicked(this.id)});
$('.left-arrow').on(events, prevSlide);
$('.right-arrow').on(events, nextSlide);


// define functions
function thumbClicked(id) {
    updateSelected(id)
}

function updateSelected(id) {
    selected = id;
    selectedIndex = imagesArr.findIndex((obj)=>obj.id==id);
    // send socket message of new selected

    // remove selected class from all images
    images.removeClass("selected");
    $("#"+id).addClass("selected");

    //update screen
    var screenInd = parseInt(id.split("-")[1])
    if (screenInd!=currScreenIndex) {
        updateScreen(screenInd)
    }

    var src = $("#"+id)[0].dataset.image;
    transmit.broadcast('docent_slide', {slideId:id, imgSrc:src});
}

function updateScreen(index) {
    currScreenIndex = index;
    screens.removeClass('selected-screen');
    screensLinks.removeClass('selected-screen');

    $("#"+screens[index].id).addClass("selected-screen");
    $("#"+screensLinks[index].id).addClass("selected-screen");
}

//screenLink onClick updateSelected(slide-{screenIndex}-0-0)

function nextSlide() {
    var nextId;
    if (!isLast()) {
        nextId = images[selectedIndex+1].id;
    }
    else {
        nextId = images[0].id;
    }
    updateSelected(nextId);
}

function prevSlide() {
    var prevId;
    if (selectedIndex>0) {
        prevId = images[selectedIndex-1].id;
    }
    else {
        prevId = images[imagesArr.length -1].id;
    }
    updateSelected(prevId);

}

function isLast() {
    return selectedIndex == imagesArr.length - 1

}

function closeDocent() {
    transmit.broadcast("stop_docent");
    // redirect to main content
    window.location = '/';
}



