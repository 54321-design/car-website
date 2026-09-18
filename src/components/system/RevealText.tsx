import { createElement, useRef, type ElementType, type ReactNode } from 'react';
import { gsap, SplitText } from '@/lib/gsap';
import { useGsapScope } from '@/hooks/useGsapScope';
import { cn, prefersReducedMotion } from '@/lib/utils';

type Variant = 'chars' | 'lines';

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /**
   * `chars` masks per line and cascades individual letters — for display headings.
   * `lines` masks per line only — cheaper, and correct for body copy.
   */
  variant?: Variant;
  delay?: number;
  /** ScrollTrigger start. Defaults to "well inside the viewport" so it never fires offscreen. */
  start?: string;
  /** Replay every time the element re-enters instead of once. */
  repeat?: boolean;
};

/**
 * Line-by-line text reveal driven by GSAP SplitText.
 *
 * Splitting depends on final text metrics, so it has to run after webfonts settle —
 * the preloader gates first paint on `document.fonts.ready`, and `autoSplit` re-splits
 * on resize so the line masks stay correct through orientation changes.
 */
export function RevealText({
  children,
  as = 'p',
  className,
  variant = 'lines',
  delay = 0,
  start = 'top 82%',
  repeat = false,
}: Props) {
  const targetRef = useRef<HTMLElement>(null);

  const scopeRef = useGsapScope<HTMLDivElement>(() => {
    const el = targetRef.current;
    if (!el) return;

    // Reveal first, animate second. If SplitText ever fails, the copy is still
    // on screen rather than stuck behind the `invisible` class.
    gsap.set(el, { autoAlpha: 1 });
    if (prefersReducedMotion()) return;

    let split: SplitText | null = null;
    try {
      split = SplitText.create(el, {
        type: variant === 'chars' ? 'lines,words,chars' : 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit(self) {
          const targets = variant === 'chars' ? self.chars : self.lines;
          return gsap.from(targets, {
            yPercent: 118,
            // A whisper of rotation stops the rise reading as a flat slide.
            rotate: variant === 'chars' ? 2.5 : 1.2,
            duration: variant === 'chars' ? 1.15 : 1.05,
            ease: 'expo.out',
            delay,
            stagger: variant === 'chars' ? { each: 0.014 } : { each: 0.085 },
            scrollTrigger: {
              trigger: el,
              start,
              once: !repeat,
              toggleActions: repeat ? 'play none none reverse' : 'play none none none',
            },
          });
        },
      });
    } catch {
      /* Text is already visible; a missing reveal is not worth a broken section. */
    }

    return () => split?.revert();
  }, [variant, delay, start, repeat]);

  return (
    <div ref={scopeRef} className="contents">
      {createElement(as, { ref: targetRef, className: cn('invisible', className) }, children)}
    </div>
  );
}

/**
 * Non-text entrance: fades and lifts a block once, on scroll.
 * Separate from RevealText so we never pay for a split we don't need.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 40,
  start = 'top 88%',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  start?: string;
}) {
  const scopeRef = useGsapScope<HTMLDivElement>(({ scope }) => {
    if (prefersReducedMotion()) {
      gsap.set(scope, { autoAlpha: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      scope,
      { autoAlpha: 0, y },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.25,
        ease: 'expo.out',
        delay,
        scrollTrigger: { trigger: scope, start, once: true },
      },
    );
  }, [delay, y, start]);

  return (
    <div ref={scopeRef} className={cn('invisible', className)}>
      {children}
    </div>
  );
}

/** Hairline that draws itself in from the centre as it scrolls into view. */
export function RuleReveal({ className, gold = false }: { className?: string; gold?: boolean }) {
  const scopeRef = useGsapScope<HTMLDivElement>(({ scope }) => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(
      scope,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1.6,
        ease: 'expo.out',
        scrollTrigger: { trigger: scope, start: 'top 92%', once: true },
      },
    );
  }, []);

  return (
    <div ref={scopeRef} className={cn(gold ? 'gold-rule' : 'rule', 'origin-center', className)} />
  );
}
