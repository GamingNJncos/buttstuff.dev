// Machines and room centrepieces: generic machine cabinet, icons, server rack (+coat/suit),
// glass pod, containment tank, turnstile, forklift, conveyor, stamp press.
import { C } from '../palette.js?v=68';
import { BAYER4 } from '../dither.js?v=68';
import { pen } from './wall.js?v=68';
import { hazardStrip } from './hazard.js?v=68';

const inPoly = (pts, px, py) => {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
};
function poly(p, x, y, pts, c, shade = null, lit = null) {
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  for (let j = Math.floor(Math.min(...ys)); j <= Math.ceil(Math.max(...ys)); j++) {
    for (let i = Math.floor(Math.min(...xs)); i <= Math.ceil(Math.max(...xs)); i++) {
      if (!inPoly(pts, i + 0.5, j + 0.5)) continue;
      let cc = c;
      const d = (i - cx) + (j - cy);
      if (shade != null && d > 2.5) cc = shade;
      else if (lit != null && d < -4) cc = lit;
      p.px(x + i, y + j, cc);
    }
  }
}

// icon(ctx, x, y, name, c, { shade, lit, remap })  ~14x14 pictograms.
export function icon(ctx, x, y, name, c = C.mint2, opts = {}) {
  const { remap, shade = C.mint0, lit = C.cream2 } = opts;
  const p = pen(ctx, remap);
  switch (name) {
    case 'gear': {
      for (let j = 0; j < 14; j++) for (let i = 0; i < 14; i++) {
        const dx = i - 6.5, dy = j - 6.5, d = Math.hypot(dx, dy);
        const tooth = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 16) % 2;
        if (d <= (tooth ? 7 : 5.4) && d > 2.3) p.px(x + i, y + j, dx + dy > 3 ? shade : dx + dy < -5 ? lit : c);
      }
      break;
    }
    case 'drop':
      poly(p, x, y, [[7, 0], [12, 7], [12.5, 10], [10, 13.5], [4, 13.5], [1.5, 10], [2, 7]], c, shade, lit);
      p.px(x + 4, y + 8, lit); p.px(x + 4, y + 9, lit); p.px(x + 5, y + 7, lit);
      break;
    case 'bolt':
      poly(p, x, y, [[9, 0], [2, 8], [6.5, 8], [4, 14], [12, 5], [7.5, 5], [10, 0]], c, shade, lit);
      break;
    case 'shield':
      poly(p, x, y, [[1, 1], [13, 1], [13, 7], [7, 14], [1, 7]], c, shade, lit);
      p.rect(x + 6, y + 3, 2, 7, shade); p.rect(x + 4, y + 5, 6, 2, shade);
      break;
    case 'cube':
      poly(p, x, y, [[7, 0], [14, 3.5], [7, 7], [0, 3.5]], lit);
      poly(p, x, y, [[0, 3.5], [7, 7], [7, 14], [0, 10.5]], c);
      poly(p, x, y, [[7, 7], [14, 3.5], [14, 10.5], [7, 14]], shade);
      break;
    case 'eye':
      poly(p, x, y, [[0, 7], [4, 3], [10, 3], [14, 7], [10, 11], [4, 11]], c);
      p.disc(x + 7, y + 7, 3, shade); p.disc(x + 7, y + 7, 1, C.void); p.px(x + 6, y + 5, lit);
      break;
    case 'wave':
      for (let k = 0; k < 3; k++) for (let i = 0; i < 14; i++) {
        const Y = y + 3 + k * 4 + Math.round(Math.sin(i / 2.2 + k) * 1.4);
        p.px(x + i, Y, k === 1 ? lit : c); p.px(x + i, Y + 1, shade);
      }
      break;
    case 'key':
      p.ring(x + 4, y + 4, 3, c); p.ring(x + 4, y + 4, 2, shade);
      p.line(x + 6, y + 6, x + 13, y + 13, c); p.line(x + 7, y + 6, x + 13, y + 12, shade);
      p.rect(x + 10, y + 12, 2, 2, c); p.rect(x + 12, y + 10, 2, 2, c);
      break;
    case 'chip':
      p.rect(x + 3, y + 3, 8, 8, c); p.bevel(x + 3, y + 3, 8, 8, lit, shade);
      for (let k = 0; k < 4; k++) {
        p.px(x + 4 + k * 2, y + 1, c); p.px(x + 4 + k * 2, y + 12, c);
        p.px(x + 1, y + 4 + k * 2, c); p.px(x + 12, y + 4 + k * 2, c);
      }
      p.rect(x + 5, y + 5, 4, 4, shade);
      break;
    case 'hook':
    default:
      p.ring(x + 9, y + 2, 2, c);
      p.rect(x + 8, y + 4, 2, 6, c); p.vl(x + 9, y + 4, 6, shade);
      for (let a = 0; a <= 180; a += 10) {
        const t = (a * Math.PI) / 180;
        const X = Math.round(x + 5.5 + Math.cos(t) * 3.5), Y = Math.round(y + 9.5 + Math.sin(t) * 3.5);
        p.px(X, Y, c); p.px(X, Y + 1, a > 60 && a < 150 ? shade : c);
      }
      p.rect(x + 1, y + 7, 2, 3, c); p.px(x + 2, y + 6, lit); p.px(x + 8, y + 5, lit);
      break;
  }
  return { w: 14, h: 14 };
}

const BODY = {
  rust: [C.rust0, C.rust1, C.rust2, C.rust3],
  steel: [C.navy2, C.steel0, C.steel1, C.steel2],
  cream: [C.stone1, C.stone2, C.stone3, C.cream],
  navy: [C.navy, C.navy2, C.steel0, C.steel1],
  brass: [C.wood0, C.wood1, C.brass, C.cream],
};

// machine(ctx, x, y, { w, h, icon, readout, label, leds, palette, accent, remap, seed })
export function machine(ctx, x, y, opts = {}) {
  const { w = 40, h = 64, icon: ic = 'gear', readout = '000000', label = '', leds = 3, palette = 'rust', accent = C.mint2, remap, seed = 1, bars = 0.6 } = opts;
  const p = pen(ctx, remap);
  const r = BODY[palette] ?? BODY.rust;
  // floor shadow
  p.dith(x - 2, y + h - 2, w + 5, 3, null, C.void, 10);
  // top cap (narrower) with vent + beacon
  const capW = w - 8, capX = x + 4;
  p.box(capX, y, capW, 7, r[1], r[3], r[0]);
  for (let i = capX + 3; i < capX + capW - 8; i += 2) p.vl(i, y + 2, 3, C.void);
  p.rect(capX + capW - 6, y + 2, 3, 3, C.void); p.px(capX + capW - 5, y + 3, C.amber);
  // main body
  const by = y + 6, bh = h - 9;
  p.box(x, by, w, bh, r[1], r[3], r[0]);
  p.mottle(x + 1, by + 1, w - 2, bh - 2, r[2], 7, 5, seed);
  p.noise(x + 1, by + 1, w - 2, bh - 2, r[0], 0.07, seed + 1);
  p.hl(x + 1, by + 1, w - 2, r[3]); p.vl(x + 1, by + 1, bh - 2, r[2]);
  // right side depth panel
  p.rect(x + w - 4, by + 1, 3, bh - 2, r[0]); p.vl(x + w - 4, by + 1, bh - 2, r[1]);
  p.dith(x + w - 3, by + 1, 2, bh - 2, null, C.void, 5);
  // icon window
  const iw = w - 12, ih = Math.min(24, iw);
  const ix = x + 4, iy = by + 4;
  p.rect(ix - 1, iy - 1, iw + 2, ih + 2, r[3]);
  p.rect(ix - 1, iy - 1, iw + 1, ih + 1, C.void);
  p.rect(ix, iy, iw, ih, C.ink);
  p.dith(ix, iy, iw, ih, null, C.navy, 3);
  icon(ctx, ix + Math.floor((iw - 14) / 2), iy + Math.floor((ih - 14) / 2), ic, accent, {
    remap, shade: accent === C.mint2 ? C.mint0 : C.rust0, lit: C.cream2,
  });
  p.dith(ix, iy, iw, 2, null, C.steel0, 4);
  p.screw(ix - 3, iy, r[3], r[0]); p.screw(ix + iw + 1, iy, r[3], r[0]);
  // readout
  const ry = iy + ih + 3, rw = w - 10;
  p.rect(ix - 1, ry - 1, rw + 2, 11, C.void);
  p.rect(ix, ry, rw, 9, C.ink);
  const digits = String(readout).slice(0, Math.floor((rw - 2) / 6));
  p.text('8'.repeat(digits.length), ix + 1, ry + 1, C.mint0);
  p.text(digits, ix + 1, ry + 1, C.mint2);
  p.hl(ix - 1, ry + 9, rw + 2, r[3]);
  // bar meter
  const my = ry + 12;
  const nLab = label ? (Array.isArray(label) ? label.length : 1) : 0;
  if (my + 5 < by + bh - 3 - nLab * 8) {
    p.rect(ix, my, rw, 4, C.void);
    const nb = Math.floor((rw - 1) / 3);
    for (let k = 0; k < nb; k++) p.rect(ix + 1 + k * 3, my + 1, 2, 2, k < nb * bars ? C.cream : r[0]);
  }
  p.grime(x + 1, by + bh - 12, w - 2, 11, r[0], seed, 8);
  // label
  if (label) {
    const lines = Array.isArray(label) ? label : [label];
    let ly = by + bh - 3 - lines.length * 8;
    for (const l of lines) { p.textShadow(l, x + 3, ly, C.cream, r[0]); ly += 8; }
  }
  // LEDs down the right edge of the face
  for (let k = 0; k < leds; k++) {
    const lc = [C.mint2, C.amber, C.red, C.mint2][k % 4];
    p.px(x + w - 6, by + 4 + k * 3, lc); p.px(x + w - 7, by + 4 + k * 3, C.void);
  }
  // grime + feet
  p.rect(x + 2, y + h - 3, 6, 3, C.void); p.rect(x + w - 8, y + h - 3, 6, 3, C.void);
  p.hl(x + 3, y + h - 3, 4, C.steel0); p.hl(x + w - 7, y + h - 3, 4, C.steel0);
  return { w, h };
}

// ---- server rack ---------------------------------------------------------------

function unit(p, x, y, w, kind, k, seed) {
  // kind: 1u, 2u, disk, patch, blank, switch
  const hU = kind === '2u' || kind === 'disk' ? 7 : 4;
  const face = kind === 'blank' ? C.navy : (k % 3 === 0 ? C.steel0 : C.navy2);
  p.rect(x, y, w, hU, face);
  p.hl(x, y, w, kind === 'blank' ? C.navy2 : C.steel1);
  p.hl(x, y + hU - 1, w, C.void);
  // rack ears + screws
  p.px(x, y + 1, C.steel2); p.px(x + w - 1, y + 1, C.steel2);
  if (kind === 'blank') { for (let i = x + 3; i < x + w - 3; i += 2) p.px(i, y + 2, C.ink); return hU; }
  if (kind === 'disk') {
    for (let i = x + 2; i + 3 < x + w - 5; i += 3) {
      p.rect(i, y + 1, 2, 5, C.ink); p.px(i, y + 1, C.steel1);
      p.px(i + 1, y + 4, p.rnd(i, y, seed) < 0.6 ? C.mint2 : C.amber);
    }
    p.rect(x + w - 5, y + 2, 3, 3, C.ink); p.px(x + w - 4, y + 3, C.mint1);
  } else if (kind === 'patch' || kind === 'switch') {
    for (let i = x + 2; i < x + w - 2; i += 2) {
      p.px(i, y + 1, C.void); p.px(i, y + 2, kind === 'switch' && p.rnd(i, y, seed) < 0.5 ? C.mint2 : C.ink);
    }
  } else {
    // 1U/2U server: handle, vent, LED row, label strip
    p.rect(x + 2, y + 1, 2, hU - 2, C.steel1); p.px(x + 2, y + 1, C.steel3);
    for (let i = x + 6; i < x + Math.floor(w * 0.55); i += 2) p.vl(i, y + 1, hU - 2, C.ink);
    const lx = x + Math.floor(w * 0.6);
    for (let q = 0; q < 3; q++) {
      const v = p.rnd(lx + q, y, seed);
      p.px(lx + q * 2, y + 1, v < 0.6 ? C.mint2 : v < 0.85 ? C.amber : C.red);
    }
    p.hl(lx, y + hU - 2, w - (lx - x) - 3, C.stone2);
    if (kind === '2u') { p.rect(x + w - 6, y + 2, 3, 3, C.ink); p.px(x + w - 5, y + 3, C.steel2); }
  }
  return hU;
}

// rack(ctx, x, y, { w, h, coat: false|true|'suit', units, seed, label, remap })
// Bounding box w×h; the top 10 px hold cable bundles / hat.
export function rack(ctx, x, y, opts = {}) {
  const { w = 32, h = 84, coat = false, seed = 1, label = 'MCP', remap } = opts;
  const p = pen(ctx, remap);
  const top = y + 10, bh = h - 10;
  // floor shadow
  p.dith(x - 3, y + h - 2, w + 7, 3, null, C.void, 11);
  // cable bundle out of the top to the tray
  const cab = [C.steel0, C.mint0, C.rust1, C.navy2, C.amber];
  for (let k = 0; k < 5; k++) {
    const cx = x + 6 + k * 2 + (k > 2 ? 4 : 0);
    p.vl(cx, y, 11, cab[k]); p.vl(cx + 1, y, 11, C.void);
  }
  p.rect(x + 5, y + 4, 16, 2, C.void); p.hl(x + 6, y + 4, 14, C.steel1); // cable tie
  // frame
  p.rect(x, top, w, bh, C.void);
  p.rect(x + 1, top + 1, w - 2, bh - 2, C.ink);
  // posts with rail holes
  for (const px0 of [x + 1, x + w - 4]) {
    p.rect(px0, top + 1, 3, bh - 2, C.navy2);
    p.vl(px0, top + 1, bh - 2, C.steel0);
    for (let yy = top + 7; yy < top + bh - 7; yy += 2) p.px(px0 + 1, yy, C.void);
  }
  // top cap
  p.rect(x + 1, top + 1, w - 2, 5, C.navy2);
  p.hl(x + 1, top + 1, w - 2, C.steel1);
  for (let i = x + 4; i < x + w - 9; i += 2) p.px(i, top + 3, C.void);
  p.rect(x + w - 9, top + 2, 6, 3, C.cream); p.text(label.slice(0, 1), x + w - 8, top + 2, C.navy, 'f3');
  p.hl(x + w - 7, top + 3, 3, C.stone1);
  // units
  const plan = ['1u', 'switch', 'patch', '2u', '1u', '1u', 'disk', 'blank', '1u', '2u', '1u', 'disk', '1u', 'blank', '2u', '1u'];
  const ux = x + 4, uw = w - 8;
  let uy = top + 7, k = 0;
  const end = top + bh - 8;
  while (uy < end) {
    let kind = plan[(k + seed * 3) % plan.length];
    const hU = kind === '2u' || kind === 'disk' ? 7 : 4;
    if (uy + hU > end) kind = 'blank';
    if (uy + 4 > end) break;
    uy += unit(p, ux, uy, uw, kind, k, seed) + 0;
    k++;
  }
  // patch cables looping out of the right side
  const pc = [C.mint1, C.amber, C.pink, C.steel2];
  for (let q = 0; q < 3; q++) {
    const sy = top + 16 + q * 2;
    const ex = x + w + 1 + q;
    p.hl(x + w - 6 + q, sy, 6 - q, pc[q]);
    p.vl(ex, sy, 10 + q * 5, pc[q]);
    p.px(ex - 1, sy + 10 + q * 5, pc[q]);
  }
  // plinth + casters
  const py = top + bh - 7;
  p.rect(x + 1, py, w - 2, 6, C.navy2); p.hl(x + 1, py, w - 2, C.steel0);
  for (let i = x + 4; i < x + w - 4; i += 2) { p.px(i, py + 2, C.void); p.px(i, py + 3, C.void); }
  p.rect(x + 2, y + h - 2, 3, 2, C.steel0); p.rect(x + w - 5, y + h - 2, 3, 2, C.steel0);
  // glass door glare (light dither streak)
  for (let q = 0; q < bh - 14; q++) {
    const X = x + 6 + Math.floor(q * 0.35), Y = top + 7 + q;
    if (X < x + w - 6 && BAYER4[Y & 3][X & 3] < 4) p.px(X, Y, C.steel1);
  }
  if (coat === true) garment(p, x, y, w, h, 'coat');
  else if (coat === 'suit') garment(p, x, y, w, h, 'suit');
  return { w, h };
}

// Garment overlay for a rack: sleeves hang outside the frame, front panels cover only the
// posts, the lapel V and the open front leave the server units visible. kind: 'coat' | 'suit'.
function garment(p, x, y, w, h, kind) {
  const coat = kind === 'coat';
  // [shadow, base, lit, edge]
  const K = coat ? [C.wood0, C.wood1, C.brass, C.stone3] : [C.navy, C.steel0, C.steel1, C.steel2];
  const top = y + 10;
  const half = Math.floor(w / 2), cx = x + half;
  const side = 6;
  const hem = coat ? y + h - 16 : top + 46;
  const vDepth = coat ? 20 : 22;
  const flareAt = (yy) => (coat ? Math.max(0, Math.floor((yy - top - 26) / 10)) : 0);
  // sleeves: separate tubes outside the frame, bulging slightly at the elbow
  const sLen = coat ? 44 : 40;
  for (const left of [true, false]) {
    for (let j = 0; j < sLen; j++) {
      const bulge = j > 14 && j < sLen - 4 ? 1 : 0;
      const X = left ? x - 6 - bulge : x + w + 1 + bulge;
      const Y = top + 3 + j;
      p.px(X, Y, C.void); p.px(X + 5, Y, C.void);
      p.hl(X + 1, Y, 4, K[1]);
      p.px(X + 1, Y, left ? K[2] : K[1]); p.px(X + 4, Y, left ? K[1] : K[0]);
      if (left) p.px(X + 2, Y, K[2]);
      if (j === 16 || j === 17) p.px(X + (left ? 3 : 2), Y, K[0]); // elbow crease
    }
    const X = left ? x - 7 : x + w + 2, Y = top + 3 + sLen;
    p.rect(X, Y - 3, 6, 3, C.void); p.hl(X + 1, Y - 3, 4, coat ? K[3] : C.cream2); p.hl(X + 1, Y - 2, 4, K[0]);
    p.hl(X + 1, Y - 1, 4, C.void);
  }
  // front panels over the posts
  for (const left of [true, false]) {
    for (let yy = top + 2; yy < hem; yy++) {
      const f = flareAt(yy);
      const xa = left ? x - 1 - f : x + w - side;
      const ww = side + 1 + f;
      p.hl(xa, yy, ww, K[1]);
      p.px(left ? xa + 1 : xa + ww - 2, yy, left ? K[2] : K[0]);
      p.px(left ? xa : xa + ww - 1, yy, C.void);
      p.px(left ? xa + ww - 1 : xa, yy, K[0]);
      p.px(left ? xa + ww : xa - 1, yy, C.void); // shadow on the rack
      if ((yy - top) % 13 === 7) p.hl(xa + 2, yy, 2, K[0]); // fabric fold
      if (!coat && (xa + 3) % 3 === 0 && yy % 2) p.px(xa + 3, yy, K[2]); // pinstripe
    }
    const f = flareAt(hem);
    const xa = left ? x - 1 - f : x + w - side;
    p.hl(xa, hem, side + 1 + f, C.void); p.hl(xa + 1, hem - 1, side - 1 + f, K[0]);
  }
  // lapels: folded-back triangles, wide at the shoulder, tapering onto the panel edge
  for (let q = 0; q < vDepth; q++) {
    const Y = top + 1 + q;
    const gap = 4 + Math.round((q * (half - side - 4)) / vDepth);
    const lw = half - side - gap + 1;
    if (!coat && q < 14) {
      const sw = Math.max(0, Math.round((gap - 1) * (1 - q / 14)));
      if (sw > 0) { p.hl(cx - sw, Y, sw * 2, C.cream2); p.px(cx - sw, Y, C.stone3); p.px(cx + sw - 1, Y, C.cream); }
    }
    if (lw <= 0) continue;
    p.hl(x + side, Y, lw, K[2]);
    p.hl(x + w - side - lw, Y, lw, K[1]);
    p.px(x + side + lw - 1, Y, K[3]); p.px(x + w - side - lw, Y, K[2]);
    p.px(x + side + lw, Y, C.void); p.px(x + w - side - lw - 1, Y, C.void);
    p.px(x + side, Y, K[0]); p.px(x + w - side - 1, Y, K[0]);
    if (q === 5) { p.px(x + side + lw - 2, Y, C.void); p.px(x + w - side - lw + 1, Y, C.void); } // notch
  }
  // sloped shoulders
  for (let i = -half - 5; i < half + 5; i++) {
    const a = Math.abs(i + 0.5);
    const drop = a > half - 4 ? Math.floor((a - (half - 4)) / 2.5) : 0;
    const X = cx + i, Y = top - 2 + drop;
    p.px(X, Y, C.void);
    p.px(X, Y + 1, a > half - 8 && a < half + 2 ? K[3] : K[2]);
    p.px(X, Y + 2, K[1]);
    if (a < half + 3) p.px(X, Y + 3, K[1]);
  }
  p.dith(x - 3, top + 2, w + 6, 1, null, K[0], 6);
  if (coat) {
    // popped collar around the neck
    p.rect(cx - 9, top - 7, 4, 7, C.void); p.rect(cx - 8, top - 6, 3, 6, K[2]); p.vl(cx - 8, top - 6, 6, K[3]);
    p.rect(cx + 5, top - 7, 4, 7, C.void); p.rect(cx + 5, top - 6, 3, 6, K[1]); p.vl(cx + 7, top - 6, 6, K[0]);
    // belt across the panels, buckle, loose tail
    const by = top + 28;
    for (const left of [true, false]) {
      const bx = left ? x - 1 : x + w - side;
      p.hl(bx, by, side + 1, C.void); p.hl(bx, by + 1, side + 1, K[2]); p.hl(bx, by + 2, side + 1, K[0]);
    }
    p.rect(x + 1, by - 1, 4, 5, C.void); p.rect(x + 2, by, 2, 3, C.brass); p.px(x + 2, by + 1, C.wood0);
    p.vl(x + w + 6, by + 2, 11, K[1]); p.vl(x + w + 7, by + 3, 9, K[0]); p.px(x + w + 6, by + 13, C.void);
    // double-breasted buttons + pocket flaps
    for (const yb of [top + 19, top + 23]) { p.px(x + 2, yb, C.hairDark); p.px(x + w - 3, yb, C.hairDark); }
    p.hl(x, top + 38, side - 1, K[3]); p.hl(x, top + 39, side - 1, K[0]);
    p.hl(x + w - side + 1, top + 38, side - 1, K[2]); p.hl(x + w - side + 1, top + 39, side - 1, K[0]);
    // grey fedora sat on the rack
    const hy = y - 1;
    p.rect(x + 3, hy + 6, w - 6, 3, C.void); p.hl(x + 4, hy + 7, w - 8, C.stone1); p.hl(x + 5, hy + 6, w - 10, C.stone2);
    p.rect(x + 9, hy, w - 18, 7, C.void);
    p.rect(x + 10, hy + 1, w - 20, 5, C.stone1);
    p.hl(x + 10, hy + 1, w - 20, C.stone2); p.vl(x + 10, hy + 1, 4, C.stone2); p.vl(x + w - 11, hy + 1, 4, C.stone0);
    p.px(cx, hy + 1, C.stone0); p.px(cx - 1, hy + 1, C.stone0);
    p.hl(x + 10, hy + 4, w - 20, C.ink); p.px(x + w - 13, hy + 4, C.rust2);
  } else {
    // shirt collar + tie (narrow; units stay visible either side)
    p.rect(cx - 4, top - 2, 8, 3, C.cream2); p.hl(cx - 4, top, 8, C.stone3);
    p.px(cx - 5, top - 1, C.cream); p.px(cx + 4, top - 1, C.cream);
    p.rect(cx - 1, top - 1, 2, 2, C.red); p.px(cx - 1, top - 1, C.rust3);
    for (let j = 1; j < 17; j++) { p.hl(cx - 1, top + j, 2, C.red); p.px(cx, top + j, C.rust0); }
    p.px(cx - 1, top + 17, C.rust0);
    p.px(cx - 1, top + 8, C.brass); // tie clip
    // pocket square + lanyard badge (legit!)
    p.rect(x + w - side + 1, top + 18, 3, 2, C.cream2); p.px(x + w - side + 3, top + 18, C.mint1);
    p.line(cx - 3, top + 1, x + side + 1, top + 24, C.mint0);
    p.rect(x + side - 1, top + 24, 6, 7, C.void); p.rect(x + side, top + 25, 4, 5, C.cream); p.hl(x + side, top + 25, 4, C.mint1);
    p.px(x + side + 1, top + 27, C.navy); p.hl(x + side + 1, top + 28, 2, C.stone1);
    for (const yb of [top + 30, top + 36]) p.px(x + w - 3, yb, C.steel3);
  }
}

// ---- other centrepieces --------------------------------------------------------

// pod(ctx, x, y, { w, h, occupant: 'worker'|'bot'|null, label, remap })
export function pod(ctx, x, y, opts = {}) {
  const { w = 26, h = 56, occupant = 'worker', label = '03', remap, lit = true } = opts;
  const p = pen(ctx, remap);
  p.dith(x - 2, y + h - 2, w + 4, 3, null, C.void, 10);
  // top cap with mini screen
  p.box(x, y, w, 10, C.steel0, C.steel2, C.navy2);
  p.rect(x + 3, y + 3, w - 12, 4, C.ink); p.text(label, x + 4, y + 3, C.mint2, 'f3');
  p.px(x + w - 6, y + 4, C.mint2); p.px(x + w - 4, y + 4, C.amber);
  // glass body
  const gy = y + 10, gh = h - 20;
  p.rect(x, gy, w, gh, C.void);
  p.rect(x + 3, gy, w - 6, gh, C.navy);
  p.dith(x + 3, gy, w - 6, gh, null, C.mint0, lit ? 6 : 3);
  p.dithV(x + 3, gy, w - 6, 6, C.mint1, 4, 0);
  if (occupant === 'worker') {
    const cx = x + Math.floor(w / 2) - 3;
    const oy = gy + gh - 26;
    p.rect(cx, oy, 6, 2, C.amber); p.rect(cx - 1, oy + 2, 8, 1, C.amber); // hard hat
    p.rect(cx + 1, oy + 3, 4, 4, C.skin); p.px(cx + 4, oy + 4, C.ink); p.px(cx + 1, oy + 6, C.skinDark);
    p.rect(cx, oy + 7, 6, 9, C.steel1); p.vl(cx + 5, oy + 7, 9, C.steel0); p.hl(cx, oy + 11, 6, C.navy2);
    p.rect(cx + 1, oy + 16, 2, 8, C.navy2); p.rect(cx + 3, oy + 16, 2, 8, C.navy2); p.vl(cx + 4, oy + 16, 8, C.navy);
    p.hl(cx, oy + 24, 3, C.void); p.hl(cx + 3, oy + 24, 3, C.void);
  } else if (occupant === 'bot') {
    const cx = x + Math.floor(w / 2) - 5, oy = gy + gh - 16;
    p.vl(cx + 5, oy - 4, 4, C.steel2); p.px(cx + 5, oy - 5, C.red);
    p.box(cx, oy, 11, 8, C.mint0, C.mint1, C.ink); p.px(cx + 3, oy + 3, C.mint2); p.px(cx + 7, oy + 3, C.mint2);
    p.box(cx + 1, oy + 8, 9, 8, C.steel0, C.steel1, C.navy2); p.hl(cx + 3, oy + 11, 5, C.mint1);
  }
  // glass glare: two clean diagonal streaks + a vertical sheen line
  for (let q = 0; q < 14; q++) {
    for (const [ox, oy] of [[4, 6], [4, 26]]) {
      const X = x + ox + Math.floor(q / 2), Y = gy + oy + 12 - q;
      if (Y > gy && Y < gy + gh && X < x + w - 4) { p.px(X, Y, C.steel2); if (q % 2) p.px(X + 2, Y, C.steel1); }
    }
  }
  p.dith(x + w - 6, gy + 2, 1, gh - 4, null, C.steel1, 8);
  p.rect(x, gy, 3, gh, C.steel0); p.vl(x, gy, gh, C.steel1); p.vl(x + 2, gy, gh, C.navy2);
  p.rect(x + w - 3, gy, 3, gh, C.navy2); p.vl(x + w - 3, gy, gh, C.steel0); p.vl(x + w - 1, gy, gh, C.void);
  for (let yy = gy + 4; yy < gy + gh - 2; yy += 10) { p.screw(x + 1, yy, C.steel2); p.screw(x + w - 2, yy, C.steel1); }
  // base
  p.box(x - 1, y + h - 10, w + 2, 10, C.steel0, C.steel1, C.navy2);
  hazardStrip(ctx, x + 1, y + h - 6, w - 2, 3, { remap, edge: false });
  p.hl(x + 1, y + h - 3, w - 2, C.navy);
  return { w, h };
}

// tank(ctx, x, y, { w, h, level, remap })  glass containment tank with liquid + specimen.
export function tank(ctx, x, y, opts = {}) {
  const { w = 60, h = 64, level = 0.7, remap, specimen = 'cube' } = opts;
  const p = pen(ctx, remap);
  p.dith(x - 3, y + h - 2, w + 6, 3, null, C.void, 10);
  // rim
  p.box(x, y, w, 7, C.steel0, C.steel2, C.navy2);
  for (let i = x + 4; i < x + w - 3; i += 8) p.rivet(i, y + 2, C.steel3, C.navy, C.steel1);
  // glass
  const gy = y + 7, gh = h - 19;
  p.rect(x + 1, gy, w - 2, gh, C.ink);
  p.dith(x + 1, gy, w - 2, gh, null, C.navy2, 6);
  const ly = gy + Math.round(gh * (1 - level));
  p.rect(x + 1, ly, w - 2, gy + gh - ly, C.mint0);
  p.dith(x + 1, ly, w - 2, gy + gh - ly, null, C.mint1, 3);
  p.dithV(x + 1, ly + 4, w - 2, gy + gh - ly - 4, C.navy, 0, 9);
  p.hl(x + 1, ly, w - 2, C.mint2); p.dith(x + 1, ly + 1, w - 2, 1, null, C.mint1, 10);
  // specimen
  if (specimen) icon(ctx, x + Math.floor(w / 2) - 7, ly + Math.floor((gy + gh - ly) / 2) - 6, specimen, C.mint2, { remap, shade: C.mint0, lit: C.cream2 });
  // bubbles
  for (let k = 0; k < 9; k++) {
    const bx = x + 4 + Math.floor(p.rnd(k, 1, 4) * (w - 8)), byy = ly + 2 + Math.floor(p.rnd(k, 2, 4) * (gy + gh - ly - 4));
    p.px(bx, byy, C.mint2); if (k % 3 === 0) { p.px(bx + 1, byy - 2, C.cream2); }
  }
  // glare + frame posts
  for (let q = 0; q < gh; q++) {
    if (q % 11 < 7) { p.px(x + 5 + Math.floor(q / 3), gy + q, C.steel2); }
    if (BAYER4[q & 3][0] < 6) p.px(x + 9 + Math.floor(q / 3), gy + q, C.steel1);
  }
  for (const px0 of [x, x + w - 3]) {
    p.rect(px0, gy, 3, gh, C.steel0); p.vl(px0, gy, gh, C.steel1); p.vl(px0 + 2, gy, gh, C.navy);
  }
  p.rect(x + Math.floor(w / 2) - 1, gy, 2, gh, C.navy2); p.vl(x + Math.floor(w / 2) - 1, gy, gh, C.steel0);
  // warning placard
  const wx = x + w - 17, wy = gy + 4;
  p.rect(wx, wy, 12, 10, C.void); p.rect(wx + 1, wy + 1, 10, 8, C.yellow);
  p.hl(wx + 1, wy + 1, 10, C.cream2);
  p.vl(wx + 6, wy + 2, 4, C.ink); p.px(wx + 6, wy + 7, C.ink);
  // base + feed pipes
  p.box(x - 2, y + h - 12, w + 4, 12, C.navy2, C.steel0, C.navy);
  hazardStrip(ctx, x, y + h - 4, w, 3, { remap, edge: false });
  p.rect(x + 3, y + h - 11, 31, 7, C.ink); p.text('SANDBOX', x + 4, y + h - 10, C.cream, 'f3');
  for (let i = x + 37; i < x + w - 3; i += 3) { p.px(i, y + h - 9, C.void); p.px(i, y + h - 8, C.steel1); }
  return { w, h };
}

// turnstile(ctx, x, y, { w, h, state: 'locked'|'open', remap })  waist-high tripod gate.
export function turnstile(ctx, x, y, opts = {}) {
  const { w = 36, h = 44, state = 'locked', remap } = opts;
  const p = pen(ctx, remap);
  const ok = state === 'open';
  p.dith(x - 2, y + h - 2, w + 4, 3, null, C.void, 10);
  // cabinet (waist height) with sloped top
  const cx0 = x + 2, cw = 16, cy0 = y + 12, ch = h - 16;
  p.rect(cx0, cy0, cw, ch, C.void);
  p.rect(cx0 + 1, cy0 + 1, cw - 2, ch - 2, C.steel0);
  p.mottle(cx0 + 1, cy0 + 1, cw - 2, ch - 2, C.steel1, 5, 5, 2);
  p.noise(cx0 + 1, cy0 + 1, cw - 2, ch - 2, C.navy2, 0.06, 3);
  p.vl(cx0 + 1, cy0 + 1, ch - 2, C.steel2); p.vl(cx0 + cw - 2, cy0 + 1, ch - 2, C.navy2);
  p.rect(cx0 - 1, cy0 - 2, cw + 2, 3, C.void); p.hl(cx0, cy0 - 2, cw, C.steel3); p.hl(cx0, cy0 - 1, cw, C.steel1);
  // service panel + vents + stripe
  p.bevel(cx0 + 3, cy0 + 10, cw - 6, 10, C.navy2, C.steel2);
  for (let k = 0; k < 3; k++) p.hl(cx0 + 5, cy0 + 12 + k * 3, cw - 10, C.navy);
  p.rect(cx0 + 1, cy0 + 4, cw - 2, 3, C.amber); p.hl(cx0 + 1, cy0 + 4, cw - 2, C.yellow); p.hl(cx0 + 1, cy0 + 6, cw - 2, C.rust1);
  // card reader post on top
  p.rect(cx0 + 3, y, 9, 11, C.void);
  p.rect(cx0 + 4, y + 1, 7, 9, C.navy2); p.hl(cx0 + 4, y + 1, 7, C.steel1);
  p.rect(cx0 + 5, y + 3, 5, 3, C.ink); p.dith(cx0 + 5, y + 3, 5, 3, null, ok ? C.mint0 : C.rust0, 8);
  p.px(cx0 + 5, y + 7, ok ? C.mint2 : C.mint0); p.px(cx0 + 9, y + 7, ok ? C.rust0 : C.red);
  if (!ok) p.dith(cx0 + 7, y - 2, 4, 2, null, C.red, 3);
  // tripod hub on the right face + three arms
  const hx = cx0 + cw, hy = cy0 + 4;
  p.disc(hx + 1, hy, 3, C.void); p.disc(hx + 1, hy, 2, C.steel1); p.px(hx, hy - 1, C.steel3); p.px(hx + 2, hy + 1, C.navy2);
  // horizontal arm toward the viewer's right (blocking)
  p.rect(hx + 3, hy - 1, x + w - hx - 3, 3, C.void); p.hl(hx + 3, hy - 1, x + w - hx - 4, C.steel3); p.hl(hx + 3, hy, x + w - hx - 4, C.steel1);
  p.rect(x + w - 2, hy - 2, 2, 5, C.void); p.vl(x + w - 2, hy - 1, 3, C.steel2);
  // two arms angled down/back
  p.line(hx + 1, hy + 3, hx + 7, hy + 12, C.void); p.line(hx + 2, hy + 3, hx + 8, hy + 12, C.steel1); p.line(hx + 3, hy + 3, hx + 9, hy + 12, C.void);
  p.line(hx + 1, hy - 3, hx + 6, hy - 10, C.void); p.line(hx + 2, hy - 3, hx + 7, hy - 10, C.steel2);
  // footplate
  hazardStrip(ctx, x, y + h - 4, w, 4, { remap });
  return { w, h };
}

// forklift(ctx, x, y, { w, h, forkY, remap })  facing right; w≈56, h≈44.
export function forklift(ctx, x, y, opts = {}) {
  const { forkY = 0, remap, label = 'L2' } = opts;
  const w = 56, h = 44;
  const p = pen(ctx, remap);
  const Y = [C.rust1, C.amber, C.yellow, C.cream2]; // paint ramp
  const gy = y + h; // ground
  p.dith(x - 2, gy - 2, w + 4, 3, null, C.void, 11);
  // mast (behind carriage): two rails with cross ties + chain
  const mx = x + 42;
  for (const rx of [mx, mx + 4]) { p.rect(rx, y + 2, 3, h - 6, C.void); p.vl(rx + 1, y + 3, h - 8, rx === mx ? C.steel1 : C.steel0); }
  for (let yy = y + 6; yy < gy - 8; yy += 8) { p.hl(mx, yy, 7, C.navy2); p.px(mx + 1, yy, C.steel2); }
  p.vl(mx + 3, y + 4, h - 10, C.ink);
  p.rect(mx - 1, y + 1, 9, 2, C.void); p.hl(mx, y + 1, 7, C.steel2);
  // carriage + forks
  const fy = gy - 5 - forkY;
  p.rect(mx + 6, fy - 12, 4, 13, C.void); p.vl(mx + 7, fy - 11, 11, C.steel2); p.vl(mx + 8, fy - 11, 11, C.steel0);
  for (let k = 0; k < 3; k++) p.hl(mx + 7, fy - 10 + k * 4, 2, C.navy2);
  p.rect(mx + 6, fy, w - (mx + 6 - x), 3, C.void); p.hl(mx + 7, fy, w - (mx + 8 - x), C.steel2); p.hl(mx + 7, fy + 1, w - (mx + 8 - x), C.steel0);
  p.px(x + w - 1, fy + 1, C.void);
  // overhead guard
  const gx0 = x + 11, gx1 = x + 36, gTop = y + 4;
  p.rect(gx0 - 1, gTop, gx1 - gx0 + 3, 4, C.void);
  p.hl(gx0, gTop + 1, gx1 - gx0 + 1, C.steel1); p.hl(gx0, gTop + 2, gx1 - gx0 + 1, C.navy2);
  for (let i = gx0 + 3; i < gx1; i += 4) p.px(i, gTop + 1, C.void);
  for (const px0 of [gx0, gx1]) { p.rect(px0 - 1, gTop + 3, 3, gy - 20 - gTop - 3, C.void); p.vl(px0, gTop + 3, gy - 20 - gTop - 3, C.steel0); }
  p.line(gx1, gTop + 4, gx1 + 5, gy - 20, C.void); p.line(gx1 + 1, gTop + 4, gx1 + 6, gy - 20, C.steel0);
  // beacon
  p.rect(gx0 + 4, gTop - 3, 4, 3, C.void); p.hl(gx0 + 5, gTop - 2, 2, C.amber); p.px(gx0 + 5, gTop - 3, C.yellow);
  // seat + steering
  p.rect(x + 15, gy - 33, 4, 10, C.void); p.vl(x + 16, gy - 32, 8, C.navy2);
  p.rect(x + 15, gy - 25, 10, 3, C.void); p.hl(x + 16, gy - 25, 8, C.navy2);
  p.line(x + 33, gy - 21, x + 30, gy - 29, C.void); p.line(x + 34, gy - 21, x + 31, gy - 29, C.steel1);
  p.rect(x + 27, gy - 31, 7, 2, C.void); p.hl(x + 28, gy - 31, 5, C.steel2);
  // body
  const bTop = gy - 21, bBot = gy - 7;
  p.rect(x + 2, bTop, mx - x - 1, bBot - bTop, C.void);
  p.rect(x + 3, bTop + 1, mx - x - 3, bBot - bTop - 2, Y[1]);
  p.mottle(x + 3, bTop + 1, mx - x - 3, bBot - bTop - 2, Y[2], 5, 5, 3);
  p.hl(x + 3, bTop + 1, mx - x - 3, Y[3]); p.hl(x + 3, bTop + 2, mx - x - 3, Y[2]);
  p.dithV(x + 3, bTop + 7, mx - x - 3, bBot - bTop - 8, Y[0], 2, 12);
  p.noise(x + 3, bTop + 3, mx - x - 3, bBot - bTop - 4, Y[0], 0.05, 9);
  // counterweight with hazard chevrons
  p.rect(x, bTop - 4, 13, bBot - bTop + 4, C.void);
  p.rect(x + 1, bTop - 3, 11, bBot - bTop + 2, Y[1]);
  p.hl(x + 1, bTop - 3, 11, Y[3]); p.px(x, bTop - 4, null);
  for (let j = 0; j < 6; j++) for (let i = 0; i < 9; i++) if (((i + j) % 6) < 3) p.px(x + 2 + i, bBot - 8 + j, C.ink);
  // hood seam, vents, number
  p.vl(x + 13, bTop + 1, bBot - bTop - 2, Y[0]);
  for (let k = 0; k < 3; k++) p.hl(x + 26, bTop + 4 + k * 2, 8, Y[0]);
  p.text(label, x + 16, bTop + 4, C.ink, 'f3');
  // wheels with arches
  for (const [wx, r] of [[x + 9, 6], [x + 35, 7]]) {
    const wy = gy - r - 1;
    p.disc(wx, wy, r + 1, C.void);
    p.disc(wx, wy, r, C.ink);
    for (let a = 0; a < 8; a++) { const t = a * Math.PI / 4; p.px(wx + Math.round(Math.cos(t) * (r - 1)), wy + Math.round(Math.sin(t) * (r - 1)), C.navy2); }
    p.disc(wx, wy, 2, C.steel0); p.px(wx - 1, wy - 1, C.steel2); p.px(wx, wy, C.navy);
    p.hl(wx - r + 1, wy - r, r * 2 - 1, C.navy2);
  }
  return { w, h };
}

// conveyor(ctx, x, y, w, { offset, items, remap })  belt 6 px + frame; y = belt top.
export function conveyor(ctx, x, y, w, opts = {}) {
  const { offset = 0, items = [], remap, h = 22 } = opts;
  const p = pen(ctx, remap);
  p.dith(x - 2, y + h - 2, w + 4, 3, null, C.void, 10);
  // items riding on the belt (drawn first so belt lip overlaps nothing important)
  for (const it of items) {
    const ix = x + it.x, iw = it.w ?? 12, ih = it.h ?? 10;
    p.rect(ix, y - ih, iw, ih, C.void);
    p.rect(ix + 1, y - ih + 1, iw - 2, ih - 1, C.wood1);
    p.hl(ix + 1, y - ih + 1, iw - 2, C.brass);
    p.line(ix + 1, y - ih + 1, ix + iw - 2, y - 1, C.wood0);
    p.vl(ix + iw - 2, y - ih + 2, ih - 2, C.wood0);
    if (it.label) p.text(it.label, ix + 2, y - ih + 3, C.cream, 'f3');
  }
  // belt
  p.rect(x, y, w, 4, C.ink);
  p.hl(x, y, w, C.steel0);
  for (let i = x + ((offset % 5) + 5) % 5; i < x + w; i += 5) { p.px(i, y + 1, C.navy2); p.px(i, y + 2, C.navy2); }
  // side frame with rollers
  p.rect(x - 2, y + 3, w + 4, 7, C.void);
  p.rect(x - 1, y + 4, w + 2, 5, C.steel0);
  p.hl(x - 1, y + 4, w + 2, C.steel2); p.hl(x - 1, y + 8, w + 2, C.navy2);
  for (let i = x + 3; i < x + w - 2; i += 8) { p.disc(i, y + 6, 1, C.navy2); p.px(i, y + 6, C.steel3); }
  // end drums
  for (const ex of [x - 3, x + w + 2]) { p.disc(ex, y + 4, 3, C.void); p.disc(ex, y + 4, 2, C.steel1); p.px(ex - 1, y + 3, C.steel3); p.px(ex, y + 4, C.navy); }
  hazardStrip(ctx, x - 1, y + 9, w + 2, 3, { remap, edge: false });
  // legs + cross-brace
  for (let lx = x + 4; lx < x + w - 2; lx += 28) {
    p.rect(lx, y + 12, 3, h - 13, C.void); p.vl(lx + 1, y + 12, h - 13, C.steel0);
    p.rect(lx - 1, y + h - 2, 5, 2, C.navy2);
  }
  p.hl(x + 4, y + h - 7, w - 8, C.navy2);
  return { w, h };
}

// stampPress(ctx, x, y, { w, h, ramY, label, count, remap })
export function stampPress(ctx, x, y, opts = {}) {
  const { w = 44, h = 66, ramY = 0, label = 'STAMP', count = '0042', remap } = opts;
  const p = pen(ctx, remap);
  const R = [C.rust0, C.rust1, C.rust2, C.rust3];
  p.dith(x - 2, y + h - 2, w + 4, 3, null, C.void, 10);
  // crown + hydraulic cylinder
  p.box(x, y + 4, w, 14, R[1], R[3], R[0]);
  p.mottle(x + 1, y + 5, w - 2, 12, R[2], 5, 5, 3);
  p.noise(x + 1, y + 5, w - 2, 12, R[0], 0.08, 4);
  p.rect(x + Math.floor(w / 2) - 5, y, 10, 5, C.void); p.rect(x + Math.floor(w / 2) - 4, y + 1, 8, 4, C.steel1); p.hl(x + Math.floor(w / 2) - 4, y + 1, 8, C.steel3);
  p.rivet(x + 2, y + 6, R[3], R[0], R[1]); p.rivet(x + w - 4, y + 6, R[3], R[0], R[1]);
  p.rect(x + 6, y + 8, w - 12, 7, C.ink);
  p.text(count.slice(0, Math.floor((w - 14) / 6)), x + 8, y + 8, C.amber);
  // columns
  for (const cx of [x + 2, x + w - 8]) {
    p.rect(cx, y + 18, 6, h - 30, C.void); p.rect(cx + 1, y + 18, 4, h - 30, C.steel0);
    p.vl(cx + 1, y + 18, h - 30, C.steel2); p.vl(cx + 4, y + 18, h - 30, C.navy2);
  }
  // ram + die
  const ry = y + 18 + ramY;
  p.rect(x + Math.floor(w / 2) - 2, y + 18, 4, ramY + 2, C.steel2); p.vl(x + Math.floor(w / 2) + 1, y + 18, ramY + 2, C.steel0);
  p.box(x + 9, ry + 2, w - 18, 8, C.steel0, C.steel2, C.navy2);
  for (let i = x + 11; i < x + w - 11; i += 4) p.px(i, ry + 8, C.yellow);
  p.rect(x + 13, ry + 10, w - 26, 3, C.navy2); p.hl(x + 13, ry + 10, w - 26, C.steel1);
  // bed + base
  const bedY = y + h - 14;
  p.box(x + 6, bedY - 4, w - 12, 5, C.steel1, C.steel3, C.steel0);
  p.box(x - 1, bedY, w + 2, 14, R[1], R[3], R[0]);
  p.noise(x, bedY + 1, w, 12, R[0], 0.1, 6);
  hazardStrip(ctx, x + 1, bedY + 3, w - 2, 4, { remap, edge: false });
  p.textShadow(label, x + 3, bedY + 8, C.cream, R[0], 'f3');
  // guard lamp
  p.rect(x + w - 6, y + 1, 4, 3, C.void); p.px(x + w - 5, y + 2, C.red); p.px(x + w - 4, y + 2, C.rust3);
  return { w, h };
}
