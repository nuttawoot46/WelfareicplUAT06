// WORKS BEST IN CHROME
// This was based on Beresnev artwork
// Link: https://dribbble.com/shots/1963351-IWD

// TweenMax.to([".flowers__dot1", ".flowers__dot2", ".flowers__dot3"], 2, {opacity:0.5});

var tl = new TimelineMax({ repeat: -1 })
.to([".flowers__dot1", ".flowers__dot2", ".flowers__dot3"], 2, { opacity: 0.1 , ease:Power0.easeOut })
.to([".flowers__dot1", ".flowers__dot2", ".flowers__dot3"], 2, { opacity: 1 , ease:Power0.easeOut });

var bee1 = new TimelineMax({ repeat: -1 })
.to(".bees__1", .5, { top: "-=30px", left: "-=30px", rotation: -20, ase:Power0.easeNone})
.to(".bees__1", .5, { top: "+=30px", left: "-=30px", rotation: -120, ase:Power0.easeNone})
.to(".bees__1", 1, { left: "+=60px", rotation: -180, ase:Power0.easeNone});

var bee2 = new TimelineMax({ repeat: -1 })
.to(".bees__2", 2, { top: "+=30px", left: "+=10px", rotation: 45, ase:Power3.easeNone})
.to(".bees__2", 2, { top: "-=30px", left: "-=10px", rotation: 0, ase:Power3.easeNone});
 
var bee3 = new TimelineMax({ repeat: -1 })
.to(".bees__3", 10, {bezier:{type:"curviness:1.25", values:[{x:0, y:0}, {x:-150, y:-100}, {x:50, y:-120}, {x:-80, y:50}, {x:-10, y:0}, {x:0, y:0}], autoRotate:["x","y","rotation", 360, false]}, ease:Power2.easeInOut});

var tl = new TimelineMax({ repeat: -1 })
.to([".bird__note1", ".bird__note2", ".bird__note3"], 3, { opacity: 0, left: "+=30px", top: "-=20px", ease:SteppedEase.config(3)}).delay(.5);

var bird_tail = new TimelineMax({ repeat: -1 })
.to(".bird__tail", 2, { rotationX: 60, ease: Circ.easeInOut, yoyo: true, repeat: -1});