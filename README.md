# AURELIAN — Calibre 01

A cinematic, scroll-driven product launch experience for a skeleton automatic wristwatch.
Eight chapters, pinned storytelling, scrubbed frame sequences, and a single continuous
scroll from overture to close.

```bash
npm install
npm run dev
```

The dev server prints a local URL. Media in `public/media/` is committed, so no build step
is required before the first run.

---

## Stack

| | |
|---|---|
| React 19 + TypeScript (strict) | Vite 7 |
| Tailwind CSS v4 (`@theme` tokens, no config file) | GSAP 3.15 + ScrollTrigger + SplitText |
| Lenis 1.3 (smooth scroll) | Framer Motion 12 (micro-interactions only, lazy-loaded) |
| Lucide (icons) | Self-hosted variable webfonts |

No React Three Fiber. Every "3D" moment in the page is a pre-rendered frame sequence
painted to a 2D canvas, which is dramatically cheaper than a live WebGL scene and gives
byte-for-byte identical results on every device.

---

## Structure

```
Assets/                       Untouched source masters (1080p / 10s / ~10 Mb·s⁻¹)
scripts/prepare-assets.mjs    Master → web pipeline (ffmpeg + cwebp)
public/
  media/seq/<id>/w{800,1280}/ 120-frame WebP sequences, per breakpoint
  media/img/w{448,896}/       Stills (native — never upscaled)
  media/video/                Hero poster (frame one of the overture)
  fonts/                      Bodoni Moda, Manrope, Inter (latin subsets, variable)
src/
  lib/          gsap (plugin registration, coalesced refresh), media manifest,
                pointer field, math helpers
  hooks/        useSmoothScroll, useGsapScope, usePointerField, useMagnetic, useMediaQuery
  components/
    system/     SequenceCanvas, Figure/Parallax, RevealText/Reveal/RuleReveal,
                MaskLine, Atmosphere (grain, dust, spotlight, scroll progress)
    layout/     Navbar, MobileMenu (lazy), Preloader, Footer
    sections/   Hero, Precision, Engineering, Heart, Materials, Gallery,
                Specifications, Finale
  data/site.ts  All copy, specs, component and material data
  data/lqip.ts  Generated — inlined blur placeholders
```

---

## The three decisions that shape everything

### 1. There is no `<video>` on the page — every shot is a frame sequence

Seeking an H.264 file with `currentTime` is asynchronous and lands on the nearest
decodable frame. Scrubbing one stutters, drifts, and behaves differently in every browser
— worst in Safari. `SequenceCanvas` instead decodes a 120-frame WebP sequence and paints
one frame per scroll position. Every position maps to exactly one image, and painting is a
single GPU blit.

That includes the overture: **the watch's full 360° turn is driven by the scroll, not by a
clock.** The rotation completes at 88% of the pinned range, leaving a beat of stillness on
the front view before the hand-off to Precision.

Frames are held as `HTMLImageElement`s rather than `ImageBitmap`s deliberately: 120 decoded
1280×720 bitmaps would pin ~440 MB of RSS. Letting the browser own the decode cache keeps
that bounded, and sequential access keeps neighbours hot. `img.decode()` is called as a
warm-up but never awaited — browsers defer decoding on hidden pages, so gating visibility
on it can hang the canvas indefinitely.

**Framing is aspect-aware.** The overture draws `contain` at 0.9 scale on landscape
viewports — the whole studio plate stays visible, the case reads as an object in a room
rather than a texture filling the screen, and it holds far more detail because it is no
longer being upscaled. Below 5:4 the canvas switches to `cover`, since containing a 16:9
plate in a phone viewport would reduce the watch to a band between two black bars. The
preloaded poster underneath mirrors the same rule at the same threshold, so the handover
from still to sequence is a pure cross-fade with no jump in framing.

### 2. One rAF loop for the whole page

Lenis is driven from `gsap.ticker` rather than its own `requestAnimationFrame`:

```ts
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

Scrub values and Lenis' interpolation are then computed in the same frame and can never
disagree by one tick — the usual source of scrub jitter. `lagSmoothing(0)` stops GSAP
"catching up" after a long frame, which would make a scrubbed sequence jump.

### 3. Pointer parallax never touches React

`usePointerField` writes an eased pointer position to `--mx` / `--my` on `:root` once per
frame (and only when it actually changed). The spotlight, hero glint and depth offsets all
read those variables in CSS. Canvas layers read the same value from a shared module object
rather than calling `getComputedStyle`, which would force a style recalculation every frame.

---

## Performance

Only `transform`, `opacity`, `clip-path` and `scale` are animated. Nothing in the scroll
path triggers layout.

**Critical path** — `index.js` 80 kB gz + `gsap` 48 kB gz + CSS 8.4 kB gz.

Everything below the second viewport is `React.lazy`. Framer Motion is deliberately *not* a
named `manualChunk`: naming it promotes it into the initial modulepreload set, which would
drag ~40 kB gz onto the critical path for a lightbox the user may never open. Left alone,
Rollup emits it as a shared async chunk fetched on first use.

**Media budget**

| | Source | Shipped |
|---|---|---|
| Overture (hero) | 12.8 MB | 4.3 MB desktop / 2.2 MB mobile, streamed |
| Hero poster | — | 28 kB, preloaded from `<head>` |
| Each other sequence | 13–15 MB | ~5 MB desktop / ~2.9 MB mobile, lazy per section |
| Stills | 1.2 MB JPEG (896×1200) | 896 kB WebP at native 896 + a 448 half, plus inlined LQIP |

Sequences load only when their section is within one viewport, at a width chosen from the
layout and `navigator.connection.saveData`. Fonts are self-hosted (no third-party
connection) and the two faces used above the fold are preloaded.

**Never upscale.** The still masters are only 896×1200. An earlier pipeline emitted a "w1800" — an interpolated 2× that cost bytes, added no detail, and compounded blur because the browser then scaled it again at render. Stills now ship at native width and layouts frame them portrait rather than stretching them across a landscape viewport.

**Trade-off worth knowing:** making the hero scroll-driven replaced a 1.6 MB looping video
with a 4.3 MB frame sequence on the critical path. Nothing is gated on it — the 28 kB
poster paints immediately and carries the LCP, the canvas cross-fades in the moment the
first frame decodes, and the rest streams in over the ~1700 px of scroll it takes to turn
the watch once. But the total bytes for a first visit went up, and on a slow connection the
early part of the turn will be coarser than the late part. Dropping `FRAME_COUNT` to 90
(4°/frame instead of 3°) would cut it by a quarter if that matters more than smoothness.

---

## Accessibility

- `prefers-reduced-motion` is honoured in both CSS and JS. Pinning, scrubbing, parallax and
  the decorative layers are dropped; **no content is lost**. Engineering's seven assemblies
  become an editorial grid, Materials' horizontal track becomes stacked panels, and the
  sequences hold a representative frame.
- Split text keeps the original string available to assistive tech; the per-character spans
  are `aria-hidden`.
- Canvas sequences carry a screen-reader description of what the shot shows.
- The Precision counters animate for sighted users; the final figure is exposed separately
  rather than announcing a rapidly changing number.
- Skip link, focus-visible rings, labelled controls, `aria-current` on the active nav item,
  Escape-to-close and focus containment in the lightbox.

## Responsive

Desktop-first, verified at 1440×900 and 375×812.

On mobile the Materials horizontal track becomes stacked full-viewport panels, the
Engineering callouts move to a bottom-anchored caption, scrims are re-weighted from
diagonal to vertical (the product fills the frame rather than sitting right of centre), and
pointer-driven effects are disabled on coarse pointers.

---

## Asset pipeline

```bash
npm run prepare:assets          # idempotent; skips completed work
npm run prepare:assets -- --force
```

Requires `ffmpeg` and `cwebp` on `PATH` (`brew install ffmpeg webp`). Reads `Assets/`,
writes `public/media/` and regenerates `src/data/lqip.ts`. Output is committed, so this
only needs re-running when the masters change.

---

## Notes

- **The intro plays once per session.** On a repeat visit every asset it waits for is
  already cached, so replaying a three-second curtain would be theatre at the user's
  expense. Cleared via `sessionStorage.removeItem('aurelian:intro-shown')`.
- **Two marks, deliberately distinct.** AURELIAN is the (fictional) maison the page
  presents; **BR | Built By Ruturaj** is the build credit, set in the same type system as a
  monogram and wordmark split by a hairline. It appears on the loading curtain and beneath
  a gold rule in the footer. Both live in `src/data/site.ts` (`BRAND`, `BUILT_BY`).
- **Brand and copy are fictional.** "AURELIAN", the Calibre 01 reference, the specifications
  and the Genève address were written for this presentation and do not describe a real
  maison or product. Swap `src/data/site.ts` to re-point the whole page.
- **The newsletter form is client-side only** — validation and confirmation states are
  implemented; wiring `onSubmit` to a list provider is the one change needed to ship it.
