import { cn } from '@/lib/utils';

type Props = {
  text: string;
  className?: string;
  charClassName?: string;
  /** Marks the characters for a parent timeline to target. */
  charAttr?: string;
};

/**
 * A single display line, pre-split into masked characters in markup.
 *
 * SplitText is the right tool when copy reflows; this is the right tool when a
 * line is a fixed design decision and its animation belongs to a scrubbed
 * timeline that must exist before any measurement happens. Splitting at render
 * also means the characters are never re-created mid-scroll.
 */
export function MaskLine({ text, className, charClassName, charAttr = 'data-char' }: Props) {
  return (
    <span className={cn('reveal-mask', className)}>
      {/* The full string stays readable to assistive tech and to copy/paste. */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-block">
        {text.split('').map((ch, i) => (
          <span
            key={`${ch}-${i}`}
            {...{ [charAttr]: '' }}
            className={cn('inline-block will-transform', charClassName)}
          >
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </span>
    </span>
  );
}
