#!/usr/bin/env node
/**
 * Asset pipeline.
 *
 * Turns the raw 1080p / 10s masters in `Assets/` into web-ready media in `public/media/`:
 *
 *   - Scroll-scrubbed shots become WebP frame sequences (canvas playback). Seeking a
 *     long-GOP H.264 file via `currentTime` is asynchronous and frame-inaccurate, so a
 *     decoded image sequence is the only way to hit a locked 60fps scrub.
 *   - The hero shot stays a real <video> (it plays continuously, never seeks) and is
 *     re-encoded far below the 10 Mb/s master bitrate.
 *   - Stills are emitted at two widths plus a 24px LQIP used as a blur-up placeholder.
 *
 * Requires `ffmpeg` and `cwebp` on PATH. Idempotent: re-running skips finished work
 * unless --force is passed.
 *
 *   node scripts/prepare-assets.mjs [--force]
 */
import { execFile, execFileSync } from 'node:child_process';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { cpus } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_VIDEO = path.join(ROOT, 'Assets/Videos');
const SRC_IMAGE = path.join(ROOT, 'Assets/Images');
const OUT = path.join(ROOT, 'public/media');
const FORCE = process.argv.includes('--force');

/** Frames kept per sequence. 120 of the master's 240 = one frame per ~21px of pinned scroll. */
export const FRAME_COUNT = 120;
const SEQ_WIDTHS = [
  { w: 1280, dir: 'w1280', q: 68 },
  { w: 800, dir: 'w800', q: 66 },
];
/**
 * The still masters are 896×1200. Emitting a "w1800" was inventing resolution:
 * an interpolated 2× that costs bytes, adds no detail, and — because the browser
 * then scales it again at render — compounds the blur rather than avoiding it.
 * Ship native and one honest half-size, and let layout do the rest.
 */
const STILL_WIDTHS = [
  { w: 896, dir: 'w896', q: 82 },
  { w: 448, dir: 'w448', q: 78 },
];

const HERO_MASTER = 'Car_rotating_in_studio_20260912172136.mp4';

const SEQUENCES = [
  // The overture carries the LCP and is the only sequence the eye can rest on a
  // single frame of, so it gets a quality bump the moving shots don't need.
  { id: 'overture', file: HERO_MASTER, quality: [76, 72] },
  { id: 'engineering', file: 'Luxury_car_components_expanding_…_20260912174328.mp4' },
  { id: 'engine', file: 'Engine_components_separating_20260912180206.mp4' },
  { id: 'assembly', file: 'Luxury_car_components_assembling_20260912181401.mp4' },
];

/** Native width of the still masters; nothing is ever emitted larger. */
const SOURCE_STILL_WIDTH = 896;

const STILLS = [
  { id: 'exterior', file: 'Car_on_pedestal_20260912162839.jpeg' },
  { id: 'interior', file: 'White_car_parked_in_studio_20260912163335.jpeg' },
  { id: 'engine', file: 'Engine_bay_with_intricate_compon…_20260912163959.jpeg' },
  { id: 'wheel', file: 'Luxury_car_wheel_centered_20260912165028.jpeg' },
  { id: 'profile', file: 'White_car_side_profile_20260912165758.jpeg' },
];

const LIMIT = Math.max(2, cpus().length - 1);

/** Minimal promise pool so 700+ cwebp spawns don't thrash the machine. */
async function pool(items, worker) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(LIMIT, queue.length) }, async () => {
    while (queue.length) await worker(queue.shift());
  });
  await Promise.all(runners);
}

function requireBinary(bin) {
  try {
    execFileSync('which', [bin], { stdio: 'ignore' });
  } catch {
    console.error(`\n  Missing required binary: ${bin}\n`);
    process.exit(1);
  }
}

const pad = (n) => String(n).padStart(3, '0');

async function buildSequence({ id, file, quality }) {
  const outDirs = SEQ_WIDTHS.map((s) => path.join(OUT, 'seq', id, s.dir));
  const done = outDirs.every((d) => existsSync(d));
  if (done && !FORCE) {
    const n = (await readdir(outDirs[0])).length;
    if (n === FRAME_COUNT) {
      console.log(`  · ${id} — up to date (${n} frames)`);
      return;
    }
  }

  const tmp = path.join(OUT, '.tmp', id);
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  for (const d of outDirs) {
    await rm(d, { recursive: true, force: true });
    await mkdir(d, { recursive: true });
  }

  // Keep every 2nd frame of the 240-frame master and normalise to the largest target width.
  await run('ffmpeg', [
    '-v', 'error',
    '-i', path.join(SRC_VIDEO, file),
    '-vf', `select='not(mod(n\\,2))',scale=${SEQ_WIDTHS[0].w}:-2`,
    '-vsync', '0',
    path.join(tmp, '%03d.png'),
  ]);

  const frames = (await readdir(tmp)).filter((f) => f.endsWith('.png')).sort();
  const jobs = [];
  frames.slice(0, FRAME_COUNT).forEach((f, i) => {
    SEQ_WIDTHS.forEach((size, w) => {
      jobs.push([
        path.join(tmp, f),
        path.join(OUT, 'seq', id, size.dir, `${pad(i)}.webp`),
        quality ? { ...size, q: quality[w] ?? size.q } : size,
      ]);
    });
  });

  await pool(jobs, async ([input, output, size]) => {
    const args = ['-quiet', '-q', String(size.q), '-m', '6', '-sharp_yuv'];
    if (size.w !== SEQ_WIDTHS[0].w) args.push('-resize', String(size.w), '0');
    await run('cwebp', [...args, input, '-o', output]);
  });

  await rm(tmp, { recursive: true, force: true });
  console.log(`  ✓ ${id} — ${FRAME_COUNT} frames × ${SEQ_WIDTHS.length} widths`);
}

/**
 * Frame one of the overture, as a standalone still.
 *
 * The hero rotation is scroll-scrubbed, so it ships as a frame sequence like every
 * other scrubbed shot — there is no hero .mp4 any more. This poster is preloaded
 * from the document head and painted behind the canvas, which gives the section a
 * correct first paint (and an LCP candidate) before a single frame has decoded.
 */
async function buildHeroPoster() {
  const outDir = path.join(OUT, 'video');
  await mkdir(outDir, { recursive: true });
  const poster = path.join(outDir, 'hero-poster.webp');

  if (!existsSync(poster) || FORCE) {
    const tmp = path.join(OUT, '.tmp-poster.png');
    await run('ffmpeg', [
      '-v', 'error', '-y',
      '-i', path.join(SRC_VIDEO, HERO_MASTER),
      '-frames:v', '1',
      '-vf', 'scale=1280:-2',
      tmp,
    ]);
    await run('cwebp', ['-quiet', '-q', '76', '-m', '6', '-sharp_yuv', tmp, '-o', poster]);
    await rm(tmp, { force: true });
  }

  // Left over from when the hero was a looping <video>; nothing references it now.
  await rm(path.join(outDir, 'hero.mp4'), { force: true });
  console.log('  ✓ hero poster');
}

async function buildStills() {
  for (const size of STILL_WIDTHS) await mkdir(path.join(OUT, 'img', size.dir), { recursive: true });
  await mkdir(path.join(OUT, 'img', 'lqip'), { recursive: true });

  const jobs = [];
  for (const still of STILLS) {
    const input = path.join(SRC_IMAGE, still.file);
    for (const size of STILL_WIDTHS) {
      jobs.push({ input, output: path.join(OUT, 'img', size.dir, `${still.id}.webp`), size });
    }
    jobs.push({ input, output: path.join(OUT, 'img', 'lqip', `${still.id}.webp`), size: { w: 24, q: 40 } });
  }

  await pool(jobs, async ({ input, output, size }) => {
    if (existsSync(output) && !FORCE) return;
    const args = ['-quiet', '-q', String(size.q), '-m', '6', '-sharp_yuv'];
    // Never resize up to the target: `-resize` would happily interpolate past
    // the source. Only downscale.
    if (size.w < SOURCE_STILL_WIDTH) args.push('-resize', String(size.w), '0');
    await run('cwebp', [...args, input, '-o', output]);
  });
  console.log(`  ✓ ${STILLS.length} stills × ${STILL_WIDTHS.length} widths + LQIP`);
}

/** Inline base64 LQIPs so the blur-up placeholder costs zero requests. */
async function writeLqipManifest() {
  const { readFile } = await import('node:fs/promises');
  const entries = {};
  for (const still of STILLS) {
    const buf = await readFile(path.join(OUT, 'img', 'lqip', `${still.id}.webp`));
    entries[still.id] = `data:image/webp;base64,${buf.toString('base64')}`;
  }
  const body = `// Generated by scripts/prepare-assets.mjs — do not edit by hand.
export const LQIP: Record<string, string> = ${JSON.stringify(entries, null, 2)};
`;
  await writeFile(path.join(ROOT, 'src/data/lqip.ts'), body, 'utf8');
  await rm(path.join(OUT, 'img', 'lqip'), { recursive: true, force: true });
  console.log('  ✓ src/data/lqip.ts');
}

async function main() {
  requireBinary('ffmpeg');
  requireBinary('cwebp');
  await mkdir(path.join(ROOT, 'src/data'), { recursive: true });

  console.log('\n  Preparing media…\n');
  await buildHeroPoster();
  await buildStills();
  await writeLqipManifest();
  for (const seq of SEQUENCES) await buildSequence(seq);
  await rm(path.join(OUT, '.tmp'), { recursive: true, force: true });
  console.log('\n  Done.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
