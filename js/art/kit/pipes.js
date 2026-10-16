// Pipes: horizontal/vertical runs with flanges, valves, brackets; elbows.
import { C } from '../palette.js?v=68';
import { BAYER4 } from '../dither.js?v=68';
import { pen } from './wall.js?v=68';

// [outline, dark, mid, light, specular]
const PIPE = {
  steel: [C.ink, C.navy2, C.steel0, C.steel1, C.steel2],
  pale: [C.navy, C.steel0, C.steel1, C.steel2, C.steel3],
  rust: [C.void, C.rust0, C.rust1, C.rust2, C.rust3],
  brass: [C.void, C.wood0, C.wood1, C.brass, C.cream],
  mint: [C.ink, C.mint0, C.mint0, C.mint1, C.mint2],
  stone: [C.void, C.stone0, C.stone1, C.stone2, C.stone3],
  red: [C.void, C.rust0, C.red, C.red, C.rust3],
  cream: [C.stone0, C.stone2, C.stone3, C.cream, C.cream2],
};
const ramp = (c) => PIPE[c] ?? PIPE.steel;

// Shade profile across a pipe of thickness t (index into ramp), lit from the top-left.
function profile(t) {
  const out = [];
  for (let k = 0; k < t; k++) {
    if (k === 0 || k === t - 1) out.push(0);
    else if (k === 1) out.push(3);
    else if (k === 2 && t > 5) out.push(4);
    else if (k === t - 2) out.push(1);
    else out.push(2);
  }
  return out;
}

function flangeH(p, x, y, t, R) {
  p.rect(x - 1, y - 2, 4, t + 4, R[0]);
  p.rect(x, y - 1, 2, t + 2, R[3]);
  p.vl(x + 1, y - 1, t + 2, R[1]);
  p.px(x, y - 1, R[4]);
  p.px(x, y + Math.floor(t / 2), R[0]);
}

function flangeV(p, x, y, t, R) {
  p.rect(x - 2, y - 1, t + 4, 4, R[0]);
  p.rect(x - 1, y, t + 2, 2, R[3]);
  p.hl(x - 1, y + 1, t + 2, R[1]);
  p.px(x - 1, y, R[4]);
}

function valveWheel(p, cx, y) {
  // stem
  p.rect(cx - 1, y - 4, 3, 4, C.void); p.vl(cx, y - 4, 4, C.steel1);
  // wheel (rim seen edge-on + spokes)
  p.rect(cx - 4, y - 7, 9, 3, C.void);
  p.hl(cx - 3, y - 6, 7, C.red); p.hl(cx - 3, y - 7, 7, C.rust3); p.hl(cx - 3, y - 5, 7, C.rust0);
  p.px(cx, y - 6, C.cream);
  p.px(cx - 4, y - 6, C.rust1); p.px(cx + 4, y - 6, C.rust0);
}

// pipeRun(ctx, x0, y, x1, { r, color, flanges, valves, brackets, remap })  y = top edge.
export function pipeRun(ctx, x0, y, x1, opts = {}) {
  const { r = 2, color = 'steel', flanges = 32, valves = [], brackets = 0, remap, seed = 0 } = opts;
  const p = pen(ctx, remap);
  const R = ramp(color), t = 2 * r + 1, prof = profile(t);
  const w = x1 - x0;
  prof.forEach((k, j) => p.hl(x0, y + j, w, R[k]));
  // Dithered roll-off between mid and dark + a little grime.
  p.dith(x0, y + t - 3, w, 1, null, R[1], 6);
  p.noise(x0, y + 2, w, t - 3, R[1], 0.06, seed + y);
  if (t > 5) p.dith(x0, y + 2, w, 1, null, R[3], 5);
  if (brackets) {
    for (let bx = x0 + brackets / 2; bx < x1 - 2; bx += brackets) {
      p.rect(bx - 1, y - 4, 4, 4, R[0]); p.vl(bx, y - 4, 4, C.steel0);
      p.rect(bx - 1, y - 1, 4, t + 2, R[0]); p.rect(bx, y - 1, 2, t + 2, C.steel0); p.vl(bx, y - 1, t + 1, C.steel1);
      p.px(bx, y + r, C.steel2);
    }
  }
  if (flanges) for (let fx = x0 + flanges; fx < x1 - 3; fx += flanges) flangeH(p, fx, y, t, R);
  for (const vx of valves) { flangeH(p, vx - 3, y, t, R); flangeH(p, vx + 2, y, t, R); valveWheel(p, vx, y); }
  return { w, h: t };
}

// pipeV(ctx, x, y0, y1, { r, color, flanges, valves, remap })  x = left edge.
export function pipeV(ctx, x, y0, y1, opts = {}) {
  const { r = 2, color = 'steel', flanges = 32, valves = [], remap, seed = 0 } = opts;
  const p = pen(ctx, remap);
  const R = ramp(color), t = 2 * r + 1, prof = profile(t);
  const h = y1 - y0;
  prof.forEach((k, i) => p.vl(x + i, y0, h, R[k]));
  p.dith(x + t - 3, y0, 1, h, null, R[1], 6);
  p.noise(x + 2, y0, t - 3, h, R[1], 0.06, seed + x);
  if (flanges) for (let fy = y0 + flanges; fy < y1 - 3; fy += flanges) flangeV(p, x, fy, t, R);
  for (const vy of valves) {
    flangeV(p, x, vy - 3, t, R); flangeV(p, x, vy + 2, t, R);
    p.rect(x + t, vy - 1, 4, 3, C.void); p.hl(x + t, vy, 4, C.steel1);
    p.rect(x + t + 3, vy - 4, 3, 9, C.void); p.vl(x + t + 4, vy - 3, 7, C.red); p.px(x + t + 4, vy - 3, C.rust3);
  }
  return { w: t, h };
}

// elbow(ctx, x, y, { r, color, dir, bend }) — quarter bend inside an S×S box at (x, y).
// dir names the two open ends: 'ne' joins a pipe going up and one going right, etc.
export function elbow(ctx, x, y, opts = {}) {
  const { r = 2, color = 'steel', dir = 'ne', bend = 2, remap } = opts;
  const p = pen(ctx, remap);
  const R = ramp(color), t = 2 * r + 1;
  const inner = bend, outer = bend + t, S = outer;
  // Arc centre sits at the corner between the two open ends.
  const cx = dir.includes('e') ? S : 0;
  const cy = dir.includes('n') ? 0 : S;
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const dx = i + 0.5 - cx, dy = j + 0.5 - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < inner || d > outer) continue;
    const k = (d - inner) / t; // 0 = inner edge, 1 = outer edge
    // light from top-left: whichever edge faces up-left gets the highlight
    const facesUL = (dx * -1 + dy * -1) > 0;
    const pos = facesUL ? 1 - k : k;
    let c;
    if (k < 0.12 || k > 0.88) c = R[0];
    else if (pos < 0.3) c = R[1];
    else if (pos > 0.72) c = R[3];
    else c = BAYER4[(y + j) & 3][(x + i) & 3] < 4 ? R[1] : R[2];
    p.px(x + i, y + j, c);
  }
  return { w: S, h: S };
}
