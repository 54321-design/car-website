import { useRef, useState } from 'react';
import { gsap, scheduleScrollRefresh } from '@/lib/gsap';
import { useGsapScope } from '@/hooks/useGsapScope';
import { LQIP } from '@/data/lqip';
import { stillSrcSet, stillUrl, type StillId } from '@/lib/media';
import { cn, prefersReducedMotion } from '@/lib/utils';

type FigureProps = {
  id: StillId;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Vertical travel, as a percentage of the frame height, across the full scroll pass. */
  parallax?: number;
  /** Slow push-in while the frame crosses the viewport. */
  zoom?: number;
  priority?: boolean;
  sizes?: string;
};

/**
 * Cropped image frame with blur-up loading and scroll parallax.
 *
 * The image is deliberately taller than its frame so parallax can slide it
 * without ever exposing an edge, and only `transform` is animated — the frame
 * itself never changes size, so nothing re-layouts while scrolling.
 */
export function Figure({
  id,
  alt,
  className,
  imgClassName,
  parallax = 12,
  zoom = 0,
  priority = false,
  sizes = '100vw',
}: FigureProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const scopeRef = useGsapScope<HTMLDivElement>(({ scope }) => {
    const img = imgRef.current;
    if (!img || prefersReducedMotion() || (!parallax && !zoom)) return;

    gsap.fromTo(
      img,
      { yPercent: -parallax / 2, scale: 1 + zoom },
      {
        yPercent: parallax / 2,
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: scope,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.1,
          invalidateOnRefresh: true,
        },
      },
    );
  }, [parallax, zoom]);

  return (
    <div ref={scopeRef} className={cn('relative overflow-hidden bg-surface', className)}>
      {/* LQIP is an inlined 24px WebP — no request, and it covers the decode gap. */}
      <img
        src={LQIP[id]}
        alt=""
        aria-hidden="true"
        className={cn(
          'absolute inset-0 h-full w-full scale-110 object-cover blur-2xl transition-opacity duration-700',
          loaded ? 'opacity-0' : 'opacity-100',
        )}
      />
      <img
        ref={imgRef}
        src={stillUrl(id)}
        srcSet={stillSrcSet(id)}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        // fetchPriority is the only reliable way to get the hero still ahead of
        // the frame-sequence flood in the network queue.
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        draggable={false}
        onLoad={() => {
          setLoaded(true);
          // A late-arriving image changes nothing about layout here, but pinned
          // sections downstream measure against it.
          scheduleScrollRefresh();
        }}
        className={cn(
          'relative h-[112%] w-full -translate-y-[6%] object-cover will-transform',
          'transition-opacity duration-1000 ease-[var(--ease-luxe)]',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName,
        )}
      />
    </div>
  );
}

/**
 * Generic scroll parallax for any child (text columns, marks, rules).
 * Positive `speed` trails the scroll, negative leads it.
 */
export function Parallax({
  children,
  speed = 1,
  className,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const scopeRef = useGsapScope<HTMLDivElement>(({ scope }) => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(
      scope,
      { yPercent: -6 * speed },
      {
        yPercent: 6 * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: scope,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      },
    );
  }, [speed]);

  return (
    <div ref={scopeRef} className={cn('will-transform', className)}>
      {children}
    </div>
  );
}
