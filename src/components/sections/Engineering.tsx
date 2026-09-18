import { useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { useGsapScope } from '@/hooks/useGsapScope';
import { SequenceCanvas, type SequenceHandle } from '@/components/system/SequenceCanvas';
import { MaskLine } from '@/components/system/MaskLine';
import { COMPONENTS } from '@/data/site';
import { useIsDesktop, useReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

/**
 * Architecture.
 *
 * Scroll *is* the timeline here. One ScrollTrigger drives both the frame
 * sequence and the callouts from the same progress value, so a component's
 * label can never appear before the part it names has separated — the copy
 * positions in `COMPONENTS[].at` are read off the exploded shot itself.
 */
export function Engineering() {
  const sequenceRef = useRef<SequenceHandle>(null);
  const [active, setActive] = useState(-1);
  const isDesktop = useIsDesktop();
  const reduced = useReducedMotion();

  const scopeRef = useGsapScope<HTMLElement>(({ scope }) => {
    if (reduced) {
      sequenceRef.current?.setProgress(0.62);
      gsap.set(scope.querySelectorAll('[data-callout]'), { autoAlpha: 1, y: 0 });
      gsap.set(scope.querySelectorAll('[data-connector]'), { scaleX: 1 });
      setActive(COMPONENTS.length - 1);
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scope,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        pin: '[data-eng-stage]',
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          sequenceRef.current?.setProgress(self.progress);

          // Nearest passed marker drives the index rail. Cheap enough to run
          // per tick, and it is the only React state this section touches.
          let next = -1;
          for (let i = 0; i < COMPONENTS.length; i++) {
            if (self.progress >= COMPONENTS[i].at - 0.06) next = i;
          }
          setActive((prev) => (prev === next ? prev : next));
        },
      },
    });

    // Title clears before the first component separates.
    tl.from('[data-eng-char]', { yPercent: 115, stagger: 0.02, ease: 'none', duration: 0.05 }, 0)
      .from('[data-eng-eyebrow]', { autoAlpha: 0, ease: 'none', duration: 0.02 }, 0)
      .to('[data-eng-title]', { autoAlpha: 0, yPercent: -30, ease: 'none', duration: 0.06 }, 0.08);

    COMPONENTS.forEach((component) => {
      const callout = `[data-callout="${component.id}"]`;
      const connector = `[data-connector="${component.id}"]`;
      const dot = `[data-dot="${component.id}"]`;

      const enter = Math.max(0, component.at - 0.075);
      const exit = Math.min(0.995, component.at + 0.07);

      tl.fromTo(
        dot,
        { scale: 0, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, ease: 'none', duration: 0.018 },
        enter,
      )
        // The rule runs outward from the part toward the copy.
        .fromTo(
          connector,
          { scaleX: 0 },
          { scaleX: 1, ease: 'none', duration: 0.03 },
          enter + 0.012,
        )
        .fromTo(
          callout,
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, ease: 'none', duration: 0.032 },
          enter + 0.022,
        )
        .to(callout, { autoAlpha: 0, y: -22, ease: 'none', duration: 0.03 }, exit)
        .to(connector, { scaleX: 0, ease: 'none', duration: 0.024 }, exit)
        .to(dot, { scale: 0, autoAlpha: 0, ease: 'none', duration: 0.02 }, exit + 0.008);
    });

    return () => {
      tl.kill();
    };
  }, [isDesktop, reduced]);

  return (
    <section
      ref={scopeRef}
      id="engineering"
      aria-label="Engineering"
      className={cn('relative', reduced ? 'py-section' : 'h-[760svh]')}
    >
      <div
        data-eng-stage
        className={cn('relative w-full overflow-hidden', reduced ? 'h-[70svh]' : 'h-svh')}
      >
        <SequenceCanvas
          ref={sequenceRef}
          id="engineering"
          label="The GT V8 separating into its seven principal assemblies: body, chassis, powertrain, interior, wheels, aerodynamics and suspension."
          className="absolute inset-0"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 50%, transparent 34%, rgba(0,0,0,0.5) 78%, rgba(0,0,0,0.88) 100%)',
          }}
        />

        {/* Title ----------------------------------------------------- */}
        <div
          data-eng-title
          className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-center gutter will-transform"
        >
          <p data-eng-eyebrow className="eyebrow mb-6">
            Chapter 02 — Architecture
          </p>
          <h2 className="display text-[clamp(2.9rem,10vw,10.5rem)]">
            <MaskLine text="Seven" charAttr="data-eng-char" />
            <MaskLine text="Components." className="italic text-gold" charAttr="data-eng-char" />
          </h2>
        </div>

        {/* Anchors + connectors — desktop only ----------------------- */}
        {!reduced && isDesktop && (
          <div className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
            {COMPONENTS.map((c) => {
              const right = c.anchor.x > 0.5;
              return (
                <div
                  key={c.id}
                  className="absolute"
                  style={{ left: `${c.anchor.x * 100}%`, top: `${c.anchor.y * 100}%` }}
                >
                  <span
                    data-dot={c.id}
                    className="absolute -left-[3px] -top-[3px] block h-1.5 w-1.5 rounded-full bg-gold will-transform"
                    style={{ boxShadow: '0 0 0 4px rgba(220,38,38,0.16), 0 0 18px rgba(220,38,38,0.7)' }}
                  />
                  <span
                    data-connector={c.id}
                    className={cn(
                      'absolute top-0 block h-px w-[clamp(3rem,7vw,7.5rem)] will-transform',
                      right ? 'left-0 origin-left' : 'right-0 origin-right',
                    )}
                    style={{
                      background: right
                        ? 'linear-gradient(90deg, var(--color-gold), rgba(199,166,106,0.05))'
                        : 'linear-gradient(270deg, var(--color-gold), rgba(199,166,106,0.05))',
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Callouts — overlay form. In reduced motion they render as a grid
            *outside* the stage instead; see below. The stage is a fixed-height
            overflow-hidden frame, so a flowed grid inside it would be clipped. */}
        {!reduced && (
        <div className="pointer-events-none absolute inset-0 z-30">
          {COMPONENTS.map((c) => {
            const right = c.anchor.x > 0.5;
            return (
              <article
                key={c.id}
                data-callout={c.id}
                className={cn(
                  'will-transform',
                  isDesktop
                    ? 'absolute w-[clamp(15rem,21vw,20rem)]'
                    : 'absolute inset-x-0 bottom-0 gutter pb-[clamp(3rem,9vh,6rem)]',
                )}
                style={
                  isDesktop
                    ? {
                        top: `calc(${c.anchor.y * 100}% - 0.55rem)`,
                        ...(right
                          ? { left: `calc(${c.anchor.x * 100}% + clamp(4rem,8vw,8.75rem))` }
                          : { right: `calc(${(1 - c.anchor.x) * 100}% + clamp(4rem,8vw,8.75rem))` }),
                      }
                    : undefined
                }
              >
                <div className={cn(isDesktop && !right && 'text-right')}>
                  <p className="font-sub text-[0.6rem] tracking-[0.34em] text-gold">{c.index}</p>
                  <h3 className="mt-2 font-display text-[clamp(1.6rem,2.6vw,2.4rem)] leading-none">
                    {c.name}
                  </h3>
                  <p className="mt-2 font-sub text-[0.66rem] uppercase tracking-[0.22em] text-muted">
                    {c.spec}
                  </p>
                  <p className="mt-4 max-w-[34ch] font-body text-[0.83rem] leading-relaxed text-muted">
                    {c.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
        )}

        {/* Index rail ------------------------------------------------ */}
        {!reduced && (
          <ol
            aria-hidden="true"
            className="absolute right-[clamp(1.25rem,3vw,3rem)] top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 lg:flex"
          >
            {COMPONENTS.map((c, i) => (
              <li key={c.id} className="flex items-center justify-end gap-3">
                <span
                  className={cn(
                    'font-sub text-[0.58rem] tracking-[0.24em] transition-all duration-500 ease-[var(--ease-luxe)]',
                    i === active ? 'text-gold opacity-100' : 'text-muted opacity-35',
                  )}
                >
                  {c.index}
                </span>
                <span
                  className={cn(
                    'block h-px origin-right bg-gold transition-all duration-500 ease-[var(--ease-luxe)]',
                    i === active ? 'w-7 opacity-100' : 'w-3 opacity-25',
                  )}
                />
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Reduced motion: the seven assemblies become a plain editorial grid
          below the plate. Same copy, same order, no scroll choreography — and
          crucially outside the clipped stage, so none of it is cut off. */}
      {reduced && (
        <div className="gutter mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {COMPONENTS.map((c) => (
            <article key={c.id} data-callout={c.id}>
              <p className="font-sub text-[0.6rem] tracking-[0.34em] text-gold">{c.index}</p>
              <h3 className="mt-2 font-display text-[clamp(1.6rem,2.6vw,2.4rem)] leading-none">
                {c.name}
              </h3>
              <p className="mt-2 font-sub text-[0.66rem] uppercase tracking-[0.22em] text-muted">
                {c.spec}
              </p>
              <p className="mt-4 max-w-[34ch] font-body text-[0.83rem] leading-relaxed text-muted">
                {c.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
