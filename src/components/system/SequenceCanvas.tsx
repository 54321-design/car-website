import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { FRAME_COUNT, pickSequenceWidth, sequenceFrameUrl, type SequenceId } from '@/lib/media';
import { clamp, cn, damp, prefersReducedMotion } from '@/lib/utils';

export type SequenceHandle = {
  /** Target scrub position, 0–1. Safe to call every scroll tick. */
  setProgress: (p: number) => void;
};

type Props = {
  id: SequenceId;
  /** Accessible description of what the sequence shows. */
  label: string;
  className?: string;
  /**
   * How tightly the canvas follows the scrub target. Lower = more inertia.
   * 0.18 lands just short of "floaty" at 60fps.
   */
  smoothing?: number;
  /** Fraction of frames that must be decoded before the loading chip clears. */
  readyThreshold?: number;
  /**
   * `cover` fills the frame and crops — right for shots that should feel like
   * you are inside them. `contain` fits the whole 16:9 plate, showing the subject
   * smaller and entire; seamless here because the masters are shot on black and
   * the stage is black.
   *
   * `adaptive` picks per container: `contain` on landscape frames, `cover` on
   * portrait ones. Containing a 16:9 plate in a tall phone viewport would reduce
   * the subject to a band with dead black above and below it.
   */
  fit?: 'cover' | 'contain' | 'adaptive';
  /** Multiplier applied after fitting. Below 1 pulls the subject back in frame. */
  scale?: number;
  /** Paint the first frame the moment it decodes, before the section is reached. */
  eager?: boolean;
  onReady?: () => void;
};

const CONCURRENCY = 12;

/**
 * Canvas playback of a WebP frame sequence, scrubbed by scroll.
 *
 * Why not a <video> with `currentTime`? Seeking H.264 is asynchronous and lands on
 * the nearest decodable frame, so a scrubbed video stutters and drifts — badly in
 * Safari. Drawing pre-decoded frames is deterministic: every scroll position maps
 * to exactly one image, and painting is a single GPU blit.
 *
 * Frames are held as HTMLImageElements rather than ImageBitmaps on purpose. 120
 * decoded 1280×720 bitmaps would pin ~440MB of RSS; letting the browser own the
 * decode cache keeps that bounded, and sequential access keeps neighbours hot.
 */
export const SequenceCanvas = forwardRef<SequenceHandle, Props>(function SequenceCanvas(
  {
    id,
    label,
    className,
    smoothing = 0.18,
    readyThreshold = 0.35,
    fit = 'cover',
    scale = 1,
    eager = false,
    onReady,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const framesRef = useRef<HTMLImageElement[]>([]);
  const loadedRef = useRef<boolean[]>([]);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const paintedRef = useRef(-1);
  const dprRef = useRef(1);

  /** First frame is on the canvas — safe to fade the canvas up. */
  const [ready, setReady] = useState(false);
  /** Enough frames buffered that scrubbing will look continuous. */
  const [buffered, setBuffered] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  useImperativeHandle(
    ref,
    () => ({
      setProgress: (p: number) => {
        targetRef.current = clamp(p);
      },
    }),
    [],
  );

  /** Nearest already-decoded frame at or before `index`, so scrub never blanks. */
  const resolveFrame = useCallback((index: number) => {
    const loaded = loadedRef.current;
    for (let i = index; i >= 0; i--) if (loaded[i]) return framesRef.current[i];
    for (let i = index + 1; i < FRAME_COUNT; i++) if (loaded[i]) return framesRef.current[i];
    return null;
  }, []);

  const paint = useCallback(
    (index: number, force = false) => {
      if (!force && index === paintedRef.current) return;
      const canvas = canvasRef.current;
      const img = resolveFrame(index);
      if (!canvas || !img) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      // Maintain high quality image smoothing to prevent pixelation on high-DPI displays
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const cw = canvas.width;
      const ch = canvas.height;
      const ratioX = cw / img.naturalWidth;
      const ratioY = ch / img.naturalHeight;

      // Threshold is 5:4 — the same breakpoint the poster underneath uses, so
      // the still and the sequence always agree on framing.
      const contain = fit === 'contain' || (fit === 'adaptive' && cw / ch >= 1.25);
      const base = contain ? Math.min(ratioX, ratioY) : Math.max(ratioX, ratioY);
      // Pulling back only makes sense when containing; under `cover` it would
      // shrink the plate inside its own frame and expose the edges.
      const applied = contain ? scale : 1;
      const dw = img.naturalWidth * base * applied;
      const dh = img.naturalHeight * base * applied;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      paintedRef.current = index;
    },
    [resolveFrame, fit, scale],
  );

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = wrap.getBoundingClientRect();
    if (!width || !height) return;
    const w = Math.round(width * dpr);
    const h = Math.round(height * dpr);
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    dprRef.current = dpr;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }

    paint(paintedRef.current < 0 ? 0 : paintedRef.current, true);
  }, [paint]);

  /* -------------------------------------------------------------- *
   * Load — deferred until the section is within one viewport.
   * -------------------------------------------------------------- */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let cancelled = false;
    let started = false;

    const start = () => {
      if (started) return;
      started = true;

      const width = pickSequenceWidth();
      const frames: HTMLImageElement[] = new Array(FRAME_COUNT);
      const loaded: boolean[] = new Array(FRAME_COUNT).fill(false);
      framesRef.current = frames;
      loadedRef.current = loaded;

      let done = 0;
      let announced = false;
      const threshold = Math.max(1, Math.floor(FRAME_COUNT * readyThreshold));

      const loadOne = (index: number) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = 'async';
          img.src = sequenceFrameUrl(id, width, index);
          frames[index] = img;

          const settle = () => {
            if (cancelled) return resolve();
            loaded[index] = true;
            done += 1;
            setProgressPct(Math.round((done / FRAME_COUNT) * 100));

            // First available frame goes up immediately — no black flash — and
            // the canvas fades in with it rather than waiting on the buffer.
            if (paintedRef.current < 0) {
              paint(index, true);
              setReady(true);
            }

            if (!announced && done >= threshold) {
              announced = true;
              setBuffered(true);
              onReady?.();
            }

            // Warm the decode so the first drawImage isn't a main-thread stall.
            // Deliberately not awaited: browsers defer decoding on hidden pages,
            // so a pending decode() must never gate the canvas becoming visible.
            img.decode?.().catch(() => undefined);

            resolve();
          };

          if (img.complete && img.naturalWidth) settle();
          else {
            img.onload = settle;
            img.onerror = () => resolve();
          }
        });

      // Interleaved keyframe loading:
      // First load keyframes (every 4th frame: 0, 4, 8, ... 116) across the full range
      // so any scrub position immediately finds an adjacent decoded frame without stutter.
      // Next load all intermediate frames to achieve full 60fps fidelity.
      const priorityIndices: number[] = [];
      const STEP = 4;
      for (let i = 0; i < FRAME_COUNT; i += STEP) {
        priorityIndices.push(i);
      }
      for (let i = 0; i < FRAME_COUNT; i++) {
        if (i % STEP !== 0) {
          priorityIndices.push(i);
        }
      }

      let cursor = 0;
      const workers = Array.from({ length: CONCURRENCY }, async () => {
        while (!cancelled && cursor < priorityIndices.length) {
          const idx = priorityIndices[cursor++];
          await loadOne(idx);
        }
      });
      void Promise.all(workers);
    };

    // The overture is on screen at load; waiting for an observer callback would
    // cost it a frame it cannot spare.
    // 250% rootMargin ensures downstream sequences begin preloading before the user scrolls to them.
    const io = eager
      ? null
      : new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              start();
              io?.disconnect();
            }
          },
          { rootMargin: '250% 0px 250% 0px' },
        );

    if (eager) start();
    else io?.observe(wrap);

    return () => {
      cancelled = true;
      io?.disconnect();
      framesRef.current.forEach((img) => {
        if (img) img.src = '';
      });
      framesRef.current = [];
      loadedRef.current = [];
    };
  }, [id, onReady, paint, readyThreshold, eager]);

  /* -------------------------------------------------------------- *
   * Sizing
   * -------------------------------------------------------------- */
  useEffect(() => {
    resize();
    const ro = new ResizeObserver(resize);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [resize]);

  /* -------------------------------------------------------------- *
   * Scrub loop — one ticker callback, shared with Lenis' rAF.
   * -------------------------------------------------------------- */
  useEffect(() => {
    const reduced = prefersReducedMotion();

    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 50) / 1000;
      currentRef.current = reduced
        ? targetRef.current
        : damp(currentRef.current, targetRef.current, smoothing, dt);

      // Snap once we're within half a frame, otherwise the damp tail runs forever.
      if (Math.abs(targetRef.current - currentRef.current) < 0.5 / FRAME_COUNT) {
        currentRef.current = targetRef.current;
      }

      const index = Math.min(FRAME_COUNT - 1, Math.round(currentRef.current * (FRAME_COUNT - 1)));
      paint(index);
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [paint, smoothing]);

  return (
    <div ref={wrapRef} className={cn('relative h-full w-full overflow-hidden bg-ink', className)}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn(
          'h-full w-full transition-opacity duration-500 ease-[var(--ease-luxe)]',
          'contrast-[1.04] saturate-[1.03] brightness-[1.01]',
          ready ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          imageRendering: 'auto',
        }}
      />
      {/* Announce the sequence to assistive tech, which cannot read a canvas. */}
      <span className="sr-only">{label}</span>

      {!buffered && (
        <div
          data-motion-decorative
          className="pointer-events-none absolute inset-x-0 bottom-14 flex justify-center"
        >
          <div className="flex items-center gap-3">
            <span className="h-px w-16 overflow-hidden bg-white/10">
              <span
                className="block h-full bg-gold transition-[width] duration-200 ease-linear"
                style={{ width: `${progressPct}%` }}
              />
            </span>
            <span className="font-sub text-[0.6rem] tracking-[0.3em] text-muted tabular-nums">
              {String(progressPct).padStart(2, '0')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
