const $ = require('jquery');
const animations = require('./animations');

var exports = module.exports = {};

exports.reveal = function(revealee) {
	$('.contentsbox').removeClass('active');
	$(revealee).addClass('active');
	animations.contentsBoxReveal(revealee);
}

exports.hideAll = function() {
  $('.contentsbox').removeClass('active');
}

exports.blackout = function(revealee) {
	animations.contentsBoxReveal(revealee);
}
