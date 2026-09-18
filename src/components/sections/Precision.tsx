import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useGsapScope } from '@/hooks/useGsapScope';
import { MaskLine } from '@/components/system/MaskLine';
import { Figure } from '@/components/system/Figure';
import { PRECISION_COUNTERS } from '@/data/site';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { cn, prefersReducedMotion } from '@/lib/utils';

/**
 * Performance.
 *
 * Black-dominant and typographic. The earlier version stretched the macro still
 * full-bleed and pushed a 1.42× dolly through it — a 896px master asked to fill
 * ~2500 device pixels, which read as mush and drowned the headline in mid-tones.
 * Now the plate sits in a portrait frame that never exceeds its source
 * resolution, and the motion comes from things that stay sharp at any size: a
 * clip-path wipe, a gauge that draws itself, internal parallax, and the counters.
 *
 * Only the editorial spread is pinned. The figures follow as their own band —
 * pinning all of it meant the stack could exceed a short viewport and clip the
 * headline off the top, which is exactly what it did at 700px.
 */

/** Tick marks for the gauge rule beside the plate. Long mark every fifth. */
const TICKS = Array.from({ length: 24 }, (_, i) => i);

export function Precision() {
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const reducedLayout = useReducedMotion();

  const scopeRef = useGsapScope<HTMLElement>(({ scope }) => {
    const reduced = prefersReducedMotion();

    const setCountersFinal = () =>
      counterRefs.current.forEach((el, i) => {
        const c = PRECISION_COUNTERS[i];
        if (el) el.textContent = format(c.value, 'decimals' in c ? c.decimals : 0);
      });

    if (reduced) {
      gsap.set(scope.querySelectorAll('[data-stat], [data-p-lede]'), { autoAlpha: 1, y: 0 });
      gsap.set(scope.querySelectorAll('[data-p-plate]'), { clipPath: 'inset(0% 0% 0% 0%)' });
      gsap.set(scope.querySelectorAll('[data-p-tick]'), { scaleX: 1, autoAlpha: 1 });
      setCountersFinal();
      return;
    }

    /* -- Pinned spread ---------------------------------------------- */
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '[data-p-pin]',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        pin: '[data-precision-stage]',
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.from('[data-precision-char]', { yPercent: 115, stagger: 0.02, ease: 'none', duration: 0.22 }, 0)
      .from('[data-precision-eyebrow]', { autoAlpha: 0, y: 18, ease: 'none', duration: 0.08 }, 0)
      .from('[data-p-lede]', { autoAlpha: 0, y: 24, ease: 'none', duration: 0.14 }, 0.14);

    /* Plate wipes up, then drifts. Never magnified beyond 1.05×. */
    tl.fromTo(
      '[data-p-plate]',
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.inOut', duration: 0.4 },
      0.08,
    )
      .fromTo('[data-p-plate]', { scale: 1.05 }, { scale: 1, ease: 'none', duration: 1 }, 0.08)
      .fromTo('[data-p-edge]', { scaleY: 0 }, { scaleY: 1, ease: 'power2.inOut', duration: 0.42 }, 0.12)
      .fromTo(
        '[data-p-caption]',
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, ease: 'none', duration: 0.12 },
        0.46,
      );

    /* Gauge: ticks flick out in sequence, like a scale being read. */
    tl.fromTo(
      '[data-p-tick]',
      { scaleX: 0, autoAlpha: 0 },
      { scaleX: 1, autoAlpha: 1, ease: 'none', stagger: 0.008, duration: 0.03 },
      0.2,
    );

    /* -- Figures band, on its own trigger ---------------------------- */
    const figures = gsap.timeline({
      scrollTrigger: {
        trigger: '[data-p-figures]',
        start: 'top 78%',
        end: 'top 30%',
        scrub: 1,
      },
    });

    figures.from('[data-stat]', { autoAlpha: 0, y: 48, stagger: 0.08, ease: 'none', duration: 0.4 }, 0);

    PRECISION_COUNTERS.forEach((counter, i) => {
      const el = counterRefs.current[i];
      if (!el) return;
      const decimals = 'decimals' in counter ? counter.decimals : 0;
      const proxy = { n: 0 };

      figures.to(
        proxy,
        {
          n: counter.value,
          ease: 'none',
          duration: 0.55,
          onUpdate: () => {
            el.textContent = format(proxy.n, decimals);
          },
        },
        0.1 + i * 0.08,
      );
    });

    return () => {
      tl.kill();
      figures.kill();
    };
  }, [reducedLayout]);

  return (
    <section ref={scopeRef} id="precision" aria-label="Precision" className="relative bg-ink">
      {/* Pin driver. Its height is the scroll budget for the spread — and it
          collapses under reduced motion, where nothing is pinned and the extra
          240svh would just be dead scroll past a static layout. */}
      <div data-p-pin className={cn('relative', !reducedLayout && 'h-[240svh]')}>
        <div data-precision-stage className="relative h-svh w-full overflow-hidden bg-ink">
          {/* A single soft key light, well away from the type column. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(58% 52% at 76% 44%, rgba(220,38,38,0.14), transparent 70%)',
            }}
          />

          {/* Top padding clears the fixed nav so centring happens in the space
              actually available — without it the chapter eyebrow slides under
              the bar on short viewports. */}
          <div className="relative flex h-full items-center gutter pt-[var(--nav-h)]">
            <div className="grid w-full items-center gap-x-[clamp(2rem,5vw,5rem)] gap-y-[clamp(2rem,5vh,3.5rem)] lg:grid-cols-12">
              {/* Type -------------------------------------------------- */}
              <div className="lg:col-span-7">
                <p data-precision-eyebrow className="eyebrow mb-[clamp(1rem,2.5vh,1.5rem)]">
                  Chapter 01 — Performance
                </p>
                <h2 className="display text-[clamp(2.6rem,7.4vw,7rem)]">
                  <MaskLine text="Track" charAttr="data-precision-char" />
                  <MaskLine
                    text="Focused."
                    className="italic text-gold"
                    charAttr="data-precision-char"
                  />
                </h2>
                <p
                  data-p-lede
                  className="lede mt-[clamp(1.25rem,3vh,2rem)] max-w-[44ch] text-[clamp(0.88rem,1.05vw,1.05rem)]"
                >
                  Performance is not a number — it is a feeling. Every component in this
                  machine is tuned to deliver power with precision, because the difference
                  between fast and extraordinary is measured in milliseconds.
                </p>
              </div>

              {/* Plate + gauge ----------------------------------------- */}
              <div className="lg:col-span-5">
                <div className="flex items-stretch justify-start gap-4 sm:gap-5">
                  {/* Gauge rule. Pure geometry, so it is pin-sharp at any DPR. */}
                  <div
                    aria-hidden="true"
                    className="hidden w-8 shrink-0 flex-col justify-between py-1 sm:flex"
                  >
                    {TICKS.map((t) => (
                      <span
                        key={t}
                        data-p-tick
                        className="block h-px origin-left"
                        style={{
                          width: t % 5 === 0 ? '100%' : '50%',
                          background: t % 5 === 0 ? 'var(--color-gold)' : 'rgba(255,255,255,0.22)',
                        }}
                      />
                    ))}
                  </div>

                  <div className="min-w-0">
                    {/* Height-led, aspect-derived width: the frame adapts to the
                        viewport instead of forcing the stage to grow past it. At
                        every size this lands at or under the 896px master. */}
                    <div
                      data-p-plate
                      className="relative aspect-[3/4] h-[clamp(15rem,50svh,30rem)] will-transform"
                      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
                    >
                      <Figure
                        id="engine"
                        alt="Macro detail of the twin-turbo V8 engine: turbochargers, intake manifold and polished internals"
                        className="h-full w-full"
                        parallax={9}
                        sizes="(min-width: 1024px) 24rem, 60vw"
                        priority
                      />
                      <span
                        data-p-edge
                        aria-hidden="true"
                        className="absolute -left-px top-0 block h-full w-px origin-top bg-gold/70"
                      />
                    </div>

                    <p
                      data-p-caption
                      className="mt-4 font-sub text-[0.56rem] uppercase tracking-[0.24em] text-muted"
                    >
                      4.0L Twin-Turbo V8 — detailed at 2:1
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Figures ---------------------------------------------------- */}
      <div data-p-figures className="gutter pb-[clamp(4rem,10vh,8rem)]">
        <div className="border-t border-divider pt-[clamp(2rem,5vh,3.5rem)]">
          <div className="grid grid-cols-1 gap-x-[clamp(1.5rem,4vw,4rem)] gap-y-10 sm:grid-cols-3">
            {PRECISION_COUNTERS.map((counter, i) => (
              <div key={counter.label} data-stat className="will-transform">
                <p className="flex items-baseline gap-1 font-display text-[clamp(2.4rem,5.4vw,4.75rem)] leading-none text-bone">
                  <span
                    ref={(el) => {
                      counterRefs.current[i] = el;
                    }}
                    className="tabular-nums"
                    aria-hidden="true"
                  >
                    {format(0, 'decimals' in counter ? counter.decimals : 0)}
                  </span>
                  <span className="text-gold" aria-hidden="true">
                    {counter.suffix}
                  </span>
                  {/* The live figure is decorative motion; this is what gets read out. */}
                  <span className="sr-only">
                    {format(counter.value, 'decimals' in counter ? counter.decimals : 0)}
                    {counter.suffix}
                  </span>
                </p>
                <p className="mt-4 font-sub text-[0.64rem] uppercase tracking-[0.28em] text-bone">
                  {counter.label}
                </p>
                <p className="mt-2 max-w-[26ch] font-body text-[0.78rem] leading-relaxed text-muted">
                  {counter.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function format(value: number, decimals = 0) {
  return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-GB');
}
