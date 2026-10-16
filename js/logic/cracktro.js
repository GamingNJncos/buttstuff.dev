// Konami-code easter egg: pure state machine + the flash-rate guard used to check the cracktro.
// off --(Konami)--> warning --(Enter)--> playing --(any key / click)--> off
//                   warning --(Escape)--> off
import { createSequenceMatcher, KONAMI } from '../engine/input.js?v=68';

export const WATCH_KEYS = ['Enter', 'NumpadEnter'];
export const BACK_KEYS = ['Escape'];

export function createEgg() {
  return { phase: 'off', t: 0, match: createSequenceMatcher(KONAMI) };
}

export const eggActive = egg => egg.phase !== 'off';

// Feed one key press. Returns true when the egg swallowed the key (the game must not see it).
export function eggKey(egg, code) {
  if (egg.phase === 'off') {
    if (!egg.match(code)) return false;
    egg.phase = 'warning';
    egg.t = 0;
    return true;
  }
  if (egg.phase === 'warning') {
    if (WATCH_KEYS.includes(code)) eggWatch(egg);
    else if (BACK_KEYS.includes(code)) eggBack(egg);
    return true;
  }
  eggBack(egg); // playing: any key goes back to the game
  return true;
}

export function eggWatch(egg) {
  if (egg.phase !== 'warning') return;
  egg.phase = 'playing';
  egg.t = 0;
}

export function eggBack(egg) {
  egg.phase = 'off';
  egg.t = 0;
}

// Cracktro clock: under reduced motion the scene holds one still frame.
export const STILL_T = 5.5; // seconds into the loop: neon logo on the grid floor, the scroller's first words on screen
export const cracktroTime = (t, reduced) => (reduced ? STILL_T : t);

// ---- flash-rate guard ----------------------------------------------------------------------
// A "flash" is a pair of opposing swings in relative luminance of at least `delta` (0..1).
const lin = c => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const LUT = Array.from({ length: 256 }, (_, i) => lin(i));
export const relLuma = (r, g, b) => 0.2126 * LUT[r] + 0.7152 * LUT[g] + 0.0722 * LUT[b];

// Mean relative luminance of the whole RGBA frame, then of each tile in a cols x rows grid.
export function frameLumas(rgba, w, h, cols = 4, rows = 3) {
  const sums = new Float64Array(cols * rows + 1);
  const counts = new Float64Array(cols * rows + 1);
  for (let y = 0; y < h; y++) {
    const ty = Math.min(rows - 1, Math.floor(y * rows / h));
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const l = relLuma(rgba[i], rgba[i + 1], rgba[i + 2]);
      const k = 1 + ty * cols + Math.min(cols - 1, Math.floor(x * cols / w));
      sums[0] += l; counts[0]++;
      sums[k] += l; counts[k]++;
    }
  }
  return Array.from(sums, (s, k) => s / counts[k]);
}

// Times at which the luminance series swings by >= delta against its previous direction.
export function swingTimes(samples, delta = 0.1) {
  const out = [];
  if (!samples.length) return out;
  let anchor = samples[0].l, dir = 0, lo = anchor, hi = anchor;
  for (const { t, l } of samples) {
    if (dir === 0) { // no swing yet: measure from the lowest and highest level seen so far
      lo = Math.min(lo, l); hi = Math.max(hi, l);
      if (l - lo >= delta) { dir = 1; anchor = l; out.push(t); }
      else if (hi - l >= delta) { dir = -1; anchor = l; out.push(t); }
      continue;
    }
    if (Math.sign(l - anchor) === dir) { anchor = l; continue; } // same way: the swing keeps going
    if (Math.abs(l - anchor) >= delta) { dir = -dir; anchor = l; out.push(t); }
  }
  return out;
}

// Most flashes (opposing swing pairs) inside any one-second window.
export function maxFlashesPerSecond(samples, delta = 0.1) {
  const sw = swingTimes(samples, delta);
  let most = 0;
  for (let i = 0; i < sw.length; i++) {
    let n = 0;
    while (i + n < sw.length && sw[i + n] < sw[i] + 1) n++;
    most = Math.max(most, Math.floor(n / 2));
  }
  return most;
}

export const MAX_FLASHES_PER_SECOND = 3;
