// Note: this should probably be renamed transmit-touch.js, if overhang is ever going to transmit
const socket = require('socket.io-client')('/touch',{
  'reconnection': true,
  'reconnectionDelay': 500,
  'reconnectionAttempts': Infinity
});

var exports = module.exports = {};

// local function to send broadcast message
exports.broadcast = function(mycmd, payload={}) {
  console.log("[out_b]"+mycmd, payload); //socketdebug; override with function
  socket.emit('b_msg', Object.assign({},{cmd: mycmd, mode:'touch_interface'}, payload));
}

// local function to send direct message
// Note from Jacob: I don't understand how direct messages work. Don't they need an address?
exports.direct = function(mycmd, payload={}) {
  console.log("[out_d]"+mycmd, payload) //socketdebug; override with function
  socket.emit('d_msg', Object.assign({},{cmd: mycmd, mode:'touch_interface'}, payload));
}
