import { gsap } from '@/lib/gsap';
import { useGsapScope } from '@/hooks/useGsapScope';
import { Figure } from '@/components/system/Figure';
import { RevealText, RuleReveal } from '@/components/system/RevealText';
import { MATERIALS, type Material } from '@/data/site';
import { useIsDesktop, useReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

/**
 * Craftsmanship.
 *
 * Desktop turns the section on its side: the page pins and three full-viewport
 * panels travel horizontally. Mobile gets the same three panels stacked — the
 * brief's own instruction, and the right call regardless, since a hijacked
 * horizontal gesture on touch fights the platform's scroll.
 */
export function Materials() {
  const isDesktop = useIsDesktop();
  const reduced = useReducedMotion();
  const horizontal = isDesktop && !reduced;

  const scopeRef = useGsapScope<HTMLElement>(({ scope }) => {
    if (!horizontal) return;

    const track = scope.querySelector<HTMLElement>('[data-track]');
    if (!track) return;

    const panels = gsap.utils.toArray<HTMLElement>('[data-panel]', track);
    const distance = () => track.scrollWidth - window.innerWidth;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scope,
        start: 'top top',
        // Scroll length matches travel distance 1:1, so the horizontal move
        // reads at exactly the speed the user is scrolling.
        end: () => `+=${distance()}`,
        scrub: 1,
        pin: '[data-materials-stage]',
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    tl.to(track, { x: () => -distance(), ease: 'none' }, 0);

    // Counter-parallax: plate and copy travel at different rates against the
    // track, which is what stops three sliding panels reading as one flat strip.
    panels.forEach((panel) => {
      const plate = panel.querySelector('[data-panel-plate]');
      const copy = panel.querySelector('[data-panel-copy]');
      const index = panel.querySelector('[data-panel-index]');

      if (plate) tl.fromTo(plate, { xPercent: 10 }, { xPercent: -10, ease: 'none' }, 0);
      if (copy) tl.fromTo(copy, { xPercent: -6 }, { xPercent: 6, ease: 'none' }, 0);
      if (index) tl.fromTo(index, { xPercent: -22 }, { xPercent: 22, ease: 'none' }, 0);
    });

    return () => {
      tl.kill();
    };
  }, [horizontal]);

  return (
    <section
      ref={scopeRef}
      id="materials"
      aria-label="Materials"
      className={cn('relative bg-ink', !horizontal && 'py-section')}
    >
      {!horizontal && (
        <header className="gutter mb-16">
          <p className="eyebrow mb-6">Chapter 04 — Craftsmanship</p>
          <RevealText as="h2" variant="chars" className="display text-[clamp(2.6rem,11vw,6rem)]">
            Three Materials.
          </RevealText>
          <RuleReveal className="mt-10" />
        </header>
      )}

      <div
        data-materials-stage
        className={cn(horizontal && 'relative h-svh w-full overflow-hidden')}
      >
        <div
          data-track
          className={cn(
            horizontal ? 'flex h-full w-max will-transform' : 'flex flex-col gap-24 lg:gap-32',
          )}
        >
          {horizontal && <IntroPanel />}
          {MATERIALS.map((material, i) => (
            <MaterialPanel
              key={material.id}
              material={material}
              horizontal={horizontal}
              align={i % 2 === 0 ? 'end' : 'start'}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Title panel, so the horizontal run starts with type rather than an image. */
function IntroPanel() {
  return (
    <div data-panel className="relative flex h-full w-screen shrink-0 items-center gutter">
      <div data-panel-copy className="max-w-[18ch] will-transform">
        <p className="eyebrow mb-7">Chapter 04 — Craftsmanship</p>
        <h2 className="display text-[clamp(3rem,7vw,7.5rem)]">
          Three
          <br />
          <span className="italic text-gold">Materials.</span>
        </h2>
        <p className="lede mt-9 max-w-[38ch] text-[0.95rem]">
          Carbon fibre for what it endures. Aluminium for what it says. Leather for what it lets you feel.
          Nothing on this car is chosen twice.
        </p>
        <p className="mt-12 flex items-center gap-4 font-sub text-[0.6rem] uppercase tracking-[0.34em] text-muted">
          <span className="inline-block h-px w-12 bg-gold/50" aria-hidden="true" />
          Scroll to travel
        </p>
      </div>
    </div>
  );
}

function MaterialPanel({
  material,
  horizontal,
  align,
}: {
  material: Material;
  horizontal: boolean;
  align: 'start' | 'end';
}) {
  return (
    <article
      data-panel
      className={cn(
        'relative shrink-0 overflow-hidden',
        horizontal ? 'h-full w-screen' : 'h-[86svh] w-full',
      )}
    >
      <div data-panel-plate className="absolute inset-0 will-transform">
        <Figure
          id={material.image}
          alt={`${material.title} — ${material.subtitle}`}
          className="h-full w-full"
          imgClassName="h-full translate-y-0"
          // The horizontal track already supplies the movement; a second
          // vertical parallax on top of it would read as drift.
          parallax={horizontal ? 0 : 10}
          sizes="100vw"
        />
      </div>

      {/* Diagonal grade for the horizontal layout, where copy sits left of the
          plate. Vertical grade for the stacked layout, where it sits over it. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden lg:block"
        style={{
          background:
            'linear-gradient(115deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.18) 62%, rgba(0,0,0,0.75) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 lg:hidden"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.34) 26%, rgba(0,0,0,0.7) 52%, rgba(0,0,0,0.9) 78%, rgba(0,0,0,0.95) 100%)',
        }}
      />

      {/* Reflection sweep: a narrow specular band crossing the plate on a long,
          offset cycle so no two panels flash together. */}
      <div
        data-motion-decorative
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span
          className="absolute -inset-y-1/2 left-0 block w-[26%] -skew-x-12"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.055) 45%, rgba(231,205,150,0.11) 55%, transparent)',
            animation: `sweep 9s cubic-bezier(0.5,0,0.2,1) ${material.index === '01' ? 0 : material.index === '02' ? 3 : 6}s infinite`,
          }}
        />
      </div>

      {/* Oversized index, sunk behind the copy. */}
      <span
        data-panel-index
        aria-hidden="true"
        className="pointer-events-none absolute right-[-2%] top-1/2 -translate-y-1/2 font-display text-[34vw] leading-none text-white/[0.045] will-transform lg:text-[24vw]"
      >
        {material.index}
      </span>

      <div
        className={cn(
          'absolute inset-0 z-10 flex gutter',
          align === 'end' ? 'items-end pb-[clamp(3rem,9vh,6rem)]' : 'items-center',
        )}
      >
        <div data-panel-copy className="max-w-[34rem] will-transform">
          <p className="eyebrow mb-5">
            {material.index} — {material.subtitle}
          </p>
          <h3 className="display text-[clamp(3rem,8.5vw,8rem)]">{material.title}</h3>
          <p className="lede mt-7 max-w-[42ch] text-[0.92rem]">{material.body}</p>

          {/* Glass meta strip — the only backdrop-filter on the page, kept small
              on purpose because it is the most expensive effect available. */}
          <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-4 border border-white/10 bg-white/[0.04] px-6 py-5 backdrop-blur-md">
            {material.meta.map((row) => (
              <div key={row.k}>
                <dt className="font-sub text-[0.55rem] uppercase tracking-[0.3em] text-muted">
                  {row.k}
                </dt>
                <dd className="mt-1.5 font-sub text-[0.82rem] text-bone">{row.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <style>{`
        @keyframes sweep {
          0%   { transform: translateX(-120%) skewX(-12deg) }
          55%  { transform: translateX(520%) skewX(-12deg) }
          100% { transform: translateX(520%) skewX(-12deg) }
        }
      `}</style>
    </article>
  );
}
