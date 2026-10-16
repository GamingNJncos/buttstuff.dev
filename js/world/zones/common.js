// Shared building blocks for floor compositions (all pure palette drawing through pen()).
import { C, PAL } from '../../art/palette.js?v=68';
import { FONT5 } from '../../engine/font.js?v=68';
import { pen } from '../../art/kit/wall.js?v=68';
import { pipeRun } from '../../art/kit/pipes.js?v=68';
import { girder, junctionBox, tickerStrip } from '../../art/kit/slab.js?v=68';
import { pipeV } from '../../art/kit/pipes.js?v=68';
import { BAYER4 } from '../../art/dither.js?v=68';

export { C, PAL, pen, BAYER4 };

const glyph = (ch) => FONT5[ch] ?? FONT5[ch.toUpperCase()] ?? FONT5['?'];

// Large readable stone blocks with seams; subtle dither only. ramp = [dark, base, light, hi].
export function blockWall(p, x0, y0, w, h, opts = {}) {
  const { ramp = [C.stone1, C.stone2, C.stone3, C.cream], bw = 48, bh = 18, seed = 1, grime = true } = opts;
  const [dk, base, lt] = ramp;
  // calm: flat blocks, thin seams, very light per-block variation; contrast is left to props
  p.rect(x0, y0, w, h, base);
  for (let row = 0, by = y0; by < y0 + h; row++, by += bh) {
    const off = row % 2 ? bw / 2 : 0;
    for (let bx = x0 - off; bx < x0 + w; bx += bw) {
      const X0 = Math.max(x0, bx), X1 = Math.min(x0 + w, bx + bw), Y1 = Math.min(y0 + h, by + bh);
      const v = p.rnd(bx, by, seed);
      if (v < 0.2) p.dith(X0, by, X1 - X0, Y1 - by, null, dk, 1);
      p.dith(X0, Y1 - 1, X1 - X0, 1, null, dk, 12);
      if (bx >= x0) p.dith(bx, by, 1, Y1 - by, null, dk, 12);
      p.dith(X0, by, X1 - X0, 1, null, lt, 5);
    }
  }
  if (grime) p.dithV(x0, y0 + Math.floor(h * 0.7), w, Math.ceil(h * 0.3), dk, 0, 4);
}

// Riveted steel panels (larger, calmer than the kit steel). ramp = [dark, base, light, hi]
export function steelPanels(p, x0, y0, w, h, opts = {}) {
  const { ramp = [C.navy, C.navy2, C.steel0, C.steel1], pw = 32, seed = 2 } = opts;
  const [dk, base, lt, hi] = ramp;
  p.rect(x0, y0, w, h, base);
  for (let px0 = x0; px0 < x0 + w; px0 += pw) {
    const ww = Math.min(pw, x0 + w - px0);
    p.vl(px0, y0, h, C.ink); p.vl(px0 + 1, y0, h, hi === C.steel1 ? lt : hi);
    p.vl(px0 + ww - 1, y0, h, dk);
    for (let ry = y0 + 4; ry < y0 + h - 2; ry += 14) { p.px(px0 + 3, ry, hi); p.px(px0 + 4, ry + 1, C.ink); p.px(px0 + ww - 4, ry, hi); p.px(px0 + ww - 3, ry + 1, C.ink); }
  }
  p.hl(x0, y0, w, hi); p.hl(x0, y0 + h - 1, w, C.ink);
}

// Steel I-column (pilaster), w ~ 8.
export function column(p, x, y0, y1, opts = {}) {
  const { w = 8, ramp = [C.navy2, C.steel0, C.steel1, C.steel2] } = opts;
  const [dk, base, lt, hi] = ramp;
  const h = y1 - y0;
  p.rect(x, y0, w, h, C.void);
  p.rect(x + 1, y0, w - 2, h, base);
  p.vl(x + 1, y0, h, hi); p.vl(x + 2, y0, h, lt); p.vl(x + w - 2, y0, h, dk);
  p.dith(x + 3, y0, w - 5, h, null, lt, 3);
  for (let ry = y0 + 5; ry < y1 - 3; ry += 10) p.rivet(x + 3, ry, hi, C.ink, base);
  // base + cap plates
  p.rect(x - 1, y1 - 5, w + 2, 5, C.void); p.rect(x, y1 - 4, w, 3, lt); p.hl(x, y1 - 4, w, hi);
  p.rect(x - 1, y0, w + 2, 3, C.void); p.hl(x, y0 + 1, w, lt);
}

// Ceiling band: slab underside, pipe run, cable tray, trim, light fixtures.
export function ceiling(ctx, x0, x1, opts = {}) {
  const { trim = C.rust1, lights = [], pipe = 'pale', seed = 1, skip = [] } = opts;
  const p = pen(ctx);
  const w = x1 - x0;
  p.rect(x0, 0, w, 19, C.ink);
  p.dith(x0, 0, w, 3, null, C.void, 8);
  pipeRun(ctx, x0, 2, x1, { r: 3, color: pipe, flanges: 64, brackets: 0, seed });
  // tray + cables
  p.rect(x0, 11, w, 4, C.void); p.hl(x0, 11, w, C.navy2); p.hl(x0, 14, w, C.navy2);
  for (let i = x0; i < x1; i++) {
    const k = (i >> 3) % 5;
    p.px(i, 12, [C.amber, C.mint0, C.rust1, C.steel0, C.mint0][k]);
    p.px(i, 13, [C.navy2, C.rust0, C.steel0, C.mint0, C.navy2][(k + 2) % 5]);
  }
  for (let bx = x0 + 16; bx < x1; bx += 48) { p.rect(bx, 9, 2, 7, C.steel0); p.px(bx, 9, C.steel2); }
  p.hl(x0, 16, w, trim); p.hl(x0, 17, w, C.void); p.dith(x0, 16, w, 1, null, C.rust3, 2);
  for (const [sx, sw] of skip) p.rect(sx, 0, sw, 19, C.void);
  for (const lx of lights) fixture(p, lx, 15);
  return p;
}

// Fluorescent fixture hanging under the tray at (cx, y) with a faint cone on the wall below.
export function fixture(p, cx, y, opts = {}) {
  const { cone = 40, lit = C.cream, w = 22 } = opts;
  p.rect(cx - (w >> 1), y, w, 4, C.void);
  p.rect(cx - (w >> 1) + 1, y + 1, w - 2, 1, C.steel0);
  p.rect(cx - (w >> 1) + 1, y + 2, w - 2, 1, C.cream2);
  p.px(cx - (w >> 1) + 1, y + 2, C.cream); p.px(cx + (w >> 1) - 2, y + 2, C.cream);
  for (let j = 0; j < cone; j++) {
    const hw = (w >> 1) + Math.round(j * 0.55);
    const fall = 4 - (j / cone) * 4;
    for (let i = -hw; i <= hw; i++) {
      const t = Math.abs(i) / (hw + 1);
      const X = cx + i, Y = y + 4 + j;
      if (BAYER4[Y & 3][X & 3] < Math.round(fall * (1 - t * t))) p.px(X, Y, lit);
    }
  }
}

// Hazard base strip + walkway (y = top of strip).
export function baseStrip(p, x0, w, y) {
  p.rect(x0, y, w, 6, C.ink);
  for (let i = 0; i < w; i++) for (let j = 1; j < 5; j++) {
    const on = ((x0 + i + j) % 8) < 4;
    p.px(x0 + i, y + j, on ? (j === 4 ? C.amber : C.yellow) : C.ink);
  }
  p.hl(x0, y, w, C.void); p.dith(x0, y + 1, w, 1, null, C.cream, 3);
}

export function walkway(p, x0, w, y) {
  p.rect(x0, y, w, 6, C.navy2);
  p.hl(x0, y, w, C.steel2); p.hl(x0, y + 1, w, C.steel1); p.hl(x0, y + 2, w, C.steel0);
  for (let i = x0; i < x0 + w; i += 16) { p.vl(i, y + 1, 4, C.navy); p.px(i + 1, y + 1, C.steel2); }
  p.hl(x0, y + 5, w, C.ink);
}

// 45-px service slab under the room (y = local top of slab).
export function slabBand(ctx, x0, x1, y, opts = {}) {
  const { seed = 1, deck = [C.stone0, C.hairDark, C.stone1, C.stone2], vpipes = [], boxes = [] } = opts;
  const p = pen(ctx);
  const w = x1 - x0;
  // speckled deck
  p.rect(x0, y, w, 21, deck[0]);
  p.mottle(x0, y, w, 21, deck[1], 10, 6, seed);
  p.noise(x0, y, w, 21, deck[2], 0.06, seed + 1);
  p.noise(x0, y, w, 21, deck[3], 0.02, seed + 2);
  p.noise(x0, y, w, 21, C.void, 0.03, seed + 3);
  p.dithV(x0, y, w, 4, C.void, 10, 0);
  for (let sx = x0 + 40; sx < x1; sx += 80) { p.vl(sx, y + 3, 18, deck[1]); p.dith(sx + 1, y + 3, 1, 18, null, deck[2], 6); }
  p.hl(x0, y + 20, w, C.void);
  // girder
  girder(ctx, x0, y + 21, w, { h: 11, light: C.steel2, mid: C.steel1, dark: C.steel0 });
  p.hl(x0, y + 32, w, C.void);
  for (const vx of vpipes) pipeV(ctx, vx, y, y + 34, { r: 2, color: 'steel', flanges: 14 });
  for (const bx of boxes) junctionBox(ctx, bx, y + 5, { w: 15, h: 12 });
  // ticker housing (text is live)
  p.rect(x0, y + 33, w, 12, C.void);
  p.hl(x0, y + 33, w, C.navy); p.hl(x0, y + 44, w, C.ink);
  for (let j = y + 35; j < y + 43; j += 2) for (let i = x0 + ((j >> 1) & 1); i < x1; i += 2) p.px(i, j, C.ink);
  return p;
}

// Slab ticker text, clipped to [x0, x1). Positions are anchored to world x = 0, so two segments
// with the same offset read as one continuous strip passing behind the shaft.
export function slabTicker(ctx, x0, x1, y, text, offset, color = C.rust2, dim = C.rust0) {
  const clip = {
    fillStyle: '#000',
    fillRect(px, py, pw, ph) {
      const a = Math.max(px, x0), b = Math.min(px + pw, x1);
      if (b > a) { ctx.fillStyle = this.fillStyle; ctx.fillRect(a, py, b - a, ph); }
    },
  };
  const p = pen(clip);
  const step = [...text].length * 6;
  const o = ((offset % step) + step) % step;
  for (let tx = -o; tx < x1; tx += step) { if (tx + step < x0) continue; p.text(text, tx + 1, y + 1, dim); p.text(text, tx, y, color); }
}

// Embossed giant letters: FONT5 scaled with outline, top-left light, bottom-right shade, drop shadow.
export function embossText(p, s, x, y, scale, opts = {}) {
  const { fill = C.steel1, hi = C.steel3, lo = C.steel0, edge = C.navy, shadow = C.stone0, accent = {}, gap = 1 } = opts;
  const adv = 5 * scale + gap * scale;
  const cells = [];
  [...s].forEach((ch, i) => {
    const g = glyph(ch);
    for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) if (g[r][q] === '1') cells.push([i, r, q, ch]);
  });
  const on = new Set(cells.map(([i, r, q]) => `${i * 5 + q},${r}`));
  const lit = (gx, r) => on.has(`${gx},${r}`);
  // shadow + outline
  for (const [i, r, q] of cells) {
    const X = x + i * adv + q * scale, Y = y + r * scale;
    p.rect(X + 2, Y + 2, scale, scale, shadow);
  }
  for (const [i, r, q] of cells) {
    const X = x + i * adv + q * scale, Y = y + r * scale;
    p.rect(X - 1, Y - 1, scale + 2, scale + 2, edge);
  }
  for (const [i, r, q, ch] of cells) {
    const gx = i * 5 + q;
    const X = x + i * adv + q * scale, Y = y + r * scale;
    const A = accent[ch];
    const f = A ? A[0] : fill, h = A ? A[1] : hi, l = A ? A[2] : lo;
    if (opts.hollow) {
      // tube letters: light rim, dark lower rim, pale core (like engraved neon tubes)
      p.rect(X, Y, scale, scale, opts.core ?? C.cream);
      const up = lit(gx, r - 1), dn = lit(gx, r + 1), lf = lit(gx - 1, r), rt = lit(gx + 1, r);
      if (!up) p.hl(X, Y, scale, f);
      if (!lf) p.vl(X, Y, scale, f);
      if (!dn) p.hl(X, Y + scale - 1, scale, l);
      if (!rt) p.vl(X + scale - 1, Y, scale, l);
      if (up && lf && !lit(gx - 1, r - 1)) p.px(X, Y, f);
      if (!up && !lf) p.px(X, Y, h);
      continue;
    }
    p.rect(X, Y, scale, scale, f);
    if (!lit(gx, r - 1)) p.hl(X, Y, scale, h);
    if (!lit(gx - 1, r)) p.vl(X, Y, scale, h);
    if (!lit(gx, r + 1)) p.hl(X, Y + scale - 1, scale, l);
    if (!lit(gx + 1, r)) p.vl(X + scale - 1, Y, scale, l);
  }
  return { w: [...s].length * adv - gap * scale, h: 7 * scale };
}

export { pipeRun, pipeV, junctionBox, tickerStrip };

// Pamphlet stand (reused by floors 01..05, placed at levels.PAMPHLET_STANDS by the lift): wire floor rack,
// mint header cap, three pockets of folded leaflets (cream, coloured cover band, a printed line). x, y = top-left.
export function pamphletRack(p, x, y, opts = {}) {
  const { w = 16, h = 28, covers = [C.mint1, C.amber, C.pink] } = opts;
  p.dith(x - 3, y + h - 2, w + 6, 2, null, C.void, 9);
  // legs + splayed feet
  for (const lx of [x + 2, x + w - 3]) { p.rect(lx - 1, y + 22, 3, h - 23, C.void); p.vl(lx, y + 22, h - 23, C.steel1); }
  p.rect(x - 1, y + h - 2, 7, 2, C.void); p.hl(x, y + h - 2, 5, C.steel2);
  p.rect(x + w - 6, y + h - 2, 7, 2, C.void); p.hl(x + w - 5, y + h - 2, 5, C.steel2);
  // back panel
  p.rect(x, y + 2, w, 21, C.void); p.rect(x + 1, y + 3, w - 2, 19, C.navy2); p.vl(x + 1, y + 3, 19, C.steel0);
  // header cap
  p.rect(x - 1, y, w + 2, 4, C.void); p.hl(x, y + 1, w, C.mint2); p.hl(x, y + 2, w, C.mint1);
  // three pockets, two leaflets each, standing up behind a wire lip
  covers.forEach((band, k) => {
    const py = y + 4 + k * 6;
    for (let i = 0; i < 2; i++) {
      const lx = x + 2 + i * 6 + (k % 2);
      p.rect(lx, py, 6, 6, C.void); p.rect(lx + 1, py + 1, 5, 5, C.cream2);
      p.hl(lx + 1, py + 1, 5, band); p.hl(lx + 2, py + 3, 3, C.stone2); p.vl(lx + 5, py + 2, 4, C.cream);
    }
    p.hl(x + 1, py + 5, w - 2, C.steel2); p.px(x + 1, py + 5, C.steel3); p.hl(x + 1, py + 6, w - 2, C.void);
  });
}
