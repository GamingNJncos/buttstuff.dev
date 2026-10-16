// Hazard stripes, floor gratings and floor bands.
import { C } from '../palette.js?v=68';
import { BAYER4 } from '../dither.js?v=68';
import { pen } from './wall.js?v=68';

// hazardStrip(ctx, x, y, w, h, { a, b, period, worn, remap })  diagonal stripes, worn paint.
export function hazardStrip(ctx, x, y, w, h, opts = {}) {
  const { a = C.yellow, b = C.ink, period = 6, worn = 0.12, remap, seed = 0, edge = true } = opts;
  const p = pen(ctx, remap);
  const aDark = a === C.yellow ? C.amber : a === C.amber ? C.rust2 : C.stone2;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const on = (((x + i + y + j) % period) + period) % period < period / 2;
    let c = on ? a : b;
    if (on && j >= h - 2) c = aDark;
    if (on && p.rnd(x + i, y + j, seed) < worn) c = BAYER4[(y + j) & 3][(x + i) & 3] < 8 ? aDark : b;
    if (!on && p.rnd(x + i, y + j, seed + 9) < worn * 0.4) c = C.stone0;
    p.px(x + i, y + j, c);
  }
  if (edge && h > 3) {
    p.hl(x, y, w, C.void);
    p.dith(x, y + 1, w, 1, null, C.cream, 4);
    p.hl(x, y + h - 1, w, C.void);
  }
  return { w, h };
}

// grating(ctx, x, y, w, h, { tone, remap })  steel floor grate: frame + slot lattice.
export function grating(ctx, x, y, w, h, opts = {}) {
  const { remap, light = C.steel1, mid = C.steel0, dark = C.navy } = opts;
  const p = pen(ctx, remap);
  p.rect(x, y, w, h, C.void);
  // Frame lip.
  p.hl(x, y, w, light); p.hl(x, y + 1, w, mid); p.hl(x, y + h - 1, w, C.ink);
  for (let j = 2; j < h - 1; j++) for (let i = 0; i < w; i++) {
    const xx = x + i, yy = y + j;
    const bar = (xx % 3 === 0) || ((yy - y) % 4 === 1);
    if (bar) {
      const lit = (yy - y) % 4 === 1;
      p.px(xx, yy, lit ? mid : dark);
    } else if (BAYER4[yy & 3][xx & 3] < 3) p.px(xx, yy, C.ink);
  }
  // Supports every 24px.
  for (let sx = x + 12; sx < x + w - 2; sx += 24) { p.vl(sx, y + 2, h - 3, mid); p.vl(sx + 1, y + 2, h - 3, C.ink); p.px(sx, y + 2, light); }
  return { w, h };
}

const FLOORS = {
  asphalt: { base: C.stone0, lo: C.hairDark, hi: C.stone1, spk: C.stone2, lip: C.stone1, seam: 64 },
  concrete: { base: C.stone1, lo: C.stone0, hi: C.stone2, spk: C.stone3, lip: C.stone2, seam: 48 },
  tile: { base: C.steel0, lo: C.navy2, hi: C.steel1, spk: C.steel2, lip: C.steel2, seam: 10 },
  steel: { base: C.navy2, lo: C.navy, hi: C.steel0, spk: C.steel1, lip: C.steel1, seam: 32 },
  wood: { base: C.wood1, lo: C.wood0, hi: C.rust1, spk: C.brass, lip: C.brass, seam: 20 },
  carpet: { base: C.rust0, lo: C.hairDark, hi: C.rust1, spk: C.rust2, lip: C.wood1, seam: 0 },
};

// floorBand(ctx, x, y, w, h, material, { remap, seed })  the walkable band under a room.
export function floorBand(ctx, x, y, w, h, material = 'asphalt', opts = {}) {
  if (material === 'grating') return grating(ctx, x, y, w, h, opts);
  const { remap, seed = 0 } = opts;
  const p = pen(ctx, remap);
  const F = FLOORS[material] ?? FLOORS.asphalt;
  p.rect(x, y, w, h, F.base);
  p.mottle(x, y, w, h, F.hi, 8, 6, seed);
  p.mottle(x, y, w, h, F.lo, 11, 7, seed + 3);
  if (material === 'tile') {
    for (let tx = x; tx < x + w; tx += F.seam) { p.vl(tx, y, h, F.lo); p.dith(tx + 1, y, 1, h, null, F.hi, 8); }
    for (let ty = y + 5; ty < y + h; ty += 6) p.hl(x, ty, w, F.lo);
  } else if (material === 'wood') {
    for (let ty = y + 2; ty < y + h; ty += 3) {
      p.hl(x, ty, w, F.lo);
      const off = (ty * 7) % F.seam;
      for (let tx = x + off; tx < x + w; tx += F.seam) p.px(tx, ty + 1, F.lo), p.px(tx, ty + 2, F.lo);
    }
  } else if (material === 'steel') {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      // tread plate diamonds
      const xx = x + i, yy = y + j;
      if (((xx + (yy >> 1)) % 6 === 0 && yy % 4 === 1) || ((xx - (yy >> 1)) % 6 === 3 && yy % 4 === 3)) { p.px(xx, yy, F.spk); p.px(xx + 1, yy + 1, F.lo); }
    }
    for (let tx = x + F.seam; tx < x + w; tx += F.seam) p.vl(tx, y, h, C.ink);
  } else if (material === 'carpet') {
    p.noise(x, y, w, h, F.hi, 0.18, seed + 4);
    p.noise(x, y, w, h, F.lo, 0.15, seed + 5);
    for (let tx = x + 4; tx < x + w; tx += 8) for (let ty = y + 4; ty < y + h; ty += 6) p.px(tx + ((ty >> 1) & 4), ty, F.spk);
  } else {
    p.noise(x, y, w, h, F.spk, 0.025, seed + 1);
    p.noise(x, y, w, h, F.lo, 0.05, seed + 2);
    p.noise(x, y, w, h, C.void, 0.012, seed + 6);
    if (F.seam) for (let tx = x + F.seam; tx < x + w; tx += F.seam) {
      p.vl(tx, y + 3, h - 3, F.lo); p.dith(tx + 1, y + 3, 1, h - 3, null, F.hi, 6);
    }
  }
  // Lip: bright top edge, dark under-edge, shadow fade at the back of the floor.
  p.hl(x, y, w, F.lip); p.hl(x, y + 1, w, F.base); p.dith(x, y + 1, w, 1, null, F.hi, 8);
  p.hl(x, y + 2, w, C.ink);
  p.dithV(x, y + 3, w, 3, C.void, 8, 0);
  p.dithV(x, y + h - 4, w, 4, C.void, 0, 10);
  return { w, h };
}
