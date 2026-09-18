export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Frame-rate independent damping. `smoothing` is the fraction of the remaining
 * distance covered in one 60fps frame; `dt` is the real elapsed seconds.
 * Without this, scrub smoothing runs at different speeds on 60Hz and 120Hz displays.
 */
export function damp(current: number, target: number, smoothing: number, dt: number) {
  return lerp(current, target, 1 - Math.pow(1 - smoothing, dt * 60));
}

export const mapRange = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
  outMin + ((clamp(v, inMin, inMax) - inMin) / (inMax - inMin)) * (outMax - outMin);

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Coarse pointer == no hover, no mouse parallax, cheaper animation budget. */
export function isTouchLike(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

export const formatIndex = (n: number) => String(n + 1).padStart(2, '0');
