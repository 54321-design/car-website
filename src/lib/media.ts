/**
 * Media manifest. Mirrors what `scripts/prepare-assets.mjs` emits into
 * `public/media` — keep the two in sync if the pipeline changes.
 */

export const FRAME_COUNT = 120;

export type SequenceId = 'overture' | 'engineering' | 'engine' | 'assembly';
export type StillId = 'exterior' | 'interior' | 'engine' | 'wheel' | 'profile';

const SEQ_WIDTHS = [800, 1280] as const;

/**
 * The still masters are 896×1200, so 896 is the largest honest width.
 * Layouts should frame these portrait-ish rather than stretching them across a
 * landscape viewport — at 896 native a full-bleed 1440px plate is a 1.6× upscale
 * before DPR, which reads as mush.
 */
const STILL_WIDTHS = [448, 896, 1376] as const;
export const STILL_MAX_WIDTH = 1376;

/**
 * Frame sequences are decoded one at a time into a canvas.
 * We select 1280px master width by default to ensure razor-sharp realism and prevent
 * fuzzy downscaling on high-DPI and modern desktop displays.
 */
export function pickSequenceWidth(): (typeof SEQ_WIDTHS)[number] {
  if (typeof window === 'undefined') return 1280;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    ?.saveData;
  if (saveData) return 800;
  const css = window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  return css < 640 && dpr < 1.5 ? 800 : 1280;
}

export const sequenceFrameUrl = (id: SequenceId, width: number, index: number) =>
  `/media/seq/${id}/w${width}/${String(index).padStart(3, '0')}.webp`;

export const stillUrl = (id: StillId, width: (typeof STILL_WIDTHS)[number] = STILL_MAX_WIDTH) => {
  if (width === 1376) {
    return `/media/img/w1376/${id}.jpeg`;
  }
  return `/media/img/w${width}/${id}.webp`;
};

export const stillSrcSet = (id: StillId) =>
  STILL_WIDTHS.map((w) => `${stillUrl(id, w)} ${w}w`).join(', ');

/**
 * Frame one of the overture. The hero rotation is scroll-scrubbed, so it is a
 * frame sequence rather than a video; this still paints behind the canvas for a
 * correct first paint and serves as the LCP candidate.
 */
export const HERO_POSTER = '/media/video/hero-poster.webp';
