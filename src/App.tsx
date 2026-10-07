import { Suspense, lazy, useEffect, useState } from 'react';
import { ScrollTrigger } from '@/lib/gsap';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { usePointerField } from '@/hooks/usePointerField';
import { DustField, Grain, ScrollProgress, Spotlight } from '@/components/system/Atmosphere';
import { Navbar } from '@/components/layout/Navbar';
import { Preloader } from '@/components/layout/Preloader';
import { Hero } from '@/components/sections/Hero';
import { Precision } from '@/components/sections/Precision';

/**
 * Everything below the second viewport is split out of the initial bundle. The
 * hero and Precision are what the user actually sees first; the remaining six
 * sections — and the GSAP timelines that drive them — arrive while they read.
 */
const Engineering = lazy(() =>
  import('@/components/sections/Engineering').then((m) => ({ default: m.Engineering })),
);
const Heart = lazy(() => import('@/components/sections/Heart').then((m) => ({ default: m.Heart })));
const Materials = lazy(() =>
  import('@/components/sections/Materials').then((m) => ({ default: m.Materials })),
);
const Gallery = lazy(() =>
  import('@/components/sections/Gallery').then((m) => ({ default: m.Gallery })),
);
const Specifications = lazy(() =>
  import('@/components/sections/Specifications').then((m) => ({ default: m.Specifications })),
);
const Finale = lazy(() =>
  import('@/components/sections/Finale').then((m) => ({ default: m.Finale })),
);
const Footer = lazy(() => import('@/components/layout/Footer').then((m) => ({ default: m.Footer })));

/**
 * The overture plays once per session. On a repeat visit every asset it waits
 * for is already in the HTTP cache, so replaying a three-second curtain would
 * be theatre at the user's expense rather than for them.
 */
const INTRO_KEY = 'aurelian:intro-shown';

function introAlreadyPlayed() {
  try {
    return sessionStorage.getItem(INTRO_KEY) === '1';
  } catch {
    // Private mode / blocked storage — fall back to always showing it.
    return false;
  }
}

export default function App() {
  const [loading, setLoading] = useState(() => !introAlreadyPlayed());
  const [started, setStarted] = useState(() => introAlreadyPlayed());

  useSmoothScroll();
  usePointerField();

  /* Nothing should scroll behind the loader. */
  useEffect(() => {
    document.body.style.overflow = loading ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [loading]);

  return (
    <>
      {loading && (
        <Preloader
          onComplete={() => {
            try {
              sessionStorage.setItem(INTRO_KEY, '1');
            } catch {
              /* Storage unavailable; the intro simply plays again next time. */
            }
            setLoading(false);
            // Sections measured while the loader had the body locked; re-measure
            // before the first scroll can reach a pinned trigger.
            requestAnimationFrame(() => {
              ScrollTrigger.refresh();
              setStarted(true);
            });
          }}
        />
      )}

      <a
        href="#precision"
        className="sr-only fixed left-4 top-4 z-[300] bg-ink px-5 py-3 font-sub text-[0.7rem] uppercase tracking-[0.24em] text-gold outline outline-1 outline-gold"
      >
        Skip to content
      </a>

      {/* Atmosphere — fixed layers, behind and above everything respectively. */}
      <Spotlight />
      <DustField />
      <Grain />
      <ScrollProgress />

      <Navbar />

      <main id="main" className="relative z-10">
        <Hero started={started} />
        <Precision />

        <Suspense fallback={<SectionFallback />}>
          <Engineering />
          <Heart />
          <Materials />
          <Gallery />
          <Specifications />
          <Finale />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
}

/** Holds vertical space so a late chunk cannot cause a layout jump mid-scroll. */
function SectionFallback() {
  return <div className="h-svh w-full bg-ink" aria-hidden="true" />;
}
