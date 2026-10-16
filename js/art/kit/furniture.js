// Furniture & small props. All take top-left (x, y) and return {w, h}.
import { C } from '../palette.js?v=68';
import { BAYER4 } from '../dither.js?v=68';
import { pen } from './wall.js?v=68';

const floorShadow = (p, x, y, w) => p.dith(x - 2, y - 2, w + 4, 3, null, C.void, 10);

// desk(ctx, x, y, { w, h, top: 'wood'|'steel', items, remap })
export function desk(ctx, x, y, opts = {}) {
  const { w = 60, h = 24, top = 'wood', items = true, remap, seed = 2 } = opts;
  const p = pen(ctx, remap);
  const T = top === 'steel' ? [C.navy2, C.steel0, C.steel1, C.steel2] : [C.wood0, C.wood1, C.brass, C.stone3];
  floorShadow(p, x, y + h, w);
  // items on the desktop (drawn above y)
  if (items) {
    // monitor
    p.rect(x + 6, y - 15, 18, 13, C.void); p.rect(x + 7, y - 14, 16, 10, C.stone2); p.hl(x + 7, y - 14, 16, C.cream);
    p.rect(x + 9, y - 12, 12, 7, C.ink); p.dith(x + 9, y - 12, 12, 7, null, C.mint0, 5);
    p.hl(x + 10, y - 11, 6, C.mint2); p.hl(x + 10, y - 9, 9, C.mint1); p.hl(x + 10, y - 7, 4, C.mint1);
    p.rect(x + 13, y - 4, 4, 2, C.stone1); p.rect(x + 11, y - 2, 8, 2, C.stone2);
    // keyboard
    p.rect(x + 26, y - 2, 12, 2, C.void); p.hl(x + 27, y - 2, 10, C.stone2);
    // paper stack + mug
    p.rect(x + w - 20, y - 3, 9, 3, C.stone3); p.hl(x + w - 20, y - 3, 9, C.cream2); p.hl(x + w - 19, y - 2, 7, C.stone2);
    p.rect(x + w - 8, y - 5, 4, 5, C.red); p.vl(x + w - 8, y - 5, 5, C.rust3); p.px(x + w - 4, y - 4, C.red); p.px(x + w - 4, y - 3, C.red);
    p.hl(x + w - 8, y - 5, 4, C.rust0);
  }
  // desktop slab
  p.rect(x, y, w, 4, C.void);
  p.rect(x + 1, y, w - 2, 3, T[1]);
  p.hl(x + 1, y, w - 2, T[3]); p.dith(x + 1, y + 1, w - 2, 1, null, T[2], 6);
  p.hl(x + 1, y + 3, w - 2, T[0]);
  // modesty panel + pedestal
  p.rect(x + 2, y + 4, w - 4, h - 4, C.void);
  p.rect(x + 3, y + 4, w - 6, h - 6, T[0]);
  p.dith(x + 3, y + 4, w - 6, 3, null, C.void, 10);
  p.noise(x + 3, y + 7, w - 6, h - 9, T[1], 0.15, seed);
  const pw = 16, px0 = x + w - pw - 3;
  p.rect(px0, y + 4, pw, h - 5, T[1]);
  p.vl(px0, y + 4, h - 5, T[2]); p.vl(px0 + pw - 1, y + 4, h - 5, T[0]);
  for (let k = 0; k < 3; k++) {
    const dy = y + 6 + k * Math.floor((h - 8) / 3);
    p.hl(px0 + 1, dy - 1, pw - 2, C.void);
    p.rect(px0 + 5, dy + 2, 6, 1, C.steel2); p.px(px0 + 10, dy + 2, C.steel0);
  }
  // legs on the other side
  p.rect(x + 3, y + 4, 3, h - 4, C.void); p.vl(x + 4, y + 4, h - 5, T[1]);
  p.dithV(x + 3, y + h - 6, w - 6, 5, C.void, 0, 8);
  return { w, h };
}

// chair(ctx, x, y, { remap })  office chair, 14x22.
export function chair(ctx, x, y, opts = {}) {
  const { remap, fab = [C.navy, C.navy2, C.steel0] } = opts;
  const p = pen(ctx, remap);
  floorShadow(p, x, y + 22, 14);
  // backrest
  p.rect(x + 1, y, 9, 11, C.void); p.rect(x + 2, y + 1, 7, 9, fab[1]);
  p.hl(x + 2, y + 1, 7, fab[2]); p.vl(x + 2, y + 1, 9, fab[2]); p.dith(x + 5, y + 4, 4, 6, null, fab[0], 8);
  p.rect(x + 4, y + 11, 2, 3, C.ink);
  // seat
  p.rect(x + 1, y + 12, 12, 4, C.void); p.rect(x + 2, y + 13, 10, 2, fab[1]); p.hl(x + 2, y + 13, 10, fab[2]);
  // armrest
  p.hl(x + 3, y + 10, 7, C.steel0); p.px(x + 9, y + 11, C.steel0);
  // gas lift + star base + casters
  p.rect(x + 6, y + 16, 2, 3, C.steel1); p.vl(x + 7, y + 16, 3, C.navy2);
  p.hl(x + 1, y + 19, 12, C.ink); p.hl(x + 2, y + 19, 10, C.steel0);
  for (const cx of [x + 1, x + 6, x + 12]) { p.px(cx, y + 20, C.void); p.px(cx, y + 21, C.ink); }
  return { w: 14, h: 22 };
}

// lamp(ctx, x, y, { type: 'hang'|'desk', cone, lit, remap })  x = centre of the shade.
export function lamp(ctx, x, y, opts = {}) {
  const { type = 'hang', cone = 40, lit = C.amber, remap, drop = 8, spread = 1.1 } = opts;
  const p = pen(ctx, remap);
  if (type === 'desk') {
    // base, arm, head, cone down-right
    p.rect(x - 4, y + 14, 9, 2, C.void); p.hl(x - 3, y + 14, 7, C.steel1);
    p.line(x, y + 13, x - 2, y + 6, C.steel1); p.line(x + 1, y + 13, x - 1, y + 6, C.navy2);
    p.line(x - 2, y + 6, x + 4, y + 1, C.steel1);
    p.rect(x + 3, y, 6, 3, C.void); p.hl(x + 4, y, 4, C.steel2); p.hl(x + 4, y + 2, 4, C.cream2);
    for (let j = 0; j < cone; j++) {
      const wj = 4 + Math.round(j * spread), fall = 6 - (j / Math.max(1, cone - 1)) * 4;
      for (let i = 0; i < wj; i++) {
        const t = Math.abs(i - wj / 2) / (wj / 2 + 1), X = x + 6 - Math.floor(wj / 2) + i, Y = y + 3 + j;
        if (BAYER4[Y & 3][X & 3] < Math.round(fall * (1 - t * t))) p.px(X, Y, lit);
      }
    }
    return { w: 12, h: 16 };
  }
  // cord + industrial shade
  p.vl(x, y, drop, C.ink);
  const sy = y + drop;
  p.rect(x - 2, sy, 5, 2, C.void); p.hl(x - 1, sy, 3, C.steel1);
  for (let j = 0; j < 4; j++) {
    const hw = 2 + j * 2;
    p.hl(x - hw, sy + 2 + j, hw * 2 + 1, j === 3 ? C.navy2 : C.steel0);
    p.px(x - hw, sy + 2 + j, C.steel2); p.px(x + hw, sy + 2 + j, C.void);
  }
  p.hl(x - 7, sy + 6, 15, C.void);
  p.rect(x - 2, sy + 6, 5, 1, C.cream2); p.px(x, sy + 7, lit);
  // cone of light (dithered), brighter near the shade
  for (let j = 0; j < cone; j++) {
    const hw = 6 + Math.round(j * spread * 0.6);
    const fall = 5 - (j / Math.max(1, cone - 1)) * 4;
    for (let i = -hw; i <= hw; i++) {
      const t = Math.abs(i) / (hw + 1);
      const lvl = Math.round(fall * (1 - t * t));
      const X = x + i, Y = sy + 7 + j;
      if (BAYER4[Y & 3][X & 3] < lvl) p.px(X, Y, j < 4 && Math.abs(i) < 4 ? C.cream2 : lit);
    }
  }
  return { w: 15, h: drop + 7 + cone };
}

// plant(ctx, x, y, { remap })  potted plant, 16x26.
export function plant(ctx, x, y, opts = {}) {
  const { remap, seed = 3 } = opts;
  const p = pen(ctx, remap);
  floorShadow(p, x, y + 26, 16);
  // leaves: arcs from the pot centre
  const cx = x + 8, by = y + 17;
  const leaves = [[-7, -10], [-4, -16], [0, -17], [3, -14], [6, -11], [-8, -4], [7, -5], [-2, -12], [5, -16]];
  leaves.forEach(([dx, dy], k) => {
    const n = 8;
    for (let t = 0; t <= n; t++) {
      const u = t / n;
      const X = Math.round(cx + dx * u + Math.sin(u * 3 + k) * 0.6 * (dx > 0 ? 1 : -1));
      const Y = Math.round(by + dy * u + (dx * dx * u * u) / 18);
      p.px(X, Y, k % 3 === 0 ? C.mint0 : C.mint1);
      if (u > 0.3 && u < 0.85) p.px(X + (dx > 0 ? 1 : -1), Y, k % 2 ? C.mint0 : C.mint1);
      if (u > 0.5 && u < 0.7 && p.rnd(k, t, seed) < 0.7) p.px(X, Y - 1, C.mint2);
    }
  });
  // pot
  p.rect(x + 3, y + 17, 11, 3, C.void); p.rect(x + 4, y + 17, 9, 2, C.rust2); p.hl(x + 4, y + 17, 9, C.rust3);
  p.rect(x + 4, y + 20, 9, 6, C.void); p.rect(x + 5, y + 20, 7, 5, C.rust1); p.vl(x + 5, y + 20, 5, C.rust2);
  p.dith(x + 9, y + 20, 3, 5, null, C.rust0, 8);
  p.hl(x + 4, y + 19, 9, C.hairDark);
  return { w: 16, h: 26 };
}

// crate(ctx, x, y, { w, h, label, remap })  wooden shipping crate.
export function crate(ctx, x, y, opts = {}) {
  const { w = 22, h = 18, label = '', remap, seed = 1 } = opts;
  const p = pen(ctx, remap);
  floorShadow(p, x, y + h, w);
  p.rect(x, y, w, h, C.void);
  p.rect(x + 1, y + 1, w - 2, h - 2, C.wood1);
  // planks
  for (let yy = y + 4; yy < y + h - 2; yy += 4) { p.hl(x + 1, yy, w - 2, C.wood0); p.dith(x + 1, yy + 1, w - 2, 1, null, C.brass, 4); }
  p.noise(x + 1, y + 1, w - 2, h - 2, C.wood0, 0.1, seed);
  p.noise(x + 1, y + 1, w - 2, h - 2, C.brass, 0.05, seed + 1);
  // frame + cross brace
  p.rect(x + 1, y + 1, w - 2, 2, C.brass); p.hl(x + 1, y + 2, w - 2, C.wood1); p.hl(x + 1, y + 1, w - 2, C.stone3);
  p.rect(x + 1, y + h - 3, w - 2, 2, C.wood0); p.hl(x + 1, y + h - 3, w - 2, C.brass);
  p.rect(x + 1, y + 1, 2, h - 2, C.brass); p.vl(x + 1, y + 1, h - 2, C.stone3);
  p.rect(x + w - 3, y + 1, 2, h - 2, C.wood0); p.vl(x + w - 3, y + 1, h - 2, C.wood1);
  p.line(x + 3, y + h - 4, x + w - 4, y + 3, C.brass); p.line(x + 3, y + h - 3, x + w - 4, y + 4, C.wood0);
  // corner nails
  for (const [nx, ny] of [[x + 2, y + 2], [x + w - 3, y + 2], [x + 2, y + h - 3], [x + w - 3, y + h - 3]]) p.px(nx, ny, C.steel1);
  // stencil label plate
  if (label) {
    const lw = label.length * 4 + 3;
    const lx = x + Math.floor((w - lw) / 2), ly = y + Math.floor(h / 2) - 3;
    p.rect(lx, ly, lw, 7, C.rust1); p.hl(lx, ly, lw, C.rust2); p.hl(lx, ly + 6, lw, C.rust0);
    p.text(label, lx + 2, ly + 1, C.cream, 'f3');
  }
  p.dithV(x + 1, y + h - 6, w - 2, 5, C.void, 0, 6);
  return { w, h };
}

// shelving(ctx, x, y, { w, h, rows, remap })  steel shelving filled with binders/boxes.
export function shelving(ctx, x, y, opts = {}) {
  const { w = 40, rows = 4, remap, seed = 5, h = rows * 14 + 4 } = opts;
  const p = pen(ctx, remap);
  floorShadow(p, x, y + h, w);
  // back panel
  p.rect(x + 2, y, w - 4, h, C.ink);
  p.dith(x + 2, y, w - 4, h, null, C.navy, 6);
  const SP = [C.red, C.navy2, C.mint0, C.amber, C.steel1, C.cream, C.rust1, C.wood1, C.pink, C.stone2];
  const rh = Math.floor((h - 4) / rows);
  for (let r = 0; r < rows; r++) {
    const sy = y + 2 + r * rh;
    // contents
    let bx = x + 3;
    while (bx < x + w - 4) {
      const v = p.rnd(bx, sy, seed);
      if (v < 0.15) { bx += 3; continue; } // gap
      if (v > 0.82 && bx + 9 < x + w - 4) {
        // archive box
        p.rect(bx, sy + rh - 9, 9, 7, C.stone2); p.hl(bx, sy + rh - 9, 9, C.stone3); p.rect(bx + 3, sy + rh - 7, 3, 2, C.cream2);
        p.vl(bx + 8, sy + rh - 9, 7, C.stone1); bx += 10; continue;
      }
      const bw = 2 + (v > 0.6 ? 1 : 0), bh = rh - 4 - Math.floor(p.rnd(bx, 7, seed) * 4);
      const c = SP[Math.floor(p.rnd(bx, sy, seed + 1) * SP.length)];
      p.rect(bx, sy + rh - 2 - bh, bw, bh, c);
      p.px(bx, sy + rh - 2 - bh, C.cream2);
      p.vl(bx + bw - 1, sy + rh - 1 - bh, bh - 1, C.void);
      if (bh > 6) p.px(bx, sy + rh - bh + 2, C.cream);
      // lean the last one sometimes
      bx += bw;
    }
    // shelf board
    p.rect(x + 1, sy + rh - 2, w - 2, 2, C.steel1); p.hl(x + 1, sy + rh - 2, w - 2, C.steel2); p.hl(x + 1, sy + rh - 1, w - 2, C.navy2);
    // shelf label
    p.rect(x + Math.floor(w / 2) - 3, sy + rh - 1, 6, 2, C.cream); p.px(x + Math.floor(w / 2) - 2, sy + rh, C.stone1);
  }
  // uprights
  for (const ux of [x, x + w - 3]) {
    p.rect(ux, y - 1, 3, h + 1, C.void); p.vl(ux + 1, y - 1, h, C.steel1); p.px(ux + 1, y - 1, C.steel3);
    for (let yy = y + 2; yy < y + h - 2; yy += 3) p.px(ux + 1, yy, C.navy2);
  }
  return { w, h };
}

// filingCabinet(ctx, x, y, { drawers, open, remap }) 18 wide.
export function filingCabinet(ctx, x, y, opts = {}) {
  const { drawers = 4, open = 2, remap, body = [C.navy2, C.steel0, C.steel1, C.steel2] } = opts;
  const p = pen(ctx, remap);
  const w = 18, dh = 9, h = drawers * dh + 3;
  floorShadow(p, x, y + h, w);
  p.rect(x, y, w, h, C.void);
  p.rect(x + 1, y + 1, w - 2, h - 2, body[1]);
  p.vl(x + 1, y + 1, h - 2, body[2]); p.hl(x + 1, y + 1, w - 2, body[3]);
  for (let k = 0; k < drawers; k++) {
    const dy = y + 2 + k * dh;
    const ox = k === open ? 2 : 0;
    p.rect(x + 2 + ox, dy, w - 4, dh - 1, body[1]);
    p.bevel(x + 2 + ox, dy, w - 4, dh - 1, body[2], body[0]);
    if (ox) { p.rect(x + w - 2, dy, 2, dh - 1, body[0]); p.hl(x + 3, dy - 1, 4, C.cream); p.hl(x + 8, dy - 2, 3, C.cream2); }
    // label slot + handle
    p.rect(x + 6 + ox, dy + 2, 6, 2, C.cream); p.px(x + 7 + ox, dy + 2, C.stone1);
    p.rect(x + 6 + ox, dy + 5, 6, 1, C.void); p.hl(x + 7 + ox, dy + 5, 4, C.steel3);
  }
  p.noise(x + 1, y + 1, w - 2, h - 2, body[0], 0.05, 3);
  p.dithV(x + 1, y + h - 8, w - 2, 7, C.void, 0, 6);
  return { w, h };
}

// locker(ctx, x, y, { w, h, n, remap })  row of n tall lockers.
export function locker(ctx, x, y, opts = {}) {
  const { n = 1, lw = 14, h = 42, remap, body = [C.mint0, C.steel0, C.steel1, C.steel2], seed = 2 } = opts;
  const p = pen(ctx, remap);
  const w = n * lw + 1;
  floorShadow(p, x, y + h, w);
  for (let k = 0; k < n; k++) {
    const lx = x + k * lw;
    p.rect(lx, y, lw + 1, h, C.void);
    p.rect(lx + 1, y + 1, lw - 1, h - 2, body[1]);
    p.hl(lx + 1, y + 1, lw - 1, body[3]); p.vl(lx + 1, y + 1, h - 2, body[2]);
    p.vl(lx + lw - 1, y + 2, h - 3, body[0]);
    // vents
    for (let v = 0; v < 4; v++) { p.hl(lx + 4, y + 4 + v * 2, lw - 7, C.void); p.hl(lx + 4, y + 5 + v * 2, lw - 7, body[2]); }
    // number plate + handle
    p.rect(lx + 4, y + 14, 6, 4, C.cream); p.text(String(k + 1), lx + 6, y + 13, C.navy, 'f3');
    p.rect(lx + lw - 4, y + 20, 2, 6, C.void); p.vl(lx + lw - 4, y + 21, 4, C.steel3);
    // dent + scuffs
    if (p.rnd(k, 1, seed) < 0.6) { const dy = y + 26 + Math.floor(p.rnd(k, 2, seed) * 8); p.px(lx + 5, dy, body[0]); p.px(lx + 6, dy + 1, body[3]); }
    p.noise(lx + 2, y + 28, lw - 3, h - 30, body[0], 0.1, seed + k);
    for (let v = 0; v < 2; v++) { p.hl(lx + 4, y + h - 8 + v * 2, lw - 7, C.void); }
  }
  p.dithV(x + 1, y + h - 7, w - 2, 6, C.void, 0, 7);
  return { w, h };
}

// bench(ctx, x, y, { w, remap })  slatted wood bench on steel legs, 10 tall.
export function bench(ctx, x, y, opts = {}) {
  const { w = 34, remap } = opts;
  const p = pen(ctx, remap);
  const h = 11;
  floorShadow(p, x, y + h, w);
  for (let k = 0; k < 2; k++) {
    const sy = y + k * 3;
    p.rect(x, sy, w, 3, C.void); p.hl(x + 1, sy, w - 2, C.brass); p.hl(x + 1, sy + 1, w - 2, C.wood1);
    p.noise(x + 1, sy + 1, w - 2, 1, C.wood0, 0.25, k);
  }
  for (const lx of [x + 3, x + w - 6]) {
    p.rect(lx, y + 6, 3, h - 6, C.void); p.vl(lx + 1, y + 6, h - 6, C.steel1);
    p.rect(lx - 1, y + h - 1, 5, 1, C.navy2);
  }
  p.hl(x + 5, y + 8, w - 10, C.navy2);
  return { w, h };
}

// fireCabinet(ctx, x, y, { remap })  red cabinet with extinguisher window, 18x34.
export function fireCabinet(ctx, x, y, opts = {}) {
  const { remap } = opts;
  const p = pen(ctx, remap);
  const w = 20, h = 36;
  // header plate
  p.rect(x, y, w, 9, C.void); p.rect(x + 1, y + 1, w - 2, 7, C.red); p.hl(x + 1, y + 1, w - 2, C.rust3);
  p.text('FIRE', x + 3, y + 2, C.cream2, 'f3'); p.hl(x + 1, y + 7, w - 2, C.rust0);
  // cabinet
  const cy = y + 10;
  p.rect(x, cy, w, h - 10, C.void);
  p.rect(x + 1, cy + 1, w - 2, h - 12, C.rust1);
  p.mottle(x + 1, cy + 1, w - 2, h - 12, C.red, 5, 6, 2);
  p.hl(x + 1, cy + 1, w - 2, C.rust3); p.vl(x + 1, cy + 1, h - 12, C.rust2); p.vl(x + w - 2, cy + 1, h - 12, C.rust0);
  // window with extinguisher
  p.rect(x + 3, cy + 3, w - 6, h - 18, C.ink);
  p.rect(x + 7, cy + 7, 6, h - 24, C.red); p.vl(x + 7, cy + 7, h - 24, C.rust3); p.vl(x + 12, cy + 7, h - 24, C.rust0);
  p.rect(x + 8, cy + 5, 4, 2, C.void); p.px(x + 9, cy + 4, C.steel2); p.line(x + 11, cy + 5, x + 14, cy + 9, C.void);
  p.rect(x + 8, cy + 12, 4, 3, C.cream); p.px(x + 9, cy + 13, C.red);
  // glass glare
  p.line(x + 4, cy + h - 17, x + 9, cy + 4, C.steel1); p.dith(x + 5, cy + 4, 2, h - 20, null, C.steel0, 3);
  // break-glass hammer + handle
  p.rect(x + 3, y + h - 6, w - 6, 3, C.cream); p.text('PULL', x + 3, y + h - 7, C.red, 'f3');
  p.rect(x + w - 4, cy + 10, 2, 5, C.steel2);
  return { w, h };
}

// coffeeMachine(ctx, x, y, { remap })  counter machine with carafe + mug, 20x26.
export function coffeeMachine(ctx, x, y, opts = {}) {
  const { remap, steam = true } = opts;
  const p = pen(ctx, remap);
  const w = 20, h = 26;
  floorShadow(p, x, y + h, w);
  // body
  p.rect(x, y, w, h, C.void);
  p.rect(x + 1, y + 1, w - 2, h - 2, C.navy2);
  p.hl(x + 1, y + 1, w - 2, C.steel1); p.vl(x + 1, y + 1, h - 2, C.steel0);
  // top: hot plate / brand strip
  p.rect(x + 2, y + 3, w - 4, 4, C.ink); p.text('JAVA', x + 3, y + 3, C.amber, 'f3');
  p.px(x + w - 4, y + 4, C.red); p.px(x + w - 4, y + 6, C.mint2);
  // brew alcove
  p.rect(x + 2, y + 8, w - 4, h - 13, C.void);
  p.dith(x + 2, y + 8, w - 4, 3, null, C.navy, 6);
  p.rect(x + 7, y + 8, 6, 2, C.steel1); p.px(x + 9, y + 10, C.hairDark); // spout + drip
  // carafe
  const cx = x + 5, cy = y + 13;
  p.rect(cx, cy, 9, 7, C.steel2); p.rect(cx + 1, cy + 1, 7, 6, C.navy);
  p.rect(cx + 1, cy + 3, 7, 4, C.hairDark); p.hl(cx + 1, cy + 3, 7, C.rust1);
  p.vl(cx + 1, cy + 1, 5, C.steel3); p.rect(cx + 9, cy + 1, 1, 4, C.void);
  p.hl(cx - 1, cy - 1, 11, C.ink);
  // drip tray
  p.rect(x + 2, y + h - 5, w - 4, 3, C.steel0); p.hl(x + 2, y + h - 5, w - 4, C.steel2);
  for (let i = x + 3; i < x + w - 3; i += 2) p.px(i, y + h - 4, C.void);
  // mug beside + steam
  p.rect(x + w + 1, y + h - 6, 4, 6, C.cream); p.vl(x + w + 4, y + h - 6, 6, C.stone2);
  p.px(x + w + 5, y + h - 5, C.cream); p.px(x + w + 5, y + h - 4, C.cream); p.hl(x + w + 1, y + h - 6, 4, C.hairDark);
  if (steam) for (let k = 0; k < 6; k++) { const X = x + w + 2 + (k % 2), Y = y + h - 8 - k; if (BAYER4[Y & 3][X & 3] < 9) p.px(X, Y, C.steel1); }
  return { w: w + 6, h };
}
