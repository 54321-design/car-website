import { useEffect } from 'react';
import { gsap } from '@/lib/gsap';
import { pointer } from '@/lib/pointer';
import { isTouchLike, prefersReducedMotion } from '@/lib/utils';

/**
 * Publishes an eased, normalised pointer position to `--mx` / `--my` on :root.
 *
 * Everything that reacts to the mouse — the spotlight, the hero glint, the depth
 * offsets on stills — reads those two variables in CSS. One rAF-driven write per
 * frame replaces a dozen React state updates and keeps pointer parallax entirely
 * off the render path.
 */
export function usePointerField() {
  useEffect(() => {
    if (isTouchLike() || prefersReducedMotion()) return;

    const root = document.documentElement;
    const setX = gsap.quickTo(pointer, 'x', { duration: 0.7, ease: 'power3.out' });
    const setY = gsap.quickTo(pointer, 'y', { duration: 0.7, ease: 'power3.out' });

    const onMove = (e: PointerEvent) => {
      setX((e.clientX / window.innerWidth) * 2 - 1);
      setY((e.clientY / window.innerHeight) * 2 - 1);
    };

    let lastX = NaN;
    let lastY = NaN;
    const tick = () => {
      // Only touch the CSSOM when the eased value actually moved — a settled
      // pointer should cost nothing.
      const x = Math.round(pointer.x * 1000) / 1000;
      const y = Math.round(pointer.y * 1000) / 1000;
      if (x === lastX && y === lastY) return;
      lastX = x;
      lastY = y;
      root.style.setProperty('--mx', String(x));
      root.style.setProperty('--my', String(y));
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    gsap.ticker.add(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.ticker.remove(tick);
      root.style.removeProperty('--mx');
      root.style.removeProperty('--my');
    };
  }, []);
}
