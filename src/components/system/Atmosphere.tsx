import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { pointer } from '@/lib/pointer';
import { clamp, damp, prefersReducedMotion } from '@/lib/utils';

/* ------------------------------------------------------------------ *
 * Film grain
 * ------------------------------------------------------------------ */

/**
 * A single 180px turbulence tile, rasterised once by the SVG filter and then
 * only ever translated. Animating the transform (not the filter) keeps this at
 * zero per-frame cost on the CPU.
 */
const GRAIN_TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")";

export function Grain() {
  return (
    <div
      data-motion-decorative
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.055] mix-blend-overlay"
      style={{
        backgroundImage: GRAIN_TILE,
        backgroundRepeat: 'repeat',
        // Oversized so the translate never exposes an edge.
        inset: '-100px',
        animation: 'grain-drift 1.1s steps(6) infinite',
        willChange: 'transform',
      }}
    >
      <style>{`
        @keyframes grain-drift {
          0%   { transform: translate3d(0,0,0) }
          16%  { transform: translate3d(-14px, 8px, 0) }
          33%  { transform: translate3d(9px, -18px, 0) }
          50%  { transform: translate3d(-22px, 12px, 0) }
          66%  { transform: translate3d(17px, 6px, 0) }
          83%  { transform: translate3d(-6px, -14px, 0) }
          100% { transform: translate3d(0,0,0) }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Dust
 * ------------------------------------------------------------------ */

type Particle = { x: number; y: number; z: number; vx: number; vy: number; r: number; a: number };

/**
 * Module-level handle so a section can raise the particle count on entry
 * without the field re-rendering (or the sections knowing about each other).
 */
const dustState = { target: 1, current: 1 };
export const setDustIntensity = (value: number) => {
  dustState.target = clamp(value, 0, 2.2);
};

const MAX_PARTICLES = 90;

export function DustField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dust is a soft, low-contrast layer — rendering it at DPR 1 is invisible
    // to the eye and quarters the fill cost on retina displays.
    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();

    // Pre-rendered glow sprite: one radial gradient total instead of 90 per frame.
    const sprite = document.createElement('canvas');
    const S = 64;
    sprite.width = sprite.height = S;
    const sctx = sprite.getContext('2d')!;
    const grad = sctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grad.addColorStop(0, 'rgba(255,246,224,0.95)');
    grad.addColorStop(0.35, 'rgba(199,166,106,0.34)');
    grad.addColorStop(1, 'rgba(199,166,106,0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, S, S);

    const particles: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random(),
      vx: (Math.random() - 0.5) * 0.14,
      vy: -0.05 - Math.random() * 0.16,
      r: 0.8 + Math.random() * 2.6,
      a: 0.12 + Math.random() * 0.5,
    }));

    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 50) / 16.667;
      dustState.current = damp(dustState.current, dustState.target, 0.04, deltaMs / 1000);

      const active = Math.round(MAX_PARTICLES * clamp(dustState.current * 0.6, 0.12, 1));
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      // Pointer nudge: the field drifts against the cursor for a hair of depth.
      const mx = pointer.x;

      for (let i = 0; i < active; i++) {
        const p = particles[i];
        p.x += (p.vx + mx * 0.25 * p.z) * dt;
        p.y += p.vy * dt;

        if (p.y < -20) {
          p.y = h + 20;
          p.x = Math.random() * w;
        }
        if (p.x < -20) p.x = w + 20;
        else if (p.x > w + 20) p.x = -20;

        const size = p.r * (2 + p.z * 5) * (0.7 + dustState.current * 0.3);
        ctx.globalAlpha = p.a * clamp(dustState.current, 0, 1.4);
        ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };

    gsap.ticker.add(tick);
    window.addEventListener('resize', resize);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-motion-decorative
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[5] h-full w-full opacity-70"
    />
  );
}

/* ------------------------------------------------------------------ *
 * Spotlight
 * ------------------------------------------------------------------ */

/**
 * The soft key light that lives behind the product through the whole page.
 * It drifts on a long, prime-ish loop so the motion never visibly repeats, and
 * leans toward the cursor via the shared --mx/--my field.
 */
export function Spotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } });
    tl.to(el, { xPercent: 9, yPercent: -7, scale: 1.14, duration: 17 })
      .to(el, { xPercent: -7, yPercent: 6, scale: 0.94, duration: 21 })
      .to(el, { xPercent: 0, yPercent: 0, scale: 1, duration: 19 });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div
      data-motion-decorative
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
    >
      <div
        ref={ref}
        className="absolute left-1/2 top-1/2 h-[130vmax] w-[130vmax] -translate-x-1/2 -translate-y-1/2 will-transform"
        style={{
          background:
            'radial-gradient(circle at calc(50% + var(--mx) * 6%) calc(45% + var(--my) * 6%), rgba(220,38,38,0.16), rgba(220,38,38,0.05) 28%, rgba(10,10,12,0) 62%)',
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Scroll progress
 * ------------------------------------------------------------------ */

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        el.style.transform = `scaleX(${self.progress})`;
      },
    });
    return () => st.kill();
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-px bg-white/[0.06]"
    >
      <div
        ref={ref}
        className="h-full origin-left scale-x-0 will-transform"
        style={{
          background:
            'linear-gradient(90deg, var(--color-gold-deep), var(--color-gold), var(--color-gold-bright))',
        }}
      />
    </div>
  );
}

/** Registers a ScrollTrigger that raises dust density while `id` is on screen. */
export function useDustBoost(ref: React.RefObject<HTMLElement | null>, intensity: number) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 60%',
      end: 'bottom 40%',
      onToggle: (self) => setDustIntensity(self.isActive ? intensity : 1),
    });
    return () => st.kill();
  }, [ref, intensity]);
}
