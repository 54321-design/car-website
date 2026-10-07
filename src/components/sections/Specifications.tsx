import { gsap } from '@/lib/gsap';
import { useGsapScope } from '@/hooks/useGsapScope';
import { RevealText } from '@/components/system/RevealText';
import { BRAND, SPECIFICATIONS } from '@/data/site';
import { prefersReducedMotion } from '@/lib/utils';

/**
 * Specifications.
 *
 * No cards, no icons, no columns of badges — just type, hairlines and space.
 * Each row is its own trigger so the table assembles under the reader at
 * reading speed rather than arriving as one block.
 */
export function Specifications() {
  const scopeRef = useGsapScope<HTMLElement>(({ scope }) => {
    if (prefersReducedMotion()) {
      gsap.set(scope.querySelectorAll('[data-spec-row] > *'), { autoAlpha: 1, y: 0 });
      gsap.set(scope.querySelectorAll('[data-spec-line]'), { scaleX: 1 });
      return;
    }

    const rows = gsap.utils.toArray<HTMLElement>('[data-spec-row]', scope);

    rows.forEach((row) => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: row, start: 'top 88%', once: true },
      });

      tl.fromTo(
        row.querySelector('[data-spec-line]'),
        { scaleX: 0 },
        { scaleX: 1, duration: 1.3, ease: 'expo.out' },
        0,
      )
        .fromTo(
          row.querySelectorAll('[data-spec-mask] > *'),
          { yPercent: 112 },
          { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.06 },
          0.08,
        )
        .fromTo(
          row.querySelector('[data-spec-note]'),
          { autoAlpha: 0, x: -14 },
          { autoAlpha: 1, x: 0, duration: 1, ease: 'expo.out' },
          0.28,
        );
    });
  }, []);

  return (
    <section
      ref={scopeRef}
      id="specifications"
      aria-label="Specifications"
      className="relative bg-ink py-section"
    >
      <header className="gutter">
        <p className="eyebrow mb-6">Chapter 06 — On Paper</p>
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
          <RevealText as="h2" variant="chars" className="display text-[clamp(2.6rem,9.5vw,8rem)]">
            Specifications.
          </RevealText>
          <p className="font-sub text-[0.62rem] uppercase tracking-[0.3em] text-muted">
            {BRAND.reference}
          </p>
        </div>
      </header>

      <dl className="gutter mt-20">
        {SPECIFICATIONS.map((spec) => (
          <div key={spec.k} data-spec-row className="relative">
            <div
              data-spec-line
              aria-hidden="true"
              className="h-px origin-left bg-divider"
              style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.16), rgba(255,255,255,0.03))' }}
            />

            <div className="grid grid-cols-1 items-baseline gap-y-3 py-[clamp(1.5rem,3.2vw,2.75rem)] md:grid-cols-12 md:gap-x-8">
              <dt className="md:col-span-4">
                <span data-spec-mask className="reveal-mask">
                  <span className="block font-sub text-[0.72rem] uppercase tracking-[0.3em] text-muted">
                    {spec.k}
                  </span>
                </span>
              </dt>

              <dd className="md:col-span-5">
                <span data-spec-mask className="reveal-mask">
                  <span className="block font-display text-[clamp(1.75rem,4.4vw,3.5rem)] leading-none">
                    {spec.v}
                  </span>
                </span>
              </dd>

              <dd
                data-spec-note
                className="font-body text-[0.78rem] text-muted md:col-span-3 md:text-right"
              >
                {spec.note}
              </dd>
            </div>
          </div>
        ))}
        <div
          aria-hidden="true"
          className="h-px"
          style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.16), rgba(255,255,255,0.03))' }}
        />
      </dl>

      <p className="gutter mt-14 max-w-[52ch] font-body text-[0.8rem] leading-relaxed text-muted">
        Every {BRAND.model} is dyno-tested and certified before it leaves the factory.
        Servicing is recommended at 10,000 km intervals and carried out only by authorised
        {' '}{BRAND.name} technicians.
      </p>
    </section>
  );
}
