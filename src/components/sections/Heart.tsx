import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useGsapScope } from '@/hooks/useGsapScope';
import { SequenceCanvas, type SequenceHandle } from '@/components/system/SequenceCanvas';
import { MaskLine } from '@/components/system/MaskLine';
import { useDustBoost } from '@/components/system/Atmosphere';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

/** Rings that bloom over mechanical detail as the camera travels into the engine. */
const HIGHLIGHTS = [
  { id: 'turbo', at: 0.34, x: 0.42, y: 0.46, size: 13, label: 'Twin Turbo' },
  { id: 'v8', at: 0.5, x: 0.63, y: 0.38, size: 10, label: 'V8 Block' },
  { id: 'exhaust', at: 0.64, x: 0.34, y: 0.62, size: 15, label: 'Exhaust Manifold' },
  { id: 'intake', at: 0.78, x: 0.58, y: 0.66, size: 8, label: 'Intake System' },
];

/**
 * The Engine.
 *
 * The camera flies into the engine while the copy holds still, so the depth
 * comes entirely from the plate. Dust density is raised for the length of the
 * section — the particles read as scale cues once the frame is inside the
 * mechanism, which is the only place on the page they do real work.
 */
export function Heart() {
  const sequenceRef = useRef<SequenceHandle>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useDustBoost(sectionRef, 2.1);

  const scopeRef = useGsapScope<HTMLElement>(({ scope }) => {
    sectionRef.current = scope;

    if (reduced) {
      sequenceRef.current?.setProgress(0.55);
      gsap.set(scope.querySelectorAll('[data-heart-body], [data-highlight]'), { autoAlpha: 1 });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scope,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        pin: '[data-heart-stage]',
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => sequenceRef.current?.setProgress(self.progress),
      },
    });

    tl.from('[data-heart-char]', { yPercent: 115, stagger: 0.018, ease: 'none', duration: 0.07 }, 0)
      .from('[data-heart-eyebrow]', { autoAlpha: 0, ease: 'none', duration: 0.03 }, 0)
      .from('[data-heart-body]', { autoAlpha: 0, y: 34, ease: 'none', duration: 0.07 }, 0.08)
      // Title drifts up and dissolves as the frame descends past it.
      .to('[data-heart-title]', { yPercent: -34, autoAlpha: 0, ease: 'none', duration: 0.2 }, 0.26)
      .to('[data-heart-body]', { autoAlpha: 0, y: -26, ease: 'none', duration: 0.14 }, 0.28)
      // Core glow swells as the camera reaches the going train.
      .fromTo(
        '[data-heart-glow]',
        { opacity: 0.15, scale: 0.72 },
        { opacity: 0.85, scale: 1.25, ease: 'none', duration: 0.7 },
        0.16,
      )
      .to('[data-heart-glow]', { opacity: 0.3, ease: 'none', duration: 0.14 }, 0.86);

    HIGHLIGHTS.forEach((h) => {
      tl.fromTo(
        `[data-highlight="${h.id}"]`,
        { autoAlpha: 0, scale: 0.55 },
        { autoAlpha: 1, scale: 1, ease: 'none', duration: 0.045 },
        h.at - 0.05,
      ).to(
        `[data-highlight="${h.id}"]`,
        { autoAlpha: 0, scale: 1.35, ease: 'none', duration: 0.05 },
        h.at + 0.06,
      );
    });

    // Closing statement rides in on the tail of the move.
    tl.from('[data-heart-close]', { autoAlpha: 0, y: 40, ease: 'none', duration: 0.09 }, 0.86);

    return () => {
      tl.kill();
    };
  }, [reduced]);

  return (
    <section
      ref={scopeRef}
      id="heart"
      aria-label="The Heart"
      className={cn('relative bg-ink', reduced ? 'py-section' : 'h-[600svh]')}
    >
      <div
        data-heart-stage
        className={cn('relative w-full overflow-hidden', reduced ? 'h-[70svh]' : 'h-svh')}
      >
        <SequenceCanvas
          ref={sequenceRef}
          id="engine"
          label="The 4.0L V8 engine opening outward: turbochargers, exhaust manifold and intake system revealing the heart of performance."
          className="absolute inset-0"
          smoothing={0.16}
        />

        {/* Core glow -------------------------------------------------- */}
        <div
          data-heart-glow
          data-motion-decorative
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 will-transform"
          style={{
            background:
              'radial-gradient(circle, rgba(220,38,38,0.34), rgba(220,38,38,0.07) 42%, transparent 68%)',
            mixBlendMode: 'screen',
          }}
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 76%, rgba(0,0,0,0.9) 100%)',
          }}
        />

        {/* Highlights ------------------------------------------------- */}
        {!reduced && (
          <div className="pointer-events-none absolute inset-0 z-20 hidden md:block" aria-hidden="true">
            {HIGHLIGHTS.map((h) => (
              <div
                key={h.id}
                data-highlight={h.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 will-transform"
                style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }}
              >
                <span
                  className="block rounded-full border border-gold/55"
                  style={{
                    width: `${h.size}vmin`,
                    height: `${h.size}vmin`,
                    boxShadow: 'inset 0 0 30px rgba(220,38,38,0.14), 0 0 24px rgba(220,38,38,0.14)',
                  }}
                />
                <span className="absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap font-sub text-[0.55rem] uppercase tracking-[0.28em] text-gold/85">
                  {h.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Copy -------------------------------------------------------- */}
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-center gutter">
          <div data-heart-title className="will-transform">
            <p data-heart-eyebrow className="eyebrow mb-6">
              Chapter 03 — The Engine
            </p>
            <h2 className="display text-[clamp(2.7rem,9.2vw,9.5rem)]">
              <MaskLine text="Inside" charAttr="data-heart-char" />
              <MaskLine text="Every Cylinder." className="italic text-gold" charAttr="data-heart-char" />
            </h2>
          </div>

          <p
            data-heart-body
            className="lede mt-10 max-w-[46ch] text-[clamp(0.92rem,1.1vw,1.1rem)] will-transform"
          >
            Six hundred and twenty horsepower, delivered through eight cylinders firing in
            perfect sequence. Everything else in the engine exists to keep that one motion
            honest — and exhilarating.
          </p>
        </div>

        {/* Closing line ------------------------------------------------ */}
        <div
          data-heart-close
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 gutter pb-[clamp(2.5rem,7vh,4.5rem)] will-transform"
        >
          <div className="gold-rule mb-6" aria-hidden="true" />
          <p className="max-w-[30ch] font-display text-[clamp(1.2rem,2.3vw,2rem)] italic leading-snug text-bone/90">
            Nothing here is decorative. It only looks that way.
          </p>
        </div>
      </div>
    </section>
  );
}
