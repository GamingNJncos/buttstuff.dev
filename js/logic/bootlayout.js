// Boot screen geometry on an integer canvas-pixel grid (pure: no canvas, no DOM).
// Every line sits on a fixed row grid: row height = glyph height + a fixed leading, so lines can never overlap.
import { wrap } from './text.js?v=68';

export const SW = 427;
export const SH = 240;
export const GLYPH_W = 5;
export const GLYPH_H = 7; // the f5 font is 7 rows tall
export const ADV = 6; // f5 advance per character
export const LEAD = 3;
export const LH = GLYPH_H + LEAD; // 10 px per row

// rainbow outline, then a black gap, then the screen
export const FRAME = { inset: 10, thick: 2, seg: 16 };
export const SCREEN = { x: 14, y: 14, w: SW - 28, h: SH - 28 };
export const PAD = 8;
export const TX = SCREEN.x + PAD;
export const TY = SCREEN.y + PAD;
export const MAX_CHARS = Math.floor((SW - 2 * TX + 1) / ADV);
export const ROWS = Math.floor((SCREEN.y + SCREEN.h - PAD - TY + LEAD) / LH);

// scanlines: darken every SCAN-th canvas row (integer rows only; LH is a multiple of SCAN so every text row sits the same way)
export const SCAN = 2;
// rainbow outline steps one band along the frame every RAINBOW_STEP seconds
export const RAINBOW_STEP = 0.4;
export const RAINBOW_SHIFT = 4;

export const rowY = r => TY + r * LH;
const textW = s => ([...s].length ? [...s].length * ADV - 1 : 0);
const box = (text, row) => ({ text, x: TX, y: rowY(row), w: textW(text), h: GLYPH_H });

// strings: { header, resume, ready, press, block } ; files: the boot file names loaded so far
export function layoutBoot({ files = [], phase = 'load', resume = false, strings }) {
  if (resume) return [box(strings.resume, 0)];
  const out = [box(strings.header, 0)];
  let row = 2;
  for (const f of files) for (const l of wrap(f, MAX_CHARS)) out.push(box(l, row++));
  if (phase === 'ready') {
    out.push(box(strings.ready, ++row));
    out.push({ cursor: true, x: TX, y: rowY(row + 1), w: GLYPH_W, h: GLYPH_H });
  }
  out.push(box(phase === 'ready' ? strings.press : strings.block, ROWS - 1));
  return out;
}

// the mobile crash box sits on the same grid, on the bottom rows of the screen
export function layoutCrash(lines) {
  const wrapped = lines.flatMap(l => wrap(l, MAX_CHARS));
  const first = ROWS - wrapped.length;
  const text = wrapped.map((l, i) => box(l, first + i));
  const y = rowY(first) - 6;
  const rect = { x: SCREEN.x + 2, y, w: SCREEN.w - 4, h: rowY(ROWS - 1) + GLYPH_H + 6 - y };
  return { text, rect };
}

// integer canvas rows to darken inside [y0, y1)
export function scanRows(y0, y1, period = SCAN) {
  const out = [];
  for (let y = y0 + period - 1; y < y1; y += period) out.push(y);
  return out;
}

// which rainbow band index a frame pixel at perimeter distance d shows at time t (t already motion-filtered)
// each step the bands crawl RAINBOW_SHIFT px along the frame, so only a quarter of the outline changes colour per step
export function rainbowBand(d, t, n) {
  const step = Math.floor(t / RAINBOW_STEP);
  return ((Math.floor((d + step * RAINBOW_SHIFT) / FRAME.seg) % n) + n) % n;
}
