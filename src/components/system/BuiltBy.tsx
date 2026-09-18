import { BUILT_BY } from '@/data/site';
import { cn } from '@/lib/utils';

/**
 * Build credit — "BR | Built By Ruturaj".
 *
 * Set as a monogram and a wordmark separated by a hairline rule, in the page's
 * own type system rather than a badge: it should read as a signature on the work,
 * not as a sticker on top of it. The monogram uses the display face at the
 * brand's own letterspacing so it sits in the same family as the JAIHIND mark.
 */
export function BuiltBy({
  className,
  size = 'sm',
}: {
  className?: string;
  size?: 'sm' | 'lg';
}) {
  return (
    <span
      className={cn(
        'group inline-flex items-center gap-3 whitespace-nowrap align-middle',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'font-display leading-none text-gold transition-colors duration-500',
          size === 'lg' ? 'text-[1.05rem] tracking-[0.2em]' : 'text-[0.8rem] tracking-[0.18em]',
        )}
      >
        {BUILT_BY.monogram}
      </span>

      <span
        aria-hidden="true"
        className={cn('block w-px bg-gold/35', size === 'lg' ? 'h-4' : 'h-3')}
      />

      <span
        className={cn(
          'font-sub uppercase text-muted transition-colors duration-500 group-hover:text-bone',
          size === 'lg'
            ? 'text-[0.62rem] tracking-[0.3em]'
            : 'text-[0.55rem] tracking-[0.26em]',
        )}
      >
        {BUILT_BY.label}
      </span>
    </span>
  );
}
