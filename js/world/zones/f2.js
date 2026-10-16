// Floor 02 — Library (deep green damask + dark wood + brass). 960 px wide; shaft at 452..556.
// West → east: Skill Library (the skill book on its lectern, bookcases, room terminal, rolling ladder), reading
// corridor (bookcase, wall clock, reading table + banker's lamp, the auto-compactor gag), shaft | call box, pamphlet
// stand, Skills With Scripts (bookcases whose books sprout cables and gears, room terminal, writing desk + typewriter).
// Decorative books carry no legible text; the only words on this floor's art are the skill book's title and the
// compactor's plate and cube.
import { C, pen, BAYER4, steelPanels, column, ceiling, baseStrip, walkway, slabBand, pipeRun, pipeV, junctionBox, pamphletRack } from './common.js?v=68';
import { signPlate } from '../../art/kit/signs.js?v=68';
import { ROOMS, PROPS, SHAFT_X, SHAFT_W, ROOM_H, WW, PAMPHLET, pamphletAt } from '../levels.js?v=68';
import { ROOM_COPY } from '../../logic/copy.js?v=68';
import { bakeProp, liveFloor } from './generic.js?v=68';
import { duct, bulkhead } from './f1.js?v=68';
import { BOOK_LINES, handPose, compactorPose, COMPACTOR_PLATE } from '../concept.js?v=68';
import { GAG_ART } from '../../logic/demos.js?v=68';
import { reduced } from '../../engine/motion.js?v=68';

const GY = ROOM_H - 6; // 129 walk surface
const WALL_Y = 19;
const EAST = SHAFT_X + SHAFT_W;
const rect = id => { const q = PROPS.find(p => p.id === id); return { x: q.x, y: q.y, w: q.w, h: q.h }; };

export const F2 = {
  lib: ROOMS.find(r => r.id === 'skills'),
  annex: ROOMS.find(r => r.id === 'annex'),
  book: rect('demo-skillbook'),
  clock: { cx: 347, y: 50 },
};
// skill book lectern (centred on the demo prop): desk box with the title plate, the small open book on top
const LCX = F2.book.x + (F2.book.w >> 1);
const LECTERN = {
  cx: LCX,
  box: { x: LCX - 28, y: GY - 6 - 50, w: 57, h: 26 },
  plate: { x: LCX - 27, y: GY - 6 - 48, w: 55, h: 22 },
};
const BOOK = { x: LCX - 15, y: GY - 6 - 67, w: 31, h: 13 };
const LEDS = []; // annex gadget lights, filled by bake()

// ------------------------------------------------------------------ bake (static)
export function bake(ctx) {
  const p = pen(ctx);
  LEDS.length = 0; wireN = 0;
  p.rect(0, 0, WW, 180, C.void);
  const { lib, annex } = F2;
  for (const [a, b] of [[0, SHAFT_X], [EAST, WW]]) {
    damask(p, a, WALL_Y, b - a, 101 - WALL_Y);
    wainscot(p, a, 104, b - a, 19);
    p.rect(a, 101, b - a, 3, C.void); p.hl(a, 101, b - a, C.brass); p.hl(a, 102, b - a, C.wood1);
    p.dithV(a, 104, b - a, 3, C.void, 8, 0);
  }
  panelWall(p, lib.x + 7, 41, lib.w - 14, 60);
  // the annex sits on lab steel (skills that bring their scripts): wood bookcases against riveted panels
  steelPanels(p, annex.x + 7, 41, annex.w - 14, 60, { pw: 34, ramp: [C.navy, C.navy2, C.steel0, C.steel1], seed: 6 });
  p.dithV(annex.x + 7, 41, annex.w - 14, 10, C.ink, 9, 0);

  ceiling(ctx, 0, SHAFT_X, { lights: [270, 410], seed: 21, pipe: 'brass', trim: C.brass });
  ceiling(ctx, EAST, WW, { lights: [], seed: 22, pipe: 'brass', trim: C.brass });

  bulkhead(p, 0, 14);
  bulkhead(p, WW - 14, 14);
  column(p, SHAFT_X - 9, WALL_Y, GY, { w: 9 });
  column(p, EAST, WALL_Y, GY, { w: 9 });

  duct(p, lib.x + lib.w, SHAFT_X - 9, 20);
  duct(p, annex.x + annex.w, WW - 14, 20);
  pipeRun(ctx, lib.x + lib.w, 32, SHAFT_X - 9, { r: 1, color: 'brass', flanges: 40, seed: 7 });

  roomShell(ctx, p, lib);
  roomShell(ctx, p, annex);
  library(ctx, p);
  corridor(ctx, p);
  scriptsAnnex(ctx, p);
  pamphletRack(p, pamphletAt(2).x, GY - PAMPHLET.h);

  baseStrip(p, 14, SHAFT_X - 9 - 14, GY - 6);
  baseStrip(p, EAST + 9, WW - 14 - EAST - 9, GY - 6);
  walkway(p, 0, SHAFT_X, GY);
  walkway(p, EAST, WW - EAST, GY);
  const deck = [C.stone0, C.hairDark, C.wood0, C.stone1];
  slabBand(ctx, 0, SHAFT_X, ROOM_H, { seed: 23, vpipes: [96, 420], boxes: [250], deck });
  slabBand(ctx, EAST, WW, ROOM_H, { seed: 24, vpipes: [640], boxes: [900], deck });

  for (const pr of PROPS.filter(q => q.floor === 2 && q.kind === 'terminal')) bakeProp(ctx, p, pr);
}

// Calm green damask: dark teal ground, dithered pinstripes, a small navy lozenge between them.
function damask(p, x0, y0, w, h) {
  p.rect(x0, y0, w, h, C.mint0);
  p.mottle(x0, y0, w, h, C.navy2, 11, 4, 31);
  for (let x = Math.ceil(x0 / 16) * 16; x < x0 + w; x += 16) p.dith(x, y0, 1, h, null, C.ink, 7);
  for (let y = y0 + 9; y < y0 + h - 3; y += 14) {
    for (let x = Math.ceil(x0 / 16) * 16 + 8; x < x0 + w - 2; x += 16) {
      if (x - 2 < x0) continue;
      for (const [i, j] of [[0, -2], [-1, -1], [1, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, 2]]) p.px(x + i, y + j, C.navy2);
      p.px(x, y, C.ink);
    }
  }
  p.dithV(x0, y0, w, 16, C.void, 9, 0);
}

// Dark wood wainscot: raised panels (shadowed top/left recess, lit bottom/right lip) between stiles.
function wainscot(p, x0, y0, w, h) {
  p.rect(x0, y0, w, h, C.wood0);
  for (let a = Math.floor(x0 / 30) * 30; a < x0 + w; a += 30) {
    if (a >= x0) { p.vl(a, y0, h, C.hairDark); if (a + 1 < x0 + w) p.vl(a + 1, y0, h, C.wood1); }
    const L = Math.max(x0, a + 5), R = Math.min(x0 + w, a + 27);
    if (R - L < 6) continue;
    p.hl(L, y0 + 4, R - L, C.hairDark); p.vl(L, y0 + 4, h - 8, C.hairDark);
    p.hl(L, y0 + h - 5, R - L, C.wood1); p.vl(R - 1, y0 + 4, h - 8, C.wood1);
    p.dith(L + 2, y0 + 6, R - L - 4, h - 12, null, C.wood1, 2);
  }
  p.dithV(x0, y0 + h - 5, w, 5, C.void, 0, 8);
}

// Room back wall: near-black wood boarding (the bookcases carry the colour).
function panelWall(p, x0, y0, w, h) {
  p.rect(x0, y0, w, h, C.hairDark);
  for (let x = x0; x < x0 + w; x += 10) { p.vl(x, y0, h, C.void); p.dith(x + 1, y0, 1, h, null, C.wood0, 8); }
  p.noise(x0, y0, w, h, C.wood0, 0.05, 41);
  p.dithV(x0, y0, w, 10, C.void, 9, 0);
}

function roomShell(ctx, p, r) {
  column(p, r.x, WALL_Y, GY, { w: 7 });
  column(p, r.x + r.w - 7, WALL_Y, GY, { w: 7 });
  p.rect(r.x + 6, WALL_Y, r.w - 12, 21, C.void);
  steelPanels(p, r.x + 7, WALL_Y + 1, r.w - 14, 19, { pw: 30 });
  const name = ROOM_COPY[r.id].name;
  const tw = Math.min(r.w - 28, name.length * 6 + 12);
  signPlate(ctx, r.x + ((r.w - tw) >> 1), 22, name, { style: 'enamel', w: tw, h: 17 });
  p.dithV(r.x + 7, 41, r.w - 14, 8, C.void, 10, 0);
}

// ------------------------------------------------------------------ bookcases
// Spine ramps [dark edge, cloth, lit edge].
const SPINES = [
  [C.rust0, C.red, C.rust3], [C.hairDark, C.rust1, C.rust2], [C.ink, C.navy2, C.steel0], [C.ink, C.mint0, C.mint1],
  [C.hairDark, C.wood1, C.brass], [C.wood0, C.brass, C.cream], [C.stone0, C.stone2, C.stone3], [C.navy, C.steel0, C.steel1],
  [C.hairDark, C.rust0, C.rust1], [C.stone1, C.cream, C.cream2], [C.rust1, C.amber, C.yellow], [C.ink, C.navy2, C.steel1],
];
const spineAt = (p, x, y, seed) => {
  const v = p.rnd(x, y, seed + 1), i = Math.floor(v * 11);
  return v > 0.97 ? SPINES[10] : SPINES[i === 10 ? 11 : i];
};

// Tall dark-wood bookcase standing on the floor (bottom = GY). parts = script parts to place, [row, 0..1 across, kind]
// with kind 'gear' | 'board' | 'cable' (annex only).
function bookcase(p, x, y, w, opts = {}) {
  const { rows = 4, seed = 1, parts = [] } = opts;
  const h = GY - y;
  p.dith(x - 3, GY - 2, w + 6, 2, null, C.void, 9);
  p.rect(x, y, w, h, C.void);
  const ix = x + 4, iw = w - 8, top = y + 6, bot = GY - 7;
  p.rect(ix, top, iw, bot - top, C.ink);
  p.dith(ix, top, iw, bot - top, null, C.hairDark, 5);
  const rh = Math.floor((bot - top) / rows);
  const after = [];
  const bases = [];
  for (let r = 0; r < rows; r++) {
    const base = top + (r + 1) * rh - 3;
    bases.push(base);
    const plan = parts.filter(q => q[0] === r).map(([, f, kind]) => ({ at: ix + 1 + Math.round(f * (iw - 2)), kind })).sort((a, b) => a.at - b.at);
    fillRow(p, ix + 1, iw - 2, base - rh + 4, base, seed * 31 + r * 7, plan, after, r < rows - 1);
  }
  for (const base of bases) {
    p.rect(ix, base, iw, 3, C.wood0); p.hl(ix, base, iw, C.brass); p.hl(ix, base + 1, iw, C.wood1); p.hl(ix, base + 2, iw, C.hairDark);
    if (base + 6 < bot) { p.dith(ix, base + 3, iw, 2, null, C.void, 9); p.dith(ix, base + 5, iw, 1, null, C.void, 4); }
  }
  for (const f of after) f();
  p.dith(ix, top, iw, 2, null, C.void, 9);
  p.dith(ix, top, 2, bot - top, null, C.void, 6);
  // stiles
  p.rect(x + 1, y + 1, 3, h - 1, C.wood0); p.vl(x + 1, y + 1, h - 1, C.wood1); p.vl(x + 3, y + 1, h - 1, C.hairDark);
  p.rect(x + w - 4, y + 1, 3, h - 1, C.wood0); p.vl(x + w - 4, y + 1, h - 1, C.wood1); p.vl(x + w - 2, y + 1, h - 1, C.hairDark);
  // crown moulding with dentils
  p.rect(x - 2, y - 1, w + 4, 7, C.void);
  p.hl(x - 1, y, w + 2, C.brass); p.hl(x - 1, y + 1, w + 2, C.wood1); p.hl(x - 1, y + 2, w + 2, C.wood0);
  for (let i = x; i < x + w; i += 3) p.px(i, y + 3, C.wood1);
  p.hl(x, y + 4, w, C.wood0);
  // plinth
  p.rect(x + 1, GY - 7, w - 2, 7, C.wood0); p.hl(x + 1, GY - 7, w - 2, C.brass); p.hl(x + 1, GY - 6, w - 2, C.wood1);
  p.dith(x + 1, GY - 4, w - 2, 4, null, C.hairDark, 8);
  return bases;
}

// One shelf row of books between x0..x0+w, standing on base (y of the board).
function fillRow(p, x0, w, yTop, base, seed, plan, after, canDangle) {
  const H = base - yTop;
  let bx = x0;
  while (bx < x0 + w - 1) {
    const v = p.rnd(bx, base, seed), room = x0 + w - bx;
    if (plan.length && bx >= plan[0].at && room >= 4) { // a skill book carrying a script part
      const { kind } = plan.shift(), S = SPINES[(bx >> 1) % 10], sw = 4, bh = H - 7, y = base - bh;
      p.rect(bx, y, sw, bh, S[1]); p.vl(bx, y, bh, S[2]); p.vl(bx + sw - 1, y + 1, bh - 1, S[0]);
      p.hl(bx, y + 2, sw, C.brass); p.hl(bx, base - 3, sw, C.brass);
      gadget(p, bx, y, sw, base, kind, after, canDangle);
      bx += sw; continue;
    }
    if (v < 0.06) { bx += 2; continue; }
    if (v > 0.92 && room >= 11) { // a few lying flat
      const n = 2 + (v > 0.96 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const S = spineAt(p, bx + i, base, seed), sw = 10 - (i % 2) * 2, sx = bx + (i % 2);
        const sy = base - 3 * (i + 1);
        p.hl(sx, sy, sw, S[2]); p.hl(sx, sy + 1, sw, S[1]); p.hl(sx, sy + 2, sw, S[0]); p.px(sx + sw - 1, sy + 1, C.cream2);
      }
      bx += 11; continue;
    }
    if (v > 0.87 && room >= 8 && H > 8) { // one leaning on its neighbour
      const S = spineAt(p, bx, base, seed), bh = H - 2;
      for (let j = 0; j < bh; j++) {
        const o = Math.floor(j / 4);
        p.px(bx + o, base - 1 - j, S[2]); p.px(bx + o + 1, base - 1 - j, S[1]); p.px(bx + o + 2, base - 1 - j, S[0]);
      }
      bx += 4 + Math.floor((bh - 1) / 4); continue;
    }
    const sw = Math.min(room, 2 + Math.floor(p.rnd(bx, 3, seed) * 3));
    const bh = Math.max(6, H - 1 - Math.floor(p.rnd(bx, 7, seed) * 6));
    const S = spineAt(p, bx, base, seed), y = base - bh;
    p.rect(bx, y, sw, bh, S[1]);
    if (sw > 2) p.vl(bx, y, bh, S[2]); else p.px(bx, y, S[2]);
    p.vl(bx + sw - 1, y + 1, bh - 1, S[0]);
    if (bh > 9 && p.rnd(bx, 11, seed) < 0.55) {
      const band = S[1] === C.brass || S[1] === C.cream || S[1] === C.amber ? C.wood0 : C.brass;
      p.hl(bx, y + 2, sw, band); p.hl(bx, base - 3, sw, band);
    }
    bx += sw;
  }
}

// Script parts poking out of a skill book (annex): a gear, a little circuit board with a light, or a plug whose
// cable hangs over the shelf lip.
// Cable colours: [lit edge, core].
const WIRES = [[C.mint2, C.mint1], [C.yellow, C.amber], [C.pink, C.red]];
let wireN = 0;
function gadget(p, bx, y, sw, base, kind, after, canDangle) {
  const cx = bx + (sw >> 1);
  if (kind === 'gear') { // a cog half out of the pages
    p.disc(cx, y - 1, 4, C.void); p.disc(cx, y - 1, 3, C.steel2);
    for (const [i, j] of [[0, -5], [-5, 0], [5, 0], [-4, -4], [4, -4]]) p.px(cx + i, y - 1 + j, C.steel2);
    p.disc(cx, y - 1, 1, C.void); p.px(cx - 2, y - 3, C.steel3);
  } else if (kind === 'board') { // a little circuit board with a slow light
    const bx0 = cx - 5, by0 = y - 7;
    p.rect(bx0, by0, 11, 7, C.void); p.rect(bx0 + 1, by0 + 1, 9, 5, C.mint1); p.hl(bx0 + 1, by0 + 1, 9, C.mint2);
    p.rect(bx0 + 2, by0 + 2, 4, 3, C.void); p.px(bx0 + 3, by0 + 2, C.steel1); // chip
    for (const i of [2, 3, 4, 5]) { p.px(bx0 + i, by0 + 1, C.steel3); }
    for (let i = bx0 + 1; i < bx0 + 10; i += 2) p.px(i, by0 + 5, C.brass); // edge contacts
    LEDS.push({ x: bx0 + 8, y: by0 + 2 });
  } else { // a plug whose thick coloured lead loops over the shelf lip and hangs down
    const [hi, core] = WIRES[wireN++ % WIRES.length];
    p.rect(cx - 2, y - 3, 5, 3, C.void); p.hl(cx - 1, y - 3, 3, C.steel3); p.hl(cx - 1, y - 2, 3, C.steel1);
    const lx = bx + sw + 1, top = y - 6, len = canDangle ? 9 : 0, end = base + 3 + len;
    after.push(() => {
      p.rect(cx - 1, top - 1, lx - cx + 4, 4, C.void); p.hl(cx, top, lx - cx + 2, hi); p.hl(cx, top + 1, lx - cx + 2, core);
      p.rect(cx - 1, top, 4, 3, C.void); p.vl(cx, top, 3, hi); p.vl(cx + 1, top + 1, 2, core);
      p.rect(lx - 1, top, 4, end - top, C.void); p.vl(lx, top, end - top, hi); p.vl(lx + 1, top + 1, end - top - 1, core);
      if (len) { p.rect(lx - 1, end, 4, 4, C.void); p.rect(lx, end, 2, 3, C.steel2); p.px(lx + 1, end + 2, C.steel0); }
    });
  }
}

// Rolling library ladder: hooks on a brass rail, leans out to two wheels on the floor.
function ladder(p, x, railY, x2, rail) {
  const [r0, r1] = rail;
  p.rect(r0, railY - 1, r1 - r0, 3, C.void); p.hl(r0, railY, r1 - r0, C.brass);
  for (let bx = r0 + 4; bx < r1; bx += 24) { p.rect(bx, railY - 2, 2, 5, C.void); p.px(bx, railY, C.steel2); }
  const y0 = railY + 2, y1 = GY - 3, gap = 8;
  for (let y = y0 + 5; y < y1 - 2; y += 6) {
    const k = (y - y0) / (y1 - y0), lx = Math.round(x + (x2 - x) * k);
    p.hl(lx + 1, y, gap, C.void); p.hl(lx + 1, y - 1, gap, C.brass);
  }
  for (const d of [0, gap + 1]) {
    p.line(x + d + 1, y0, x2 + d + 1, y1, C.void);
    p.line(x + d, y0, x2 + d, y1, C.wood1);
  }
  p.px(x, y0 - 1, C.void); p.px(x + gap + 1, y0 - 1, C.void);
  for (const d of [0, gap + 1]) { p.rect(x2 + d - 1, GY - 3, 3, 3, C.void); p.px(x2 + d, GY - 2, C.steel2); }
  p.dith(x2 - 3, GY - 1, gap + 8, 1, null, C.void, 9);
}

// Green-shaded pendant over a reading spot with a dithered amber pool under it.
function pendant(p, x, y, drop, cone) {
  p.vl(x, y, drop, C.ink);
  const sy = y + drop;
  p.rect(x - 1, sy, 3, 2, C.brass);
  for (let j = 0; j < 5; j++) {
    const hw = j + 1;
    p.hl(x - hw, sy + 2 + j, hw * 2 + 1, C.void);
    if (hw > 1) p.hl(x - hw + 1, sy + 2 + j, hw * 2 - 1, j < 2 ? C.mint1 : C.mint0);
  }
  p.px(x - 2, sy + 4, C.mint2);
  p.hl(x - 5, sy + 7, 11, C.brass); p.hl(x - 2, sy + 8, 5, C.cream2); p.px(x, sy + 8, C.white);
  for (let j = 0; j < cone; j++) {
    const hw = 5 + Math.round(j * 0.55), fall = 5 - (j / Math.max(1, cone - 1)) * 4;
    for (let i = -hw; i <= hw; i++) {
      const t = Math.abs(i) / (hw + 1), X = x + i, Y = sy + 9 + j;
      if (BAYER4[Y & 3][X & 3] < Math.round(fall * (1 - t * t))) p.px(X, Y, j < 3 && Math.abs(i) < 3 ? C.cream2 : C.amber);
    }
  }
}

// Soft dithered light pool (ellipse) on the wall around a lamp.
function pool(p, cx, cy, rx, ry, max = 3) {
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
    const d = (i / rx) ** 2 + (j / ry) ** 2;
    if (d >= 1) continue;
    const X = cx + i, Y = cy + j;
    if (BAYER4[Y & 3][X & 3] < Math.round((1 - d) * max)) p.px(X, Y, C.amber);
  }
}

// Banker's lamp standing on a table top at y (x = centre).
function bankerLamp(p, x, y) {
  p.rect(x - 4, y - 2, 9, 2, C.void); p.hl(x - 3, y - 2, 7, C.brass);
  p.vl(x, y - 9, 7, C.brass); p.vl(x + 1, y - 8, 6, C.wood0);
  p.rect(x - 6, y - 13, 13, 5, C.void);
  p.rect(x - 5, y - 13, 11, 3, C.mint0); p.hl(x - 5, y - 13, 11, C.mint1); p.px(x - 3, y - 13, C.mint2);
  p.hl(x - 5, y - 10, 11, C.cream2); p.px(x, y - 10, C.white);
  p.dith(x - 9, y - 1, 19, 1, null, C.amber, 6);
}

function table(p, x, y, w) {
  p.dith(x - 2, GY - 2, w + 4, 2, null, C.void, 9);
  for (const lx of [x + 2, x + w - 5]) {
    p.rect(lx, y + 4, 3, GY - y - 4, C.void); p.vl(lx + 1, y + 4, GY - y - 4, C.wood1);
    p.rect(lx - 1, y + 11, 5, 3, C.void); p.hl(lx, y + 12, 3, C.wood1);
  }
  p.rect(x + 3, GY - 7, w - 6, 2, C.void); p.hl(x + 4, GY - 7, w - 8, C.wood0);
  p.rect(x - 1, y, w + 2, 4, C.void); p.hl(x, y, w, C.brass); p.hl(x, y + 1, w, C.wood1); p.hl(x, y + 2, w, C.wood0);
  p.rect(x + 1, y + 4, w - 2, 3, C.wood0); p.hl(x + 1, y + 6, w - 2, C.hairDark);
}

// Side-view wooden chair (back on the left), y = floor.
function chair(p, x, flip) {
  const bx = flip ? x + 10 : x;
  p.rect(bx, GY - 24, 3, 24, C.void); p.vl(bx + 1, GY - 23, 23, C.wood1);
  p.rect(x, GY - 12, 13, 3, C.void); p.hl(x + 1, GY - 12, 11, C.brass); p.hl(x + 1, GY - 11, 11, C.wood0);
  const fx = flip ? x : x + 10;
  p.rect(fx, GY - 9, 3, 9, C.void); p.vl(fx + 1, GY - 9, 9, C.wood0);
  for (const sy of [GY - 21, GY - 17]) p.px(flip ? bx - 1 : bx + 3, sy, C.wood1);
}

// Open book lying on a table (pages only: no legible text).
function openBook(p, x, y) {
  p.rect(x, y - 3, 15, 3, C.void);
  p.hl(x + 1, y - 3, 6, C.cream2); p.hl(x + 8, y - 3, 6, C.cream2); p.px(x + 7, y - 2, C.stone2);
  p.hl(x + 1, y - 2, 6, C.cream); p.hl(x + 8, y - 2, 6, C.cream);
  p.hl(x, y - 1, 15, C.red);
}

function bookStack(p, x, y) {
  [[C.mint0, C.mint1, 12], [C.rust1, C.rust2, 10], [C.navy2, C.steel0, 11]].forEach(([c, hi, w], i) => {
    const sy = y - 3 * (i + 1), sx = x + (i % 2);
    p.rect(sx, sy, w, 3, C.void); p.hl(sx + 1, sy, w - 2, hi); p.hl(sx + 1, sy + 1, w - 2, c); p.px(sx + w - 2, sy + 1, C.cream2);
  });
}

// ------------------------------------------------------------------ auto-compactor (gag)
// A brass-trimmed steel press at the east end of the corridor. A long roll of conversation paper hangs from a
// wall spool into the hopper; the window shows the ram; the slot at the bottom drops out the stamped cube.
// Live parts (roll, paper, window, slot) are redrawn from compactorPose() while it runs.
const CMP = (() => {
  const r = rect('gag-compactor'), x = r.x + 2, w = r.w - 4; // body inset 2 px inside the prop
  return {
    x, w, roll: { x0: x + 6, x1: x + w - 6, cy: r.y + 7, r: 6 }, hop: { y: r.y + 25 }, body: { y: r.y + 33 },
    win: { x: x + 6, y: r.y + 35, w: w - 12, h: 11 }, plate: { y: r.y + 49 }, slot: { x: x + 4, y: r.y + 68, w: w - 8, h: 11 },
    cube: { w: 29, h: 10, rest: r.y + 70 },
  };
})();

function compactor(p) {
  const { x, w } = CMP, G = GY;
  p.dith(x - 3, G - 2, w + 6, 2, null, C.void, 9);
  // wall spool: a wooden feed board down to the hopper, two brass arms holding the axle
  const R = CMP.roll, bb = R.cy - R.r - 4;
  p.rect(R.x0 - 5, bb, R.x1 - R.x0 + 10, CMP.hop.y - bb + 1, C.void);
  p.rect(R.x0 - 4, bb + 1, R.x1 - R.x0 + 8, CMP.hop.y - bb - 1, C.wood0); p.hl(R.x0 - 4, bb + 1, R.x1 - R.x0 + 8, C.wood1);
  for (const ax of [R.x0 - 3, R.x1]) { p.rect(ax, R.cy - 6, 3, 9, C.void); p.vl(ax + 1, R.cy - 5, 7, C.brass); }
  // hopper: a funnel mouth, wide at the top
  const hy = CMP.hop.y;
  for (let j = 0; j < 8; j++) {
    const inset = Math.round(j * 0.75);
    p.hl(x - 2 + inset, hy + j, w + 4 - inset * 2, C.void);
    p.hl(x - 1 + inset, hy + j, w + 2 - inset * 2, j === 0 ? C.steel2 : j < 3 ? C.steel1 : C.steel0);
  }
  p.rect(x + 7, hy + 1, w - 14, 2, C.ink); // the mouth
  // body
  const by = CMP.body.y;
  p.rect(x, by, w, G - 6 - by, C.void);
  p.rect(x + 1, by + 1, w - 2, G - 8 - by, C.navy2);
  p.vl(x + 1, by + 1, G - 8 - by, C.steel0); p.vl(x + w - 2, by + 1, G - 8 - by, C.navy);
  p.dith(x + 2, by + 1, w - 4, G - 8 - by, null, C.steel0, 2);
  p.hl(x, by, w, C.brass); p.hl(x + 1, by + 1, w - 2, C.wood1);
  for (const [rx, ry] of [[x + 2, by + 3], [x + w - 3, by + 3], [x + 2, G - 10], [x + w - 3, G - 10]]) p.px(rx, ry, C.brass);
  // window frame
  const W0 = CMP.win;
  p.rect(W0.x - 1, W0.y - 1, W0.w + 2, W0.h + 2, C.void); p.hl(W0.x - 1, W0.y + W0.h, W0.w + 2, C.steel1);
  // name plate: AUTO- / COMPACTOR (exact plate text, split at its hyphen)
  const py = CMP.plate.y, pw = 39, px0 = x + ((w - pw) >> 1);
  p.rect(px0, py, pw, 15, C.void); p.rect(px0 + 1, py + 1, pw - 2, 13, C.brass);
  p.hl(px0 + 1, py + 1, pw - 2, C.cream); p.hl(px0 + 1, py + 13, pw - 2, C.wood1);
  COMPACTOR_PLATE.forEach((l, i) => p.text(l, px0 + ((pw - (l.length * 4 - 1) + 1) >> 1), py + 2 + i * 6, C.ink, 'f3'));
  // hazard band over the slot
  for (let i = 0; i < w - 4; i++) p.px(x + 2 + i, CMP.slot.y - 3, ((i >> 1) % 2) ? C.yellow : C.ink);
  for (let i = 0; i < w - 4; i++) p.px(x + 2 + i, CMP.slot.y - 2, ((i + 1 >> 1) % 2) ? C.yellow : C.ink);
  // tray lip under the slot, feet
  p.rect(x - 1, G - 7, w + 2, 2, C.void); p.hl(x, G - 7, w, C.steel2);
  for (const fx of [x + 2, x + w - 7]) { p.rect(fx, G - 6, 5, 6, C.void); p.rect(fx + 1, G - 5, 3, 4, C.steel0); p.hl(fx + 1, G - 5, 3, C.steel1); }
  compactorParts(p, 0, { feed: 0, ram: 0, cube: -1 }, 0);
}

// The moving parts for a pose (see concept.compactorPose); top = floor top offset, t = mt() time for the paper.
export function compactorParts(p, top, pose, t) {
  const R = CMP.roll, hy = top + CMP.hop.y;
  // roll: shrinks to its bare core as the paper feeds in
  p.rect(R.x0, top + R.cy - R.r - 1, R.x1 - R.x0, CMP.hop.y - (R.cy - R.r - 1), C.wood0); // the feed board behind roll + paper
  const r = Math.max(1, Math.round(R.r - pose.feed * (R.r - 1)));
  const cy = top + R.cy;
  p.rect(R.x0, cy - r, R.x1 - R.x0, r * 2 + 1, C.void);
  if (r > 1) {
    p.rect(R.x0 + 1, cy - r + 1, R.x1 - R.x0 - 2, r * 2 - 1, C.cream2);
    p.hl(R.x0 + 1, cy - r + 1, R.x1 - R.x0 - 2, C.white); p.hl(R.x0 + 1, cy + r - 1, R.x1 - R.x0 - 2, C.stone2);
    p.dith(R.x0 + 1, cy, R.x1 - R.x0 - 2, r, null, C.stone3, 4);
  } else p.hl(R.x0 + 1, cy, R.x1 - R.x0 - 2, C.wood1); // the empty cardboard core
  p.px(R.x0 - 1, cy, C.steel2); p.px(R.x1, cy, C.steel2); // axle ends
  // the paper strip from the roll down into the hopper; its printed lines travel down as it feeds
  const sx = R.x0 + 3, sw = R.x1 - R.x0 - 6, rollBottom = cy + r + 1, mouth = hy; // it vanishes behind the hopper rim
  const tail = pose.feed > 0.8 ? Math.round(((pose.feed - 0.8) / 0.2) * (mouth - rollBottom)) : 0;
  const y0 = rollBottom + tail;
  if (mouth - y0 > 0) {
    p.rect(sx - 1, y0, sw + 2, mouth - y0, C.void);
    p.rect(sx, y0, sw, mouth - y0, C.cream2);
    const off = Math.floor(pose.feed * 24);
    for (let yy = y0; yy < mouth; yy++) if (((yy - top + off) % 3) === 0) p.hl(sx + 2, yy, sw - 4 - ((yy + off) % 2) * 4, C.stone2);
  }
  p.rect(CMP.x + 7, hy + 1, CMP.w - 14, 2, C.ink);
  // window: the ram comes down on the crumpled paper
  const W0 = CMP.win, wy = top + W0.y;
  p.rect(W0.x, wy, W0.w, W0.h, C.ink); p.dith(W0.x, wy, W0.w, W0.h, null, C.navy, 6);
  const fill = Math.round(pose.feed * 5) - Math.round(pose.ram * 2);
  for (let k = 0; k < Math.max(0, fill); k++) p.hl(W0.x + 2 + (k % 2), wy + W0.h - 2 - k, W0.w - 4 - (k % 2) * 2, k % 2 ? C.cream2 : C.stone3);
  const ram = Math.round(pose.ram * 6);
  p.rect(W0.x, wy, W0.w, 2 + ram, C.steel0); p.hl(W0.x, wy + 1 + ram, W0.w, C.steel2); p.vl(W0.x + (W0.w >> 1), wy, 1 + ram, C.steel2);
  // slot: dark until the cube drops out and lands on the tray
  const S = CMP.slot, syy = top + S.y;
  p.rect(S.x, syy, S.w, S.h, C.void); p.dith(S.x, syy, S.w, 3, null, C.ink, 8);
  if (pose.cube >= 0) {
    const K = CMP.cube, kx = S.x + ((S.w - K.w) >> 1), ky = top + K.rest - Math.round((1 - pose.cube) * 8);
    cube(p, kx, ky, K.w, K.h, syy);
  }
}

// The stamped cube: squashed paper, creased, SUMMARY stamped in red. Rows above clipY stay inside the machine.
function cube(p, x, y, w, h, clipY) {
  const rows = [];
  for (let j = 0; j < h; j++) if (y + j >= clipY) rows.push(j);
  if (!rows.length) return;
  const j0 = rows[0];
  p.rect(x, y + j0, w, h - j0, C.void);
  p.rect(x + 1, y + Math.max(1, j0), w - 2, h - 1 - Math.max(1, j0), C.cream2);
  for (const j of rows) if (j > 0 && j < h - 1 && (j % 3) === 1) p.dith(x + 1, y + j, w - 2, 1, null, C.stone3, 5);
  if (j0 <= 2) p.text(GAG_ART.cube, x + 1, y + 3, C.red, 'f3');
  else for (let k = 0; k < 4; k++) p.px(x + 4 + k * 6, y + h - 2, C.stone2);
}

// Wall clock with a pendulum case (the pendulum itself is live).
function clock(p, cx, y) {
  p.rect(cx - 6, y + 5, 13, 32, C.void); p.rect(cx - 5, y + 6, 11, 30, C.wood0); p.vl(cx - 5, y + 6, 30, C.wood1);
  p.rect(cx - 6, y + 36, 13, 2, C.void); p.hl(cx - 5, y + 36, 11, C.brass);
  pendulumBox(p, cx, y, 0);
  p.disc(cx, y, 8, C.void); p.ring(cx, y, 7, C.brass); p.disc(cx, y, 6, C.cream2);
  p.px(cx - 4, y - 4, C.cream);
  for (const [i, j] of [[0, -5], [5, 0], [0, 5], [-5, 0]]) p.px(cx + i, y + j, C.stone1);
  p.line(cx, y, cx, y - 4, C.void); p.line(cx, y, cx + 3, y + 1, C.void); p.px(cx, y, C.red);
}
function pendulumBox(p, cx, y, sw) {
  p.rect(cx - 3, y + 9, 7, 24, C.ink);
  p.vl(cx - 3, y + 9, 24, C.navy2);
  p.line(cx, y + 9, cx + sw, y + 27, C.steel0);
  p.disc(cx + sw, y + 29, 2, C.brass); p.px(cx + sw - 1, y + 28, C.cream);
}

// ------------------------------------------------------------------ Skill Library (west room)
function library(ctx, p) {
  const { lib } = F2;
  // reading lamp hangs over the book's left page, well clear of where the hand pops out on the right
  pendant(p, LECTERN.cx - 20, 41, 1, 9);
  pool(p, LECTERN.cx - 12, 64, 30, 15, 3);
  bookcase(p, 99, 52, 19, { rows: 4, seed: 3 });
  bookcase(p, 142, 46, 84, { rows: 4, seed: 5 });
  ladder(p, 196, 50, 210, [142, 226]);
  skillBook(p);
  // drift of dust on the lectern side of the room floor (subtle)
  p.dith(lib.x + 8, GY - 1, 10, 1, null, C.stone0, 4);
}

// The skill book: a small open book on a slanted lectern; its title is engraved on a brass plate on the
// lectern front. Everything stands on the base strip line (G), like the other floor props.
function skillBook(p) {
  const cx = LECTERN.cx, G = GY - 6;
  // feet + turned pedestal
  p.rect(cx - 16, G - 4, 32, 4, C.void); p.hl(cx - 15, G - 4, 30, C.brass); p.rect(cx - 15, G - 3, 30, 2, C.wood1); p.hl(cx - 15, G - 1, 30, C.wood0);
  const py = G - 24;
  p.rect(cx - 5, py, 10, 20, C.void);
  p.rect(cx - 4, py, 8, 20, C.wood1); p.vl(cx - 4, py, 20, C.brass); p.vl(cx + 3, py, 20, C.wood0);
  p.rect(cx - 6, py + 8, 12, 3, C.void); p.hl(cx - 5, py + 8, 10, C.brass); p.hl(cx - 5, py + 9, 10, C.wood1);
  // desk box with the brass title plate on its front
  const { x: bx, y: by, w: bw, h: bh } = LECTERN.box;
  p.rect(bx, by, bw, bh, C.void);
  p.rect(bx + 1, by + 1, bw - 2, bh - 2, C.wood0);
  p.hl(bx + 1, by + 1, bw - 2, C.wood1); p.vl(bx + 1, by + 1, bh - 2, C.wood1); p.hl(bx + 1, by + bh - 2, bw - 2, C.hairDark);
  const { x: tx, y: ty, w: tw, h: th } = LECTERN.plate;
  p.rect(tx, ty, tw, th, C.void);
  p.rect(tx + 1, ty + 1, tw - 2, th - 2, C.brass);
  p.hl(tx + 1, ty + 1, tw - 2, C.cream); p.hl(tx + 1, ty + th - 2, tw - 2, C.wood1); p.vl(tx + tw - 2, ty + 2, th - 3, C.wood1);
  for (const [sx, sy] of [[tx + 2, ty + 2], [tx + tw - 3, ty + 2], [tx + 2, ty + th - 3], [tx + tw - 3, ty + th - 3]]) p.px(sx, sy, C.wood0);
  BOOK_LINES.forEach((l, i) => plateText(p, l, cx - (plateWidth(l) >> 1), ty + 3 + i * 6, C.ink));
  // slanted reading top (seen edge-on: a lip that widens toward the front)
  for (let j = 0; j < 4; j++) {
    const hw = 27 + j, y = by - 4 + j;
    p.hl(cx - hw - 1, y, hw * 2 + 2, C.void); p.hl(cx - hw, y, hw * 2, j === 0 ? C.brass : j === 3 ? C.wood0 : C.wood1);
  }
  // the open book resting on it: two page blocks dipping into the gutter, red cover edges, ribbon
  const { x, y, w, h } = BOOK, mid = x + (w >> 1);
  p.rect(x, y + 1, w, h, C.void);
  p.hl(x + 1, y + h - 1, w - 2, C.red); p.px(x, y + h - 1, C.rust0); p.px(x + w - 1, y + h - 1, C.rust0);
  for (let i = x + 1; i < x + w - 1; i++) {
    const dip = Math.abs(i - mid) < 3 ? 2 - (Math.abs(i - mid) >> 1) : 0;
    const left = i < mid;
    p.vl(i, y + 1 + dip, h - 3 - dip, left ? C.cream2 : C.cream);
    p.px(i, y + 1 + dip, C.white);
    p.px(i, y + h - 2, C.stone3);
  }
  p.vl(mid, y + 3, h - 4, C.stone2);
  for (let r = y + 4; r < y + h - 3; r += 2) { // print as grey dither, nothing legible
    p.dith(x + 3, r, mid - x - 5, 1, null, C.stone2, 6);
    p.dith(mid + 3, r, x + w - mid - 6, 1, null, C.stone2, 6);
  }
  p.rect(mid - 1, y + h, 3, 6, C.void); p.vl(mid, y + h, 5, C.red);
}

// Engraved plate lettering: the 3x5 micro font, but with a 5-wide W (the micro W is one pixel off an H).
const PLATE_W = ['10001', '10001', '10101', '10101', '01010'];
const advOf = ch => (ch === 'W' ? 6 : 4);
const plateWidth =s => [...s].reduce((a, ch) => a + advOf(ch), 0) - 1;
function plateText(p, s, x, y, c) {
  for (const ch of s) {
    if (ch === 'W') PLATE_W.forEach((r, j) => [...r].forEach((b, i) => { if (b === '1') p.px(x + i, y + j, c); }));
    else p.text(ch, x, y, c, 'f3');
    x += advOf(ch);
  }
}

// Waving glove on a red ribbon stalk (K outline, W glove, c cuff, R ribbon). Rows reveal top-down as it rises.
const HAND = [
  '.K.K.K...',
  'KWKWKWK..',
  'KWKWKWK..',
  'KWWWWWKK.',
  'KWWWWWKWK',
  'KWWWWWWK.',
  '.KWWWWK..',
  '.KccccK..',
  '..KccK...',
  '..KRRK...',
];
const HKEY = { K: C.void, W: C.white, c: C.cream, R: C.red };

function drawHand(p, x, baseY, rise, tilt) {
  for (let j = 0; j < Math.min(rise, HAND.length); j++) {
    const y = baseY - rise + j, off = Math.round((tilt * (HAND.length - 1 - j)) / 4);
    [...HAND[j]].forEach((ch, i) => { if (ch !== '.') p.px(x + i + off, y, HKEY[ch]); });
  }
}

// ------------------------------------------------------------------ reading corridor
function corridor(ctx, p) {
  bookcase(p, 242, 50, 58, { rows: 4, seed: 8 });
  pool(p, 341, 100, 26, 13, 2);
  clock(p, F2.clock.cx, F2.clock.y);
  table(p, 318, GY - 20, 56);
  chair(p, 302, false);
  chair(p, 378, true);
  openBook(p, 352, GY - 20);
  bookStack(p, 322, GY - 20);
  bankerLamp(p, 340, GY - 20);
  compactor(p); // the auto-compactor gag stands where the corridor meets the shaft column
  // brass riser + valve by the shaft column
  pipeV(ctx, 439, 30, GY - 6, { r: 1, color: 'brass', flanges: 24 });
  junctionBox(ctx, 930, 52, { w: 12, h: 14 });
  pipeV(ctx, 936, 30, 52, { r: 1, color: 'steel', flanges: 0 });
}

// ------------------------------------------------------------------ Skills With Scripts (east room)
function scriptsAnnex(ctx, p) {
  // every bookcase carries all three script parts, spread over its shelves
  bookcase(p, 614, 48, 64, { rows: 4, seed: 11, parts: [[0, 0.2, 'gear'], [0, 0.7, 'cable'], [1, 0.45, 'board'], [2, 0.15, 'cable'], [2, 0.75, 'gear'], [3, 0.4, 'board']] });
  bookcase(p, 682, 54, 62, { rows: 4, seed: 12, parts: [[0, 0.55, 'board'], [1, 0.1, 'gear'], [1, 0.65, 'cable'], [2, 0.4, 'board'], [3, 0.15, 'gear'], [3, 0.7, 'board']] });
  bookcase(p, 780, 48, 70, { rows: 4, seed: 13, parts: [[0, 0.15, 'cable'], [0, 0.65, 'gear'], [1, 0.35, 'board'], [2, 0.6, 'cable'], [2, 0.1, 'board'], [3, 0.45, 'gear']] });
  // a conduit drops from the ceiling tray into a junction box on the bookcase crown
  pipeV(ctx, 840, 19, 41, { r: 1, color: 'steel', flanges: 0 });
  p.rect(834, 41, 15, 7, C.void); p.rect(835, 42, 13, 5, C.steel0); p.hl(835, 42, 13, C.steel2); p.px(845, 44, C.amber);
  // its leads run down the bookcase side and plug into the shelves
  [[C.mint1, 851, 71], [C.amber, 853, 88], [C.red, 855, 105]].forEach(([c, wx, wy]) => {
    p.line(846, 47, wx, 51, c); p.vl(wx, 51, wy - 51, c); p.vl(wx + 1, 52, wy - 51, C.void);
    p.hl(847, wy, wx - 846, c); p.rect(845, wy - 1, 3, 3, C.void); p.px(846, wy, C.steel2);
  });
  // writing desk with a typewriter and a banker's lamp
  pool(p, 869, 100, 20, 11, 2);
  table(p, 858, GY - 20, 50);
  bankerLamp(p, 868, GY - 20);
  typewriter(p, 888, GY - 20);
  bookStack(p, 876, GY - 20);
}

function typewriter(p, x, y) {
  p.rect(x + 4, y - 14, 9, 7, C.void); p.rect(x + 5, y - 13, 7, 6, C.cream2); p.hl(x + 6, y - 11, 5, C.stone2); p.hl(x + 6, y - 9, 4, C.stone2);
  p.rect(x + 1, y - 8, 15, 3, C.void); p.hl(x + 2, y - 7, 13, C.ink); p.px(x + 1, y - 7, C.steel2); p.px(x + 15, y - 7, C.steel2);
  p.rect(x, y - 5, 17, 5, C.void); p.rect(x + 1, y - 5, 15, 4, C.navy2); p.hl(x + 1, y - 5, 15, C.steel0);
  for (let i = 0; i < 6; i++) { p.px(x + 2 + i * 2, y - 3, C.steel2); p.px(x + 3 + i * 2, y - 2, C.cream); }
}

// ------------------------------------------------------------------ live
export function live(ctx, top, t, s, draw, animate) {
  liveFloor(ctx, top, t, s, 2, animate);
  const p = pen(ctx);
  // ambient: the clock pendulum swings (t is mt()-scaled: still under reduced motion)
  pendulumBox(p, F2.clock.cx, top + F2.clock.y, Math.round(Math.sin(t * 2.4) * 1.4));
  // ambient: script lights in the annex books pulse slowly, out of step
  LEDS.forEach((L, i) => p.px(L.x, top + L.y, ((t * 0.4 + i * 0.37) % 1) < 0.5 ? C.yellow : C.rust0));
  // the skill book waves at you (only on a waved roll): the hand pops out beside the book's right edge,
  // clear of the reading lamp and of the interaction chevron above the book
  const pose = handPose(s.demos.book, reduced);
  if (pose && pose.rise > 0) drawHand(p, BOOK.x + BOOK.w + 1, top + BOOK.y + BOOK.h, pose.rise, pose.tilt);
  // the auto-compactor while it runs (reduced motion: straight to the finished cube)
  if (s.demos.compactor.t >= 0) compactorParts(p, top, compactorPose(s.demos.compactor.t, reduced), t);
}
