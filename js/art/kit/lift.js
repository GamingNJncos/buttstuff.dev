// Goods lift: shaft cutaway sections, car with scissor gate + readout, call box, head cap and pit.
import { C } from '../palette.js?v=68';
import { pen } from './wall.js?v=68';
import { bigText } from './signs.js?v=68';
import { BAYER4 } from '../dither.js?v=68';

export const CAR_W = 66;
export const CAR_H = 74;

// Static back of the shaft between y0 and y1 (floors: [{ f, top }] that intersect, for stencils + sills).
export function drawShaft(ctx, x, w, y0, y1, opts = {}) {
  const { floors = [], remap, roomH = 135 } = opts;
  const p = pen(ctx, remap);
  const h = y1 - y0;
  // back wall: dark panels with seams, darker toward the edges
  p.rect(x, y0, w, h, C.navy);
  p.mottle(x, y0, w, h, C.navy2, 9, 5, 7);
  p.noise(x, y0, w, h, C.ink, 0.05, 11);
  for (let sx = x + 20; sx < x + w - 4; sx += 20) { p.vl(sx, y0, h, C.ink); p.dith(sx + 1, y0, 1, h, null, C.navy2, 10); }
  for (let sy = y0 - (y0 % 30) + 30; sy < y1; sy += 30) { p.hl(x, sy, w, C.ink); p.dith(x, sy + 1, w, 1, null, C.navy2, 8); }
  p.dithH(x + 2, y0, 8, h, C.ink, 12, 0);
  p.dithH(x + w - 10, y0, 8, h, C.ink, 0, 12);
  // floor-number stencils + ring beams + landing sills
  for (const { f, top, plaque } of floors) {
    const label = f < 0 ? '^^' : f > 5 ? '??' : `0${f}`;
    const sy = top + 28;
    if (plaque) {
      // the floor plaque is drawn live, in front of the cables (drawFloorPlaque)
    } else if (sy + 21 > y0 && sy < y1) bigText(ctx, label, x + 24, sy, C.steel0, 3, { shadow: C.ink, worn: 0.18, seed: f + 3, remap });
    const gy = top + roomH;
    if (gy - 6 >= y0 && gy < y1) {
      // ring beam across the back under the landing
      p.rect(x, gy, w, 10, C.ink); p.hl(x, gy + 1, w, C.navy2); p.rect(x, gy + 2, w, 6, C.navy2);
      p.dith(x, gy + 2, w, 6, null, C.steel0, 3); p.hl(x, gy + 8, w, C.ink);
      for (let rx = x + 4; rx < x + w - 2; rx += 8) p.rivet(rx, gy + 4, C.steel1, C.ink, C.navy2);
      // landing sills each side with hazard paint
      for (const sx of [x, x + w - 9]) {
        p.rect(sx, gy - 6, 9, 6, C.ink); p.hl(sx, gy - 6, 9, C.steel1); p.hl(sx, gy - 5, 9, C.steel0);
        for (let i = 0; i < 9; i++) p.px(sx + i, gy - 4, ((sx + i) % 4) < 2 ? C.yellow : C.ink);
        p.hl(sx, gy - 3, 9, C.navy2);
      }
      // little landing plate with the level
      p.rect(x + w - 24, top + 56, 13, 7, C.void); p.rect(x + w - 23, top + 57, 11, 5, C.steel0);
      p.text(f < 0 ? '^^' : f > 5 ? '??' : `0${f}`, x + w - 21, top + 57, C.cream, 'f3');
    }
  }
  // ladder (left)
  const lx = x + 3;
  p.vl(lx, y0, h, C.steel0); p.vl(lx + 1, y0, h, C.ink); p.vl(lx + 6, y0, h, C.steel0); p.vl(lx + 7, y0, h, C.ink);
  for (let ry = y0 - (y0 % 4); ry < y1; ry += 4) if (ry >= y0) { p.hl(lx + 1, ry, 5, C.steel1); p.hl(lx + 2, ry + 1, 4, C.ink); }
  for (let by = y0 - (y0 % 45) + 20; by < y1; by += 45) if (by >= y0) { p.rect(lx - 1, by, 9, 2, C.navy2); p.px(lx - 1, by, C.steel1); }
  // car guide rails
  for (const gx of [x + 11, x + w - 13]) {
    p.vl(gx, y0, h, C.steel1); p.vl(gx + 1, y0, h, C.navy2);
    for (let by = y0 - (y0 % 45) + 8; by < y1; by += 45) if (by >= y0) { p.rect(gx - 1, by, 4, 5, C.ink); p.rect(gx, by + 1, 2, 3, C.steel0); p.px(gx, by + 1, C.steel2); }
  }
  // counterweight rails (right)
  p.vl(x + w - 9, y0, h, C.navy2); p.vl(x + w - 4, y0, h, C.navy2);
  // cut edges of the shaft walls
  p.vl(x, y0, h, C.stone1); p.vl(x + 1, y0, h, C.ink);
  p.vl(x + w - 1, y0, h, C.stone1); p.vl(x + w - 2, y0, h, C.ink);
}

// Head of the shaft at y (= top of floor 00): concrete header, hatch (closed unless open), sheave.
export function drawShaftHead(ctx, x, w, y, opts = {}) {
  const { open = false, remap } = opts;
  const p = pen(ctx, remap);
  if (!open) {
    // hatch leaves: hazard paint on steel
    p.rect(x, y - 4, w, 6, C.void);
    for (let i = 0; i < w; i++) for (let j = 0; j < 4; j++) p.px(x + i, y - 3 + j, ((x + i + j) % 8) < 4 ? C.yellow : C.ink);
    p.hl(x, y - 4, w, C.steel1); p.vl(x + (w >> 1), y - 4, 6, C.void);
    p.rect(x + (w >> 1) - 3, y - 3, 2, 3, C.steel2); p.rect(x + (w >> 1) + 2, y - 3, 2, 3, C.steel2);
  }
  // header beam with rivets
  p.rect(x - 4, y + 1, w + 8, 7, C.void); p.rect(x - 3, y + 2, w + 6, 5, C.steel0);
  p.hl(x - 3, y + 2, w + 6, C.steel2); p.hl(x - 3, y + 6, w + 6, C.navy2);
  for (let rx = x; rx < x + w; rx += 7) p.rivet(rx, y + 3, C.steel2, C.ink, C.steel0);
  // sheave housing + wheel
  const cx = x + (w >> 1);
  p.rect(cx - 12, y + 8, 24, 4, C.ink); p.rect(cx - 11, y + 8, 22, 3, C.navy2); p.hl(cx - 11, y + 8, 22, C.steel0);
  p.disc(cx, y + 15, 6, C.void); p.ring(cx, y + 15, 6, C.steel1); p.ring(cx, y + 15, 4, C.navy2); p.disc(cx, y + 15, 2, C.steel0);
  p.px(cx - 1, y + 14, C.steel3);
  p.line(cx - 4, y + 12, cx + 4, y + 18, C.steel0); p.line(cx + 4, y + 12, cx - 4, y + 18, C.steel0);
  p.disc(cx, y + 15, 1, C.steel2);
  // warning plate on header
  p.rect(x + 12, y + 9, 5, 5, C.yellow); p.px(x + 14, y + 10, C.ink); p.px(x + 14, y + 12, C.ink);
}

// Pit under floor 05: buffers on a solid sump floor (y = top of the pit).
export function drawShaftPit(ctx, x, w, y, h, opts = {}) {
  const { remap } = opts;
  const p = pen(ctx, remap);
  const fy = y + h - 8;
  p.rect(x, fy, w, 8, C.stone1); p.hl(x, fy, w, C.stone2); p.noise(x, fy + 1, w, 7, C.stone0, 0.25, 5);
  p.dith(x, fy - 5, w, 5, null, C.ink, 8);
  for (const bx of [x + 18, x + w - 26]) {
    p.rect(bx, fy - 4, 8, 4, C.void); p.rect(bx + 1, fy - 3, 6, 3, C.steel0);
    for (let k = 0; k < 4; k++) { p.hl(bx + 1, fy - 6 - k * 2, 6, C.amber); p.hl(bx + 2, fy - 5 - k * 2, 5, C.rust1); }
    p.rect(bx, fy - 15, 8, 2, C.steel1);
  }
  p.dith(x + 30, fy + 2, 16, 2, null, C.void, 9);
}

// Car with gate. gateT 0 = open, 1 = closed. y = top of car.
export function drawCar(ctx, x, y, opts = {}) {
  const { readout = '00', lamp = true, gateT = 0, arrow = 0, remap, t = 0 } = opts;
  const p = pen(ctx, remap);
  const w = CAR_W, h = CAR_H;
  const ix = x + 6, iw = w - 12, iy = y + 13, ih = h - 17;
  // cables to the crosshead (above)
  // crosshead
  p.rect(x, y, w, 13, C.void);
  p.rect(x + 1, y + 1, w - 2, 11, C.steel0); p.hl(x + 1, y + 1, w - 2, C.steel2); p.hl(x + 1, y + 11, w - 2, C.navy2);
  p.dith(x + 1, y + 2, w - 2, 9, null, C.steel1, 3);
  p.rivet(x + 2, y + 3, C.steel2, C.navy2, C.steel0); p.rivet(x + w - 4, y + 3, C.steel2, C.navy2, C.steel0);
  // readout
  const rx = x + (w >> 1) - 11;
  p.rect(rx, y + 2, 22, 9, C.void); p.rect(rx + 1, y + 3, 20, 7, C.ink);
  p.dith(rx + 1, y + 3, 20, 7, null, C.mint0, 4);
  p.text(readout, rx + 4, y + 3, C.mint2);
  if (arrow) p.text(arrow < 0 ? '▲' : '▼', rx + 15, y + 3, (Math.floor(t * 2) % 2) ? C.mint2 : C.mint1);
  else for (let k = 0; k < 3; k++) p.hl(rx + 16, y + 4 + k * 2, 3, k === 1 ? C.mint1 : C.mint0);
  for (let k = 0; k < 3; k++) p.hl(x + w - 14, y + 4 + k * 2, 6, C.navy2);
  // interior
  p.rect(ix, iy, iw, ih, C.navy2);
  p.dithV(ix, iy, iw, 8, C.ink, 10, 0);
  for (let sx = ix + 3; sx < ix + iw - 1; sx += 5) { p.vl(sx, iy + 2, ih - 2, C.navy); p.dith(sx + 1, iy + 2, 1, ih - 2, null, C.steel0, 3); }
  // amber lamp under the readout + dithered spill
  const lc = lamp ? C.amber : C.rust0;
  p.rect(x + (w >> 1) - 7, iy, 14, 2, C.void); p.hl(x + (w >> 1) - 6, iy, 12, lc); p.hl(x + (w >> 1) - 5, iy + 1, 10, lamp ? C.yellow : C.rust1);
  if (lamp) for (let j = 0; j < 6; j++) p.dith(x + (w >> 1) - 8 - j, iy + 2 + j, 16 + 2 * j, 1, null, C.amber, Math.max(0, 5 - j));
  // notice + handrail + floor panel
  p.rect(ix + 3, iy + 7, 11, 9, C.stone2); p.rect(ix + 4, iy + 8, 9, 7, C.cream);
  p.hl(ix + 5, iy + 9, 6, C.stone1); p.hl(ix + 5, iy + 11, 7, C.stone2); p.hl(ix + 5, iy + 13, 5, C.stone2);
  p.hl(ix, iy + 33, iw, C.steel1); p.hl(ix, iy + 34, iw, C.ink);
  p.rect(ix + iw - 9, iy + 16, 6, 14, C.void); p.rect(ix + iw - 8, iy + 17, 4, 12, C.steel0);
  for (let k = 0; k < 6; k++) p.px(ix + iw - 7 + (k % 2), iy + 18 + Math.floor(k / 2) * 3, k === 0 ? C.mint2 : C.navy2);
  // posts
  for (const px0 of [x, x + w - 6]) {
    p.rect(px0, y + 12, 6, h - 12, C.void);
    p.rect(px0 + 1, y + 12, 4, h - 13, C.steel0); p.vl(px0 + 1, y + 12, h - 13, C.steel1); p.vl(px0 + 4, y + 12, h - 13, C.navy2);
    for (let ry = y + 16; ry < y + h - 6; ry += 9) p.px(px0 + 2, ry, C.steel2);
  }
  // gate: collapsed bundles at the posts, scissor lattice when closing
  const half = Math.floor((iw / 2) * Math.max(0, Math.min(1, gateT)));
  const gy0 = iy + 2, gh = ih - 3;
  const lattice = (x0, x1) => {
    const ww = x1 - x0;
    if (ww < 2) return;
    const cell = 6;
    for (let gx = x0; gx <= x1; gx += cell) p.vl(Math.min(gx, x1), gy0, gh, C.steel1);
    for (let j = 0; j < gh; j++) {
      for (let i = 0; i < ww; i++) {
        const X = x0 + i, Y = gy0 + j;
        const a = ((i + j) % (cell * 2)) === 0, b = ((i - j) % (cell * 2) + cell * 2) % (cell * 2) === 0;
        if (a || b) p.px(X, Y, a ? C.steel2 : C.steel0);
      }
    }
    p.hl(x0, gy0, ww + 1, C.steel2); p.hl(x0, gy0 + gh - 1, ww + 1, C.steel0);
  };
  lattice(ix, ix + 2 + half);
  lattice(ix + iw - 3 - half, ix + iw - 1);
  // platform grating + toe guard
  const fy = y + h - 4;
  p.rect(x - 1, fy, w + 2, 4, C.void);
  for (let i = 0; i < w; i++) p.px(x + i, fy + 1, i % 3 ? C.steel1 : C.navy2);
  p.hl(x, fy, w, C.steel2); p.hl(x, fy + 2, w, C.navy2);
  p.rect(x + 4, fy + 4, w - 8, 3, C.ink); p.hl(x + 4, fy + 4, w - 8, C.navy2);
}

// Counterweight block on the right rails; y = top.
export function drawCounterweight(ctx, x, y, opts = {}) {
  const p = pen(ctx, opts.remap);
  p.rect(x, y, 6, 26, C.void); p.rect(x + 1, y + 1, 4, 24, C.stone1);
  for (let k = 0; k < 6; k++) p.hl(x + 1, y + 2 + k * 4, 4, C.stone0);
  p.vl(x + 1, y + 1, 24, C.stone2);
  p.rect(x + 1, y + 22, 4, 3, C.yellow); p.px(x + 2, y + 23, C.ink);
}

// Hoist cables from yTop down to yBot at the given x positions.
export function drawCables(ctx, xs, yTop, yBot, opts = {}) {
  const p = pen(ctx, opts.remap);
  for (const cx of xs) {
    p.vl(cx, yTop, yBot - yTop, C.ink);
    for (let yy = yTop + ((cx * 3) & 3); yy < yBot; yy += 4) p.px(cx, yy, C.steel0);
  }
}

// Call box on the landing wall; x,y = top-left (12x22). called: car on its way; ready: car here.
export function drawCallBox(ctx, x, y, opts = {}) {
  const { ready = false, called = false, fate = false, t = 0, digits = '00', remap } = opts;
  const p = pen(ctx, remap);
  // conduit up to the ceiling
  p.rect(x + 5, y - 30, 3, 30, C.void); p.vl(x + 6, y - 30, 30, C.steel0);
  // fate lamp dome
  const fateOn = fate && (Math.floor(t * 1.2) % 2 === 0);
  p.rect(x + 3, y - 4, 7, 4, C.void);
  p.rect(x + 4, y - 3, 5, 3, fate ? (fateOn ? C.amber : C.rust1) : C.navy2);
  p.px(x + 5, y - 3, fate ? (fateOn ? C.cream2 : C.rust2) : C.steel0);
  if (fateOn) { p.dith(x + 1, y - 8, 11, 4, null, C.amber, 3); }
  // box
  p.rect(x, y, 13, 22, C.void); p.rect(x + 1, y + 1, 11, 20, C.steel0);
  p.hl(x + 1, y + 1, 11, C.steel2); p.vl(x + 1, y + 1, 20, C.steel1); p.vl(x + 11, y + 2, 19, C.navy2); p.hl(x + 2, y + 20, 10, C.navy2);
  // screen
  p.rect(x + 2, y + 3, 9, 7, C.void); p.rect(x + 3, y + 4, 7, 5, C.ink);
  p.text(digits, x + 3, y + 4, called ? C.amber : C.mint1, 'f3');
  // button
  const bc = ready ? C.mint2 : called ? C.amber : C.mint0;
  p.rect(x + 4, y + 12, 5, 5, C.void); p.rect(x + 5, y + 13, 3, 3, bc); p.px(x + 5, y + 13, ready || called ? C.cream2 : C.mint1);
  p.hl(x + 3, y + 18, 7, C.navy2);
  p.px(x + 2, y + 18, C.steel2); p.px(x + 10, y + 18, C.steel2);
}

export { BAYER4 };

// Fixed floor plaque on the door header above the lift (in front of the cables). lines: [level, name].
export function drawFloorPlaque(ctx, x, w, top, lines) {
  const p = pen(ctx);
  const pw = w - 8, ph = 20, px0 = x + 4, py0 = top + 22;
  p.rect(px0, py0, pw, ph, C.void); p.rect(px0 + 1, py0 + 1, pw - 2, ph - 2, C.navy2);
  p.hl(px0 + 1, py0 + 1, pw - 2, C.steel1); p.hl(px0 + 1, py0 + ph - 2, pw - 2, C.ink);
  for (const rx of [px0 + 2, px0 + pw - 3]) { p.px(rx, py0 + 3, C.steel2); p.px(rx, py0 + ph - 4, C.steel2); }
  lines.forEach((ln, i) => p.text(ln, px0 + ((pw - (ln.length * 6 - 1)) >> 1), py0 + 3 + i * 8, i ? C.cream : C.mint2));
}
