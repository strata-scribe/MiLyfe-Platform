"use client";

import confetti from 'canvas-confetti';

export type CelebrationType = 'milestone' | 'achievement' | 'simple';

export const triggerCelebration = (type: CelebrationType = 'simple') => {
  const duration = 3000;
  const end = Date.now() + duration;

  switch (type) {
    case 'milestone':
      // Big confetti burst
      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#00C1AE', '#FFC107', '#3e72b4']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#00C1AE', '#FFC107', '#3e72b4']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
      break;

    case 'achievement':
      // Centered burst
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FFC107', '#FFFFFF', '#00C1AE']
      });
      break;

    case 'simple':
    default:
      // Lightweight pop
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
      break;
  }
};
