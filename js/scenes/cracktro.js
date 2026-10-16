// Konami cracktro: a port of ACT 1 "GnJ synthwave" from demo_fb.c to the 427x240 canvas.
// This is the one scene allowed its own colours. Pure buffer drawing (renderCracktro) so the
// flash-rate guard can run on real frames in node; drawCracktro blits it to the game canvas.
// Left out on purpose: the scene-change tear/split burst, and the neon logo's hue flicker.
import { W, H } from '../engine/screen.js?v=68';
import { COPY } from '../logic/copy.js?v=68';

const SW = W, SH = H;
const HORIZON = 130, FOCAL = 180, CAM_H = 1, VP_X = SW >> 1;
const GRID_Z = 2, GRID_X = 0.42, GRID_ROWS = 64, GRID_COLS = 9;
const TICKS = 25;          // the demo's 25 fps tick
const SCENE_TICKS = 70;    // ticks per floor/logo pairing

// 8x8 bitmap font, verbatim from demo_fb.c (LSB = leftmost). Index = char code - 32.
const FONT8 = [
  [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [0x18, 0x3C, 0x3C, 0x18, 0x18, 0x00, 0x18, 0x00],
  [0x36, 0x36, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [0x36, 0x36, 0x7F, 0x36, 0x7F, 0x36, 0x36, 0x00],
  [0x0C, 0x3E, 0x03, 0x1E, 0x30, 0x1F, 0x0C, 0x00], [0x00, 0x63, 0x33, 0x18, 0x0C, 0x66, 0x63, 0x00],
  [0x1C, 0x36, 0x1C, 0x6E, 0x3B, 0x33, 0x6E, 0x00], [0x06, 0x06, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00],
  [0x18, 0x0C, 0x06, 0x06, 0x06, 0x0C, 0x18, 0x00], [0x06, 0x0C, 0x18, 0x18, 0x18, 0x0C, 0x06, 0x00],
  [0x00, 0x66, 0x3C, 0xFF, 0x3C, 0x66, 0x00, 0x00], [0x00, 0x0C, 0x0C, 0x3F, 0x0C, 0x0C, 0x00, 0x00],
  [0x00, 0x00, 0x00, 0x00, 0x00, 0x0C, 0x0C, 0x06], [0x00, 0x00, 0x00, 0x3F, 0x00, 0x00, 0x00, 0x00],
  [0x00, 0x00, 0x00, 0x00, 0x00, 0x0C, 0x0C, 0x00], [0x60, 0x30, 0x18, 0x0C, 0x06, 0x03, 0x01, 0x00],
  [0x3E, 0x63, 0x73, 0x7B, 0x6F, 0x67, 0x3E, 0x00], [0x0C, 0x0E, 0x0C, 0x0C, 0x0C, 0x0C, 0x3F, 0x00],
  [0x1E, 0x33, 0x30, 0x1C, 0x06, 0x33, 0x3F, 0x00], [0x1E, 0x33, 0x30, 0x1C, 0x30, 0x33, 0x1E, 0x00],
  [0x38, 0x3C, 0x36, 0x33, 0x7F, 0x30, 0x78, 0x00], [0x3F, 0x03, 0x1F, 0x30, 0x30, 0x33, 0x1E, 0x00],
  [0x1C, 0x06, 0x03, 0x1F, 0x33, 0x33, 0x1E, 0x00], [0x3F, 0x33, 0x30, 0x18, 0x0C, 0x0C, 0x0C, 0x00],
  [0x1E, 0x33, 0x33, 0x1E, 0x33, 0x33, 0x1E, 0x00], [0x1E, 0x33, 0x33, 0x3E, 0x30, 0x18, 0x0E, 0x00],
  [0x00, 0x0C, 0x0C, 0x00, 0x00, 0x0C, 0x0C, 0x00], [0x00, 0x0C, 0x0C, 0x00, 0x00, 0x0C, 0x0C, 0x06],
  [0x18, 0x0C, 0x06, 0x03, 0x06, 0x0C, 0x18, 0x00], [0x00, 0x00, 0x3F, 0x00, 0x00, 0x3F, 0x00, 0x00],
  [0x06, 0x0C, 0x18, 0x30, 0x18, 0x0C, 0x06, 0x00], [0x1E, 0x33, 0x30, 0x18, 0x0C, 0x00, 0x0C, 0x00],
  [0x3E, 0x63, 0x7B, 0x7B, 0x7B, 0x03, 0x1E, 0x00], [0x0C, 0x1E, 0x33, 0x33, 0x3F, 0x33, 0x33, 0x00],
  [0x3F, 0x66, 0x66, 0x3E, 0x66, 0x66, 0x3F, 0x00], [0x3C, 0x66, 0x03, 0x03, 0x03, 0x66, 0x3C, 0x00],
  [0x1F, 0x36, 0x66, 0x66, 0x66, 0x36, 0x1F, 0x00], [0x7F, 0x46, 0x16, 0x1E, 0x16, 0x46, 0x7F, 0x00],
  [0x7F, 0x46, 0x16, 0x1E, 0x16, 0x06, 0x0F, 0x00], [0x3C, 0x66, 0x03, 0x03, 0x73, 0x66, 0x7C, 0x00],
  [0x33, 0x33, 0x33, 0x3F, 0x33, 0x33, 0x33, 0x00], [0x1E, 0x0C, 0x0C, 0x0C, 0x0C, 0x0C, 0x1E, 0x00],
  [0x78, 0x30, 0x30, 0x30, 0x33, 0x33, 0x1E, 0x00], [0x67, 0x66, 0x36, 0x1E, 0x36, 0x66, 0x67, 0x00],
  [0x0F, 0x06, 0x06, 0x06, 0x46, 0x66, 0x7F, 0x00], [0x63, 0x77, 0x7F, 0x7F, 0x6B, 0x63, 0x63, 0x00],
  [0x63, 0x67, 0x6F, 0x7B, 0x73, 0x63, 0x63, 0x00], [0x1C, 0x36, 0x63, 0x63, 0x63, 0x36, 0x1C, 0x00],
  [0x3F, 0x66, 0x66, 0x3E, 0x06, 0x06, 0x0F, 0x00], [0x1E, 0x33, 0x33, 0x33, 0x3B, 0x1E, 0x38, 0x00],
  [0x3F, 0x66, 0x66, 0x3E, 0x36, 0x66, 0x67, 0x00], [0x1E, 0x33, 0x07, 0x0E, 0x38, 0x33, 0x1E, 0x00],
  [0x3F, 0x2D, 0x0C, 0x0C, 0x0C, 0x0C, 0x1E, 0x00], [0x33, 0x33, 0x33, 0x33, 0x33, 0x33, 0x3F, 0x00],
  [0x33, 0x33, 0x33, 0x33, 0x33, 0x1E, 0x0C, 0x00], [0x63, 0x63, 0x63, 0x6B, 0x7F, 0x77, 0x63, 0x00],
  [0x63, 0x63, 0x36, 0x1C, 0x1C, 0x36, 0x63, 0x00], [0x33, 0x33, 0x33, 0x1E, 0x0C, 0x0C, 0x1E, 0x00],
  [0x7F, 0x63, 0x31, 0x18, 0x4C, 0x66, 0x7F, 0x00], [0x1E, 0x06, 0x06, 0x06, 0x06, 0x06, 0x1E, 0x00],
  [0x03, 0x06, 0x0C, 0x18, 0x30, 0x60, 0x40, 0x00], [0x1E, 0x18, 0x18, 0x18, 0x18, 0x18, 0x1E, 0x00],
  [0x08, 0x1C, 0x36, 0x63, 0x00, 0x00, 0x00, 0x00], [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF],
  [0x0C, 0x0C, 0x18, 0x00, 0x00, 0x00, 0x00, 0x00], [0x00, 0x00, 0x1E, 0x30, 0x3E, 0x33, 0x6E, 0x00],
  [0x07, 0x06, 0x06, 0x3E, 0x66, 0x66, 0x3B, 0x00], [0x00, 0x00, 0x1E, 0x33, 0x03, 0x33, 0x1E, 0x00],
  [0x38, 0x30, 0x30, 0x3E, 0x33, 0x33, 0x6E, 0x00], [0x00, 0x00, 0x1E, 0x33, 0x3F, 0x03, 0x1E, 0x00],
  [0x1C, 0x36, 0x06, 0x0F, 0x06, 0x06, 0x0F, 0x00], [0x00, 0x00, 0x6E, 0x33, 0x33, 0x3E, 0x30, 0x1F],
  [0x07, 0x06, 0x36, 0x6E, 0x66, 0x66, 0x67, 0x00], [0x0C, 0x00, 0x0E, 0x0C, 0x0C, 0x0C, 0x1E, 0x00],
  [0x30, 0x00, 0x30, 0x30, 0x30, 0x33, 0x33, 0x1E], [0x07, 0x06, 0x66, 0x36, 0x1E, 0x36, 0x67, 0x00],
  [0x0E, 0x0C, 0x0C, 0x0C, 0x0C, 0x0C, 0x1E, 0x00], [0x00, 0x00, 0x33, 0x7F, 0x7F, 0x6B, 0x63, 0x00],
  [0x00, 0x00, 0x1F, 0x33, 0x33, 0x33, 0x33, 0x00], [0x00, 0x00, 0x1E, 0x33, 0x33, 0x33, 0x1E, 0x00],
  [0x00, 0x00, 0x3B, 0x66, 0x66, 0x3E, 0x06, 0x0F], [0x00, 0x00, 0x6E, 0x33, 0x33, 0x3E, 0x30, 0x78],
  [0x00, 0x00, 0x3B, 0x6E, 0x66, 0x06, 0x0F, 0x00], [0x00, 0x00, 0x3E, 0x03, 0x1E, 0x30, 0x1F, 0x00],
  [0x08, 0x0C, 0x3E, 0x0C, 0x0C, 0x2C, 0x18, 0x00], [0x00, 0x00, 0x33, 0x33, 0x33, 0x33, 0x6E, 0x00],
  [0x00, 0x00, 0x33, 0x33, 0x33, 0x1E, 0x0C, 0x00], [0x00, 0x00, 0x63, 0x6B, 0x7F, 0x7F, 0x36, 0x00],
  [0x00, 0x00, 0x63, 0x36, 0x1C, 0x36, 0x63, 0x00], [0x00, 0x00, 0x33, 0x33, 0x33, 0x3E, 0x30, 0x1F],
  [0x00, 0x00, 0x3F, 0x19, 0x0C, 0x26, 0x3F, 0x00], [0x38, 0x0C, 0x0C, 0x07, 0x0C, 0x0C, 0x38, 0x00],
  [0x18, 0x18, 0x18, 0x00, 0x18, 0x18, 0x18, 0x00], [0x07, 0x0C, 0x0C, 0x38, 0x0C, 0x0C, 0x07, 0x00],
  [0x6E, 0x3B, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF],
];
const MIDDOT = [0x00, 0x00, 0x00, 0x0C, 0x0C, 0x00, 0x00, 0x00]; // "·" (not in the C table)
export const glyph = ch => {
  const c = ch.charCodeAt(0);
  if (c === 0xB7) return MIDDOT;
  return c >= 32 && c <= 127 ? FONT8[c - 32] : FONT8[0];
};

// ---- colour + raster primitives (32-bit ABGR, little-endian ImageData layout) ----
const RGB = (r, g, b) => (0xFF000000 | (b << 16) | (g << 8) | r) >>> 0;
const R = c => c & 255, G = c => (c >>> 8) & 255, B = c => (c >>> 16) & 255;
const DIM1 = c => (((c >>> 1) & 0x7F7F7F) | 0xFF000000) >>> 0;
const DIM2 = c => (((c >>> 2) & 0x3F3F3F) | 0xFF000000) >>> 0;
const mix = (a, b, t) => RGB(R(a) + (((R(b) - R(a)) * t) >> 8), G(a) + (((G(b) - G(a)) * t) >> 8), B(a) + (((B(b) - B(a)) * t) >> 8));
function palAt(pal, t) {
  if (t < 0) t = 0;
  if (t > 0.9999) t = 0.9999;
  const f = t * (pal.length - 1), i = Math.trunc(f);
  return mix(pal[i], pal[i + 1], Math.trunc((f - i) * 256));
}
const hash32 = v => {
  v >>>= 0;
  v ^= v >>> 16; v = Math.imul(v, 0x7feb352d); v ^= v >>> 15; v = Math.imul(v, 0x846ca68b); v ^= v >>> 16;
  return v >>> 0;
};
const hrange = (seed, lo, hi) => (hi <= lo ? lo : lo + (hash32(seed) % (hi - lo)));

let buf = null;
const px = (x, y, c) => { if (x >= 0 && x < SW && y >= 0 && y < SH) buf[y * SW + x] = c; };
function hline(x, y, w, c) {
  if (y < 0 || y >= SH || w <= 0) return;
  const x1 = Math.max(0, x), x2 = Math.min(SW - 1, x + w - 1);
  if (x1 > x2) return;
  buf.fill(c, y * SW + x1, y * SW + x2 + 1);
}
const vline = (x, y, h, c) => { for (let i = y; i < y + h; i++) px(x, i, c); };
function line(x0, y0, x1, y1, c) {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx - dy;
  for (;;) {
    px(x0, y0, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * e;
    if (e2 > -dy) { e -= dy; x0 += sx; }
    if (e2 < dx) { e += dx; y0 += sy; }
  }
}
function drawChar(x, y, ch, col, scale = 1) {
  const g = glyph(ch);
  for (let row = 0; row < 8; row++) {
    const bits = g[row];
    for (let c2 = 0; c2 < 8; c2++) if (bits & (1 << c2)) {
      if (scale === 1) px(x + c2, y + row, col);
      else for (let k = 0; k < scale; k++) hline(x + c2 * scale, y + row * scale + k, scale, col);
    }
  }
}

// Convex polygon scanline fill, optional palette ramp over gy0..gy1 and star sparkle (fill_poly_ex).
function fillPoly(p, flat, pal = null, gy0 = 0, gy1 = 1, sparkle = 0) {
  let fy0 = p[0][1], fy1 = p[0][1];
  for (const q of p) { if (q[1] < fy0) fy0 = q[1]; if (q[1] > fy1) fy1 = q[1]; }
  let y0 = Math.floor(fy0), y1 = Math.ceil(fy1);
  if (y1 < 0 || y0 >= SH) return;
  y0 = Math.max(0, y0); y1 = Math.min(SH - 1, y1);
  const span = gy1 - gy0 > 1 ? gy1 - gy0 : 1;
  const n = p.length;
  for (let y = y0; y <= y1; y++) {
    const cy = y + 0.5;
    let xmin = 1e9, xmax = -1e9;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const ya = p[j][1], yb = p[i][1];
      if ((ya <= cy && yb > cy) || (yb <= cy && ya > cy)) {
        const x = p[j][0] + ((cy - ya) / (yb - ya)) * (p[i][0] - p[j][0]);
        if (x < xmin) xmin = x;
        if (x > xmax) xmax = x;
      }
    }
    if (xmax < xmin) continue;
    const ix0 = Math.floor(xmin + 0.5), ix1 = Math.floor(xmax + 0.5);
    hline(ix0, y, ix1 - ix0 + 1, pal ? palAt(pal, (y - gy0) / span) : flat);
    if (sparkle) {
      const w = ix1 - ix0 + 1;
      if (w > 3) for (let s = 0; s < 2; s++) {
        const h = hash32((sparkle ^ (y * 8191 + s * 5701)) >>> 0);
        if ((h & 7) < 5) continue;
        px(ix0 + (h % w), y, h & 0x10000 ? RGB(255, 255, 255) : RGB(150, 190, 255));
      }
    }
  }
}

function project3(x, y, z, ay, ax, cx, cy, dist, scale) {
  const sy = Math.sin(ay), cyr = Math.cos(ay);
  const x1 = x * cyr + z * sy, z1 = -x * sy + z * cyr;
  const sx = Math.sin(ax), cxr = Math.cos(ax);
  const y1 = y * cxr - z1 * sx, z2 = y * sx + z1 * cxr;
  const f = (scale * dist) / (dist + z2);
  return [cx + x1 * f, cy + y1 * f];
}

// ---- palettes (the C values, 8 bits per channel) ----
const SKY = [RGB(2, 0, 14), RGB(6, 2, 34), RGB(18, 4, 66), RGB(48, 8, 96), RGB(96, 16, 110)];
const LAVA = [RGB(30, 0, 0), RGB(120, 10, 0), RGB(220, 60, 0), RGB(255, 150, 10), RGB(255, 230, 120)];
const CHROME = [RGB(255, 255, 255), RGB(210, 244, 255), RGB(120, 200, 245), RGB(30, 90, 170), RGB(6, 14, 50), RGB(8, 20, 60), RGB(120, 190, 235), RGB(235, 250, 255), RGB(255, 255, 255)];
const BRONZE = [RGB(255, 236, 180), RGB(230, 150, 50), RGB(150, 60, 10), RGB(80, 26, 4), RGB(200, 110, 30), RGB(255, 210, 130)];
const VOID = [RGB(8, 4, 40), RGB(20, 10, 80), RGB(40, 16, 110), RGB(14, 6, 60), RGB(30, 12, 90)];
const SUNSET = [RGB(255, 60, 180), RGB(255, 120, 60), RGB(255, 220, 80), RGB(120, 230, 255), RGB(150, 60, 255)];
const SUN = [RGB(255, 250, 190), RGB(255, 215, 90), RGB(255, 140, 40), RGB(255, 60, 120), RGB(220, 20, 180), RGB(130, 10, 190)];

// ---- layers ----
function drawSky() {
  for (let y = 0; y < HORIZON; y++) { const t = y / HORIZON; hline(0, y, SW, palAt(SKY, t * t)); }
}

function drawSun() {
  const cx = VP_X, cy = HORIZON - 14, r = 66;
  let y = cy - r, i = 0;
  while (y < cy + r && y < HORIZON) {
    const solid = Math.max(2, 10 - i), gap = i < 3 ? 0 : i - 2;
    for (let k = 0; k < solid && y < cy + r && y < HORIZON; k++, y++) {
      const dy = y - cy, hw = Math.trunc(Math.sqrt(r * r - dy * dy));
      if (hw <= 0) continue;
      hline(cx - hw, y, hw * 2, palAt(SUN, (y - (cy - r)) / (2 * r)));
    }
    y += gap;
    i++;
  }
}

function drawBands(ft) {
  for (let b = 0; b < 7; b++) {
    const h = 3 + (b >> 1);
    const y = HORIZON - 52 + b * 8 + Math.trunc(Math.sin(ft * 0.045 + b * 0.8) * 2);
    const c = palAt(SUNSET, 0.1 * b + 0.5 + 0.5 * Math.sin(ft * 0.02));
    hline(0, y, SW, DIM1(c));
    for (let k = 1; k < h; k++) hline(0, y + k, SW, c);
    hline(0, y + h, SW, DIM1(c));
  }
}

function drawHorizonGlow() {
  hline(0, HORIZON - 2, SW, RGB(120, 60, 200));
  hline(0, HORIZON - 1, SW, RGB(255, 220, 255));
  hline(0, HORIZON, SW, RGB(255, 255, 255));
  hline(0, HORIZON + 1, SW, RGB(200, 150, 255));
  hline(0, HORIZON + 2, SW, RGB(90, 40, 150));
}

const STARS = Math.round(70 * SW / 320);
function drawStars(tick) {
  for (let i = 0; i < STARS; i++) {
    const h = hash32(Math.imul(i, 2654435761));
    const x = h % SW, y = (h >>> 10) % (HORIZON - 50), tw = (h >>> 20) & 31;
    const on = ((tick + tw) >> 2) & 3;
    if (on) px(x, y, on === 3 ? RGB(255, 255, 255) : RGB(150, 160, 200));
  }
}

// Ridge control points from the C (x on its 320 grid, stretched to the 427 width).
const RIDGE = (() => {
  const cp = [[0, 18], [24, 30], [46, 20], [70, 36], [96, 24], [122, 32], [148, 22], [170, 42], [196, 30], [220, 58], [244, 82], [262, 66], [282, 44], [302, 30], [319, 24]]
    .map(([x, h]) => [Math.round(x * (SW - 1) / 319), h]);
  const r = new Uint8Array(SW);
  for (let i = 0; i < cp.length - 1; i++) {
    const [x0, h0] = cp[i], [x1, h1] = cp[i + 1];
    for (let x = x0; x <= x1 && x < SW; x++) {
      const t = x1 > x0 ? (x - x0) / (x1 - x0) : 0;
      const jag = Math.trunc(Math.sin(x * 0.9) * 2) + (hrange(Math.imul(x, 7919), 0, 3) - 1);
      r[x] = Math.max(4, Math.trunc(h0 + (h1 - h0) * t) + jag);
    }
  }
  return r;
})();
function drawMountains() {
  for (let x = 0; x < SW; x++) {
    const h = RIDGE[x], y = HORIZON - h;
    px(x, y, RGB(120, 70, 190));
    px(x, y + 1, RGB(50, 26, 90));
    vline(x, y + 2, 3, RGB(18, 10, 44));
    vline(x, y + 5, h - 5, RGB(5, 3, 16));
  }
}

const FLOOR_GRID = 0, FLOOR_LAVA = 1, FLOOR_LATTICE = 2, FLOOR_MIRROR = 3;
function floorBase(style, ft) {
  const fh = SH - HORIZON;
  for (let y = HORIZON; y < SH; y++) {
    const t = (y - HORIZON) / fh;
    let c;
    if (style === FLOOR_LAVA) {
      const sh = 0.1 * Math.sin(y * 0.55 - ft * 0.16) + 0.06 * Math.sin(y * 0.17 + ft * 0.07);
      c = palAt(LAVA, t * 0.92 + sh);
    } else if (style === FLOOR_MIRROR) c = mix(RGB(20, 0, 50), RGB(150, 20, 120), Math.trunc(t * 220));
    else if (style === FLOOR_LATTICE) c = mix(RGB(2, 0, 18), RGB(20, 4, 60), Math.trunc(t * 200));
    else c = mix(RGB(0, 0, 10), RGB(10, 0, 40), Math.trunc(t * 180));
    hline(0, y, SW, c);
  }
}

function floorCells(style, ft, phase) {
  if (style !== FLOOR_LAVA) return;
  for (let k = 1; k < GRID_ROWS; k++) {
    const z0 = k * GRID_Z - phase, z1 = (k + 1) * GRID_Z - phase;
    if (z0 < 0.35) continue;
    const yb = HORIZON + (FOCAL * CAM_H) / z0, yt = HORIZON + (FOCAL * CAM_H) / z1;
    if (yb - yt < 2) break;
    if (yt >= SH) continue;
    for (let m = -GRID_COLS; m < GRID_COLS; m++) {
      const xln = VP_X + (FOCAL * (m * GRID_X)) / z0, xrn = VP_X + (FOCAL * ((m + 1) * GRID_X)) / z0;
      const xlf = VP_X + (FOCAL * (m * GRID_X)) / z1, xrf = VP_X + (FOCAL * ((m + 1) * GRID_X)) / z1;
      if (xrn < 0 && xrf < 0) continue;
      if (xln >= SW && xlf >= SW) continue;
      const seed = hash32(((k * 131) ^ ((m + 32) * 7919)) >>> 0);
      const heat = ((seed >>> 8) & 255) / 255;
      const pulse = 0.5 + 0.5 * Math.sin(ft * 0.11 + (seed & 63) * 0.4);
      fillPoly([[xlf, yt], [xrf, yt], [xrn, yb], [xln, yb]], palAt(LAVA, 0.3 + heat * 0.45 + pulse * 0.22));
    }
  }
}

function floorLines(style, ft, phase) {
  const [cl, clDim] = style === FLOOR_LAVA ? [RGB(20, 0, 0), RGB(60, 10, 0)]
    : style === FLOOR_MIRROR ? [RGB(255, 120, 255), RGB(120, 40, 150)]
      : style === FLOOR_LATTICE ? [RGB(120, 255, 255), RGB(30, 110, 140)]
        : [RGB(60, 200, 255), RGB(20, 80, 130)];
  for (let k = 1; k < GRID_ROWS; k++) { // depth rows
    const z = k * GRID_Z - phase;
    if (z < 0.35) continue;
    const y = Math.trunc(HORIZON + (FOCAL * CAM_H) / z);
    if (y >= SH) continue;
    if (y <= HORIZON + 1) break;
    hline(0, y, SW, cl);
    if (y > HORIZON + 40) hline(0, y + 1, SW, clDim);
  }
  const zBot = (FOCAL * CAM_H) / (SH - 1 - HORIZON);
  for (let m = -GRID_COLS; m <= GRID_COLS; m++) { // lateral rays from the vanishing point
    if (m === 0 && style === FLOOR_LATTICE) continue;
    const dx = (FOCAL * (m * GRID_X)) / zBot, dy = SH - 1 - HORIZON;
    let t = 1;
    if (dx > 0.001) t = Math.min(t, (SW - 1 - VP_X) / dx);
    else if (dx < -0.001) t = Math.min(t, (0 - VP_X) / dx);
    if (t <= 0) continue;
    line(VP_X, HORIZON, Math.trunc(VP_X + dx * t), Math.trunc(HORIZON + dy * t), cl);
  }
  if (style === FLOOR_LATTICE) {
    for (let m = -GRID_COLS; m <= GRID_COLS; m++) {
      const ex = Math.trunc(VP_X - (FOCAL * (m * GRID_X)) / zBot);
      line(VP_X, HORIZON, Math.max(0, Math.min(SW - 1, ex)), SH - 1, clDim);
    }
  }
  if (style === FLOOR_MIRROR) { // the logo's reflection smeared down the wet floor
    const sx = VP_X + Math.trunc(Math.sin(ft * 0.03) * 26);
    for (let y = HORIZON + 4; y < SH; y += 4) {
      const t = (y - HORIZON) / (SH - HORIZON);
      const w = Math.trunc(8 + t * 84);
      const j = Math.trunc(Math.sin(y * 0.7 + ft * 0.2) * (2 + t * 6));
      hline(sx - (w >> 1) + j, y, w, mix(RGB(255, 190, 255), RGB(70, 0, 110), Math.trunc(t * 245)));
    }
  }
}

// ---- extruded block logo, generated from the font (build_logo / draw_logo) ----
const LOGO_ADV = 10;
const LOGO = (() => {
  const s = 'GnJ', nc = s.length, gw = (nc - 1) * LOGO_ADV + 8;
  const on = (x, row) => { const ci = Math.floor(x / LOGO_ADV), cc = x - ci * LOGO_ADV; return ci < nc && cc < 8 ? (glyph(s[ci])[row] >> cc) & 1 : 0; };
  const rects = [];
  let prev = [];
  for (let row = 0; row < 8; row++) {
    const cur = [];
    let x = 0;
    while (x < gw) {
      if (!on(x, row)) { x++; continue; }
      const a = x;
      while (x < gw && on(x, row)) x++;
      const b = x;
      let r = prev.find(p => p.a === a && p.b === b)?.r;
      if (r) r.y1 = row + 1;
      else { r = { x0: a, x1: b, y0: row, y1: row + 1 }; rects.push(r); }
      cur.push({ a, b, r });
    }
    prev = cur;
  }
  const hw = gw / 2, hh = 4;
  for (const r of rects) { r.x0 -= hw; r.x1 -= hw; r.y0 -= hh; r.y1 -= hh; }
  return { rects, hh };
})();

function logoSlice(z, expand, cam, flat, pal, gy0, gy1, sparkle, ox, oy) {
  const { ay, ax, cx, cy, dist, scale } = cam;
  for (const r of LOGO.rects) {
    const x0 = r.x0 - expand + ox, x1 = r.x1 + expand + ox, y0 = r.y0 - expand + oy, y1 = r.y1 + expand + oy;
    fillPoly([project3(x0, y0, z, ay, ax, cx, cy, dist, scale), project3(x1, y0, z, ay, ax, cx, cy, dist, scale),
      project3(x1, y1, z, ay, ax, cx, cy, dist, scale), project3(x0, y1, z, ay, ax, cx, cy, dist, scale)], flat, pal, gy0, gy1, sparkle);
  }
}

const LOGO_CHROME = 0, LOGO_BRONZE = 1, LOGO_STARFIELD = 2, LOGO_NEON = 3;
function drawLogo(style, cam, tick) {
  const depth = 5, steps = 7;
  const gy0 = project3(0, -LOGO.hh, 0, cam.ay, cam.ax, cam.cx, cam.cy, cam.dist, cam.scale)[1];
  const gy1 = project3(0, LOGO.hh, 0, cam.ay, cam.ax, cam.cx, cam.cy, cam.dist, cam.scale)[1];
  if (style === LOGO_NEON) { // neon tube; one steady hue (the C flicker between two pinks is left out)
    const hue = RGB(255, 60, 220);
    logoSlice(0, 1.55, cam, DIM2(hue), null, gy0, gy1, 0, 0, 0);
    logoSlice(0, 1.05, cam, DIM1(hue), null, gy0, gy1, 0, 0, 0);
    logoSlice(0, 0.6, cam, hue, null, gy0, gy1, 0, 0, 0);
    logoSlice(0, 0.26, cam, RGB(255, 220, 255), null, gy0, gy1, 0, 0, 0);
    logoSlice(0, 0, cam, RGB(10, 0, 20), null, gy0, gy1, 0, 0, 0);
    return;
  }
  const [pal, sideFar, sideNear] = style === LOGO_BRONZE ? [BRONZE, RGB(40, 14, 2), RGB(190, 96, 20)]
    : style === LOGO_STARFIELD ? [VOID, RGB(10, 4, 30), RGB(90, 60, 180)]
      : [CHROME, RGB(4, 10, 40), RGB(90, 150, 210)];
  const EXT = 1.35;
  for (let i = steps - 1; i >= 1; i--) {
    const t = i / (steps - 1), z = depth * t;
    if (i === steps - 1) logoSlice(z, 0.5, cam, RGB(0, 0, 0), null, gy0, gy1, 0, EXT * t, EXT * t);
    logoSlice(z, 0, cam, mix(sideNear, sideFar, Math.trunc(t * 256)), null, gy0, gy1, 0, EXT * t, EXT * t);
  }
  logoSlice(0, 0.55, cam, RGB(235, 250, 255), null, gy0, gy1, 0, 0, 0);
  logoSlice(0, 0, cam, 0, pal, gy0, gy1, style === LOGO_STARFIELD ? (0x9E3779B9 + Math.floor(tick / 3)) >>> 0 : 0, 0, 0);
}

// ---- matrix rain down the right edge (the C's 224..320 strip, stretched) ----
const RAIN_X0 = Math.round(224 * SW / 320), RAIN_PITCH = 6, RAIN_ROW = 8;
function drawRain(tick) {
  for (let x = RAIN_X0, col = 0; x < SW; x += RAIN_PITCH, col++) {
    const h = hash32(Math.imul(col, 2246822519));
    const spd = 2 + (h % 5), len = 9 + ((h >>> 4) % 14), off = (h >>> 8) % 320;
    const head = ((tick * spd + off) % 400) - 40;
    for (let k = 0; k < len; k++) {
      const y = head - k * RAIN_ROW;
      if (y < -8 || y >= SH) continue;
      const gh = hash32((col * 733 + Math.trunc((y + (tick >> 1)) / RAIN_ROW) * 977) >>> 0);
      const ch = String.fromCharCode(33 + (gh % 93));
      const c = k === 0 ? RGB(220, 255, 220) : k < 3 ? RGB(60, 255, 90)
        : mix(RGB(0, 190, 60), RGB(0, 30, 10), Math.trunc(((k - 3) * 256) / (len > 3 ? len - 3 : 1)));
      drawChar(x, y, ch, c);
    }
  }
}

// ---- AOL-style rainbow sine scroller (draw_scroller, rainbow per letter) ----
const hsv = h => { // full-saturation rainbow, h in turns
  const f = (n) => { const k = (n + h * 6) % 6; return Math.round(255 * (1 - Math.max(0, Math.min(k, 4 - k, 1)))); };
  return RGB(f(5), f(3), f(1));
};
const SCROLL_SCALE = 2, CW = 8 * SCROLL_SCALE, SCROLL_PX = 3; // px per tick, as in the C
function drawScroller(ft) {
  const text = COPY.cracktro.scroller, len = text.length, total = len * CW;
  const sx = SW - (Math.floor(ft * SCROLL_PX) % total), base = SH - 26;
  for (let i = 0; i < len; i++) {
    let x = sx + i * CW;
    if (x <= -CW) { x += total; if (x <= -CW || x >= SW) continue; }
    if (x >= SW) continue;
    const y = base + Math.trunc(Math.sin(x * 0.045 + ft * 0.09) * 7);
    const c = hsv((((i * 0.07 - ft * 0.012) % 1) + 1) % 1);
    drawChar(x, y + 1, text[i], RGB(30, 0, 40), SCROLL_SCALE); // drop shadow
    drawChar(x, y, text[i], c, SCROLL_SCALE);
  }
}

// "PRESENTED BY GNJ" title credit, top centre, with a drop shadow.
function drawCredit() {
  const s = COPY.cracktro.credit, x0 = (SW - s.length * 8) >> 1, y = 8;
  for (let i = 0; i < s.length; i++) drawChar(x0 + i * 8 + 1, y + 1, s[i], RGB(30, 0, 40));
  for (let i = 0; i < s.length; i++) drawChar(x0 + i * 8, y, s[i], RGB(255, 236, 180));
}

// ---- post: a single drifting tear band + a thin colour-split band + edge vignette (no scene-change burst) ----
const tmp = new Uint32Array(SW);
function fxTear(tick, bands) {
  for (let b = 0; b < bands; b++) {
    const h = hash32((Math.imul(tick, 2654435761) + b * 40503) >>> 0);
    const y0 = h % (SH - 10), hgt = 2 + ((h >>> 7) % 7), shift = ((h >>> 15) % 21) - 10;
    if (!shift) continue;
    for (let y = y0; y < y0 + hgt && y < SH; y++) {
      const o = y * SW;
      tmp.set(buf.subarray(o, o + SW));
      for (let x = 0; x < SW; x++) { const s = x - shift; buf[o + x] = s >= 0 && s < SW ? tmp[s] : RGB(0, 0, 0); }
    }
  }
}
function fxRgbSplit(y0, hgt, amt) {
  for (let y = Math.max(0, y0); y < y0 + hgt && y < SH; y++) {
    const o = y * SW;
    tmp.set(buf.subarray(o, o + SW));
    for (let x = 0; x < SW; x++) {
      const r = tmp[x - amt >= 0 ? x - amt : x], b = tmp[x + amt < SW ? x + amt : x];
      buf[o + x] = RGB(R(r), G(tmp[x]), B(b));
    }
  }
}
function fxVignette() {
  for (let i = 0; i < 6; i++) for (let x = 0; x < SW; x++) {
    buf[i * SW + x] = DIM1(buf[i * SW + x]);
    buf[(SH - 1 - i) * SW + x] = DIM1(buf[(SH - 1 - i) * SW + x]);
  }
  for (let y = 0; y < SH; y++) for (let i = 0; i < 5; i++) {
    buf[y * SW + i] = DIM1(buf[y * SW + i]);
    buf[y * SW + SW - 1 - i] = DIM1(buf[y * SW + SW - 1 - i]);
  }
}

// ACT 1 scene list: [floor, logo], 70 ticks each, looping.
export const SCENES = [
  [FLOOR_LAVA, LOGO_CHROME], [FLOOR_GRID, LOGO_NEON], [FLOOR_MIRROR, LOGO_BRONZE], [FLOOR_LAVA, LOGO_BRONZE],
  [FLOOR_LATTICE, LOGO_STARFIELD], [FLOOR_GRID, LOGO_CHROME], [FLOOR_MIRROR, LOGO_NEON], [FLOOR_GRID, LOGO_STARFIELD],
];

// Render one frame at time t (seconds) into a Uint32Array of SW*SH pixels. still = no glitch bands.
export function renderCracktro(out, t, still = false) {
  buf = out;
  const ft = t * TICKS, tick = Math.floor(ft);
  const [floor, logo] = SCENES[Math.floor(tick / SCENE_TICKS) % SCENES.length];
  const phase = (ft * 0.1) % GRID_Z;
  drawSky();
  drawStars(tick);
  drawSun();
  drawBands(ft);
  drawMountains();
  floorBase(floor, ft);
  floorCells(floor, ft, phase);
  floorLines(floor, ft, phase);
  drawHorizonGlow();
  drawRain(tick);
  drawLogo(logo, {
    ay: Math.sin(ft * 0.017) * 0.42, ax: Math.sin(ft * 0.011) * 0.13, scale: 7.2 + Math.sin(ft * 0.023) * 0.45,
    cx: VP_X, cy: HORIZON - 42 + Math.sin(ft * 0.019) * 6, dist: 70,
  }, tick);
  drawScroller(ft);
  if (!still) {
    fxTear(tick, tick % 23 < 3 ? 4 : 1);
    const by = hash32(tick) % (SH - 20);
    fxRgbSplit(by, 14, 1 + (hash32(Math.imul(tick, 7)) % 2));
  }
  drawCredit(); // after the glitch bands, so the credit always reads cleanly
  fxVignette();
  buf = null;
  return out;
}

let img = null;
export function drawCracktro(ctx, t, still = false) {
  if (!img) img = ctx.createImageData(SW, SH);
  renderCracktro(new Uint32Array(img.data.buffer), t, still);
  ctx.putImageData(img, 0, 0);
}
