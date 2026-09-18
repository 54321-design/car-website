import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ScrollTrigger } from '@/lib/gsap';
import { BRAND, NAV_SECTIONS } from '@/data/site';
import { getLenis, scrollToSection } from '@/hooks/useSmoothScroll';
import { cn } from '@/lib/utils';

/** Pulled in on first open; keeps Framer Motion out of the initial bundle. */
const MobileMenu = lazy(() => import('@/components/layout/MobileMenu'));

/**
 * Navigation.
 *
 * Transparent over the hero, then a blurred bar once the page moves. The active
 * indicator is a single element that slides between items rather than seven
 * elements fading — the continuity is what makes it read as one instrument.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>('hero');
  const [menuOpen, setMenuOpen] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  /* Bar state ------------------------------------------------------- */
  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 'top -80',
      end: 'max',
      onToggle: (self) => setScrolled(self.isActive),
    });
    return () => st.kill();
  }, []);

  /* Active section -------------------------------------------------- */
  useEffect(() => {
    const triggers = NAV_SECTIONS.map((section) => {
      const el = document.getElementById(section.id);
      if (!el) return null;
      return ScrollTrigger.create({
        trigger: el,
        start: 'top 45%',
        end: 'bottom 45%',
        onToggle: (self) => {
          if (self.isActive) setActive(section.id);
        },
      });
    }).filter(Boolean) as ScrollTrigger[];

    return () => triggers.forEach((t) => t.kill());
  }, []);

  /* Indicator ------------------------------------------------------- */
  useEffect(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    if (!list || !indicator) return;

    const move = () => {
      const target = list.querySelector<HTMLElement>(`[data-nav-item="${active}"]`);
      if (!target) {
        indicator.style.opacity = '0';
        return;
      }
      indicator.style.opacity = '1';
      indicator.style.width = `${target.offsetWidth}px`;
      indicator.style.transform = `translateX(${target.offsetLeft}px)`;
    };

    move();
    window.addEventListener('resize', move);
    return () => window.removeEventListener('resize', move);
  }, [active]);

  /* Mobile sheet ---------------------------------------------------- */
  useEffect(() => {
    const lenis = getLenis();
    if (menuOpen) lenis?.stop();
    else lenis?.start();
  }, [menuOpen]);

  const go = (id: string) => {
    setMenuOpen(false);
    // Let the sheet begin closing before the scroll starts, or the two
    // animations land on top of each other.
    window.setTimeout(() => scrollToSection(id), menuOpen ? 260 : 0);
  };

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-[80] transition-[background-color,backdrop-filter,border-color] duration-700 ease-[var(--ease-luxe)]',
          scrolled
            ? 'border-b border-divider bg-black/55 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <nav
          aria-label="Primary"
          className="gutter flex h-[var(--nav-h)] items-center justify-between gap-8"
        >
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              go('hero');
            }}
            className="group flex shrink-0 items-baseline gap-2.5"
          >
            <span className="font-display text-[1.1rem] tracking-[0.24em] text-bone">
              {BRAND.name}
            </span>
            <span className="hidden font-sub text-[0.55rem] uppercase tracking-[0.3em] text-gold transition-opacity duration-500 group-hover:opacity-70 sm:inline">
              {BRAND.model}
            </span>
          </a>

          {/* Desktop menu */}
          <ul ref={listRef} className="relative hidden items-center gap-1 lg:flex">
            <span
              ref={indicatorRef}
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-0.5 left-0 h-px bg-gold opacity-0 transition-[transform,width,opacity] duration-[650ms] ease-[var(--ease-luxe)]"
            />
            {NAV_SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  data-nav-item={section.id}
                  aria-current={active === section.id ? 'true' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    go(section.id);
                  }}
                  className={cn(
                    'block whitespace-nowrap px-4 py-2 font-sub text-[0.62rem] uppercase tracking-[0.26em] transition-colors duration-500',
                    active === section.id ? 'text-bone' : 'text-muted hover:text-bone',
                  )}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-5">
            <a
              href="#finale"
              onClick={(e) => {
                e.preventDefault();
                go('finale');
              }}
              className="hidden border border-gold/35 px-6 py-2.5 font-sub text-[0.58rem] uppercase tracking-[0.28em] text-gold transition-colors duration-500 hover:bg-gold hover:text-ink sm:block"
            >
              Enquire
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="flex h-10 w-10 items-center justify-center text-bone lg:hidden"
            >
              {menuOpen ? (
                <X size={20} strokeWidth={1.25} aria-hidden="true" />
              ) : (
                <Menu size={20} strokeWidth={1.25} aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {menuOpen && (
        <Suspense fallback={null}>
          <MobileMenu onNavigate={go} />
        </Suspense>
      )}
    </>
  );
}
