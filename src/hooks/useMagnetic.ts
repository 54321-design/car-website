import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { isTouchLike, prefersReducedMotion } from '@/lib/utils';

type Options = {
  /** Fraction of the cursor's offset the element travels. */
  strength?: number;
  /** Inner label travels further than the shell for a subtle parallax. */
  labelStrength?: number;
  /** Extra hit area, in px, beyond the element's own box. */
  padding?: number;
};

/**
 * Magnetic hover. The element leans toward the cursor while it is nearby and
 * springs back on exit — only ever writing `transform`, never layout.
 */
export function useMagnetic<T extends HTMLElement>({
  strength = 0.32,
  labelStrength = 0.55,
  padding = 44,
}: Options = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || isTouchLike() || prefersReducedMotion()) return;

    const label = el.querySelector<HTMLElement>('[data-magnetic-label]');
    const opts = { duration: 0.9, ease: 'elastic.out(1, 0.5)' } as const;
    const moveX = gsap.quickTo(el, 'x', opts);
    const moveY = gsap.quickTo(el, 'y', opts);
    const labelX = label ? gsap.quickTo(label, 'x', opts) : null;
    const labelY = label ? gsap.quickTo(label, 'y', opts) : null;

    let inside = false;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const near =
        e.clientX > rect.left - padding &&
        e.clientX < rect.right + padding &&
        e.clientY > rect.top - padding &&
        e.clientY < rect.bottom + padding;

      if (near) {
        inside = true;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        moveX(dx * strength);
        moveY(dy * strength);
        labelX?.(dx * strength * labelStrength);
        labelY?.(dy * strength * labelStrength);
      } else if (inside) {
        inside = false;
        moveX(0);
        moveY(0);
        labelX?.(0);
        labelY?.(0);
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.set(el, { x: 0, y: 0 });
      if (label) gsap.set(label, { x: 0, y: 0 });
    };
  }, [strength, labelStrength, padding]);

  return ref;
}
