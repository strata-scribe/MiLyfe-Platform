import confetti from 'canvas-confetti';

/**
 * Celebration utilities — trigger confetti for milestone moments.
 * Use for: badge earned, course completed, loan repaid, milestone hit.
 */

/** Standard celebration burst */
export function celebrate() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#00C1AE', '#FFC107', '#1e3a6e', '#ff6f00', '#4dd4c6'],
  });
}

/** Big celebration (multiple bursts) */
export function bigCelebration() {
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#00C1AE', '#FFC107', '#1e3a6e'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#00C1AE', '#FFC107', '#1e3a6e'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

/** $MLY earned celebration (gold-themed) */
export function mlyEarned(amount?: number) {
  confetti({
    particleCount: amount ? Math.min(amount * 2, 150) : 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#FFC107', '#ffb300', '#ffa000', '#ff8f00', '#ff6f00'],
    shapes: ['circle'],
  });
}

/** Subtle sparkle (for small achievements) */
export function sparkle() {
  confetti({
    particleCount: 30,
    spread: 40,
    origin: { y: 0.6 },
    colors: ['#00C1AE', '#4dd4c6'],
    gravity: 0.8,
    scalar: 0.8,
  });
}
