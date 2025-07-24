import React, { useEffect } from 'react';
import './TreeAnimation.css';

const TreeAnimation: React.FC = () => {
  useEffect(() => {
    // Load GSAP if not already loaded
    if (typeof window !== 'undefined' && !window.TweenMax) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/2.1.3/TweenMax.min.js';
      script.onload = () => {
        initAnimations();
      };
      document.head.appendChild(script);
    } else if (window.TweenMax) {
      initAnimations();
    }
  }, []);

  const initAnimations = () => {
    if (!window.TweenMax || !window.TimelineMax) return;

    // Flower dots animation
    const tl = new window.TimelineMax({ repeat: -1 })
      .to([".flowers__dot1", ".flowers__dot2", ".flowers__dot3"], 2, { opacity: 0.1, ease: window.Power0.easeOut })
      .to([".flowers__dot1", ".flowers__dot2", ".flowers__dot3"], 2, { opacity: 1, ease: window.Power0.easeOut });

    // Bee animations
    const bee1 = new window.TimelineMax({ repeat: -1 })
      .to(".bees__1", .5, { top: "-=30px", left: "-=30px", rotation: -20, ease: window.Power0.easeNone })
      .to(".bees__1", .5, { top: "+=30px", left: "-=30px", rotation: -120, ease: window.Power0.easeNone })
      .to(".bees__1", 1, { left: "+=60px", rotation: -180, ease: window.Power0.easeNone });

    const bee2 = new window.TimelineMax({ repeat: -1 })
      .to(".bees__2", 2, { top: "+=30px", left: "+=10px", rotation: 45, ease: window.Power3.easeNone })
      .to(".bees__2", 2, { top: "-=30px", left: "-=10px", rotation: 0, ease: window.Power3.easeNone });

    const bee3 = new window.TimelineMax({ repeat: -1 })
      .to(".bees__3", 10, {
        bezier: {
          type: "curviness:1.25",
          values: [
            { x: 0, y: 0 },
            { x: -150, y: -100 },
            { x: 50, y: -120 },
            { x: -80, y: 50 },
            { x: -10, y: 0 },
            { x: 0, y: 0 }
          ],
          autoRotate: ["x", "y", "rotation", 360, false]
        },
        ease: window.Power2.easeInOut
      });

    // Bird notes animation
    const birdNotes = new window.TimelineMax({ repeat: -1 })
      .to([".bird__note1", ".bird__note2", ".bird__note3"], 3, {
        opacity: 0,
        left: "+=30px",
        top: "-=20px",
        ease: window.SteppedEase.config(3)
      }).delay(.5);

    // Bird tail animation
    const birdTail = new window.TimelineMax({ repeat: -1 })
      .to(".bird__tail", 2, {
        rotationX: 60,
        ease: window.Circ.easeInOut,
        yoyo: true,
        repeat: -1
      });
  };

  return (
    <div className="tree-animation-canvas">
      <div className="grass"></div>
      
      <div className="bees">
        <div className="bees__1"></div>
        <div className="bees__2"></div>
        <div className="bees__3"></div>
      </div>
      
      <div className="flowers">
        <div className="flowers__pink">
          <div className="flowers__stem"></div>
          <div className="flowers__petals"></div>
          <div className="flowers__dot1"></div>
          <div className="flowers__dot2"></div>
        </div>
        <div className="flowers__blue">
          <div className="flowers__stem"></div>
          <div className="flowers__petals"></div>
        </div>
        <div className="flowers__orange">
          <div className="flowers__stem"></div>
          <div className="flowers__petals"></div>
        </div>
        <div className="flowers__yellow">
          <div className="flowers__stem"></div>
          <div className="flowers__petals"></div>
          <div className="flowers__dot1"></div>
          <div className="flowers__dot2"></div>
          <div className="flowers__dot3"></div>
        </div>
        <div className="flowers__yellow2">
          <div className="flowers__stem"></div>
          <div className="flowers__petals"></div>
        </div>
        <div className="flowers__purple">
          <div className="flowers__stem"></div>
          <div className="flowers__petals"></div>
          <div className="flowers__dot1"></div>
          <div className="flowers__dot2"></div>
        </div>
      </div>
      
      <div className="tree">
        <div className="tree__top"></div>
        <div className="tree__face">
          <div className="tree__leye"></div>
          <div className="tree__reye"></div>
          <div className="tree__mouth"></div>
        </div>
        
        <div className="tree__shade1"></div>
        <div className="tree__shade2"></div>
        <div className="tree__shade3"></div>
        <div className="tree__shade4"></div>
        <div className="tree__shade5"></div>
        
        <div className="tree__trunk1"></div>
        <div className="tree__trunk2"></div>
        <div className="tree__trunk3">
          <div className="tree__trunk3__leaf1"></div>
          <div className="tree__trunk3__leaf2"></div>
          <div className="tree__trunk3__leaf3"></div>
        </div>
      </div>
      
      <div className="bird">
        <div className="bird__head"></div>
        <div className="bird__body"></div>
        <div className="bird__tail"></div>
        <div className="bird__note1"></div>
        <div className="bird__note2"></div>
        <div className="bird__note3"></div>
      </div>
    </div>
  );
};

export default TreeAnimation;