import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { gsap } from '@/lib/gsap';
import { useGsapScope } from '@/hooks/useGsapScope';
import { useMagnetic } from '@/hooks/useMagnetic';
import { SequenceCanvas, type SequenceHandle } from '@/components/system/SequenceCanvas';
import { MaskLine } from '@/components/system/MaskLine';
import { BRAND } from '@/data/site';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

/**
 * Finale.
 *
 * The assembly shot runs to completion under the scroll, so the car is whole
 * at exactly the moment the closing line finishes setting. The last 15% of the
 * pin is held with the sequence already at frame 120 — the resolve needs a beat
 * of stillness or it reads as an accident.
 */
export function Finale() {
  const sequenceRef = useRef<SequenceHandle>(null);
  const reduced = useReducedMotion();
  const ctaRef = useMagnetic<HTMLAnchorElement>({ strength: 0.36 });

  const scopeRef = useGsapScope<HTMLElement>(({ scope }) => {
    if (reduced) {
      sequenceRef.current?.setProgress(1);
      gsap.set(scope.querySelectorAll('[data-finale-copy], [data-finale-cta]'), { autoAlpha: 1, y: 0 });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scope,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        pin: '[data-finale-stage]',
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Assembly finishes at 85%, leaving the tail for the copy to land.
          sequenceRef.current?.setProgress(Math.min(1, self.progress / 0.85));
        },
      },
    });

    tl.fromTo('[data-finale-scrim]', { opacity: 0 }, { opacity: 0.6, ease: 'none', duration: 0.5 }, 0.4)
      .from(
        '[data-finale-char]',
        { yPercent: 118, stagger: 0.012, ease: 'none', duration: 0.16 },
        0.52,
      )
      .from('[data-finale-eyebrow]', { autoAlpha: 0, ease: 'none', duration: 0.06 }, 0.5)
      .from('[data-finale-sub]', { autoAlpha: 0, y: 28, ease: 'none', duration: 0.09 }, 0.7)
      .from('[data-finale-cta]', { autoAlpha: 0, y: 30, ease: 'none', duration: 0.09 }, 0.78);

    return () => {
      tl.kill();
    };
  }, [reduced]);

  return (
    <section
      ref={scopeRef}
      id="finale"
      aria-label="Explore the collection"
      className={cn('relative bg-ink', reduced ? 'py-section' : 'h-[520svh]')}
    >
      <div
        data-finale-stage
        className={cn('relative w-full overflow-hidden', reduced ? 'h-[70svh]' : 'h-svh')}
      >
        <SequenceCanvas
          ref={sequenceRef}
          id="assembly"
          label={`The ${BRAND.full} assembling: engine, chassis, body and interior coming together into the finished car.`}
          className="absolute inset-0"
          smoothing={0.2}
        />

        {/* Slowly rotating key light behind the product. */}
        <div
          data-motion-decorative
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, rgba(220,38,38,0.13) 42deg, transparent 96deg, transparent 200deg, rgba(220,38,38,0.09) 256deg, transparent 320deg)',
            animation: 'finale-sweep 34s linear infinite',
            mixBlendMode: 'screen',
          }}
        />

        <div
          data-finale-scrim
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-ink opacity-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 48%, transparent 32%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0.94) 100%)',
          }}
        />

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gutter text-center">
          <p data-finale-eyebrow className="eyebrow mb-8">
            {BRAND.name} — {BRAND.model}
          </p>

          <h2
            data-finale-copy
            className="display text-[clamp(2.4rem,8.4vw,9rem)] uppercase"
          >
            <MaskLine text="Built to" charAttr="data-finale-char" />
            <MaskLine
              text="Move You."
              className="italic text-gold"
              charAttr="data-finale-char"
            />
          </h2>

          <p
            data-finale-sub
            className="lede mt-9 max-w-[42ch] text-[clamp(0.9rem,1.05vw,1.05rem)] will-transform"
          >
            Hand-built by master craftsmen, at a rate of just five hundred a year.
            {' '}
            {BRAND.price}.
          </p>

          <div data-finale-cta className="mt-12 will-transform">
            <a
              ref={ctaRef}
              href="#specifications"
              className={cn(
                'group relative inline-flex items-center gap-4 overflow-hidden border border-gold/40 px-[clamp(2rem,3.4vw,3.25rem)] py-[clamp(1rem,1.5vw,1.35rem)]',
                'font-sub text-[0.68rem] uppercase tracking-[0.3em] text-bone will-transform',
                'transition-colors duration-500 ease-[var(--ease-luxe)] hover:text-ink',
              )}
            >
              {/* Fill wipes up from the baseline on hover. */}
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-bottom scale-y-0 bg-gold transition-transform duration-[650ms] ease-[var(--ease-luxe)] group-hover:scale-y-100"
              />
              <span data-magnetic-label className="relative flex items-center gap-4 will-transform">
                Explore Models
                <ArrowRight
                  size={15}
                  strokeWidth={1.25}
                  aria-hidden="true"
                  className="transition-transform duration-500 ease-[var(--ease-luxe)] group-hover:translate-x-1.5"
                />
              </span>
            </a>
          </div>
        </div>

        <style>{`
          @keyframes finale-sweep {
            from { transform: translate(-50%, -50%) rotate(0deg) }
            to   { transform: translate(-50%, -50%) rotate(360deg) }
          }
        `}</style>
      </div>
    </section>
  );
}
