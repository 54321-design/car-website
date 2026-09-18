import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { prefersReducedMotion } from '@/lib/utils';

let lenisInstance: Lenis | null = null;

export const getLenis = () => lenisInstance;

/**
 * Boots Lenis and hands scroll timing to GSAP's ticker.
 *
 * The three lines that matter:
 *   1. `lenis.on('scroll', ScrollTrigger.update)` — triggers read Lenis' virtual
 *      position instead of polling the native scroll event.
 *   2. driving `lenis.raf` from `gsap.ticker` — one rAF loop for the whole page,
 *      so scrub values and Lenis' interpolation are computed in the same frame
 *      and can never disagree by one tick (the usual source of scrub jitter).
 *   3. `lagSmoothing(0)` — GSAP otherwise "catches up" after a long frame, which
 *      makes a scrubbed sequence jump.
 */
export function useSmoothScroll() {
  const ref = useRef<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      // Native scrolling only. ScrollTrigger still works; nothing is interpolated.
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      // Long, flat-tailed curve. Heavier than default — the page should feel weighted.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      // Never interpolate touch: it fights the platform's own inertia and feels laggy.
      syncTouch: false,
      touchMultiplier: 1.6,
    });

    ref.current = lenis;
    lenisInstance = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Sections mount their triggers on their own layout effects; one refresh
    // after the first paint settles any that measured before fonts landed.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      ref.current = null;
      lenisInstance = null;
    };
  }, []);

  return ref;
}

/** Anchor navigation that routes through Lenis so it inherits the same easing. */
export function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  const lenis = getLenis();
  if (lenis && !prefersReducedMotion()) {
    lenis.scrollTo(target, { offset: 0, duration: 1.6 });
  } else {
    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }
}
