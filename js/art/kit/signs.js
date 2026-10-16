// Signs: enamel plaques, embossed metal, painted stencils, hanging cards, big ZONE letters.
import { C } from '../palette.js?v=68';
import { BAYER4 } from '../dither.js?v=68';
import { FONT5, textWidth } from '../../engine/font.js?v=68';
import { pen } from './wall.js?v=68';

const glyph = (ch) => FONT5[ch] ?? FONT5[ch.toUpperCase()] ?? FONT5['?'];

// bigText(ctx, s, x, y, c, scale, { shadow, worn, seed, remap })  FONT5 scaled up with paint wear.
export function bigText(ctx, s, x, y, c, scale = 2, opts = {}) {
  const { shadow = null, worn = 0, seed = 0, remap, light = null } = opts;
  const p = pen(ctx, remap);
  const adv = 6 * scale;
  const pass = (ox, oy, col, wear) => {
    let i = 0;
    for (const ch of s) {
      const g = glyph(ch);
      for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) {
        if (g[r][q] !== '1') continue;
        for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
          const X = x + ox + i * adv + q * scale + sx, Y = y + oy + r * scale + sy;
          if (wear && p.rnd(X, Y, seed) < worn) continue;
          let cc = col;
          if (light != null && col === c && sy === 0 && (r === 0 || g[r - 1][q] !== '1')) cc = light;
          p.px(X, Y, cc);
        }
      }
      i++;
    }
  };
  if (shadow != null) pass(1, 1, shadow, false);
  pass(0, 0, c, worn > 0);
  return { w: [...s].length * adv - scale, h: 7 * scale };
}

const STYLE = {
  enamel: { bg: C.steel0, fg: C.cream, hi: C.steel2, lo: C.navy2 },
  embossed: { bg: C.stone2, fg: C.cream2, hi: C.cream, lo: C.stone0 },
  stencil: { bg: null, fg: C.cream, hi: null, lo: C.stone0 },
  card: { bg: C.cream, fg: C.navy, hi: C.cream2, lo: C.stone2 },
};

// signPlate(ctx, x, y, text, { style, fg, bg, pad, w, lines, remap, center }) -> {w, h}  center: each line centred (enamel)
export function signPlate(ctx, x, y, text, opts = {}) {
  const { style = 'enamel', remap, pad = 5, seed = 0 } = opts;
  const S = { ...STYLE[style] ?? STYLE.enamel };
  if (opts.fg != null) S.fg = opts.fg;
  if (opts.bg != null) S.bg = opts.bg;
  if (opts.hi != null) S.hi = opts.hi;
  if (opts.lo != null) S.lo = opts.lo;
  const p = pen(ctx, remap);
  const lines = Array.isArray(text) ? text : [text];
  const tw = Math.max(...lines.map((l) => textWidth(l)));
  const w = opts.w ?? tw + pad * 2 + 2;
  const h = opts.h ?? lines.length * 9 + pad * 2 - 1;
  const tx = x + Math.floor((w - tw) / 2);
  const ty0 = y + Math.floor((h - (lines.length * 9 - 2)) / 2);

  if (style === 'stencil') {
    // Painted straight on the wall: dithered overspray, worn letters.
    lines.forEach((l, k) => {
      const ty = ty0 + k * 9;
      const tmpS = [...l];
      tmpS.forEach((ch, i) => {
        const g = glyph(ch);
        for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) {
          if (g[r][q] !== '1') continue;
          const X = tx + i * 6 + q, Y = ty + r;
          // stencil bridges: break vertical strokes at row 3
          if (r === 3 && (q === 0 || q === 4) && 'BDEOPRS08'.includes(ch.toUpperCase())) continue;
          if (p.rnd(X, Y, seed) < 0.1) { p.px(X, Y, S.lo); continue; }
          p.px(X, Y, S.fg);
          if (BAYER4[(Y + 1) & 3][X & 3] < 3) p.px(X, Y + 1, S.lo);
        }
      });
    });
    return { w, h };
  }

  if (style === 'card') return hangingCard(ctx, x, y, lines, { ...opts, w, h });

  // Plate: shadow, outline, fill, texture, bevel.
  const round = style === 'enamel';
  const plate = (ox, oy, c) => {
    if (round) { p.rect(x + ox + 1, y + oy, w - 2, h, c); p.rect(x + ox, y + oy + 1, w, h - 2, c); } else p.rect(x + ox, y + oy, w, h, c);
  };
  plate(1, 1, C.void);
  plate(0, 0, C.ink);
  p.rect(x + 1, y + 1, w - 2, h - 2, S.bg);
  p.mottle(x + 1, y + 1, w - 2, h - 2, S.hi, 6, 4, seed);
  p.noise(x + 1, y + 1, w - 2, h - 2, S.lo, 0.06, seed + 1);
  p.bevel(x + 1, y + 1, w - 2, h - 2, S.hi, S.lo);
  if (style === 'enamel') {
    // inset border line + rounded corners + chipped enamel
    p.hl(x + 3, y + 3, w - 6, S.hi); p.hl(x + 3, y + h - 4, w - 6, S.hi);
    p.vl(x + 3, y + 3, h - 6, S.hi); p.vl(x + w - 4, y + 3, h - 6, S.hi);
    p.hl(x + 4, y + 4, w - 8, S.lo); p.vl(x + 4, y + 4, h - 8, S.lo);
    for (let k = 0; k < 4; k++) {
      const ex = x + 1 + Math.floor(p.rnd(k, x, seed) * (w - 3)), ey = p.rnd(x, k, seed) < 0.5 ? y + 1 : y + h - 2;
      p.px(ex, ey, C.ink); p.px(ex + 1, ey, C.stone0);
    }
    lines.forEach((l, k) => p.textShadow(l, opts.center ? x + Math.floor((w - textWidth(l)) / 2) : tx, ty0 + k * 9, S.fg, S.lo));
    p.screw(x + 1, y + Math.floor(h / 2) - 1, C.steel3, C.ink);
    p.screw(x + w - 3, y + Math.floor(h / 2) - 1, C.steel3, C.ink);
  } else {
    // embossed: raised letters (light top-left, dark bottom-right), rivets.
    lines.forEach((l, k) => {
      const ty = ty0 + k * 9;
      p.text(l, tx + 1, ty + 1, S.lo);
      p.text(l, tx, ty, S.fg);
    });
    p.rivet(x + 2, y + 2, S.hi, S.lo, S.bg); p.rivet(x + w - 4, y + 2, S.hi, S.lo, S.bg);
    p.rivet(x + 2, y + h - 4, S.hi, S.lo, S.bg); p.rivet(x + w - 4, y + h - 4, S.hi, S.lo, S.bg);
    p.dithV(x + 1, y + h - 4, w - 2, 3, S.lo, 0, 6);
  }
  return { w, h };
}

// hangingCard(ctx, x, y, lines, { w, h, stripe, remap })  paper card on a clip + string.
export function hangingCard(ctx, x, y, lines, opts = {}) {
  const { remap, stripe = C.mint1, fg = C.navy2, seed = 0 } = opts;
  const p = pen(ctx, remap);
  const L = Array.isArray(lines) ? lines : [lines];
  const tw = Math.max(...L.map((l) => textWidth(l)));
  const w = opts.w ?? tw + 8;
  const h = opts.h ?? L.length * 9 + 9;
  // hanger: clip + string
  const cx = x + Math.floor(w / 2);
  p.vl(cx, y - 6, 4, C.steel1); p.rect(cx - 2, y - 3, 5, 4, C.void); p.rect(cx - 1, y - 2, 3, 2, C.steel2); p.px(cx - 1, y - 2, C.steel3);
  // drop shadow on wall
  p.dith(x + 2, y + 2, w, h, null, C.void, 10);
  // paper
  p.rect(x, y, w - 2, h, C.stone2); p.rect(x + w - 2, y + 2, 2, h - 2, C.stone2);
  p.rect(x + 1, y + 1, w - 2, h - 2, C.cream);
  p.noise(x + 1, y + 1, w - 2, h - 2, C.stone3, 0.08, seed);
  p.hl(x + 1, y + 1, w - 2, C.cream2);
  p.vl(x + w - 2, y + 2, h - 3, C.stone3);
  p.dith(x + 1, y + h - 5, w - 2, 2, null, C.stone3, 6);
  // punch hole + text + status stripe
  p.px(cx, y + 2, C.stone1);
  L.forEach((l, k) => p.text(l, x + 4, y + 4 + k * 9, fg));
  p.rect(x + 1, y + h - 3, w - 2, 2, stripe);
  p.hl(x + 1, y + h - 3, w - 2, stripe === C.mint1 ? C.mint2 : stripe);
  p.hl(x, y + h - 1, w, C.stone1);
  // dog-eared corner
  p.px(x + w - 2, y + 1, C.stone2); p.px(x + w - 1, y + 1, C.stone1); p.px(x + w - 2, y, C.stone1);
  return { w, h };
}

// zoneStencil(ctx, x, y, text, { c, scale, remap })  big worn wall letters with a shadow.
export function zoneStencil(ctx, x, y, text, opts = {}) {
  const { c = C.stone3, shadow = C.stone0, scale = 2, remap, seed = 3 } = opts;
  return bigText(ctx, text, x, y, c, scale, { shadow, worn: 0.14, seed, remap });
}
