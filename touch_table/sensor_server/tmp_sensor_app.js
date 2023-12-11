var SerialPort = require('serialport');
var socket = require('socket.io-client')('http://localhost:3001/touch');



/*
var port = new SerialPort('/dev/tty-usbserial1', {
  baudRate: 57600
});
*/

const ByteLength = SerialPort.parsers.ByteLength;
//const parser = port.pipe(new ByteLength({length: 5}))

const Readline = SerialPort.parsers.Readline;

//var sensorAddress = '/dev/cu.usbmodem1411';//arduino
//var sensorAddress = '/dev/cu.usbserial-MB1PA5FS';
const notify = require('sd-notify');
var sensorAddress = '/dev/ttyUSB0';
var port = new SerialPort(sensorAddress, {
  baudRate: 57600
},
function (err) {
  if (err) {
    return console.log('Error: ', err.message);
  }
    notify.ready();
    notify.startWatchdogMode(2800);
}

);


//const parser = port.pipe(new Readline({ delimiter: '\n' }));

var serialStream = "";
var serialOutput = [];

var avgReads = 5;
var currAvgDist = 0;


function getSum(total, num) {
    return Number(total) + Number(num);
}


var maxThreshold = 2000;
var minThreshold = 350;//sensor min is 300

var EMPTY = 0;
var IN_RANGE = 1;
var TOO_CLOSE = 2;
var LEFT = 3;

var states = ["EMPTY","IN_RANGE","TOO_CLOSE","LEFT"];
var currState = EMPTY;


port.on('data', function (data) {
 	serialStream += data.toString();
	//console.log("New read: "+serialStream);
	
	var pings = serialStream.split("R");
	
	if(pings.length>3){
		//ignore first & last packets as they may be incomplete
		pings.shift();
		pings.pop();
		serialOutput = serialOutput.concat(pings);

		//average the last avgReads elements
		var l = Math.min(serialOutput.length,avgReads);

		serialOutput = serialOutput.slice(serialOutput.length-l,serialOutput.length);
		currAvgDist = serialOutput.reduce(getSum)/serialOutput.length;

		//console.log("currAvgDist: "+currAvgDist);
		serialStream = "";
		parseDistance(currAvgDist);
	}
	
});

function parseDistance(d){
	var jsonStr = "";

	if(d < maxThreshold && currState == EMPTY){
		currState = IN_RANGE;
		var jsonObj = {state:states[currState],distance:currAvgDist};
		jsonStr = JSON.stringify(jsonObj);
	}else if(d < minThreshold && currState != TOO_CLOSE){
		currState = TOO_CLOSE;
		var jsonObj = {state:states[currState],distance:currAvgDist};
		jsonStr = JSON.stringify(jsonObj);
	}else if(d > maxThreshold && currState != EMPTY){
		currState = EMPTY;//skipping setting it to LEFT intentionally
		var jsonObj = {state:states[LEFT],distance:currAvgDist};
		jsonStr = JSON.stringify(jsonObj);
	}else if(currState == TOO_CLOSE && d > minThreshold && d < maxThreshold){
		currState = IN_RANGE;
		var jsonObj = {state:states[IN_RANGE],distance:currAvgDist};
		jsonStr = JSON.stringify(jsonObj);
	}else if(currState == IN_RANGE){
		//send continuous distance when in range
		var jsonObj = {state:states[IN_RANGE],distance:currAvgDist};
		jsonStr = JSON.stringify(jsonObj);
	}



	if(jsonStr  != ""){
		socket.emit('sensor_1', jsonObj);
		console.log(jsonStr);
	}

};

socket.on('connect', function(){
	console.log("Conencted to socket, join sensorclient_room");
	socket.emit('room', 'sensorclient_room');

});
socket.on('event', function(data){
	console.log("Got some data" + data);

});
socket.on('disconnect', function(){});



