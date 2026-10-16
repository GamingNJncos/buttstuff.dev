// Service slab between floors: girders, conduit bundles, junction boxes, cable sag, ticker.
import { C } from '../palette.js?v=68';
import { pen } from './wall.js?v=68';
import { pipeRun, pipeV } from './pipes.js?v=68';
import { floorBand } from './hazard.js?v=68';

// girder(ctx, x, y, w, { h, truss, remap })  riveted I-beam seen from the side.
export function girder(ctx, x, y, w, opts = {}) {
  const { h = 10, truss = false, remap, light = C.steel1, mid = C.steel0, dark = C.navy2 } = opts;
  const p = pen(ctx, remap);
  // Top flange.
  p.hl(x, y, w, C.ink); p.hl(x, y + 1, w, C.steel2); p.hl(x, y + 2, w, light); p.hl(x, y + 3, w, dark);
  // Web.
  const wy = y + 4, wh = h - 7;
  p.rect(x, wy, w, wh, mid);
  p.dithV(x, wy, w, wh, dark, 6, 10);
  p.hl(x, wy, w, C.navy);
  if (truss) {
    for (let tx = x; tx < x + w; tx += wh * 2) {
      p.line(tx, wy + wh - 1, tx + wh - 1, wy, light); p.line(tx + 1, wy + wh - 1, tx + wh, wy, dark);
      p.line(tx + wh, wy, tx + 2 * wh - 1, wy + wh - 1, light); p.line(tx + wh + 1, wy, tx + 2 * wh, wy + wh - 1, dark);
    }
  } else {
    for (let sx = x + 4; sx < x + w - 2; sx += 6) p.rivet(sx, wy + Math.floor(wh / 2) - 1, light, C.ink, mid);
    for (let sx = x + 23; sx < x + w - 2; sx += 24) { p.vl(sx, wy, wh, light); p.vl(sx + 1, wy, wh, C.ink); }
  }
  // Bottom flange.
  p.hl(x, y + h - 3, w, light); p.hl(x, y + h - 2, w, mid); p.hl(x, y + h - 1, w, C.ink);
  return { w, h };
}

const WIRE = [C.steel1, C.rust1, C.mint0, C.navy2, C.amber, C.stone2];

// conduit(ctx, x, y, w, n, { remap, clips })  bundle of n 2px cables with clamps.
export function conduit(ctx, x, y, w, n = 4, opts = {}) {
  const { remap, clips = 22, colors = WIRE } = opts;
  const p = pen(ctx, remap);
  for (let k = 0; k < n; k++) {
    const c = colors[k % colors.length];
    const yy = y + k * 2;
    p.hl(x, yy, w, c);
    p.hl(x, yy + 1, w, C.ink);
    p.dith(x, yy, w, 1, null, C.cream, k % 2 ? 1 : 2);
  }
  for (let cx = x + clips / 2; cx < x + w - 3; cx += clips) {
    p.rect(cx - 1, y - 1, 4, n * 2 + 2, C.void);
    p.rect(cx, y - 1, 2, n * 2 + 1, C.steel1);
    p.vl(cx + 1, y, n * 2, C.steel0);
    p.px(cx, y - 1, C.steel3);
    p.px(cx, y + n, C.ink);
  }
  return { w, h: n * 2 };
}

// junctionBox(ctx, x, y, { w, h, label, lamp, remap })
export function junctionBox(ctx, x, y, opts = {}) {
  const { w = 16, h = 13, label = '', lamp = C.amber, remap, fill = C.steel0 } = opts;
  const p = pen(ctx, remap);
  // conduit stubs top and bottom
  p.rect(x + 3, y - 3, 3, 3, C.void); p.vl(x + 4, y - 3, 3, C.steel1);
  p.rect(x + w - 6, y + h, 3, 3, C.void); p.vl(x + w - 5, y + h, 3, C.steel1);
  p.box(x, y, w, h, fill, C.steel2, C.navy2);
  p.rect(x + 2, y + 2, w - 4, h - 4, fill);
  p.bevel(x + 2, y + 2, w - 4, h - 4, C.navy2, C.steel1); // recessed door
  p.noise(x + 3, y + 3, w - 6, h - 6, C.navy2, 0.08, x);
  p.screw(x + 1, y + 1, C.steel3); p.screw(x + w - 3, y + 1, C.steel3);
  p.screw(x + 1, y + h - 3, C.steel3); p.screw(x + w - 3, y + h - 3, C.steel3);
  // label plate + lamp
  p.rect(x + 4, y + 4, w - 8, 3, C.cream); p.hl(x + 5, y + 5, Math.max(1, w - 11), C.stone1);
  p.px(x + w - 5, y + h - 5, lamp); p.px(x + w - 6, y + h - 5, C.ink);
  // hazard bolt sticker
  p.px(x + 4, y + h - 5, C.yellow); p.px(x + 5, y + h - 5, C.ink); p.px(x + 5, y + h - 6, C.yellow);
  if (label) p.text(label, x + 2, y + h + 4, C.steel2, 'f3');
  p.dith(x + 1, y + h - 3, w - 2, 2, null, C.navy, 5);
  return { w, h };
}

// cableSag(ctx, x0, y, x1, { sag, color, remap })  drooping cable between two hooks.
export function cableSag(ctx, x0, y, x1, opts = {}) {
  const { sag = 6, color = C.ink, hi = C.steel0, remap } = opts;
  const p = pen(ctx, remap);
  let prev = null;
  for (let x = x0; x <= x1; x++) {
    const t = (x - x0) / Math.max(1, x1 - x0);
    const yy = Math.round(y + sag * 4 * t * (1 - t));
    if (prev != null) for (let k = Math.min(prev, yy); k <= Math.max(prev, yy); k++) p.px(x, k, color);
    p.px(x, yy, color);
    p.px(x, yy - 1, (x & 3) === 0 ? hi : null);
    prev = yy;
  }
  for (const hx of [x0, x1]) { p.rect(hx - 1, y - 2, 3, 3, C.void); p.px(hx, y - 1, C.steel2); }
  return { w: x1 - x0, h: sag };
}

// tickerStrip(ctx, x, y, w, text, { offset, color, remap })  dot-matrix crawl strip.
export function tickerStrip(ctx, x, y, w, text, opts = {}) {
  const { offset = 0, color = C.amber, dim = C.rust0, remap } = opts;
  const p = pen(ctx, remap);
  const h = 11;
  p.box(x, y, w, h, C.void, C.navy2, C.ink, C.ink);
  // unlit LED grid
  for (let j = y + 2; j < y + h - 2; j += 1) for (let i = x + 2; i < x + w - 2; i += 2) if ((j - y) % 2 === 0) p.px(i, j, C.ink);
  // text clipped to the strip
  const tmp = { fillStyle: '', fillRect(px, py, pw, ph) { if (px >= x + 2 && px < x + w - 2) { ctx.fillStyle = this.fillStyle; ctx.fillRect(px, py, pw, ph); } } };
  const tp = pen(tmp, remap);
  const step = text.length * 6 + 24;
  for (let tx = x + 2 - (offset % step); tx < x + w; tx += step) {
    tp.text(text, tx + 1, y + 3, dim);
    tp.text(text, tx, y + 2, color);
  }
  p.hl(x + 1, y + 1, w - 2, C.navy);
  return { w, h };
}

// slab(ctx, x, y, w, h, { seed, remap, ticker })  composite 45px service slab.
export function slab(ctx, x, y, w, h = 45, opts = {}) {
  const { seed = 1, remap, ticker = '' } = opts;
  const p = pen(ctx, remap);
  p.rect(x, y, w, h, C.ink);
  // Concrete deck under the floor.
  floorBand(ctx, x, y, w, 14, 'asphalt', { remap, seed });
  // Rear wall of the slab cavity.
  p.rect(x, y + 14, w, h - 14, C.navy);
  p.mottle(x, y + 14, w, h - 14, C.navy2, 7, 6, seed);
  p.noise(x, y + 14, w, h - 14, C.void, 0.05, seed + 1);
  p.dithV(x, y + 14, w, 5, C.void, 12, 0);
  girder(ctx, x, y + 15, w, { h: 9, remap });
  conduit(ctx, x, y + 27, w, 3, { remap });
  pipeRun(ctx, x, y + 34, x + w, { r: 2, color: 'pale', flanges: 48, remap, seed, valves: w > 120 ? [x + Math.floor(w * 0.62)] : [] });
  for (let jx = x + 30; jx < x + w - 20; jx += 96) {
    pipeV(ctx, jx, y + 24, y + 34, { r: 1, color: 'steel', flanges: 0, remap });
    junctionBox(ctx, jx + 6, y + 26, { w: 14, h: 11, remap });
  }
  if (ticker) tickerStrip(ctx, x + 4, y + h - 11, w - 8, ticker, { remap, offset: seed * 7 });
  else p.dithV(x, y + h - 4, w, 4, C.void, 0, 12);
  return { w, h };
}
