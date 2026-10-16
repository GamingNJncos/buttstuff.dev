// Art kit: shared pen (palette-indexed drawing primitives) + wall surfaces.
// Every colour argument is a C index; `remap` (32-long index table) recolours per zone.
import { PAL, C } from '../palette.js?v=68';
import { BAYER4 } from '../dither.js?v=68';
import { hash } from '../../engine/hash.js?v=68';
import { drawText } from '../../engine/font.js?v=68';

const H2 = (a, b, s = 0) => hash((a * 73856093) ^ (b * 19349663) ^ (s * 83492791));

// pen(ctx, remap) -> primitives that only ever paint PAL entries.
export function pen(ctx, remap) {
  const col = (i) => PAL[remap ? remap[i] : i];
  const p = {
    ctx, col, remap,
    rnd: H2,
    rect(x, y, w, h, c) {
      if (w <= 0 || h <= 0 || c == null) return;
      ctx.fillStyle = col(c);
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    },
    px(x, y, c) { p.rect(x, y, 1, 1, c); },
    hl(x, y, w, c) { p.rect(x, y, w, 1, c); },
    vl(x, y, h, c) { p.rect(x, y, 1, h, c); },
    // Ordered dither: paints b where bayer < level, a elsewhere (a = null -> overlay only b).
    dith(x, y, w, h, a, b, level) {
      if (level <= 0) { if (a != null) p.rect(x, y, w, h, a); return; }
      if (level >= 16) { p.rect(x, y, w, h, b); return; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const on = BAYER4[(y + j) & 3][(x + i) & 3] < level;
        if (on) p.px(x + i, y + j, b); else if (a != null) p.px(x + i, y + j, a);
      }
    },
    // Vertical ramp of an overlay colour from level l0 (top) to l1 (bottom).
    dithV(x, y, w, h, b, l0, l1, a = null) {
      for (let j = 0; j < h; j++) {
        const l = Math.round(l0 + ((l1 - l0) * j) / Math.max(1, h - 1));
        p.dith(x, y + j, w, 1, a, b, l);
      }
    },
    dithH(x, y, w, h, b, l0, l1) {
      for (let i = 0; i < w; i++) {
        const l = Math.round(l0 + ((l1 - l0) * i) / Math.max(1, w - 1));
        p.dith(x + i, y, 1, h, null, b, l);
      }
    },
    // Hash speckle noise.
    noise(x, y, w, h, c, density, seed = 0) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        if (H2(x + i, y + j, seed) < density) p.px(x + i, y + j, c);
      }
    },
    // Low-frequency mottling: coarse cells pick a dither level of colour c.
    mottle(x, y, w, h, c, cell, maxLevel, seed = 0) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const gx = Math.floor((x + i) / cell), gy = Math.floor((y + j) / cell);
        const fx = ((x + i) % cell) / cell, fy = ((y + j) % cell) / cell;
        const v00 = H2(gx, gy, seed), v10 = H2(gx + 1, gy, seed);
        const v01 = H2(gx, gy + 1, seed), v11 = H2(gx + 1, gy + 1, seed);
        const v = (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy;
        const l = Math.round(Math.max(0, v - 0.45) * 2 * maxLevel);
        if (BAYER4[(y + j) & 3][(x + i) & 3] < l) p.px(x + i, y + j, c);
      }
    },
    // Top/left highlight, bottom/right shadow (1 px).
    bevel(x, y, w, h, hi, lo) {
      p.hl(x, y, w - 1, hi); p.vl(x, y, h - 1, hi);
      p.hl(x + 1, y + h - 1, w - 1, lo); p.vl(x + w - 1, y + 1, h - 1, lo);
    },
    // Outline + fill + bevel.
    box(x, y, w, h, fill, hi, lo, out = C.void) {
      if (out != null) p.rect(x, y, w, h, out);
      const o = out != null ? 1 : 0;
      p.rect(x + o, y + o, w - 2 * o, h - 2 * o, fill);
      if (w - 2 * o > 1 && h - 2 * o > 1) p.bevel(x + o, y + o, w - 2 * o, h - 2 * o, hi, lo);
    },
    // 2x2 rivet: lit top-left, shadow bottom-right.
    rivet(x, y, hi = C.steel3, lo = C.navy, mid = C.steel1) {
      p.px(x, y, hi); p.px(x + 1, y, mid); p.px(x, y + 1, mid); p.px(x + 1, y + 1, lo);
    },
    // 1px screw with a shadow pixel below-right.
    screw(x, y, hi = C.steel2, lo = C.ink) { p.px(x, y, hi); p.px(x + 1, y + 1, lo); },
    line(x0, y0, x1, y1, c) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy;
      for (;;) {
        p.px(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * e;
        if (e2 >= dy) { e += dy; x0 += sx; }
        if (e2 <= dx) { e += dx; y0 += sy; }
      }
    },
    disc(cx, cy, r, c) {
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
        if (i * i + j * j <= r * r + r * 0.8) p.px(cx + i, cy + j, c);
      }
    },
    ring(cx, cy, r, c) {
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
        const d = i * i + j * j;
        if (d <= r * r + r * 0.8 && d > (r - 1) * (r - 1) + (r - 1) * 0.8) p.px(cx + i, cy + j, c);
      }
    },
    text(s, x, y, c, font = 'f5') { drawText(ctx, s, x, y, col(c), font); },
    textShadow(s, x, y, c, sh, font = 'f5') { drawText(ctx, s, x + 1, y + 1, col(sh), font); drawText(ctx, s, x, y, col(c), font); },
    // Grime: darken toward the bottom plus a few vertical streaks.
    grime(x, y, w, h, c, seed = 0, maxLevel = 9) {
      p.dithV(x, y, w, h, c, 0, maxLevel);
      for (let i = 0; i < w; i++) {
        const r = H2(x + i, 991, seed);
        if (r < 0.12) {
          const len = 2 + Math.floor(H2(x + i, 17, seed) * h * 0.8);
          p.dith(x + i, y + h - len, 1, len, null, c, 6);
        }
      }
    },
  };
  return p;
}

// Tone ramps (dark, base, light, highlight) per wall tone.
const RAMPS = {
  cool: [C.navy, C.navy2, C.steel0, C.steel1],
  warm: [C.rust0, C.rust1, C.rust2, C.rust3],
  neutral: [C.stone0, C.stone1, C.stone2, C.stone3],
};

function concrete(p, x, y, w, h, r, seed) {
  p.rect(x, y, w, h, r[1]);
  p.mottle(x, y, w, h, r[2], 9, 7, seed);
  p.mottle(x, y, w, h, r[0], 13, 6, seed + 5);
  p.noise(x, y, w, h, r[0], 0.035, seed + 1);
  p.noise(x, y, w, h, r[2], 0.015, seed + 2);
  // Form panels: horizontal + vertical joints with lit lower lip, form-tie holes.
  const ph = 30, pw = 44;
  for (let yy = y + ph; yy < y + h - 4; yy += ph) {
    p.hl(x, yy, w, r[0]); p.dith(x, yy + 1, w, 1, null, r[2], 8);
  }
  for (let row = 0; row * ph < h; row++) {
    const off = row % 2 ? pw / 2 : 0;
    for (let xx = x + off + pw; xx < x + w - 1; xx += pw) {
      const y0 = y + row * ph + 1, hh = Math.min(ph - 1, y + h - y0);
      p.vl(xx, y0, hh, r[0]); p.dith(xx + 1, y0, 1, hh, null, r[2], 6);
    }
    for (let xx = x + off + 8; xx < x + w - 2; xx += pw / 2) {
      for (const dy of [7, 21]) {
        const ty = y + row * ph + dy;
        if (ty < y + h - 2) { p.px(xx, ty, C.ink); p.px(xx + 1, ty, r[0]); p.px(xx, ty + 1, r[2]); }
      }
    }
  }
  // Water stains from joints.
  for (let i = 0; i < w; i += 3) {
    if (p.rnd(x + i, 3, seed) < 0.18) {
      const top = y + ph * Math.floor(p.rnd(x + i, 4, seed) * Math.max(1, h / ph)) + 1;
      const len = 4 + Math.floor(p.rnd(x + i, 5, seed) * 14);
      p.dith(x + i, top, 1, Math.min(len, y + h - top), null, r[0], 8);
    }
  }
}

function steel(p, x, y, w, h, r, seed) {
  const pw = 24, ph = Math.max(16, Math.min(40, Math.floor(h / 2)));
  p.rect(x, y, w, h, r[1]);
  p.mottle(x, y, w, h, r[2], 7, 5, seed);
  p.noise(x, y, w, h, r[0], 0.05, seed + 1);
  for (let px0 = x; px0 < x + w; px0 += pw) {
    const pww = Math.min(pw, x + w - px0);
    for (let py0 = y; py0 < y + h; py0 += ph) {
      const phh = Math.min(ph, y + h - py0);
      // Seam (dark) then a bevelled panel inside it.
      p.hl(px0, py0, pww, C.ink); p.vl(px0, py0, phh, C.ink);
      if (pww > 3 && phh > 3) {
        p.hl(px0 + 1, py0 + 1, pww - 2, r[3]); p.vl(px0 + 1, py0 + 1, phh - 2, r[2]);
        p.hl(px0 + 2, py0 + phh - 1, pww - 2, r[0]); p.vl(px0 + pww - 1, py0 + 2, phh - 2, r[0]);
        // Brushed streaks.
        for (let k = 0; k < 3; k++) {
          const sy = py0 + 3 + Math.floor(p.rnd(px0, py0 + k, seed) * (phh - 6));
          p.dith(px0 + 3, sy, pww - 6, 1, null, r[2], 5);
        }
        if (pww > 8 && phh > 8) {
          p.rivet(px0 + 3, py0 + 3, r[3], r[0], r[2]); p.rivet(px0 + pww - 5, py0 + 3, r[3], r[0], r[2]);
          p.rivet(px0 + 3, py0 + phh - 5, r[3], r[0], r[2]); p.rivet(px0 + pww - 5, py0 + phh - 5, r[3], r[0], r[2]);
        }
      }
    }
  }
}

function tile(p, x, y, w, h, r, seed) {
  const tw = 10, th = 7;
  p.rect(x, y, w, h, r[0]);
  for (let ty = y; ty < y + h; ty += th) {
    const off = (Math.floor((ty - y) / th) % 2) * 5;
    for (let tx = x - off; tx < x + w; tx += tw) {
      const x0 = Math.max(x, tx + 1), x1 = Math.min(x + w, tx + tw), y0 = ty + 1, y1 = Math.min(y + h, ty + th);
      if (x1 - x0 < 1 || y1 - y0 < 1) continue;
      const v = p.rnd(tx, ty, seed);
      const fill = v < 0.12 ? r[1] : r[2];
      p.rect(x0, y0, x1 - x0, y1 - y0, fill);
      if (v > 0.8) p.dith(x0, y0, x1 - x0, y1 - y0, null, r[3], 3);
      p.hl(x0, y0, x1 - x0, r[3]);
      p.dith(x0, y1 - 1, x1 - x0, 1, null, r[1], 10);
      if (v > 0.93 && x1 - x0 > 5) { p.line(x0 + 1, y0 + 1, x0 + 5, y1 - 1, r[0]); }
    }
  }
}

function wood(p, x, y, w, h, r, seed) {
  const pk = 7;
  p.rect(x, y, w, h, C.wood1);
  for (let px0 = x; px0 < x + w; px0 += pk) {
    const v = p.rnd(px0, 1, seed);
    const pw = Math.min(pk, x + w - px0);
    // per-plank tone: darker, base or warmer
    if (v < 0.3) p.dith(px0, y, pw, h, null, C.wood0, 4);
    else if (v > 0.75) p.dith(px0, y, pw, h, null, C.rust1, 3);
    // seam (dark) + lit left edge of the plank
    p.vl(px0, y, h, C.hairDark);
    if (pw > 2) p.vl(px0 + 1, y, h, v > 0.5 ? C.rust1 : C.wood1);
    // grain: long broken strokes with a slight wobble
    const gx = px0 + 3 + Math.floor(p.rnd(px0, 7, seed) * Math.max(1, pw - 4));
    for (let yy = y; yy < y + h; yy++) {
      const seg = Math.floor((yy - y + px0) / 7);
      if (p.rnd(px0, seg, seed + 3) < 0.65) {
        const wob = Math.round(Math.sin((yy + px0) / 6) * 0.7);
        p.px(gx + wob, yy, C.wood0);
      }
    }
    if (v > 0.55 && h > 20) {
      const ky = y + 6 + Math.floor(p.rnd(px0, 9, seed) * (h - 12));
      p.px(px0 + 3, ky, C.hairDark); p.px(px0 + 4, ky, C.wood0); p.px(px0 + 3, ky + 1, C.wood0); p.px(px0 + 2, ky - 1, C.brass);
    }
  }
  // sheen near the top (lamp light) and a few scuffs
  p.dithV(x, y + 6, w, Math.floor(h * 0.3), C.brass, 1, 0);
  // wainscot rail
  if (h > 40) {
    const ry = y + Math.floor(h * 0.62);
    p.rect(x, ry, w, 4, C.wood0); p.hl(x, ry, w, C.brass); p.hl(x, ry + 1, w, C.wood1);
    p.dith(x, ry + 2, w, 1, C.wood1, C.wood0, 8); p.hl(x, ry + 4, w, C.hairDark);
    p.dith(x, ry + 5, w, 2, null, C.hairDark, 8);
  }
}

function padded(p, x, y, w, h, r, seed) {
  const cw = 12, ch = 10;
  p.rect(x, y, w, h, r[1]);
  for (let cy = y; cy < y + h; cy += ch) {
    const off = (Math.floor((cy - y) / ch) % 2) * 6;
    for (let cx = x - off; cx < x + w; cx += cw) {
      for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
        const xx = cx + i, yy = cy + j;
        if (xx < x || xx >= x + w || yy >= y + h) continue;
        const dx = (i - cw / 2) / (cw / 2), dy = (j - ch / 2) / (ch / 2);
        const d = Math.abs(dx) + Math.abs(dy);
        let c = r[2];
        if (d > 0.95) c = r[0];
        else if (dx + dy > 0.35) c = BAYER4[yy & 3][xx & 3] < 8 ? r[1] : r[2];
        else if (dx + dy < -0.45) c = BAYER4[yy & 3][xx & 3] < 9 ? r[3] : r[2];
        p.px(xx, yy, c);
      }
      // Button.
      const bx = cx + cw / 2, by = cy + ch / 2;
      if (bx >= x && bx < x + w - 1 && by < y + h - 1) { p.px(bx - 1, by - 1, r[0]); p.px(bx, by, C.ink); p.px(bx + 1, by + 1, r[3]); }
      // Stains.
      if (p.rnd(cx, cy, seed) < 0.1) p.dith(Math.max(x, cx + 2), cy + 3, 4, 3, null, r[0], 6);
    }
  }
}

const MATERIALS = { concrete, steel, tile, wood, padded };

// wall(ctx, x, y, w, h, { material, tone, seed, grime, remap })
export function wall(ctx, x, y, w, h, opts = {}) {
  const { material = 'concrete', tone = 'neutral', seed = 1, grime = true, remap } = opts;
  const p = pen(ctx, remap);
  const r = RAMPS[tone] ?? RAMPS.neutral;
  (MATERIALS[material] ?? concrete)(p, x, y, w, h, r, seed);
  // Ceiling shadow and floor grime.
  p.dithV(x, y, w, Math.min(6, h), C.ink, 10, 0);
  if (grime) p.grime(x, y + Math.floor(h * 0.7), w, Math.ceil(h * 0.3), material === 'wood' ? C.hairDark : r[0], seed, 9);
  return { w, h };
}

// bevelBox: a generic bolted metal plate (used by many props).
export function bevelBox(ctx, x, y, w, h, opts = {}) {
  const { fill = C.steel0, hi = C.steel1, lo = C.navy2, out = C.void, rivets = true, tex = true, remap, seed = 0 } = opts;
  const p = pen(ctx, remap);
  p.box(x, y, w, h, fill, hi, lo, out);
  if (tex && w > 4 && h > 4) {
    p.mottle(x + 2, y + 2, w - 4, h - 4, hi, 6, 4, seed);
    p.noise(x + 2, y + 2, w - 4, h - 4, lo, 0.05, seed + 3);
  }
  if (rivets && w >= 10 && h >= 8) {
    p.rivet(x + 2, y + 2, hi, lo, fill); p.rivet(x + w - 4, y + 2, hi, lo, fill);
    p.rivet(x + 2, y + h - 4, hi, lo, fill); p.rivet(x + w - 4, y + h - 4, hi, lo, fill);
  }
  return { w, h };
}
