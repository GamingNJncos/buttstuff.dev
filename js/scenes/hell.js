// Hell: the YES / YES ending. The lift breaks through the level 05 sump into a burning cavern.
// Logic (createHell / updateHell) is DOM-free; the art below bakes static layers once and only
// animates flames (lava band), embers, a slow lava glow and a 1 px heat-haze on one background band.
import { W, H } from '../engine/screen.js?v=68';
import { PAL, C } from '../art/palette.js?v=68';
import { BAYER4 } from '../art/dither.js?v=68';
import { drawText, textWidth } from '../engine/font.js?v=68';
import { COPY } from '../logic/copy.js?v=68';
import { WW, FH, ROOM_H, SHAFT_X, SHAFT_W, floorTop } from '../world/levels.js?v=68';
import { hash } from '../engine/hash.js?v=68';
import { pen } from '../art/kit/wall.js?v=68';
import { girder } from '../art/kit/slab.js?v=68';
import { drawShaft } from '../art/kit/lift.js?v=68';

// Hell camera: fixed framing that holds the car and the whole gate (ride below level 05 + the sequence).
export const HELL_CAM_X = 330;
const CAM_DY = 22;

const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

// Screen rects splatter may never cover: the carved inscription (frieze) and the restart prompt.
export function hellProtected() {
  const rw = textWidth(COPY.restart);
  return [
    { x: 591 - HELL_CAM_X - 2, y: 10 + CAM_DY - 2, w: 154 + 4, h: 29 + 4 },
    { x: ((W - rw) >> 1) - 7, y: H - 26, w: rw + 14, h: 19 },
  ];
}

const SLIDE = 4; // a splat sags at most this far down the glass
const half = s => Math.ceil(s.r * 1.5 * 1.25) + 10;
// Everything a splat paints: blob + satellites (incl. its slide), and the drip/bits column below it.
export function splatExtent(s) {
  const hw = half(s), y0 = s.y0 ?? s.y;
  const blob = { x: s.x - hw, y: y0 - hw, w: 2 * hw, h: 2 * hw + SLIDE + 1 };
  const bottom = Math.max(s.y + Math.round(s.r * 1.5 * 0.6) + s.drip + 4, s.y + s.drip * 0.6 + 11);
  const drip = { x: s.x - hw, y: s.y, w: 2 * hw, h: Math.ceil(bottom - s.y) + 1 };
  return { blob, drip };
}

function placeSplat(s, rand, prot) {
  const free = () => !prot.some(r => overlap(splatExtent(s).blob, r));
  for (let k = 0; k < 12 && !free(); k++) { s.x = Math.floor(rand() * W); s.y = Math.floor(rand() * H * 0.7); s.y0 = s.y; }
  for (let y = 0; y < H * 0.7 && !free(); y += 4) { s.y = y; s.y0 = y; } // deterministic fallback down the same column
  // drips stop above the first protected rect underneath
  const hw = half(s);
  s.limit = Math.min(H + 40, ...prot.filter(r => r.x < s.x + hw && s.x - hw < r.x + r.w && r.y > s.y).map(r => r.y));
}

export function createHell() {
  return { kind: 'hell', t: 0, phase: 'walk', gibs: [], splats: [], done: false, bx: 0, by: 0 };
}

// Arriving in hell: the player always faces (and walks) east into the cavern, whichever way they faced in the car.
export function enterHell(p) {
  p.facing = 1;
  return createHell();
}

export function updateHell(h, dt, p, rand = Math.random) {
  h.t += dt;
  if (h.phase === 'walk') {
    p.x += 22 * dt * (p.facing || 1);
    p.walking = true;
    p.t += dt;
    if (h.t > 1.8) {
      h.phase = 'boom';
      h.t = 0;
      p.alive = false;
      p.walking = false;
      h.bx = Math.round(p.x); h.by = Math.round(p.y - 10);
      const cols = [C.red, C.rust0, C.skin, C.ink];
      for (let i = 0; i < 48; i++) {
        h.gibs.push({ x: p.x, y: p.y - 10, vx: (rand() * 2 - 1) * 90, vy: -rand() * 140 - 20, c: cols[i % 4], s: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1 });
      }
      const prot = hellProtected();
      for (let i = 0; i < 14; i++) {
        const s = { x: Math.floor(rand() * W), y: Math.floor(rand() * H * 0.7), r: 3 + Math.floor(rand() * 6),
          drip: 0, speed: 4 + rand() * 10, c: i % 3 ? C.red : C.rust0, bits: Math.floor(rand() * 3), k: i };
        s.y0 = s.y;
        placeSplat(s, rand, prot);
        h.splats.push(s);
      }
    }
    return;
  }
  for (const g of h.gibs) {
    g.vy += 300 * dt;
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    if (g.y > p.y) { g.y = p.y; g.vx *= 0.7; g.vy = 0; g.rest = true; }
  }
  for (const s of h.splats) {
    s.y = Math.min((s.y0 ?? s.y) + SLIDE, s.y + s.speed * 0.15 * dt);
    const lim = (s.limit ?? H + 40) - 2;
    const top = s.y + Math.round(s.r * 1.5 * 0.6);
    const cap = Math.max(0, Math.min(lim - top - 4, (lim - s.y - 11) / 0.6));
    s.drip = Math.min(H, cap, s.drip + s.speed * dt);
  }
  if (h.t > 2.5) h.done = true;
}

// ---------------------------------------------------------------- art
const OY = 24;                 // mid layer starts 24 px above the floor top (torn slab underside)
const GL = ROOM_H - 6;         // ground line (local y)
const LV = GL + 12;            // lava surface
const BH = FH + 64;            // baked height below the floor top (past the camera's bottom edge)
const HZ0 = 64, HZ1 = 101;     // heat-haze band (background only)
const GATE = { l0: 600, l1: 618, r0: 718, r1: 736, cx: 668, spr: 96, ar: 52, ring: 7 };
const CAR_ZONE = [458, 550];
// scorched recolour for facility kit pieces: steel/navy -> rust and soot, phosphor -> dead
const SCORCH = [...Array(32).keys()].map(i => ({ 2: 28, 3: 16, 4: 12, 5: 13, 6: 27, 7: 14, 19: 1, 20: 0, 21: 12 }[i] ?? i));

let ART = null;

function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').imageSmoothingEnabled = false;
  return c;
}

// height field of pointed spires: x -> height
function spires(seed, n, w0, w1, h0, h1, skip = null) {
  const s = [];
  for (let i = 0; i < n; i++) {
    const x = hash(seed * 977 + i * 13) * WW;
    if (skip && x > skip[0] && x < skip[1]) continue;
    s.push({ x, w: w0 + hash(seed * 31 + i * 7) * (w1 - w0), h: h0 + hash(seed * 17 + i * 29) * (h1 - h0) });
  }
  return x => {
    let m = 0;
    for (const q of s) { const d = Math.abs(x - q.x) / q.w; if (d < 1) m = Math.max(m, q.h * (1 - d) ** 1.3); }
    return m;
  };
}

function bakeSky(p) {
  // layered smoke rolls, hard-edged: each band's top is a row of rounded billows with a lit rim
  // [colour, base y, billow width, billow height, rim]
  const B = [[C.void, -99, 1, 0, C.void], [C.hairDark, 12, 30, 6, C.rust0], [C.rust0, 26, 40, 8, C.rust1], [C.rust1, 42, 34, 9, C.rust2],
    [C.red, 58, 46, 10, C.rust2], [C.rust2, 76, 30, 7, C.rust3], [C.amber, 90, 22, 3, C.yellow], [C.yellow, 96, 12, 1, C.yellow], [C.red, 99, 1, 0, C.red]];
  const edge = (k, x) => {
    const [, base, bw, bh] = B[k];
    if (!bh) return base;
    const off = Math.floor(hash(k * 131) * bw), i = Math.floor((x + off) / bw), u = ((x + off) % bw) / bw;
    const hh = bh * (0.45 + 0.55 * hash(k * 977 + i * 31));
    return base - Math.round(hh * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)));
  };
  for (let x = 0; x < WW; x++) {
    const e = B.map((b, k) => edge(k, x));
    for (let y = 0; y < BH; y++) {
      let k = 0;
      for (let q = 1; q < B.length; q++) if (y >= e[q]) k = q;
      let c = B[k][0];
      if (k > 0 && y === e[k]) c = B[k][4];                                     // lit rim
      else if (k > 0 && y === e[k] + 1 && B[k][3] > 3 && ((x + B[k][1]) % B[k][2]) < B[k][2] * 0.45) c = B[k][4]; // cel highlight, left of each billow
      else if (k < B.length - 1 && y === e[k + 1] - 1 && B[k + 1][3] > 3) c = k > 1 ? B[k - 1][0] : C.void;    // shadow under the next roll
      p.px(x, y, c);
    }
  }
  // farthest spires, hazy
  const far = spires(3, 56, 5, 16, 6, 30);
  for (let x = 0; x < WW; x++) {
    const hgt = Math.round(far(x) + p.rnd(x >> 1, 7, 41) * 2);
    if (hgt < 1) continue;
    p.vl(x, 99 - hgt, hgt, C.rust1);
    p.px(x, 99 - hgt, C.red);
  }
  // nearer ruins: broken stacks, a gantry, spires (the facility's foundations, burning)
  const near = spires(5, 30, 6, 20, 4, 20);
  for (let x = 0; x < WW; x++) {
    const hgt = Math.round(near(x) + p.rnd(x, 8, 41) * 1.5);
    if (hgt < 1) continue;
    p.vl(x, 101 - hgt, hgt, C.hairDark);
    p.px(x, 101 - hgt, C.rust1);
  }
  for (let i = 0; i < 9; i++) {
    const sx = 30 + i * 104 + Math.floor(p.rnd(i, 3, 42) * 50), sw = 4 + Math.floor(p.rnd(i, 4, 42) * 4), sh = 16 + Math.floor(p.rnd(i, 5, 42) * 18);
    for (let k = 0; k < sw; k++) {
      const top = 100 - sh + Math.floor(p.rnd(i, k, 43) * 4);
      p.vl(sx + k, top, 100 - top, C.hairDark);
      p.px(sx + k, top, C.rust1);
    }
    p.hl(sx - 1, 100 - sh + 6, sw + 2, C.hairDark); // band ring
    if (i % 3 === 1) { // gantry to the next stack
      const gx1 = sx + 40;
      p.hl(sx + sw, 100 - sh + 9, gx1 - sx - sw, C.hairDark); p.hl(sx + sw, 100 - sh + 13, gx1 - sx - sw, C.hairDark);
      for (let gx = sx + sw; gx < gx1; gx += 4) p.line(gx, 100 - sh + 9, gx + 4, 100 - sh + 13, C.hairDark);
      p.vl(gx1, 100 - sh + 9, sh - 9, C.hairDark);
    }
  }
  // the far lava sea under the horizon
  p.dith(0, 101, WW, BH - 101, C.red, C.rust2, 5);
}

function stalactites(p) {
  for (let i = 0; i < 64; i++) {
    const sx = Math.floor(p.rnd(i, 1, 60) * WW);
    if (sx > SHAFT_X - 4 && sx < SHAFT_X + SHAFT_W + 4) continue;
    const overGate = sx > GATE.l0 - 10 && sx < GATE.r1 + 10;
    let len = 6 + Math.floor(p.rnd(i, 2, 60) ** 1.7 * 44);
    if (overGate) len = Math.min(len, 10);
    const w = 3 + Math.floor(p.rnd(i, 3, 60) * 7);
    for (let j = 0; j < len; j++) {
      const ww = Math.max(1, Math.round(w * (1 - j / len) ** 0.85));
      const x0 = sx - (ww >> 1) + Math.round(Math.sin(j * 0.25 + i) * 0.7);
      p.hl(x0, j, ww, C.hairDark);
      p.px(x0, j, C.stone0);
      if (ww > 3) p.px(x0 + 1, j, (j + i) % 3 ? C.stone0 : C.hairDark);
      p.px(x0 + ww - 1, j, j > len * 0.55 ? C.rust0 : C.void);
      if (j > len * 0.7) p.px(x0 + (ww >> 1), j, C.rust0);
    }
    p.px(sx, len, C.rust1);
    if (i % 5 === 0) p.px(sx, len + 3 + (i % 4), C.amber); // a falling drop of something hot
  }
}

function chain(p, x, y0, len, hook) {
  for (let y = y0, k = 0; y < y0 + len; y += 4, k++) {
    if (k % 2 === 0) { // link face-on: 4x5 ring
      p.hl(x - 1, y, 3, C.void); p.vl(x - 2, y + 1, 3, C.void); p.vl(x + 2, y + 1, 3, C.void); p.hl(x - 1, y + 4, 3, C.void);
      p.vl(x - 1, y + 1, 3, C.stone1); p.vl(x + 1, y + 1, 3, C.rust0); p.px(x - 1, y + 1, C.stone2); p.px(x, y + 4, C.rust1);
    } else { p.vl(x, y, 5, C.void); p.vl(x - 1, y + 1, 3, C.stone0); p.px(x - 1, y + 3, C.rust1); }
  }
  if (hook) {
    const y = y0 + len;
    p.vl(x, y, 5, C.void); p.vl(x - 1, y, 5, C.stone2); p.hl(x - 1, y + 5, 4, C.stone1); p.px(x + 2, y + 4, C.stone1); p.px(x + 2, y + 3, C.rust1); p.hl(x - 1, y + 6, 4, C.void);
  }
}

function sagChain(p, x0, y0, x1, y1, sag) {
  const n = Math.abs(x1 - x0);
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = x0 + Math.sign(x1 - x0) * i, y = Math.round(y0 + (y1 - y0) * u + sag * 4 * u * (1 - u));
    p.px(x, y, i % 3 === 0 ? C.void : i % 3 === 1 ? C.stone1 : C.rust0);
    if (i % 3 === 1) p.px(x, y + 1, C.rust1);
  }
}

function wire(p, x0, x1, y, sag, c) {
  for (let x = x0; x <= x1; x++) {
    const u = (x - x0) / (x1 - x0);
    p.px(x, Math.round(y + sag * 4 * u * (1 - u)), c);
  }
}

function rocks(p, f, base, fill, mot, rim, glow, seed) {
  for (let x = 0; x < WW; x++) {
    const hgt = Math.round(f(x) + (f(x) > 2 ? p.rnd(x >> 1, seed, 44) * 3 : 0));
    if (hgt < 1) continue;
    const y = base - hgt;
    p.vl(x, y, hgt, fill);
    p.dith(x, y, 1, hgt, null, mot, 5 + Math.floor(p.rnd(x >> 2, seed + 1, 44) * 6));
    p.dithV(x, base - Math.min(hgt, 16), 1, Math.min(hgt, 16), glow, 0, 9);
    p.px(x, y, rim);
    const hl = f(x - 1), hr = f(x + 1);
    if (hr < f(x) - 0.3) p.px(x, y + 1, rim); // sloping right edge catches the glow
    if (hl < f(x) - 0.6) p.px(x, y, C.void);
  }
}

// copy columns of a sprite with a per-column y offset (bent / sagging things)
function columns(ctx, spr, x, y, off) {
  for (let i = 0; i < spr.width; i++) ctx.drawImage(spr, i, 0, 1, spr.height, x + i, y + off(i), 1, spr.height);
}
// copy rows with a per-row x offset (leaning things)
function rows(ctx, spr, x, y, off) {
  for (let j = 0; j < spr.height; j++) ctx.drawImage(spr, 0, j, spr.width, 1, x + off(j), y + j, spr.width, 1);
}

function bentGirder(ctx, x, y, segs) {
  const w = segs.reduce((a, s) => a + s.w, 0);
  const g = mk(w, 10);
  girder(g.getContext('2d'), 0, 0, w, { h: 10, remap: SCORCH });
  const q = pen(g.getContext('2d'));
  q.mottle(0, 0, w, 10, C.void, 6, 10, 7);
  const offs = [];
  let acc = 0;
  for (const s of segs) for (let i = 0; i < s.w; i++) { offs.push(Math.round(acc)); acc += s.s; }
  columns(ctx, g, x, y, i => offs[i]);
  return offs;
}

function burntRack(w, h) {
  const c = mk(w, h), cx = c.getContext('2d'), p = pen(cx);
  p.rect(0, 0, w, h, C.void);
  p.rect(1, 1, w - 2, h - 2, C.stone0);
  p.hl(1, 1, w - 2, C.stone1); p.vl(1, 1, h - 2, C.stone1); p.vl(w - 3, 1, h - 2, C.hairDark); p.vl(w - 2, 1, h - 2, C.void);
  // perforated door, hanging open a little at the top
  p.rect(3, 4, w - 8, 20, C.hairDark);
  for (let y = 5; y < 23; y += 2) for (let x = 4 + (y & 2 ? 1 : 0); x < w - 6; x += 2) p.px(x, y, C.void);
  p.vl(w - 6, 6, 6, C.stone1); p.px(w - 6, 12, C.void); // handle
  // units below: blank faceplates, one gone, one still smouldering
  for (let y = 27, k = 0; y < h - 6; y += 6, k++) {
    if (k === 2) { p.rect(3, y, w - 8, 5, C.void); p.px(6, y + 2, C.rust2); p.px(7, y + 3, C.amber); continue; }
    p.rect(3, y, w - 8, 5, k % 2 ? C.wood0 : C.hairDark);
    p.hl(3, y, w - 8, C.stone1); p.hl(3, y + 4, w - 8, C.void);
    p.px(5, y + 2, C.rust0); p.px(7, y + 2, C.void); p.px(9, y + 2, C.void);
  }
  p.dithV(1, 1, w - 2, 22, C.void, 9, 0);
  p.mottle(1, 1, w - 2, h - 2, C.void, 5, 7, 6);
  // melted top edge
  for (let i = 0; i < w; i++) { const d = Math.floor(p.rnd(i >> 1, 3, 9) * 3) + Math.round(4 * Math.sin((Math.PI * i) / w)); cx.clearRect(i, 0, 1, d); p.px(i, d, C.rust0); p.px(i, d + 1, C.hairDark); }
  for (const i of [5, 12, 18]) if (i < w - 3) { const len = 4 + (i % 5); p.vl(i, h - 14, len, C.ink); p.px(i, h - 14 + len, C.rust0); }
  return c;
}

function meltedCrt() {
  const w = 28, h = 24, c = mk(w, h), p = pen(c.getContext('2d'));
  p.rect(0, 0, w, h - 4, C.void);
  p.rect(1, 1, w - 2, h - 6, C.stone2);
  p.mottle(1, 1, w - 2, h - 6, C.stone1, 5, 12, 11);
  p.dithV(1, 1, w - 2, h - 6, C.hairDark, 9, 2);
  p.hl(1, 1, w - 2, C.stone3); p.vl(1, 1, h - 6, C.stone3);
  // bezel + dead glass, bulged
  p.rect(3, 3, w - 9, h - 10, C.stone0);
  p.rect(4, 4, w - 11, h - 12, C.void);
  p.rect(5, 5, w - 13, h - 14, C.ink);
  p.px(6, 5, C.rust2); p.px(7, 5, C.rust1); p.px(6, 6, C.rust1); p.px(5, 6, C.rust0);
  p.hl(6, h - 10, w - 15, C.rust0);
  // side vents + knob
  for (let y = 5; y < h - 9; y += 2) p.hl(w - 5, y, 3, C.stone0);
  p.px(w - 4, h - 8, C.rust1);
  // foot
  p.rect(8, h - 4, 12, 4, C.void); p.rect(9, h - 4, 10, 3, C.stone1); p.hl(9, h - 4, 10, C.stone2);
  return c;
}

function hazardChunk(p, x, y, w, slope) {
  for (let i = 0; i < w; i++) {
    const yy = y + Math.round(i * slope);
    p.vl(x + i, yy, 8, C.stone1);
    p.px(x + i, yy + 7, C.stone0);
    for (let j = 0; j < 2; j++) p.px(x + i, yy + j, ((x + i + j) % 6) < 3 ? C.yellow : C.ink);
    if (p.rnd(x + i, 2, 7) < 0.3) p.px(x + i, yy + 3 + Math.floor(p.rnd(x + i, 3, 7) * 3), C.stone0);
  }
  p.vl(x, y, 8, C.void); p.vl(x + w - 1, y + Math.round((w - 1) * slope), 8, C.void);
  p.line(x + w - 1, y + Math.round((w - 1) * slope) + 2, x + w + 4, y + Math.round((w - 1) * slope) - 3, C.rust1); // rebar
}

function concreteChunk(p, x, y, w, h, seed) {
  p.rect(x, y, w, h, C.void);
  p.rect(x + 1, y + 1, w - 2, h - 1, C.stone1);
  p.noise(x + 1, y + 1, w - 2, h - 1, C.stone0, 0.25, seed);
  p.hl(x + 1, y + 1, w - 2, C.stone2);
  p.dith(x + 1, y + h - 3, w - 2, 3, null, C.rust0, 8);
  for (let i = 0; i < w; i += 3) if (p.rnd(x + i, seed, 5) < 0.4) p.px(x + i, y, C.void);
}

function hardHat(p, x, y) {
  p.hl(x + 1, y, 4, C.yellow); p.hl(x, y + 1, 6, C.yellow); p.hl(x - 1, y + 2, 8, C.amber); p.px(x + 1, y, C.cream);
  p.px(x + 4, y + 1, C.hairDark); p.px(x + 2, y + 1, C.rust0);
}

function pipe(p, x0, y0, segs) {
  let x = x0, y = y0;
  for (const s of segs) for (let i = 0; i < s.w; i++, x++) {
    const yy = Math.round(y);
    p.px(x, yy, C.void); p.px(x, yy + 1, C.rust2); p.px(x, yy + 2, C.rust1); p.px(x, yy + 3, C.rust0); p.px(x, yy + 4, C.hairDark); p.px(x, yy + 5, C.void);
    if ((x - x0) % 22 === 0) { p.vl(x, yy - 1, 8, C.hairDark); p.px(x, yy, C.rust1); }
    y += s.s;
  }
  // torn end
  p.vl(x, Math.round(y), 6, C.void); p.px(x, Math.round(y) + 2, C.rust3);
}

function gate(p, ctx) {
  const { l0, l1, r0, r1, cx, spr, ar, ring } = GATE;
  const c1 = l1 + ar, c2 = r0 - ar;
  const d1 = (x, y) => Math.hypot(x - c1, y - spr), d2 = (x, y) => Math.hypot(x - c2, y - spr);
  const open = (x, y) => x >= l1 && x < r0 && y <= GL && (y >= spr || (d1(x, y) <= ar && d2(x, y) <= ar));
  const inRing = (x, y) => !open(x, y) && y < spr && d1(x, y) <= ar + ring && d2(x, y) <= ar + ring;
  const top = 38;
  // walls: pillars + spandrels of dressed stone; arch ring of voussoirs
  for (let y = top; y < GL; y++) for (let x = l0; x < r1; x++) {
    if (open(x, y)) continue;
    if (inRing(x, y)) {
      const a = Math.atan2(y - spr, x - cx), b = Math.atan2(y - spr, x + 1 - cx);
      const joint = Math.floor(a / 0.15) !== Math.floor(b / 0.15) || Math.floor(Math.atan2(y + 1 - spr, x - cx) / 0.15) !== Math.floor(a / 0.15);
      let c = joint ? C.hairDark : C.stone2;
      if (!joint && BAYER4[y & 3][x & 3] < 5) c = C.stone1;
      if (!inRing(x, y - 1) && !open(x, y - 1)) c = joint ? c : C.stone1; // outer edge
      if (open(x, y + 1) || open(x + 1, y) || open(x - 1, y)) c = C.void;            // cut into the opening
      else if (open(x, y + 2) || open(x + 2, y) || open(x - 2, y)) c = C.rust1;      // lit lip
      p.px(x, y, c);
      continue;
    }
    const course = Math.floor((y - top) / 7), bx = Math.floor((x - l0 + (course % 2) * 6) / 12);
    const mortar = (y - top) % 7 === 0 || (x - l0 + (course % 2) * 6) % 12 === 0;
    let c = C.stone1;
    const tone = p.rnd(bx, course, 77);
    if (mortar) c = C.hairDark;
    else if (tone < 0.3) c = BAYER4[y & 3][x & 3] < 8 ? C.stone0 : C.stone1;
    else if (tone > 0.85) c = BAYER4[y & 3][x & 3] < 6 ? C.stone2 : C.stone1;
    if (!mortar && (y - top) % 7 === 6) c = C.rust0; // underside of each block lit from below
    p.px(x, y, c);
  }
  // pillar edges + jamb shadow
  p.vl(l0, top, GL - top, C.void); p.vl(r1 - 1, top, GL - top, C.void);
  p.vl(l0 + 1, top, GL - top, C.stone2); p.vl(r1 - 2, top, GL - top, C.stone0);
  p.vl(l1 - 1, spr, GL - spr, C.rust1); p.vl(r0, spr, GL - spr, C.rust1);
  p.vl(l1 - 2, spr, GL - spr, C.rust0); p.vl(r0 + 1, spr, GL - spr, C.rust0);
  // soot at the top, fire light at the bottom
  p.dithV(l0, top, r1 - l0, 18, C.void, 7, 0);
  p.dithV(l0, GL - 30, l1 - l0, 30, C.rust0, 0, 8); p.dithV(r0, GL - 30, r1 - r0, 30, C.rust0, 0, 8);
  // plinths
  for (const x of [l0 - 3, r0 - 2]) {
    p.rect(x, GL - 11, 24, 11, C.void); p.rect(x + 1, GL - 10, 22, 10, C.stone1);
    p.hl(x + 1, GL - 10, 22, C.stone3); p.hl(x + 1, GL - 9, 22, C.stone2); p.hl(x + 1, GL - 5, 22, C.hairDark);
    p.dith(x + 1, GL - 4, 22, 4, null, C.rust1, 6);
  }
  // the opening: a dark throat with stairs going down to a far glowing door
  for (let y = 40; y < GL; y++) for (let x = l1; x < r0; x++) {
    if (!open(x, y)) continue;
    let c = C.void;
    const lv = y < 70 ? 0 : Math.round(((y - 70) / (GL - 70)) * 11);
    if (BAYER4[y & 3][x & 3] < lv) c = C.rust0;
    if (y > 104 && BAYER4[(y + 1) & 3][(x + 2) & 3] < Math.round(((y - 104) / (GL - 104)) * 6)) c = C.red;
    p.px(x, y, c);
  }
  // far door
  for (let y = 78; y < GL - 9; y++) {
    const hw = y < 94 ? Math.max(1, Math.round(7 * Math.sqrt((y - 78) / 16))) : 7;
    for (let x = cx - hw; x < cx + hw; x++) {
      const lv = Math.round(((y - 78) / (GL - 87)) * 12);
      p.px(x, y, BAYER4[y & 3][x & 3] < lv ? C.amber : BAYER4[y & 3][x & 3] < lv + 6 ? C.red : C.rust0);
    }
  }
  p.vl(cx - 8, 92, GL - 101, C.void); p.vl(cx + 7, 92, GL - 101, C.void);
  p.dith(cx - 6, GL - 13, 12, 3, null, C.yellow, 5);
  // stairs down (lit nosings)
  [[GL - 1, 92], [GL - 4, 76], [GL - 7, 58], [GL - 9, 40]].forEach(([y, w], i) => {
    p.rect(cx - (w >> 1), y, w, i ? 3 : 1, C.hairDark);
    p.hl(cx - (w >> 1), y, w, i < 2 ? C.rust2 : C.rust1);
  });
  // portcullis, half raised: bars with spikes
  for (let x = l1 + 4; x < r0 - 3; x += 7) {
    for (let y = 40; y < 74; y++) if (open(x, y) && open(x + 1, y)) { p.px(x, y, C.rust0); p.px(x + 1, y, C.void); }
    if (open(x, 74)) { p.px(x, 74, C.rust0); p.px(x + 1, 74, C.void); p.px(x, 75, C.rust1); p.px(x, 76, C.rust1); }
  }
  for (const y of [56, 66]) for (let x = l1; x < r0; x++) if (open(x, y)) { p.px(x, y, C.void); if (open(x, y - 1)) p.px(x, y - 1, C.rust0); }
  // keystone with a horned skull
  p.rect(cx - 6, 36, 13, 13, C.void); p.rect(cx - 5, 37, 11, 11, C.stone2); p.hl(cx - 5, 37, 11, C.stone3); p.dith(cx - 5, 44, 11, 4, null, C.rust1, 6);
  const sk = ['.ccccc.', 'ccccccc', 'cv.c.vc', 'cvvcvvc', 'cccvccc', '.c.c.c.', '.ccccc.'];
  sk.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') p.px(cx - 3 + i, 39 + j, ch === 'c' ? C.cream : C.void); }));
  p.px(cx - 2, 41, C.rust2); p.px(cx + 2, 41, C.rust2);
  for (const s of [-1, 1]) { p.px(cx + s * 4, 38, C.cream); p.px(cx + s * 5, 37, C.stone3); p.px(cx + s * 5, 36, C.stone3); p.px(cx + s * 4, 35, C.stone3); }
  // frieze with the carved inscription
  const fx0 = l0 - 7, fx1 = r1 + 7, fy0 = 14, fy1 = 38;
  p.rect(fx0, fy0, fx1 - fx0, fy1 - fy0, C.void);
  p.rect(fx0 + 1, fy0 + 1, fx1 - fx0 - 2, fy1 - fy0 - 2, C.stone1);
  p.mottle(fx0 + 1, fy0 + 1, fx1 - fx0 - 2, fy1 - fy0 - 2, C.stone0, 7, 8, 21);
  p.noise(fx0 + 1, fy0 + 1, fx1 - fx0 - 2, fy1 - fy0 - 2, C.stone2, 0.04, 22);
  p.hl(fx0 + 1, fy0 + 1, fx1 - fx0 - 2, C.stone2); p.hl(fx0 + 1, fy1 - 2, fx1 - fx0 - 2, C.rust1); p.hl(fx0 + 1, fy1 - 3, fx1 - fx0 - 2, C.rust0);
  p.rect(fx0 + 3, fy0 + 3, fx1 - fx0 - 6, 1, C.stone0); p.rect(fx0 + 3, fy1 - 5, fx1 - fx0 - 6, 1, C.stone0); // incised border
  COPY.hellGate.forEach((line, i) => {
    const x = cx - (textWidth(line) >> 1), y = fy0 + 5 + i * 9;
    p.text(line, x + 1, y + 1, C.stone2);
    p.text(line, x, y, C.void);
  });
  // cornice + spikes
  p.rect(fx0 - 2, fy0 - 4, fx1 - fx0 + 4, 4, C.void); p.rect(fx0 - 1, fy0 - 3, fx1 - fx0 + 2, 2, C.stone2); p.hl(fx0 - 1, fy0 - 3, fx1 - fx0 + 2, C.stone3);
  for (let x = fx0 + 2; x < fx1 - 2; x += 10) {
    const hh = x % 20 === (fx0 + 2) % 20 ? 9 : 5;
    for (let j = 0; j < hh; j++) { p.px(x, fy0 - 5 - j, C.void); if (j < hh - 2) p.px(x + 1, fy0 - 5 - j, C.rust0); }
  }
  // pinnacles
  for (const x of [fx0 - 1, fx1 - 6]) for (let j = 0; j < 14; j++) {
    const w = Math.max(1, 6 - Math.floor(j / 2.5));
    p.hl(x + ((6 - w) >> 1), fy0 - 4 - j, w, C.stone1); p.px(x + ((6 - w) >> 1), fy0 - 4 - j, C.stone2); p.px(x + ((6 - w) >> 1) + w - 1, fy0 - 4 - j, C.void);
  }
  // a chunk knocked off the right pillar, and a crack through the frieze corner
  p.rect(r1 - 5, 74, 5, 6, C.void); p.px(r1 - 5, 79, C.rust0); p.hl(r1 - 4, 74, 4, C.stone0);
  void ctx;
}

function ledge(p) {
  for (let x = 0; x < WW; x++) {
    const bot = LV + Math.round(p.rnd(x >> 1, 4, 70) * 3);
    p.vl(x, GL, bot - GL, C.stone0);
    p.px(x, bot, C.amber);
    p.px(x, bot - 1, (x & 1) ? C.rust1 : C.rust0);
  }
  p.mottle(0, GL, WW, LV - GL + 2, C.hairDark, 5, 10, 71);
  p.noise(0, GL + 2, WW, LV - GL - 2, C.void, 0.08, 72);
  p.dithV(0, LV - 6, WW, 6, C.rust0, 0, 10);
  p.hl(0, GL, WW, C.rust1);
  p.dith(0, GL + 1, WW, 1, C.stone0, C.rust0, 8);
  for (let x = 0; x < WW; x++) if (p.rnd(x, 5, 70) < 0.08) p.px(x, GL, C.stone2);
  // glowing seams in the rock face
  for (let i = 0; i < 18; i++) {
    let x = Math.floor(p.rnd(i, 6, 70) * WW), y = LV - 1;
    const len = 4 + Math.floor(p.rnd(i, 7, 70) * 9);
    for (let k = 0; k < len && y > GL + 1; k++) {
      p.px(x, y, k < 2 ? C.amber : k < 5 ? C.rust2 : C.rust1);
      if (k < 3) p.px(x + 1, y, C.void);
      const r = p.rnd(i, k, 74);
      if (r < 0.4) y--; else x += r < 0.7 ? 1 : -1;
    }
  }
  // loose stones on the path, lit from the front
  for (let i = 0; i < 70; i++) { const x = Math.floor(p.rnd(i, 8, 70) * WW); p.hl(x, GL - 1, 2 + (i % 2), C.stone1); p.px(x, GL - 1, C.rust1); p.px(x + 1, GL - 2, i % 3 ? C.stone0 : C.stone1); }
}

// smooth value noise (bilinear, smoothstep) on a cx × cy grid
function vn(p, x, y, cx, cy, seed) {
  const gx = Math.floor(x / cx), gy = Math.floor(y / cy), u0 = x / cx - gx, v0 = y / cy - gy;
  const u = u0 * u0 * (3 - 2 * u0), v = v0 * v0 * (3 - 2 * v0);
  const a = p.rnd(gx, gy, seed), b = p.rnd(gx + 1, gy, seed), c = p.rnd(gx, gy + 1, seed), d = p.rnd(gx + 1, gy + 1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

function bakeLava(p) {
  const y0 = LV - 2, y1 = BH;
  for (let y = y0; y < y1; y++) for (let x = 0; x < WW; x++) {
    const n = vn(p, x, y, 30, 9, 1) * 0.62 + vn(p, x, y, 12, 4, 2) * 0.38;
    const m = Math.abs(n - 0.5), heat = vn(p, x, y, 60, 20, 3);
    const near = Math.max(0, 1 - (y - y0) / 14);           // molten channel right under the ledge
    const b = BAYER4[y & 3][x & 3];
    const w = 0.018 + heat * heat * 0.05 + near * 0.12;
    let c;
    if (m < w * 0.35) c = C.yellow;
    else if (m < w * 0.7) c = C.amber;
    else if (m < w) c = C.red;
    else if (m < w * 1.6) c = b < 8 ? C.rust1 : C.rust0;
    else c = b < Math.round(heat * 9) ? C.rust0 : C.hairDark;
    if (near > 0.5 && c === C.hairDark) c = C.rust1;
    else if (near > 0 && (c === C.hairDark || c === C.rust0) && b < near * 16) c = C.red;
    p.px(x, y, c);
  }
  // crust plates catching the glow on their upper rims
  for (let i = 0; i < 48; i++) {
    const cx = Math.floor(p.rnd(i, 4, 84) * WW), cy = y0 + 16 + Math.floor(p.rnd(i, 5, 84) * (y1 - y0 - 18)), rw = 4 + Math.floor(p.rnd(i, 6, 84) * 9), rh = 1 + Math.floor(p.rnd(i, 7, 84) * 2);
    for (let k = -rw; k <= rw; k++) {
      const top = Math.round(-rh * Math.sqrt(Math.max(0, 1 - (k / rw) ** 2)));
      if (top === 0 && Math.abs(k) > rw - 1) continue;
      p.vl(cx + k, cy + top, rh - top + 1, C.hairDark);
      p.px(cx + k, cy + top, k < 0 ? C.rust1 : C.rust0);
      p.px(cx + k, cy + rh + 1, C.amber);
    }
  }
}

function bakeMid(p, ctx) {
  // underside of level 05's slab: lit red from below, torn concrete lip, rebar, dangling wires
  p.dithV(0, -12, WW, 12, C.rust0, 0, 8);
  for (let x = 0; x < WW; x++) {
    if (x > SHAFT_X - 2 && x < SHAFT_X + SHAFT_W + 2) continue;
    const d = Math.max(0, Math.round(1 + 3 * p.rnd(x >> 2, 5, 50) + 2 * Math.sin(x * 0.05)));
    p.vl(x, 0, d, C.stone0); p.px(x, d, C.rust0);
    if (d > 3) p.px(x, d - 1, C.stone1);
  }
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(p.rnd(i, 1, 51) * WW);
    if (x > SHAFT_X - 4 && x < SHAFT_X + SHAFT_W + 4) continue;
    const len = 3 + Math.floor(p.rnd(i, 2, 51) * 9), b = p.rnd(i, 3, 51) < 0.5 ? -1 : 1;
    p.line(x, 2, x + b * 2, 2 + len, C.rust1); p.px(x + b * 2 + 1, 2 + len, C.void);
  }
  stalactites(p);
  // back row of rock teeth (avoid the car), then the gate in front of them
  rocks(p, spires(11, 34, 8, 30, 12, 64, CAR_ZONE), GL, C.hairDark, C.stone0, C.rust1, C.rust0, 12);
  // wires torn out of the slab
  wire(p, 300, 362, 3, 16, C.void); wire(p, 312, 380, 2, 24, C.rust0); wire(p, 566, 600, 2, 10, C.void);
  wire(p, 770, 846, 3, 20, C.void); wire(p, 150, 210, 3, 14, C.void); wire(p, 40, 70, 2, 18, C.rust0);
  for (const [x, l] of [[372, 26], [598, 18], [846, 30]]) { p.vl(x, 3, l, C.void); p.px(x, 3 + l, C.amber); p.px(x + 1, 3 + l, C.rust2); }
  // chains and hooks from the roof
  for (const [x, l, hk] of [[318, 56, true], [425, 72, true], [760, 64, true], [884, 52, true], [120, 48, true], [64, 68, false], [214, 36, true]]) chain(p, x, 2, l, hk);
  sagChain(p, 425, 40, 452, 24, 6);
  // a cage on a chain, and a strip light from upstairs hanging by one wire
  chain(p, 398, 2, 34, false);
  { const x = 391, y = 38;
    p.rect(x + 2, y, 11, 2, C.void); p.hl(x + 3, y, 9, C.rust1);
    p.rect(x, y + 2, 15, 1, C.void);
    for (let i = 0; i < 15; i += 3) { p.vl(x + i, y + 3, 18, C.void); p.vl(x + i + 1, y + 3, 18, i < 6 ? C.stone1 : C.rust0); }
    p.rect(x - 1, y + 21, 17, 3, C.void); p.hl(x, y + 21, 15, C.rust1); p.hl(x, y + 22, 15, C.rust0);
    p.rect(x + 5, y + 17, 4, 3, C.cream); p.px(x + 6, y + 18, C.void); p.px(x + 8, y + 18, C.void); p.hl(x + 3, y + 20, 8, C.stone3); }
  { const x0 = 562, x1 = 592;
    p.vl(x0 + 2, 2, 22, C.void); p.line(x1 - 3, 2, x1 - 1, 8, C.void); p.px(x1 - 1, 9, C.amber);
    for (let i = 0; i <= x1 - x0; i++) { const y = 24 + Math.round(i * 0.45); p.px(x0 + i, y, C.void); p.px(x0 + i, y + 1, C.stone1); p.px(x0 + i, y + 2, C.stone0); p.px(x0 + i, y + 3, i % 9 < 6 && i < 22 ? C.cream : C.void); p.px(x0 + i, y + 4, C.void); } }
  sagChain(p, 760, 30, 796, 22, 8);
  // girders: one fell through and lies kinked over a rock, one hangs out of the roof
  bentGirder(ctx, 398, GL - 12, [{ w: 18, s: -0.4 }, { w: 34, s: -1.55 }]);
  bentGirder(ctx, 744, 1, [{ w: 26, s: 1.1 }, { w: 44, s: 0.22 }]);
  bentGirder(ctx, 150, GL - 22, [{ w: 30, s: 0.3 }, { w: 40, s: 0.05 }]);
  // burnt server racks, leaning; a melted terminal
  const rk = burntRack(28, 56);
  rows(ctx, rk, 366, GL - 56, j => Math.round((55 - j) * 0.14));
  const rk2 = burntRack(26, 48);
  rows(ctx, rk2, 244, GL - 48, j => -Math.round((47 - j) * 0.12));
  const crt = meltedCrt();
  columns(ctx, crt, 330, GL - 24, i => Math.round(5 * Math.sin((Math.PI * i) / 27) ** 2) + (i > 20 ? Math.round((i - 20) * 0.6) : 0));
  for (const [i, l] of [[3, 5], [9, 8], [15, 4], [21, 7]]) { p.vl(330 + i, GL - 6, l, C.stone1); p.vl(331 + i, GL - 5, l - 2, C.stone0); p.px(330 + i, GL - 6 + l, C.stone2); }
  // facility pipe bent out of the right-hand rock
  pipe(p, 744, 92, [{ w: 30, s: 0 }, { w: 16, s: 0.7 }, { w: 30, s: 0.1 }]);
  // front row of short teeth
  rocks(p, spires(23, 40, 4, 12, 3, 16, [CAR_ZONE[0] - 10, GATE.r1 + 6]), GL, C.stone0, C.hairDark, C.rust2, C.rust1, 24);
  gate(p, ctx);
  // the sump slab came down with the lift: rubble round the car's landing
  concreteChunk(p, 454, GL - 9, 16, 9, 1); concreteChunk(p, 446, GL - 5, 10, 5, 2);
  concreteChunk(p, 540, GL - 7, 12, 7, 3); concreteChunk(p, 551, GL - 4, 7, 4, 4);
  hazardChunk(p, 412, GL - 9, 18, 0.15);
  hazardChunk(p, 562, GL - 6, 14, -0.2);
  hardHat(p, 300, GL - 3); hardHat(p, 590, GL - 3); hardHat(p, 820, GL - 3);
  bakeLava(p);
  ledge(p);
  // molten puddle under the terminal
  p.hl(330, GL, 24, C.hairDark); p.hl(333, GL + 1, 16, C.stone0);
}

function bakeBreach() {
  // origin aligned to the 4 px dither grid
  const ox = SHAFT_X - 72, oy = floorTop(5) + ROOM_H - 3, w = SHAFT_W + 144, h = 90;
  const c = mk(w, h), ctx = c.getContext('2d');
  ctx.translate(-ox, -oy);
  const p = pen(ctx), X = SHAFT_X, Wd = SHAFT_W, y5 = floorTop(5) + ROOM_H, y6 = floorTop(6);
  drawShaft(ctx, X, Wd, y5, y6, { floors: [], roomH: ROOM_H });
  p.dithV(X + 2, y5, Wd - 4, y6 - y5, C.rust0, 0, 12);
  p.dithV(X + 2, y6 - 22, Wd - 4, 22, C.rust1, 0, 8);
  p.dithV(X + 14, y6 - 8, Wd - 28, 8, C.red, 0, 6);
  // torn bottom edge of the shaft walls
  for (let x = X; x < X + Wd; x++) {
    const edge = x < X + 2 || x > X + Wd - 3;
    const d = Math.round(p.rnd(x >> 1, 9, 90) * 4 + (edge ? 6 : 0) + (x < X + 12 || x > X + Wd - 13 ? 2 : 0));
    p.vl(x, y6, d, edge ? C.stone1 : (x - X) % 20 === 0 ? C.ink : C.navy);
    p.px(x, y6 + d, C.rust1);
    if (d > 2 && !edge) p.px(x, y6 + d - 1, C.rust0);
  }
  // the slab around the shaft cracked open, glowing
  for (let i = 0; i < 9; i++) {
    const side = i % 2 ? 1 : -1;
    let x = side > 0 ? X + Wd : X - 1, y = y5 + 8 + Math.floor(p.rnd(i, 1, 92) * 34);
    const len = 14 + Math.floor(p.rnd(i, 2, 92) * 46);
    for (let k = 0; k < len; k++) {
      const hot = k < len * 0.4;
      p.px(x, y, hot ? (k % 5 === 0 ? C.yellow : C.amber) : k < len * 0.75 ? C.rust2 : C.rust1);
      p.px(x, y + 1, C.void);
      if (hot && k % 2) p.px(x, y - 1, C.rust1);
      x += side;
      const r = p.rnd(i, k, 93);
      if (r < 0.22) y++; else if (r < 0.44) y--;
      y = Math.max(y5 + 2, Math.min(y6 - 2, y));
      if (k === 8 && i < 4) { let bx = x, by = y; for (let q = 0; q < 8; q++) { by += 1; bx += side * (q % 2); p.px(bx, by, C.rust1); } }
    }
  }
  // ragged bottom of the slab either side of the shaft, sagging into the cavern
  for (let x = X - 60; x < X + Wd + 60; x++) {
    if (x >= X && x < X + Wd) continue;
    const dist = x < X ? X - x : x - (X + Wd - 1), fall = Math.max(0, Math.round((1 - dist / 60) * 7 + p.rnd(x >> 1, 6, 94) * 3 - 1));
    if (!fall) continue;
    p.vl(x, y6 - 2, fall + 2, C.stone1); p.px(x, y6 + fall, C.rust1); p.px(x, y6 + fall - 1, C.rust0);
    if (p.rnd(x, 7, 94) < 0.3) p.px(x, y6, C.stone0);
  }
  // remains of the pit floor, bent down where the car went through
  const seg = (x0, n, dir) => {
    for (let i = 0; i < n; i++) {
      const u = dir > 0 ? i / n : (n - 1 - i) / n, sag = Math.round(u * u * 9), x = x0 + i, y = y6 - 8 + sag;
      p.vl(x, y, 8, C.stone1); p.px(x, y, C.stone2); p.px(x, y + 7, C.rust1); p.px(x, y + 6, C.rust0);
      if (p.rnd(x, 3, 91) < 0.35) p.px(x, y + 2 + Math.floor(p.rnd(x, 4, 91) * 4), C.stone0);
      if (u > 0.85) p.px(x, y, C.void);
    }
  };
  seg(X + 2, 22, 1); seg(X + Wd - 24, 22, -1);
  for (const [x, dx] of [[X + 23, 1], [X + 21, 2], [X + Wd - 25, -1], [X + Wd - 23, -2]]) p.line(x, y6 + 1, x + dx * 3, y6 + 9 + Math.abs(dx) * 2, C.rust1);
  // a buffer spring hanging by one bolt
  for (let k = 0; k < 5; k++) { p.hl(X + 26 - k, y6 + 6 + k * 2, 6, C.amber); p.hl(X + 27 - k, y6 + 7 + k * 2, 5, C.rust1); }
  // guide rails and ladder bent out into the cavern
  for (const [gx, dir] of [[X + 11, -1], [X + Wd - 13, 1]]) for (let j = 0; j < 26; j++) {
    const o = Math.round(dir * (j / 26) ** 2 * 10);
    p.px(gx + o, y6 + j, C.steel1); p.px(gx + 1 + o, y6 + j, C.navy2); if (j > 18) p.px(gx + o, y6 + j, C.rust1);
  }
  for (let j = 0; j < 18; j++) { const o = -Math.round((j / 18) * 5); p.px(X + 3 + o, y6 + j, C.steel0); p.px(X + 9 + o, y6 + j, C.steel0); if (j % 4 === 0) p.hl(X + 4 + o, y6 + j, 5, C.steel1); }
  return { c, ox, oy };
}

function flameSprite(w, h, f, seed) {
  const c = mk(w, h), p = pen(c.getContext('2d'));
  const mid = (w - 1) / 2;
  for (let i = 0; i < w; i++) {
    const dx = Math.abs(i - mid) / (w / 2 + 0.5);
    const colH = Math.round(h * (1 - dx * dx) * (0.5 + 0.5 * hash(seed * 131 + i * 17 + f * 7919)));
    for (let j = 0; j < colH; j++) {
      const r = j / h + dx * 0.55 + hash(seed + i * 3 + j * 11 + f * 101) * 0.12;
      const col = r < 0.16 ? C.white : r < 0.3 ? C.yellow : r < 0.44 ? C.rust3 : r < 0.6 ? C.rust2 : r < 0.78 ? C.rust1 : C.rust0;
      p.px(i, h - 1 - j, col);
    }
  }
  // a detached tongue
  const tx = Math.round(mid + (hash(seed * 7 + f) - 0.5) * w * 0.5), ty = Math.floor(hash(seed * 5 + f * 3) * 3);
  p.px(tx, ty, C.rust1); p.px(tx, ty + 1, C.rust2);
  return c;
}

function bake() {
  if (ART) return ART;
  const back = mk(WW, BH);
  bakeSky(pen(back.getContext('2d')));
  const mid = mk(WW, BH + OY);
  const mctx = mid.getContext('2d');
  mctx.translate(0, OY);
  bakeMid(pen(mctx), mctx);
  const flames = [];
  const SITES = [[24, 172, 1], [66, LV + 3, 0], [118, LV + 3, 1], [150, 196, 0], [205, LV + 3, 0], [262, 178, 1], [300, LV + 3, 1], [352, 192, 0], [414, LV + 3, 0], [446, 170, 1],
    [588, LV + 3, 1], [626, 190, 0], [700, LV + 3, 0], [748, LV + 3, 1], [790, 174, 0], [850, LV + 3, 0], [910, 188, 1]];
  SITES.forEach(([x, y, big], k) => {
    const set = big ? [[-10, 9, 15], [-2, 13, 28], [7, 9, 19], [14, 5, 9]] : [[-6, 7, 12], [1, 11, 21], [8, 7, 10]];
    for (const [dx, w, h] of set) {
      const seed = k * 10 + dx + 7, fr = [0, 1, 2, 3].map(f => flameSprite(w, h, f, seed));
      flames.push({ x: x + dx - (w >> 1), y: y - h + 2, fr, ph: hash(seed) * 4 });
    }
  });
  ART = { back, mid, flames, breach: bakeBreach() };
  return ART;
}

// The shaft through level 05's slab, its sump floor torn open (drawn in world space during the ride).
export function drawHellShaft(ctx) {
  const { breach } = bake();
  ctx.drawImage(breach.c, breach.ox, breach.oy);
}

export function drawHellFloor(ctx, top, t) {
  const A = bake();
  ctx.drawImage(A.back, 0, top);
  // heat haze: 1 px row wobble on the far band only
  for (let y = HZ0; y < HZ1; y++) {
    const off = Math.round(Math.sin(t * 1.7 + y * 0.45) * 0.7 + Math.sin(t * 0.9 + y * 0.21) * 0.45);
    if (off) ctx.drawImage(A.back, 0, y, WW, 1, off, top + y, WW, 1);
  }
  ctx.drawImage(A.mid, 0, top - OY);
  const p = pen(ctx);
  // slow lava glow, a few small spots
  [[300, LV + 34, 14], [560, LV + 54, 12], [690, LV + 24, 16], [120, LV + 20, 12], [860, LV + 30, 14], [470, LV + 16, 10]].forEach(([x, y, w], k) => {
    const lv = 3 + Math.round(5 * (0.5 + 0.5 * Math.sin(t * 0.8 + k * 1.9)));
    for (let j = 0; j < 4; j++) { const ww = w - Math.abs(j - 1.5) * 4; p.dith(x - (ww >> 1), top + y + j, ww, 1, null, C.yellow, lv); }
  });
  // flames, only in the lava band
  for (const f of A.flames) ctx.drawImage(f.fr[Math.floor(t * 9 + f.ph) & 3], f.x, top + f.y);
  // embers rising off the lava
  for (let i = 0; i < 70; i++) {
    const sp = 6 + hash(i * 7 + 1) * 12, x0 = hash(i * 13 + 2) * WW, life = 130;
    const k = (t * sp + hash(i * 29 + 3) * life) % life;
    const x = Math.round(x0 + Math.sin(t * 1.3 + i) * 3 + k * (hash(i * 3) - 0.5) * 0.3), y = Math.round(top + LV - k);
    const u = k / life;
    p.px(x, y, u < 0.2 ? C.yellow : u < 0.45 ? C.amber : u < 0.7 ? C.rust2 : C.rust0);
  }
}

// gibs + a small local burst (no full-screen flash)
export function drawHellWorld(ctx, h) {
  const p = pen(ctx);
  if (h.phase === 'boom' && h.t < 0.7) {
    const e = h.t, r = Math.min(19, Math.round(7 + e * 90));
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
      const spike = 0.55 + 0.45 * hash(Math.floor((Math.atan2(j, i) + 3.2) * 3.2) * 31 + 5);
      const d = Math.hypot(i, j) / (r * spike);
      if (d > 1) continue;
      const v = d * 0.85 + hash((i + 40) * 97 + (j + 40) * 13 + Math.floor(e * 20) * 7) * 0.3 + Math.max(0, e - 0.06) * 2.4;
      const c = v < 0.3 ? C.white : v < 0.5 ? C.yellow : v < 0.72 ? C.rust3 : v < 0.92 ? C.rust2 : v < 1.15 ? C.rust1 : v < 1.5 ? C.rust0 : null;
      if (c != null) p.px(h.bx + i, h.by + j - Math.round(e * 10 * (1 - d)), c);
    }
  }
  for (const g of h.gibs) {
    const x = Math.round(g.x), y = Math.round(g.y) - g.s;
    if (g.rest) { p.hl(x - 1, y + g.s, g.s + 2, C.rust0); p.px(x + g.s, y + g.s, C.red); }
    p.rect(x, y, g.s, g.s, g.c);
    if (g.s > 1) p.px(x + g.s - 1, y + g.s - 1, g.c === C.skin ? C.skinDark : C.void);
    if (g.s > 2) p.px(x, y, g.c === C.red ? C.pink : g.c === C.skin ? C.cream : C.rust1);
  }
}

function splat(p, s, k) {
  const x = s.x, y = Math.round(s.y), r = Math.round(s.r * 1.5);
  const R = Math.round(r * 1.25) + 1;
  const rad = a => r * (0.68 + 0.5 * hash(k * 97 + Math.floor((a + 3.2) * 2.4)));
  for (let j = -R; j <= R; j++) for (let i = -R - 1; i <= R + 1; i++) {
    const d = Math.hypot(i, j * 1.15), rr = rad(Math.atan2(j, i));
    if (d <= rr + 1) p.px(x + i, y + j, d > rr ? C.void : d > rr - 1.5 || j > rr * 0.45 ? C.rust0 : s.c === C.rust0 ? C.rust0 : C.red);
  }
  p.rect(x - (r >> 1), y - (r >> 1), 2, 1, C.pink); p.px(x - (r >> 1), y - (r >> 1) + 1, C.pink);
  for (let m = 0; m < 3; m++) {
    const a = hash(k * 31 + m) * 6.28, dd = r + 2 + hash(k * 17 + m) * 5;
    const sx = Math.round(x + Math.cos(a) * dd), sy = Math.round(y + Math.sin(a) * dd * 0.9);
    p.rect(sx - 1, sy - 1, m ? 3 : 4, m ? 3 : 4, C.void); p.rect(sx, sy, m ? 1 : 2, m ? 1 : 2, C.red); if (!m) p.px(sx + 1, sy + 1, C.rust0);
  }
  for (let m = 0; m < 1 + (k % 2); m++) {
    const dx = Math.round((hash(k * 13 + m) - 0.5) * r), len = Math.round(s.drip * (0.3 + 0.3 * hash(k * 7 + m)));
    const yy = y + Math.round(r * 0.6), thick = Math.round(len * 0.55);
    p.vl(x + dx + 1, yy, len, C.void);
    p.vl(x + dx, yy, len, C.red); p.vl(x + dx + 1, yy, thick, C.rust0); p.vl(x + dx + 2, yy, thick, C.void);
    if (thick > 4) p.px(x + dx - 1, yy + 1, C.red);
    if (len > 2) { p.rect(x + dx - 1, yy + len, 3, 2, C.red); p.px(x + dx + 1, yy + len + 1, C.rust0); p.hl(x + dx - 1, yy + len + 2, 3, C.void); p.vl(x + dx - 2, yy + len, 2, C.void); p.vl(x + dx + 2, yy + len, 2, C.void); }
  }
  for (let b = 0; b < s.bits; b++) {
    const bx = x + b * 3 - r, by = Math.round(y + s.drip * 0.6 + b * 4);
    p.rect(bx, by, 2, 2, C.skin); p.px(bx + 1, by + 1, C.skinDark); p.px(bx - 1, by + 1, C.red);
  }
}

export function drawHellScreen(ctx, h) {
  const p = pen(ctx);
  h.splats.forEach((s, i) => { if (h.phase !== 'boom' || h.done || h.t > 0.12 + i * 0.035) splat(p, s, s.k ?? i); });
  if (h.done) {
    const w = textWidth(COPY.restart), x = (W - w) >> 1, y = H - 20;
    p.rect(x - 5, y - 4, w + 10, 15, C.void); p.hl(x - 4, y - 3, w + 8, C.rust0); p.hl(x - 4, y + 9, w + 8, C.rust0);
    drawText(ctx, COPY.restart, x, y, PAL[C.cream2]);
  }
}
