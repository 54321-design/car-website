import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { gsap } from '@/lib/gsap';
import { RevealText, RuleReveal } from '@/components/system/RevealText';
import { Reveal } from '@/components/system/RevealText';
import { LQIP } from '@/data/lqip';
import { GALLERY, type GalleryItem } from '@/data/site';
import { stillSrcSet, stillUrl } from '@/lib/media';
import { getLenis } from '@/hooks/useSmoothScroll';
import { isTouchLike, prefersReducedMotion } from '@/lib/utils';
import { cn } from '@/lib/utils';

/**
 * Gallery.
 *
 * An offset editorial grid — deliberately not a uniform masonry. Column spans
 * and vertical offsets are authored per image in `site.ts` so the eye travels
 * diagonally down the page rather than scanning rows.
 */
export function Gallery() {
  const [open, setOpen] = useState<GalleryItem | null>(null);

  // Lenis keeps scrolling under a fixed overlay unless it is explicitly stopped.
  useEffect(() => {
    const lenis = getLenis();
    if (!open) return;
    lenis?.stop();
    document.body.style.overflow = 'hidden';
    return () => {
      lenis?.start();
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <section id="gallery" aria-label="Gallery" className="relative bg-ink py-section">
      <header className="gutter">
        <p className="eyebrow mb-6">Chapter 05 — Portfolio</p>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <RevealText as="h2" variant="chars" className="display text-[clamp(2.6rem,9vw,7.5rem)]">
            Seen Closely.
          </RevealText>
          <RevealText
            as="p"
            className="lede max-w-[34ch] text-[0.9rem]"
          >
            Shot in a single session, one light, no retouching beyond dust. What the sensor
            recorded is what you see.
          </RevealText>
        </div>
        <RuleReveal className="mt-12" />
      </header>

      <div className="gutter mt-16">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-12 md:gap-7">
          {GALLERY.map((item, i) => (
            <Reveal key={item.id} delay={(i % 3) * 0.08} className={item.span}>
              <GalleryCard item={item} onOpen={() => setOpen(item)} />
            </Reveal>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open && <Lightbox item={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function GalleryCard({ item, onOpen }: { item: GalleryItem; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  /**
   * Pointer tilt. Rotation is written through quickTo so repeated pointermove
   * events collapse into one interpolated tween per frame instead of queuing
   * a new one each time.
   */
  useEffect(() => {
    const el = ref.current;
    if (!el || isTouchLike() || prefersReducedMotion()) return;

    const plate = el.querySelector<HTMLElement>('[data-plate]');
    if (!plate) return;

    const opts = { duration: 0.7, ease: 'power3.out' } as const;
    const rx = gsap.quickTo(plate, 'rotateX', opts);
    const ry = gsap.quickTo(plate, 'rotateY', opts);
    const sc = gsap.quickTo(plate, 'scale', opts);

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rx(-py * 8);
      ry(px * 11);
      sc(1.045);
    };
    const onLeave = () => {
      rx(0);
      ry(0);
      sc(1);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      aria-label={`Open ${item.caption} at full size`}
      className={cn(
        'group relative block w-full overflow-hidden bg-surface text-left',
        '[perspective:1200px]',
        item.aspect,
      )}
    >
      <div
        data-plate
        className="absolute inset-0 will-transform [transform-style:preserve-3d]"
      >
        <img
          src={LQIP[item.image]}
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 h-full w-full scale-110 object-cover blur-md transition-opacity duration-300',
            loaded ? 'opacity-0' : 'opacity-100',
          )}
        />
        <img
          ref={imgRef}
          src={stillUrl(item.image, 1376)}
          srcSet={stillSrcSet(item.image)}
          sizes="(min-width: 768px) 50vw, 100vw"
          alt={item.caption}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300 ease-out',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
          style={{ imageRendering: 'auto' }}
        />
      </div>

      {/* Specular sweep on hover. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span
          className={cn(
            'absolute -inset-y-1/3 -left-1/3 block w-1/2 -skew-x-12 opacity-0',
            'transition-all duration-[1100ms] ease-[var(--ease-luxe)]',
            'group-hover:left-[110%] group-hover:opacity-100',
          )}
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), rgba(231,205,150,0.18), transparent)',
          }}
        />
      </span>

      <span
        aria-hidden="true"
        // Weighted for the brightest plate in the set (the gold macro), so the
        // caption holds contrast on every card rather than only the dark ones.
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent transition-opacity duration-700"
      />

      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
        <span className="block">
          <span className="block font-display text-[clamp(1.1rem,1.7vw,1.6rem)] leading-none">
            {item.caption}
          </span>
          <span className="mt-2 block max-w-[28ch] font-body text-[0.72rem] leading-relaxed text-muted opacity-0 transition-opacity duration-700 group-hover:opacity-100">
            {item.detail}
          </span>
        </span>
        <span className="font-sub text-[0.55rem] uppercase tracking-[0.3em] text-gold opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          View
        </span>
      </span>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 border border-white/0 transition-colors duration-700 group-hover:border-white/12"
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */

function Lightbox({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Keep tab focus inside the overlay while it is open.
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    closeRef.current?.focus();
  }, []);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.caption} — ${item.detail}`}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-5 backdrop-blur-xl sm:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClose}
    >
      <motion.figure
        className="relative max-h-full w-full max-w-5xl"
        initial={reduced ? false : { opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: reduced ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={stillUrl(item.image)}
          alt={item.caption}
          className="mx-auto max-h-[76svh] w-auto object-contain"
        />
        <figcaption className="mt-6 flex flex-wrap items-baseline justify-between gap-4 border-t border-divider pt-5">
          <span className="font-display text-[clamp(1.3rem,2.4vw,2rem)]">{item.caption}</span>
          <span className="font-body text-[0.78rem] text-muted">{item.detail}</span>
        </figcaption>
      </motion.figure>

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center border border-white/12 text-muted transition-colors duration-300 hover:border-gold hover:text-gold sm:right-10 sm:top-10"
      >
        <X size={18} strokeWidth={1.25} aria-hidden="true" />
      </button>
    </motion.div>
  );
}
