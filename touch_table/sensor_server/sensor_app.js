
//you can pass environment variables from systemd script via process.env., eg. process.env.NODE_PORT


const socketHost = 'http://localhost:3001/touch';
const socketName = 'sensor_1';
const sensorAddress = '/dev/ttyUSB0';
const maxThreshold = 600;
const minThreshold = 350;//sensor min is 300
const notify = require('sd-notify');




const SerialPort = require('serialport');
const socket = require('socket.io-client')(socketHost);
const ByteLength = SerialPort.parsers.ByteLength;

const Readline = SerialPort.parsers.Readline;


const usbSensor = new SerialPort(sensorAddress, {
  baudRate: 57600
},
function (err) {
  notify.ready();
  if (err) {
    return console.log('Error: ', err.message);
  }
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



var EMPTY = 0;
var IN_RANGE = 1;
var TOO_CLOSE = 2;
var LEFT = 3;

var states = ["EMPTY","IN_RANGE","TOO_CLOSE","LEFT"];
var currState = EMPTY;


usbSensor.on('data', function (data) {
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
	var jsonObj;

	if(d < maxThreshold && currState == EMPTY){
		currState = IN_RANGE;
		jsonObj = {state:states[currState],distance:currAvgDist};

	}else if(d < minThreshold && currState != TOO_CLOSE){
		currState = TOO_CLOSE;
		jsonObj = {state:states[currState],distance:currAvgDist};

	}else if(d > maxThreshold && currState != EMPTY){
		currState = EMPTY;//skipping setting it to LEFT intentionally
		jsonObj = {state:states[LEFT],distance:currAvgDist};

	}else if(currState == TOO_CLOSE && d > minThreshold && d < maxThreshold){
		currState = IN_RANGE;
		jsonObj = {state:states[IN_RANGE],distance:currAvgDist};

	}else if(currState == IN_RANGE){
		//send continuous distance when in range
		jsonObj = {state:states[IN_RANGE],distance:currAvgDist};

	}



	if(jsonObj  != null){
		socket.emit(socketName, jsonObj);
		console.log("[sensor]"+JSON.stringify(jsonObj));
	}

};

socket.on('connect', function(){
	console.log("[sensor] Connected to touchtable socket");

});
socket.on('event', function(data){
	console.log("[sensor] Got some data" + data);

});
socket.on('disconnect', function(){});



