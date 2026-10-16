// Wall screens: bezel + glass + scanlines + content callback + emissive glow spill.
import { C } from '../palette.js?v=68';
import { BAYER4 } from '../dither.js?v=68';
import { pen } from './wall.js?v=68';

// A ctx proxy that only lets fillRect through inside the rectangle.
function clipped(ctx, cx, cy, cw, ch) {
  return {
    fillStyle: '#000000',
    fillRect(x, y, w, h) {
      const x0 = Math.max(x, cx), y0 = Math.max(y, cy);
      const x1 = Math.min(x + w, cx + cw), y1 = Math.min(y + h, cy + ch);
      if (x1 <= x0 || y1 <= y0) return;
      ctx.fillStyle = this.fillStyle;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    },
  };
}

const BEZEL = {
  steel: { out: C.void, base: C.steel0, hi: C.steel2, lo: C.navy2, mid: C.steel1 },
  beige: { out: C.stone0, base: C.stone2, hi: C.cream, lo: C.stone1, mid: C.stone3 },
  dark: { out: C.void, base: C.navy2, hi: C.steel0, lo: C.ink, mid: C.navy2 },
};

// screen(ctx, x, y, w, h, contentFn(ctx, x, y, w, h), { bezel, glow, label, remap, tint })
export function screen(ctx, x, y, w, h, contentFn, opts = {}) {
  const { bezel = 'steel', glow = true, label = '', remap, tint = C.mint1, b = 3 } = opts;
  const p = pen(ctx, remap);
  const B = BEZEL[bezel] ?? BEZEL.steel;
  // Glow spill on the wall beneath (dither, not alpha).
  if (glow) {
    for (let j = 0; j < 10; j++) {
      const lvl = Math.round(7 - j * 0.7);
      const inset = Math.max(0, 3 - j);
      p.dith(x + inset - j, y + h + j, w - inset * 2 + j * 2, 1, null, j < 4 ? C.mint0 : C.navy2, lvl);
    }
    p.dith(x - 2, y + 2, 2, h - 4, null, C.mint0, 3);
    p.dith(x + w, y + 2, 2, h - 4, null, C.mint0, 3);
  }
  // Bezel.
  p.rect(x + 1, y + 1, w, h, C.void);
  p.box(x, y, w, h, B.base, B.hi, B.lo, B.out);
  p.noise(x + 1, y + 1, w - 2, h - 2, B.lo, 0.08, x + y);
  p.hl(x + 1, y + 1, w - 2, B.hi);
  // Inner recess.
  const gx = x + b, gy = y + b, gw = w - 2 * b, gh = h - 2 * b - (label ? 5 : 0);
  p.rect(gx - 1, gy - 1, gw + 2, gh + 2, B.lo);
  p.hl(gx - 1, gy + gh, gw + 2, B.hi); p.vl(gx + gw, gy - 1, gh + 2, B.hi);
  // Glass.
  p.rect(gx, gy, gw, gh, C.ink);
  p.dith(gx, gy, gw, gh, null, C.mint0, 2);
  p.dithV(gx, gy, gw, gh, C.navy, 0, 3);
  for (let j = 1; j < gh; j += 2) p.dith(gx, gy + j, gw, 1, null, C.void, 6);
  if (contentFn) contentFn(clipped(ctx, gx + 1, gy + 1, gw - 2, gh - 2), gx + 1, gy + 1, gw - 2, gh - 2);
  // Scanlines + vignette + glare.
  p.dith(gx, gy, gw, 1, null, C.void, 10); p.dith(gx, gy, 1, gh, null, C.void, 8);
  p.dith(gx + gw - 1, gy, 1, gh, null, C.void, 8); p.dith(gx, gy + gh - 1, gw, 1, null, C.void, 8);
  for (let k = 0; k < Math.min(gw, gh) * 0.6; k++) {
    const X = gx + 2 + k, Y = gy + gh - 3 - Math.floor(k * 1.4);
    if (Y > gy) { if (BAYER4[Y & 3][X & 3] < 3) p.px(X, Y, tint === C.mint1 ? C.mint1 : tint); }
  }
  // Bezel screws, label, power LED.
  p.screw(x + 1, y + 1, B.hi, B.lo); p.screw(x + w - 3, y + 1, B.hi, B.lo);
  if (h > 20) { p.screw(x + 1, y + h - 3, B.hi, B.lo); p.screw(x + w - 3, y + h - 3, B.hi, B.lo); }
  if (label) {
    p.text(label, x + b + 1, y + h - b - 4, bezel === 'beige' ? C.stone0 : C.steel2, 'f3');
  }
  p.px(x + w - b - 2, y + h - 2 - (label ? 2 : 1), C.mint2);
  p.px(x + w - b - 4, y + h - 2 - (label ? 2 : 1), C.amber);
  return { w, h };
}

// --- content callbacks: (ctx, x, y, w, h, opts) ---

export function textRoll(ctx, x, y, w, h, opts = {}) {
  const { lines = [], color = C.mint2, font = 'f5', cursor = true, remap } = opts;
  const p = pen(ctx, remap);
  const lh = font === 'f5' ? 9 : 6;
  let yy = y + 1;
  lines.forEach((l, k) => {
    if (yy + lh - 2 > y + h) return;
    const c = l.startsWith('!') ? C.amber : l.startsWith('#') ? C.mint1 : color;
    const s = l.replace(/^[!#]/, '');
    p.text(s, x + 2, yy, c, font);
    if (cursor && k === lines.length - 1) p.rect(x + 3 + s.length * (font === 'f5' ? 6 : 4), yy, font === 'f5' ? 5 : 3, lh - 2, c);
    yy += lh;
  });
}

export function statusBoard(ctx, x, y, w, h, opts = {}) {
  const { rows = [], title = '', remap } = opts;
  const p = pen(ctx, remap);
  let yy = y + 1;
  if (title) {
    p.rect(x, yy - 1, w, 8, C.mint0); p.text(title, x + 2, yy + 1, C.mint2, 'f3');
    for (let i = x + w - 10; i < x + w - 2; i += 2) p.px(i, yy + 3, C.mint1);
    yy += 9;
  }
  const ST = { ok: C.mint2, warn: C.amber, fail: C.red, off: C.steel0, wait: C.pink };
  for (const [label, st] of rows) {
    if (yy + 5 > y + h) break;
    p.text(label, x + 2, yy, C.mint1, 'f3');
    const sc = ST[st] ?? C.mint2;
    // dot leaders
    for (let i = x + 4 + label.length * 4; i < x + w - 16; i += 2) p.px(i, yy + 4, C.mint0);
    p.rect(x + w - 13, yy, 3, 5, sc); p.px(x + w - 13, yy, C.cream2);
    p.text(st.toUpperCase().slice(0, 2), x + w - 8, yy, sc, 'f3');
    yy += 7;
  }
}

export function lifeGrid(ctx, x, y, w, h, opts = {}) {
  const { seed = 1, gen = 0, cell = 2, remap } = opts;
  const p = pen(ctx, remap);
  const cw = Math.floor(w / cell), ch = Math.floor(h / cell);
  let g = Array.from({ length: ch }, (_, j) => Array.from({ length: cw }, (_, i) => p.rnd(i, j, seed) < 0.33 ? 1 : 0));
  for (let s = 0; s < gen; s++) {
    g = g.map((row, j) => row.map((v, i) => {
      let n = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (di || dj) n += g[(j + dj + ch) % ch][(i + di + cw) % cw];
      }
      return n === 3 || (v && n === 2) ? 1 : 0;
    }));
  }
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
    const X = x + i * cell, Y = y + j * cell;
    if (g[j][i]) { p.rect(X, Y, cell - (cell > 2 ? 1 : 0), cell - (cell > 2 ? 1 : 0), C.mint2); p.px(X, Y, C.cream2); }
    else if ((i + j) % 4 === 0) p.px(X, Y, C.mint0);
  }
}

export function lineGraph(ctx, x, y, w, h, opts = {}) {
  const { seed = 1, color = C.mint2, remap } = opts;
  const p = pen(ctx, remap);
  for (let gx = x; gx < x + w; gx += 6) p.dith(gx, y, 1, h, null, C.mint0, 8);
  for (let gy = y + h - 1; gy > y; gy -= 5) p.dith(x, gy, w, 1, null, C.mint0, 8);
  p.vl(x, y, h, C.mint1); p.hl(x, y + h - 1, w, C.mint1);
  let v = 0.5, prev = null;
  for (let i = 1; i < w; i++) {
    v += (p.rnd(i, seed, 3) - 0.48) * 0.18; v = Math.min(0.95, Math.max(0.08, v));
    const Y = y + Math.round((1 - v) * (h - 2));
    if (prev != null) p.line(x + i - 1, prev, x + i, Y, color);
    p.dith(x + i, Y + 1, 1, y + h - 1 - Y - 1, null, C.mint0, 6);
    prev = Y;
  }
  if (prev != null) { p.rect(x + w - 3, prev - 1, 3, 3, C.cream2); }
}

// CI pipeline: stages as boxes joined by arrows, coloured by state.
export function pipeline(ctx, x, y, w, h, opts = {}) {
  const { stages = [['LINT', 'ok'], ['TEST', 'ok'], ['BUILD', 'run'], ['SHIP', 'off']], remap } = opts;
  const p = pen(ctx, remap);
  const n = stages.length, sw = Math.floor((w - (n - 1) * 3) / n);
  const ST = { ok: [C.mint0, C.mint2], run: [C.rust0, C.amber], fail: [C.rust0, C.red], off: [C.navy, C.steel0] };
  const by = y + Math.floor(h / 2) - 5;
  stages.forEach(([label, st], k) => {
    const [bg, fg] = ST[st] ?? ST.off;
    const bx = x + k * (sw + 3);
    p.rect(bx, by, sw, 11, fg); p.rect(bx + 1, by + 1, sw - 2, 9, bg);
    p.text(label.slice(0, Math.max(1, Math.floor((sw - 3) / 4))), bx + 2, by + 3, fg, 'f3');
    if (k < n - 1) { p.hl(bx + sw, by + 5, 3, C.mint1); }
    if (st === 'run') for (let i = 0; i < sw - 4; i += 3) p.px(bx + 2 + i, by + 12, C.amber);
  });
  p.text('#' + 4000 + (opts.build ?? 412), x + 1, y + 1, C.mint1, 'f3');
}
