import React from 'react';

const PARTICLE_NUM = 200;
const PARTICLE_MIN_SIZE = 4; // px
const PARTICLE_MAX_SIZE = 10; // px
const PARTICLE_COLOR = 'hsl(180, 100%, 80%)';

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const Particles: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      width: '100vw',
      height: '100vh',
      top: 0,
      left: 0,
      pointerEvents: 'none',
      zIndex: 1,
      overflow: 'hidden',
    }}>
      {Array.from({ length: PARTICLE_NUM }).map((_, i) => {
        const size = randomBetween(PARTICLE_MIN_SIZE, PARTICLE_MAX_SIZE);
        const startX = randomBetween(0, 100); // vw
        const startY = randomBetween(100, 110); // vh
        const endX = randomBetween(0, 100); // vw
        const endY = randomBetween(-30, 0); // vh
        const moveDuration = randomBetween(7000, 11000); // ms
        const moveDelay = randomBetween(0, 11000); // ms
        const scaleDuration = randomBetween(1800, 2500); // ms
        const fadeDuration = randomBetween(180, 300); // ms
        const fadeDelay = randomBetween(0, 4000); // ms

        const moveKeyframes = `@keyframes move-particle-${i} {
          from {
            transform: translate3d(${startX}vw, ${startY}vh, 0);
          }
          to {
            transform: translate3d(${endX}vw, ${endY}vh, 0);
          }
        }`;

        // Inject keyframes dynamically
        if (typeof document !== 'undefined' && !document.getElementById(`move-particle-${i}`)) {
          const style = document.createElement('style');
          style.id = `move-particle-${i}`;
          style.innerHTML = moveKeyframes;
          document.head.appendChild(style);
        }

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              left: 0,
              top: 0,
              borderRadius: '50%',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
              animationName: `move-particle-${i}`,
              animationDuration: `${moveDuration}ms`,
              animationDelay: `${moveDelay}ms`,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'linear',
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: `radial-gradient(${PARTICLE_COLOR}, ${PARTICLE_COLOR} 10%, hsla(180, 100%, 80%, 0) 56%)`,
                animation: `fade-frames ${fadeDuration}ms infinite, scale-frames ${scaleDuration}ms infinite`,
                animationDelay: `${fadeDelay}ms, 0ms`,
              }}
            />
          </div>
        );
      })}
      {/* Global keyframes for fade and scale */}
      <style>{`
        @keyframes fade-frames {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        @keyframes scale-frames {
          0% { transform: scale3d(0.4, 0.4, 1); }
          50% { transform: scale3d(2.2, 2.2, 1); }
          100% { transform: scale3d(0.4, 0.4, 1); }
        }
      `}</style>
    </div>
  );
};

export default Particles; 