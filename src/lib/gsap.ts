import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * House easing + timing. Every entrance in the site pulls from these so the
 * pacing reads as one hand rather than eight different sections.
 */
gsap.defaults({ ease: 'power3.out', duration: 1.1 });

/** Mirrors --ease-luxe in CSS. Long tail, no overshoot — reads expensive. */
export const EASE = {
  luxe: 'expo.out',
  glide: 'power2.inOut',
  scrub: 'none',
} as const;

/**
 * Mobile browsers resize the viewport when the URL bar hides, which would
 * otherwise re-run every pinned calculation mid-scroll and cause visible jumps.
 */
ScrollTrigger.config({ ignoreMobileResize: true });

/** Pinned sections must not fight the browser trying to restore a scroll position. */
if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

let refreshHandle = 0;

/**
 * Coalesced `ScrollTrigger.refresh()`.
 *
 * A refresh re-measures every trigger on the page, so calling it directly from
 * each image's `onload` would run it a dozen times in the same second. Batching
 * to one call per idle window keeps late-loading media from costing frames.
 */
export function scheduleScrollRefresh() {
  if (typeof window === 'undefined') return;
  window.clearTimeout(refreshHandle);
  refreshHandle = window.setTimeout(() => ScrollTrigger.refresh(), 180);
}

export { gsap, ScrollTrigger, SplitText };
