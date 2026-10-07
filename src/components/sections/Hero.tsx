import { useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { useGsapScope } from '@/hooks/useGsapScope';
import { MaskLine } from '@/components/system/MaskLine';
import { SequenceCanvas, type SequenceHandle } from '@/components/system/SequenceCanvas';
import { HERO_POSTER } from '@/lib/media';
import { BRAND } from '@/data/site';
import { prefersReducedMotion } from '@/lib/utils';

type Props = { started: boolean };

/**
 * Exterior.
 *
 * The car turns a full 360° under the scroll — the rotation is the scrollbar.
 * It is a frame sequence rather than a video for the same reason as every other
 * scrubbed shot on the page: seeking H.264 is asynchronous and frame-inexact, so
 * a scrubbed video slips against the scroll instead of tracking it.
 *
 * The plate is drawn `contain` rather than `cover`, which keeps the whole studio
 * frame visible and the car smaller and sharper. The masters are shot on black
 * against a black stage, so nothing gives the letterboxing away.
 */
export function Hero({ started }: Props) {
  const sequenceRef = useRef<SequenceHandle>(null);

  const scopeRef = useGsapScope<HTMLElement>(({ scope }) => {
    const reduced = prefersReducedMotion();

    /* -- Entrance, once the preloader has cleared -------------------- */
    if (started) {
      const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });

      intro
        .from('[data-hero-char]', {
          yPercent: 120,
          duration: reduced ? 0 : 1.5,
          stagger: reduced ? 0 : 0.028,
        })
        .from(
          '[data-hero-sub]',
          { autoAlpha: 0, y: 26, duration: reduced ? 0 : 1.4 },
          reduced ? 0 : '-=1.05',
        )
        .from(
          '[data-hero-meta]',
          { autoAlpha: 0, y: 18, duration: reduced ? 0 : 1.2, stagger: 0.1 },
          reduced ? 0 : '-=1.15',
        )
        .from('[data-hero-cue]', { autoAlpha: 0, duration: reduced ? 0 : 1.2 }, reduced ? 0 : '-=0.9');
    }

    if (reduced) {
      // Hold the three-quarter view: the most legible single frame of the rotation.
      sequenceRef.current?.setProgress(0.32);
      return;
    }

    /* -- Scroll: one full revolution across the pinned range ---------- */
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scope,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
        pin: '[data-hero-stage]',
        pinSpacing: false,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // The rotation completes at 88%, leaving a beat of stillness on the
          // front view before the section hands off to Precision.
          sequenceRef.current?.setProgress(Math.min(1, self.progress / 0.88));
        },
      },
    });

    tl.to('[data-hero-plate]', { scale: 1.08, ease: 'none' }, 0)
      // Headline recedes rather than simply fading — the depth cue is the point.
      .to('[data-hero-copy]', { yPercent: -26, scale: 0.82, autoAlpha: 0, ease: 'none' }, 0)
      .to('[data-hero-grade]', { opacity: 1, ease: 'none' }, 0)
      // Explicit `fromTo` with immediateRender off. The intro above animates the
      // cue *from* autoAlpha 0, which sets it to 0 on creation; a plain `.to()`
      // here would record that as its start value and fade 0 → 0, leaving the
      // cue permanently invisible.
      .fromTo(
        '[data-hero-cue]',
        { autoAlpha: 1 },
        { autoAlpha: 0, ease: 'none', duration: 0.25, immediateRender: false },
        0,
      );

    return () => {
      tl.kill();
    };
  }, [started]);

  return (
    <section ref={scopeRef} id="hero" aria-label="Overture" className="relative h-[190svh]">
      <div data-hero-stage className="relative h-svh w-full overflow-hidden">
        {/* Plate ------------------------------------------------------ */}
        <div data-hero-plate className="absolute inset-0">
          {/* Preloaded still under the canvas: the section has a correct first
              paint (and an LCP candidate) before a single frame has decoded. */}
          <img
            src={HERO_POSTER}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            // Mirrors the canvas's `adaptive` rule at the same 5:4 threshold, so
            // the handover from still to sequence is a pure cross-fade with no
            // jump in framing at any viewport.
            className="absolute inset-0 h-full w-full object-cover [@media(min-aspect-ratio:5/4)]:scale-90 [@media(min-aspect-ratio:5/4)]:object-contain"
          />
          <SequenceCanvas
            ref={sequenceRef}
            id="overture"
            label={`The ${BRAND.full} rotating through a full revolution in the studio.`}
            className="absolute inset-0 bg-transparent"
            fit="adaptive"
            // Pulled back off the frame edges so the case reads as an object in
            // a room rather than a texture filling the viewport.
            scale={0.9}
            smoothing={0.14}
            eager
          />
        </div>

        {/* Grade: vignette always, full darken driven by scroll -------- */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 45%, transparent 26%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.92) 100%)',
          }}
        />
        {/* Directional scrim under the type column. Falls away well before the
            product so the headline stays legible without dimming the car.
            Desktop only — the product sits right of centre there. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            background:
              'linear-gradient(100deg, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.5) 26%, rgba(0,0,0,0.1) 48%, transparent 64%)',
          }}
        />
        {/* On narrow screens the car fills the frame and the copy sits on top of
            it, so the scrim has to run vertically and carry a lot more weight. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.42) 24%, rgba(0,0,0,0.72) 48%, rgba(0,0,0,0.88) 72%, rgba(0,0,0,0.95) 100%)',
          }}
        />
        <div data-hero-grade aria-hidden="true" className="pointer-events-none absolute inset-0 bg-ink opacity-0" />

        {/* Gold glint that tracks the cursor -------------------------- */}
        <div
          data-motion-decorative
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{
            background:
              'radial-gradient(280px circle at calc(50% + var(--mx) * 50%) calc(50% + var(--my) * 50%), rgba(239,68,68,0.85), rgba(220,38,38,0.16) 42%, transparent 70%)',
          }}
        />

        {/* Copy ------------------------------------------------------- */}
        <div className="absolute inset-0 z-10 flex flex-col justify-center gutter">
          <div data-hero-copy className="will-transform">
            {/* Tracking tightens on narrow screens; 0.42em would wrap this to
                two lines at 375px and break the rhythm of the stack. */}
            <p
              data-hero-meta
              className="eyebrow mb-7 flex items-center gap-4 whitespace-nowrap tracking-[0.2em] sm:tracking-[var(--tracking-mega)]"
            >
              <span className="inline-block h-px w-8 bg-gold/50 sm:w-10" aria-hidden="true" />
              {BRAND.tagline}
            </p>

            {/* Capped so the second line clears the car on wide viewports —
                the product, not the type, is the subject of this frame. */}
            <h1 className="display max-w-[13ch] text-[clamp(2.9rem,10.4vw,10.5rem)] uppercase">
              <MaskLine text="Power," charAttr="data-hero-char" />
              <MaskLine
                text="Perfected."
                className="italic text-gold"
                charAttr="data-hero-char"
              />
            </h1>

            <p
              data-hero-sub
              className="lede mt-9 max-w-md text-[clamp(0.95rem,1.15vw,1.15rem)]"
            >
              Engineered for those who demand exhilaration.
            </p>
          </div>
        </div>

        {/* Baseline meta --------------------------------------------- */}
        <div className="absolute inset-x-0 bottom-0 z-10 gutter pb-9">
          <div className="rule mb-6" aria-hidden="true" />
          {/* Three equal tracks rather than justify-between, so the cue stays
              optically centred even when "Genève" is hidden on small screens. */}
          <div className="grid grid-cols-3 items-end gap-6">
            <p
              data-hero-meta
              className="whitespace-nowrap font-sub text-[0.55rem] uppercase tracking-[0.18em] text-muted sm:text-[0.65rem] sm:tracking-[0.3em]"
            >
              {BRAND.reference}
            </p>

            <div data-hero-cue className="flex flex-col items-center gap-3 justify-self-center">
              <span className="whitespace-nowrap font-sub text-[0.6rem] uppercase tracking-[0.34em] text-muted">
                Scroll to explore
              </span>
              <span
                aria-hidden="true"
                className="relative block h-12 w-px overflow-hidden bg-white/12"
              >
                <span className="absolute inset-x-0 top-0 block h-1/3 bg-gold [animation:cue-fall_2.4s_var(--ease-glide)_infinite]" />
              </span>
            </div>

            <p
              data-hero-meta
              className="hidden justify-self-end font-sub text-[0.65rem] uppercase tracking-[0.3em] text-muted sm:block"
            >
              Genève
            </p>
          </div>
        </div>

        <style>{`
          @keyframes cue-fall {
            0%   { transform: translateY(-100%); opacity: 0 }
            35%  { opacity: 1 }
            100% { transform: translateY(300%); opacity: 0 }
          }
        `}</style>
      </div>
    </section>
  );
}
