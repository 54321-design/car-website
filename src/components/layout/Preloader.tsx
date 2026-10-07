import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { BRAND } from '@/data/site';
import { HERO_POSTER, stillUrl } from '@/lib/media';
import { clamp, damp, prefersReducedMotion } from '@/lib/utils';

type Props = { onComplete: () => void };

/** Hard ceiling — a stalled asset must never hold the page hostage. */
const MAX_WAIT_MS = 7000;
/** The reveal needs a beat to read as intentional rather than as a stutter. */
const MIN_DURATION_MS = 1500;

/**
 * Loading screen.
 *
 * Gates first paint on the four things that would otherwise pop in: the three
 * webfonts (which also have to settle before SplitText can measure line breaks),
 * the hero video, its poster, and the first still. Everything downstream —
 * gallery images, all three frame sequences — streams in behind the experience.
 *
 * The counter is driven straight into the DOM rather than through state: at
 * 60fps a `setState` per frame would re-reconcile this tree ~90 times during a
 * load whose entire job is to look effortless.
 */
export function Preloader({ onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const started = performance.now();
    const target = { value: 0 };
    const shown = { value: 0 };
    let done = false;

    /**
     * Never let one asset wedge the loader. Each task resolves on success,
     * failure, or its own deadline — whichever comes first.
     */
    const settleAll = (p: Promise<unknown>, deadline = 5000) =>
      Promise.race([
        p.then(
          () => undefined,
          () => undefined,
        ),
        new Promise<void>((resolve) => window.setTimeout(resolve, deadline)),
      ]);

    const loadImage = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      });

    /**
     * The hero video is deliberately *not* awaited here. The Hero's own <video>
     * element already fetches it, and racing a second detached element for the
     * same 1.6MB only causes the two requests to contend — one of them gets
     * aborted, and whichever loses can stall the counter. The poster is frame
     * one of that same shot, so there is nothing to see between poster and
     * playback anyway.
     */
    const tasks = [
      settleAll(document.fonts ? document.fonts.ready : Promise.resolve()),
      settleAll(loadImage(HERO_POSTER)),
      settleAll(loadImage(stillUrl('exterior'))),
    ];

    let settled = 0;
    tasks.forEach((task) => {
      void task.then(() => {
        settled += 1;
        target.value = settled / tasks.length;
      });
    });

    const bail = window.setTimeout(() => {
      target.value = 1;
    }, MAX_WAIT_MS);

    void Promise.all(tasks).then(() => {
      target.value = 1;
      window.clearTimeout(bail);
    });

    const render = (v: number) => {
      const pct = Math.round(clamp(v) * 100);
      if (pctRef.current) pctRef.current.textContent = String(pct).padStart(3, '0');
      if (barRef.current) barRef.current.style.transform = `scaleX(${clamp(v)})`;
      if (liveRef.current) {
        liveRef.current.setAttribute('aria-label', `Loading ${BRAND.full}, ${pct} percent`);
      }
    };

    const exit = () => {
      gsap.ticker.remove(tick);
      const root = rootRef.current;
      if (!root || prefersReducedMotion()) {
        onComplete();
        return;
      }

      // Resolve against the loader's own subtree and skip anything already gone:
      // exit can be reached on a frame where React has begun tearing this down,
      // and GSAP warns (and silently drops the tween) on a missing target.
      const dial = root.querySelector('[data-pre-dial]');
      const meta = root.querySelector('[data-pre-meta]');

      const tl = gsap.timeline({ onComplete });
      if (dial) tl.to(dial, { autoAlpha: 0, scale: 1.08, duration: 0.7, ease: 'power2.inOut' }, 0);
      if (meta) tl.to(meta, { autoAlpha: 0, y: -14, duration: 0.6, ease: 'power2.in' }, 0.05);
      if (barRef.current)
        tl.to(
          barRef.current,
          { scaleX: 0, transformOrigin: 'right center', duration: 0.7, ease: 'expo.inOut' },
          0.1,
        );
      tl
        // The curtain lifts rather than fading; a cross-fade would show the hero
        // mid-entrance through a translucent overlay.
        .to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.05, ease: 'expo.inOut' }, 0.45);
    };

    /* Displayed percentage eases toward the real figure so the counter is always
       in motion — a number that jumps 0 → 100 reads as broken, not as fast. */
    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 50) / 1000;
      shown.value = damp(shown.value, target.value, 0.09, dt);
      // Exponential easing approaches but never arrives. Close the last percent
      // outright, or the counter sits on 099 looking like it has hung.
      if (target.value - shown.value < 0.01) shown.value = target.value;
      render(shown.value);

      const elapsed = performance.now() - started;
      if (!done && shown.value >= 1 && elapsed >= MIN_DURATION_MS) {
        done = true;
        render(1);
        exit();
      }
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      window.clearTimeout(bail);
    };
    // Mount-only: the loader runs exactly once per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-ink"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
    >
      <div
        ref={liveRef}
        role="status"
        aria-live="polite"
        aria-label={`Loading ${BRAND.full}, 0 percent`}
        className="sr-only"
      />

      <div data-pre-dial className="flex flex-col items-center">
        <CarOutline />
      </div>

      <div data-pre-meta className="absolute inset-x-0 bottom-[clamp(2.5rem,8vh,5rem)] gutter">
        <div className="flex items-end justify-between gap-6">
          <p className="font-display text-[0.95rem] tracking-[0.28em] text-bone">{BRAND.name}</p>
          <p className="hidden font-sub text-[0.55rem] uppercase tracking-[0.32em] text-muted sm:block">
            {BRAND.tagline}
          </p>
        </div>

        <div className="mt-6 h-px w-full bg-white/[0.08]">
          <div
            ref={barRef}
            className="h-full origin-left"
            style={{
              transform: 'scaleX(0)',
              background:
                'linear-gradient(90deg, var(--color-gold-deep), var(--color-gold), var(--color-gold-bright))',
            }}
          />
        </div>

        <p
          aria-hidden="true"
          className="mt-5 text-right font-display text-[clamp(2.5rem,7vw,5rem)] leading-none tabular-nums text-bone"
        >
          <span ref={pctRef}>000</span>
          <span className="ml-1 align-super font-sub text-[0.7rem] tracking-[0.2em] text-gold">%</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Aerodynamic automotive silhouette drawn on with stroke-dashoffset. `pathLength="1"`
 * normalises every shape to a unit length, so one dash value drives curves, wheels
 * and body surfaces alike regardless of their real geometry.
 */
function CarOutline() {
  return (
    <svg
      viewBox="0 0 240 120"
      fill="none"
      aria-hidden="true"
      className="h-[clamp(5.5rem,16vw,8rem)] w-[clamp(13rem,38vw,20rem)] overflow-visible"
    >
      <g
        stroke="var(--color-gold)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Ground baseline */}
        <line pathLength={1} x1="12" y1="90" x2="42" y2="90" strokeWidth="0.8" style={draw(0)} />
        <line pathLength={1} x1="78" y1="90" x2="162" y2="90" strokeWidth="0.8" style={draw(0.08)} />
        <line pathLength={1} x1="198" y1="90" x2="228" y2="90" strokeWidth="0.8" style={draw(0.16)} />

        {/* Front & Rear Wheel Arches */}
        <path pathLength={1} d="M42 90 A18 18 0 0 1 78 90" strokeWidth="1" style={draw(0.2)} />
        <path pathLength={1} d="M162 90 A18 18 0 0 1 198 90" strokeWidth="1" style={draw(0.25)} />

        {/* Front Wheel & Centre Hub */}
        <circle pathLength={1} cx="60" cy="90" r="13" strokeWidth="1" style={draw(0.3)} />
        <circle pathLength={1} cx="60" cy="90" r="4.5" strokeWidth="1" style={draw(0.38)} />
        <line pathLength={1} x1="60" y1="77" x2="60" y2="103" strokeWidth="0.6" style={draw(0.42)} />
        <line pathLength={1} x1="47" y1="90" x2="73" y2="90" strokeWidth="0.6" style={draw(0.45)} />

        {/* Rear Wheel & Centre Hub */}
        <circle pathLength={1} cx="180" cy="90" r="13" strokeWidth="1" style={draw(0.35)} />
        <circle pathLength={1} cx="180" cy="90" r="4.5" strokeWidth="1" style={draw(0.4)} />
        <line pathLength={1} x1="180" y1="77" x2="180" y2="103" strokeWidth="0.6" style={draw(0.44)} />
        <line pathLength={1} x1="167" y1="90" x2="193" y2="90" strokeWidth="0.6" style={draw(0.48)} />

        {/* Main Aerodynamic Fastback Body Silhouette */}
        <path
          pathLength={1}
          d="M18 88 C18 84 22 75 34 72 C48 70 70 68 88 66 C98 65 108 50 124 42 C134 38 152 38 168 44 C182 50 196 60 212 65 C218 65 224 66 225 68 C226 74 225 82 222 88"
          strokeWidth="1.4"
          style={draw(0.52)}
        />

        {/* Side Cabin Glass (Greenhouse) */}
        <path
          pathLength={1}
          d="M108 61 C116 50 126 44 138 43 C152 43 164 47 172 55 C154 59 132 61 108 61 Z"
          strokeWidth="0.9"
          style={draw(0.68)}
        />
        <line pathLength={1} x1="142" y1="43" x2="142" y2="61" strokeWidth="0.8" style={draw(0.75)} />

        {/* Shoulder Line Aero Crease */}
        <path
          pathLength={1}
          d="M38 72 C72 70 120 68 180 65 C198 64 212 65 222 67"
          strokeWidth="0.8"
          style={draw(0.8)}
        />

        {/* Headlight Blade */}
        <path pathLength={1} d="M24 76 Q32 74 38 73" strokeWidth="1.5" style={draw(0.88)} />

        {/* Rear Light Ribbon */}
        <line pathLength={1} x1="215" y1="67" x2="224" y2="68" strokeWidth="1.6" style={draw(0.92)} />
      </g>

      <style>{`
        @keyframes draw-on { to { stroke-dashoffset: 0 } }
        @media (prefers-reduced-motion: reduce) {
          svg g > * { stroke-dashoffset: 0 !important; animation: none !important }
        }
      `}</style>
    </svg>
  );
}

/**
 * Dash state has to live on the shape itself, not on the parent <g>: `pathLength`
 * is only honoured by shape elements, and without it `strokeDasharray: 1` means
 * one *user unit* — which renders as a dotted line rather than a single stroke.
 */
const draw = (delay: number): React.CSSProperties => ({
  strokeDasharray: 1,
  strokeDashoffset: 1,
  animation: `draw-on 1.15s cubic-bezier(0.65,0,0.35,1) ${delay}s forwards`,
});
