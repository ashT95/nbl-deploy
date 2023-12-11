const $ = require('jquery');
require('gsap'); // not really a module; exposes TweenMax, TimelineLite, etc. to window fortunately/unfortunately

var animations = {};

function makeWipeMask(from, to) {
  return `-webkit-gradient(linear, ${from}, ${to}, color-stop(0.00, rgba(0,0,0,1)), color-stop(0.33, rgba(0,0,0,1)), color-stop(0.66, rgba(0,0,0,0)), color-stop(1.00, rgba(0,0,0,0)))`;
}

function killTweensOfArr(els) {
  els.forEach(function(el) {
    TweenLite.killTweensOf(el);
  })
}

animations.contentsBoxReveal = function(box) {
  var title = $(box).find('.title'),
      desc = $(box).find('.description'),
      close = $(box).find('.close'),
      intro = $(box).find('.intro'),
      deepDive = $(box).find('.deepdive');
  
  var tl = new TimelineLite();

  // Note: blue bar animations are handled in CSS
  // Can't easily access ::pseudoelements here.

  tl.set(desc, {webkitMaskImage: makeWipeMask('center top', 'center bottom')})
    .set(title, {webkitMaskImage: makeWipeMask('left center', 'right center')})
    .set(desc, {webkitMaskSize: '100% 300%'})
    .set(title, {webkitMaskSize: '300% 100%'})
    .fromTo(box, .7, {borderColor: 'rgba(0,0,0,0)'}, {borderColor: 'white'}, 'start')
    .fromTo(close, .7, {opacity: 0}, {opacity: 1}, 'start')
    .to(box, 1, {borderColor: 'rgba(0,0,0,0)'}, 'borderin')
    .fromTo(box, 1, {backgroundColor:'rgba(0,0,0,0)'}, {backgroundColor:'rgba(0,0,0,.9)'}, 'borderin')
    .fromTo(desc, 3, {webkitMaskPosition:'0% 100%'}, {webkitMaskPosition:'0% 0%'}, 'borderin-=.15')
    .fromTo(title, 4, {webkitMaskPosition:'100% 0%'}, {webkitMaskPosition:'0% 0%'}, 'borderin-=.15')
    .fromTo(deepDive, 2, {opacity: 0}, {opacity: 1}, 'borderin+=.5')

  return tl;
}

animations.topicFloaterInit = function(floater, visibleOnInit = false) {
  floater = $(floater);

  var tl = new TimelineLite();

  // TODO: move orbit @keyframes in here, using x & y?

  tl.set(floater, {webkitMaskImage: makeWipeMask('left center', 'right center')})
    .set(floater, {webkitMaskSize: '300% 100%'})
    .set(floater, {webkitMaskPosition: (visibleOnInit ? '0% 0%' : '100% 0%')})
    .set(floater, {autoAlpha: (visibleOnInit ? 1 : 0)})

  $(floater).each(function(i, el) {
    // each needs its own random offset
    var offset = Math.random() * -8; // orbit set to 8 seconds
    tl.set(el, {animationDelay: offset})
  })
  return tl;
}

animations.topicFloaterReveal = function(floater) {
  var floater = $(floater);

  TweenLite.killTweensOf(floater); // avoid conflicting timelines

  var tl = new TimelineMax();

  tl.set(floater, {autoAlpha: 1})
    .to(floater, 2, {webkitMaskPosition:'0% 0%'})

  return tl;
}

animations.topicFloaterHide = function(floater) {
  floater = $(floater);

  TweenLite.killTweensOf(floater); // avoid conflicting timelines

  var tl = new TimelineLite();

  tl.to(floater, 2, {webkitMaskPosition:'100% 0%'})
    .set(floater, {autoAlpha: 0})

  return tl;
}

animations.chapterInit = function(chapterBar, visibleOnInit = false) {
  // TODO: this is redudant. Should store these in Obj here
  var chapterBar = $(chapterBar),
      title = $(chapterBar).find('.title'),
      particleAnim = $(chapterBar).find('.particle-anim'),
      intro = $(chapterBar).find('.intro');

  var tl = new TimelineLite();

  // not setting MaskImage or MaskPosition
  // because the reveal/hide wipes go in opposite directions

  tl.set(title, {webkitMaskImage: makeWipeMask('left center', 'right center')})
    .set(title, {webkitMaskSize: '300% 100%'})
    .set(title, {webkitMaskPosition: (visibleOnInit ? '100% 0%' : '0% 0%')})
    .set(chapterBar, {autoAlpha: (visibleOnInit ? 1 : 0)})
    .set(particleAnim, {backgroundPosition: (visibleOnInit ? '0px 0px' : '-49972px 0px')})

  return tl;
}

animations.chapterReveal = function(chapterBar) {
  var chapterBar = $(chapterBar),
      title = $(chapterBar).find('.title'),
      particleAnim = $(chapterBar).find('.particle-anim'),
      intro = $(chapterBar).find('.intro');

  killTweensOfArr([chapterBar, title, particleAnim, intro]);

  var tl = new TimelineLite();

  tl.set(chapterBar, {autoAlpha: 1})
    .set(title, {webkitMaskImage: makeWipeMask('left center', 'right center')})
    .fromTo( // must be fromTo or else the frames get out of wack
      particleAnim,
      2,
      {backgroundPosition: '0px 0px'},
      {backgroundPosition: '-49972px 0px', ease: SteppedEase.config(62)},
      'particlestart'
    )
    .fromTo(title, 3, {webkitMaskPosition: '100% 0%'}, {webkitMaskPosition:'0% 0%'}, 'particlestart+=.5')

  return tl;
}

animations.chapterHide = function(chapterBar) {
  var chapterBar = $(chapterBar),
      title = $(chapterBar).find('.title'),
      particleAnim = $(chapterBar).find('.particle-anim'),
      intro = $(chapterBar).find('.intro');

  killTweensOfArr([chapterBar, title, particleAnim, intro]);

  var tl = new TimelineLite();

  tl.fromTo( // must be fromTo or else the frames get out of wack
      particleAnim,
      1,
      {backgroundPosition: '-42780px 0px'},
      {backgroundPosition: '0px 0px', ease: SteppedEase.config(62)},
      'particlestart'
    )
    .set(intro, {webkitMaskImage: makeWipeMask('center bottom', 'center top')})
    .fromTo(intro, 1, {webkitMaskPosition:'0% 0%'}, {webkitMaskPosition:'0% 100%'}, 'particlestart')
    .set(chapterBar, {autoAlpha: 0})

  return tl;
}

module.exports = animations;
