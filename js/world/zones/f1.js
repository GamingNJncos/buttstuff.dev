// Floor 01 — Workshop (warm rust/copper brick + steel). 960 px wide; shaft at 452..556.
// West → east: Tool Bin (tool chest, vise bench, room terminal, the pegboard demo), corridor workbench + crates,
// shaft | call box, pamphlet stand, Script Lab (desk, room terminal, paper feed → conveyor → stamp demo → tray).
import { C, pen, steelPanels, column, ceiling, baseStrip, walkway, slabBand, pipeRun, pipeV, junctionBox, pamphletRack } from './common.js?v=68';
import { signPlate } from '../../art/kit/signs.js?v=68';
import { lamp, crate, desk, shelving } from '../../art/kit/furniture.js?v=68';
import { conveyor, stampPress } from '../../art/kit/machines.js?v=68';
import { ROOMS, PROPS, SHAFT_X, SHAFT_W, ROOM_H, WW, PAMPHLET, pamphletAt } from '../levels.js?v=68';
import { ROOM_COPY } from '../../logic/copy.js?v=68';
import { bakeProp, liveFloor } from './generic.js?v=68';
import { pressTravel, toolLift, ANIM, vimPhase } from '../concept.js?v=68';
import { GAG_ART } from '../../logic/demos.js?v=68';
import { reduced } from '../../engine/motion.js?v=68';

const GY = ROOM_H - 6; // 129 walk surface
const WALL_Y = 19;
const EAST = SHAFT_X + SHAFT_W;
const BRICK = [C.rust0, C.rust1, C.rust2];
const DARK_BRICK = [C.hairDark, C.rust0, C.rust1];
const rect = id => { const q = PROPS.find(p => p.id === id); return { x: q.x, y: q.y, w: q.w, h: q.h }; };

export const F1 = {
  bin: ROOMS.find(r => r.id === 'cli'),
  lab: ROOMS.find(r => r.id === 'script'),
  peg: rect('demo-toolbin'),
  stamp: rect('demo-stamp'),
  belt: { x: 798, y: GY - 20, w: 30 },
  tray: { x: 882, y: GY - 36 },
  vim: rect('gag-vim'),
};

// ------------------------------------------------------------------ bake (static)
export function bake(ctx) {
  const p = pen(ctx);
  p.rect(0, 0, WW, 180, C.void);
  const { bin, lab } = F1;
  // walls: calm warm brick over a steel wainscot; rooms get a darker back wall
  for (const [a, b] of [[0, SHAFT_X], [EAST, WW]]) {
    brickWall(p, a, WALL_Y, b - a, 101 - WALL_Y, BRICK, a + 1);
    steelPanels(p, a, 104, b - a, 19, { pw: 40, seed: a + 3 });
    p.rect(a, 101, b - a, 3, C.void); p.hl(a, 101, b - a, C.rust2); p.hl(a, 102, b - a, C.rust0);
    p.dithV(a, 104, b - a, 4, C.ink, 6, 0);
  }
  brickWall(p, bin.x + 7, 41, bin.w - 14, 60, DARK_BRICK, 7);
  steelPanels(p, lab.x + 7, 41, lab.w - 14, 60, { pw: 34, ramp: [C.navy, C.navy2, C.steel0, C.steel1], seed: 6 });
  p.dithV(lab.x + 7, 41, lab.w - 14, 10, C.ink, 9, 0);

  ceiling(ctx, 0, SHAFT_X, { lights: [bin.x + 52, bin.x + 160, 380], seed: 11, pipe: 'rust', trim: C.rust2 });
  ceiling(ctx, EAST, WW, { lights: [lab.x + 60, lab.x + 250], seed: 12, pipe: 'rust', trim: C.rust2 });

  bulkhead(p, 0, 14);
  bulkhead(p, WW - 14, 14);
  column(p, SHAFT_X - 9, WALL_Y, GY, { w: 9 });
  column(p, EAST, WALL_Y, GY, { w: 9 });

  // corridor ducts + copper lines (west corridor, east stub)
  duct(p, bin.x + bin.w, SHAFT_X - 9, 20);
  duct(p, lab.x + lab.w, WW - 14, 20);
  pipeRun(ctx, bin.x + bin.w, 32, SHAFT_X - 9, { r: 1, color: 'rust', flanges: 40, seed: 4 });

  roomShell(ctx, p, bin);
  roomShell(ctx, p, lab);
  toolBin(ctx, p);
  corridor(ctx, p);
  scriptLab(ctx, p);
  pamphletRack(p, pamphletAt(1).x, GY - PAMPHLET.h);

  baseStrip(p, 14, SHAFT_X - 9 - 14, GY - 6);
  baseStrip(p, EAST + 9, WW - 14 - EAST - 9, GY - 6);
  walkway(p, 0, SHAFT_X, GY);
  walkway(p, EAST, WW - EAST, GY);
  slabBand(ctx, 0, SHAFT_X, ROOM_H, { seed: 13, vpipes: [96, 420], boxes: [250], deck: [C.stone0, C.hairDark, C.rust0, C.stone1] });
  slabBand(ctx, EAST, WW, ROOM_H, { seed: 14, vpipes: [640], boxes: [900], deck: [C.stone0, C.hairDark, C.rust0, C.stone1] });

  for (const pr of PROPS.filter(q => q.floor === 1 && q.kind === 'terminal')) bakeProp(ctx, p, pr);
}

// Calm brick: low-contrast mortar (dithered), a few darker/lighter bricks, darker toward the ceiling.
function brickWall(p, x0, y0, w, h, [dk, base, lt], seed) {
  p.rect(x0, y0, w, h, base);
  const bh = 8, bw = 22;
  for (let row = 0, by = y0; by < y0 + h; row++, by += bh) {
    const off = row % 2 ? bw >> 1 : 0;
    for (let bx = x0 - off; bx < x0 + w; bx += bw) {
      const X0 = Math.max(x0, bx), X1 = Math.min(x0 + w, bx + bw), Y1 = Math.min(y0 + h, by + bh);
      const v = p.rnd(bx, by, seed);
      if (v < 0.16) p.dith(X0, by, X1 - X0, Y1 - by, null, dk, 3);
      else if (v > 0.93) p.dith(X0, by, X1 - X0, Y1 - by, null, lt, 2);
      if (bx >= x0) p.dith(bx, by, 1, Y1 - by, null, dk, 10);
      p.dith(X0, by + 1, X1 - X0, 1, null, lt, 2);
    }
    p.dith(x0, by, w, 1, null, dk, 10);
  }
  p.dithV(x0, y0, w, 14, C.void, 8, 0);
}

export function bulkhead(p, x, w) {
  p.rect(x, 0, w, 180, C.void);
  p.rect(x + 1, WALL_Y, w - 2, GY - WALL_Y, C.navy2);
  for (let y = WALL_Y; y < GY; y++) for (let i = 1; i < w - 1; i++) if (((x + i + y) % 10) < 5 && (i < 4 || i > w - 5)) p.px(x + i, y, C.amber);
  p.vl(x + 4, WALL_Y, GY - WALL_Y, C.ink); p.vl(x + w - 5, WALL_Y, GY - WALL_Y, C.ink);
  for (let y = WALL_Y + 6; y < GY; y += 12) p.rivet(x + 6, y, C.steel1, C.ink, C.navy2);
}

// Galvanised rectangular duct hung under the ceiling: seams + flanges every 32 px, hanger straps.
export function duct(p, x0, x1, y) {
  const w = x1 - x0, h = 10;
  p.rect(x0, y, w, h, C.void);
  p.rect(x0, y + 1, w, h - 2, C.steel0);
  p.hl(x0, y + 1, w, C.steel2); p.hl(x0, y + 2, w, C.steel1); p.hl(x0, y + h - 2, w, C.navy2);
  p.dith(x0, y + 3, w, 4, null, C.steel1, 2);
  for (let fx = x0 + 14; fx < x1 - 4; fx += 32) {
    p.rect(fx, y - 1, 3, h + 2, C.void); p.vl(fx + 1, y, h, C.steel2); p.px(fx + 1, y + h - 2, C.steel0);
    p.px(fx + 1, y + 3, C.steel3); p.px(fx + 1, y + 6, C.steel3);
  }
  for (let hx = x0 + 30; hx < x1 - 4; hx += 64) { p.vl(hx, WALL_Y - 2, y - WALL_Y + 2, C.ink); p.vl(hx + 1, WALL_Y - 2, y - WALL_Y + 2, C.steel0); }
  p.dith(x0, y + h, w, 2, null, C.void, 6);
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

// ------------------------------------------------------------------ Tool Bin
function toolBin(ctx, p) {
  const { bin } = F1;
  toolChest(p, bin.x + 11, GY - 38);
  lamp(ctx, bin.x + 64, 40, { cone: 34, drop: 6 });
  partsBins(p, bin.x + 47, 74);
  workbench(p, bin.x + 44, GY - 24, 44, true);
  // pegboard centrepiece over a steel drawer counter
  const P = F1.peg;
  counter(p, P.x - 2, GY - 20, P.w + 4);
  pegboard(p, P.x, P.y, -1, 0);
}

function toolChest(p, x, y) {
  const w = 28, h = 34;
  p.dith(x - 2, GY - 2, w + 4, 2, null, C.void, 9);
  p.rect(x, y, w, h, C.void);
  p.rect(x + 1, y + 1, w - 2, h - 2, C.red);
  p.vl(x + 1, y + 1, h - 2, C.rust3); p.vl(x + w - 2, y + 1, h - 2, C.rust1);
  // lid
  p.rect(x + 1, y + 1, w - 2, 4, C.rust1); p.hl(x + 1, y + 1, w - 2, C.rust3); p.hl(x + 1, y + 5, w - 2, C.void);
  p.rect(x + 10, y - 2, 8, 2, C.void); p.hl(x + 11, y - 2, 6, C.steel2);
  // drawers
  for (let k = 0; k < 5; k++) {
    const dy = y + 7 + k * 5;
    p.hl(x + 2, dy + 4, w - 4, C.rust0);
    p.rect(x + 9, dy + 1, 10, 2, C.void); p.hl(x + 10, dy + 1, 8, C.steel2);
  }
  p.dith(x + 2, y + 6, w - 4, h - 8, null, C.rust1, 2);
  // casters
  for (const cx of [x + 3, x + w - 6]) { p.rect(cx, GY - 4, 4, 4, C.void); p.px(cx + 1, GY - 3, C.steel1); }
}

function workbench(p, x, y, w, vise) {
  p.dith(x - 2, GY - 2, w + 4, 2, null, C.void, 9);
  // legs + lower shelf
  for (const lx of [x + 2, x + w - 5]) { p.rect(lx, y + 3, 3, GY - y - 3, C.void); p.vl(lx + 1, y + 3, GY - y - 3, C.steel0); }
  p.rect(x + 2, GY - 9, w - 4, 3, C.void); p.hl(x + 3, GY - 9, w - 6, C.wood1);
  p.rect(x + 8, GY - 15, 10, 6, C.void); p.rect(x + 9, GY - 14, 8, 5, C.steel0); p.hl(x + 9, GY - 14, 8, C.steel1); // toolbox
  p.rect(x + 22, GY - 13, 7, 4, C.void); p.rect(x + 23, GY - 12, 5, 3, C.amber); // can
  // top
  p.rect(x - 1, y, w + 2, 4, C.void); p.hl(x, y, w, C.brass); p.hl(x, y + 1, w, C.wood1); p.hl(x, y + 2, w, C.wood0);
  if (vise) {
    const vx = x + 2;
    p.rect(vx, y - 7, 11, 7, C.void); p.rect(vx + 1, y - 6, 9, 5, C.steel0); p.hl(vx + 1, y - 6, 9, C.steel2);
    p.rect(vx + 4, y - 9, 3, 3, C.void); p.vl(vx + 5, y - 9, 2, C.steel1);
    p.hl(vx - 3, y - 3, 4, C.steel2); p.px(vx - 4, y - 3, C.void); // screw handle
    p.rect(vx + 13, y - 3, 12, 3, C.void); p.hl(vx + 14, y - 3, 10, C.brass); // wood offcut
  }
}

function partsBins(p, x, y) {
  const cols = [C.amber, C.mint1, C.red, C.steel1, C.amber];
  p.rect(x - 1, y - 1, cols.length * 8 + 1, 11, C.void);
  p.rect(x, y, cols.length * 8 - 1, 9, C.steel0); p.hl(x, y, cols.length * 8 - 1, C.steel1);
  cols.forEach((c, k) => {
    const bx = x + k * 8 + 1;
    p.rect(bx, y + 3, 6, 5, C.ink); p.hl(bx, y + 3, 6, c); p.px(bx + 1, y + 2, c); p.px(bx + 3, y + 2, c);
    p.px(bx + 2, y + 6, C.cream);
  });
}

function counter(p, x, y, w) {
  p.dith(x - 2, GY - 2, w + 4, 2, null, C.void, 9);
  p.rect(x, y, w, GY - y, C.void);
  p.rect(x + 1, y + 1, w - 2, GY - y - 2, C.navy2);
  p.hl(x, y, w, C.steel2); p.hl(x, y + 1, w, C.steel0);
  for (let dx = x + 3; dx < x + w - 12; dx += 18) {
    p.rect(dx, y + 4, 15, 12, C.ink); p.rect(dx + 1, y + 5, 13, 10, C.navy2); p.hl(dx + 1, y + 5, 13, C.steel0);
    p.rect(dx + 5, y + 8, 5, 1, C.steel2);
  }
}

// Tools as pixel maps. Keys: H steel3, S steel2, s steel1, d steel0, n navy2, W wood1, w wood0, B brass, R red,
// r rust1, Y yellow, y amber, K ink.
const KEY = { H: C.steel3, S: C.steel2, s: C.steel1, d: C.steel0, n: C.navy2, W: C.wood1, w: C.wood0, B: C.brass, R: C.red, r: C.rust1, Y: C.yellow, y: C.amber, K: C.ink };
const HAMMER = ['.HSSSSSs.', 'HSSSSSSSs', 'ddddsdddd', '...BWw...', ...Array(11).fill('...wWw...'), '...wWw...', '...ddd...'];
const WRENCH = ['SS...Sd', 'SS...Sd', 'SSs.sSd', '.SSSSd.', '..sSd..', ...Array(9).fill('..sSd..'), '.sSSSd.', 'sS.n.Sd', 'sS...Sd', '.sSSSd.'];
const DRIVER = ['.RR.', 'RRRr', 'RyRr', 'RRRr', 'RRRr', 'RyRr', 'RRRr', '.rr.', ...Array(9).fill('.Sd.'), '.d..'];
const PLIERS = ['..Ss...', '..SSs..', '..SSd..', '..sSd..', '.dSSSd.', '.sHnSd.', '.Ss.Sd.', '.RR.RR.', '.RR.RR.', 'RR...RR', 'RR...RR', 'Rr...rR', 'Rr...rR', 'R.....R', 'R.....R', 'r.....r'];
const TAPE = ['.YYYYYYY..', 'YYYYYYYYy.', 'YYYdddYYy.', 'YYdHsdYYy.', 'YYdsndYYy.', 'YYYdddYYy.', 'YYYYYYYYyB', 'yyyyyyyyyB', '.KKKKKKK.B'];
const SAW = (() => {
  const rows = [];
  for (let j = 0; j < 11; j++) {
    let r = '';
    for (let i = 0; i < 30; i++) {
      let c = '.';
      if (i < 8) { // closed wooden grip
        const edge = j === 0 || j === 10 || i === 0 || i === 7;
        const hole = i >= 2 && i <= 5 && j >= 3 && j <= 7;
        c = hole ? '.' : edge ? 'w' : 'W';
        if ((i === 0 || i === 7) && (j === 0 || j === 10)) c = '.';
      } else {
        const bot = 9 - Math.floor((i - 8) / 5); // blade tapers toward the tip
        if (j >= 1 && j <= bot) c = j === 1 ? 'S' : j === bot ? ((i % 2) ? 'd' : 's') : 's';
        if (j === bot + 1 && i % 2 === 0) c = 'd'; // teeth
        if (i === 9 && j >= 4 && j <= 6) c = 'B'; // brass screws
      }
      r += c;
    }
    rows.push(r);
  }
  return rows;
})();

// slots relative to the pegboard: [map, dx, dy]
const SLOTS = [[HAMMER, 6, 5], [WRENCH, 22, 5], [DRIVER, 38, 5], [PLIERS, 52, 6], [TAPE, 54, 33], [SAW, 8, 34]];

const maskOf = rows => { const m = new Set(); rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') m.add(`${i},${j}`); })); return m; };

function drawTool(p, rows, x, y) {
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') p.px(x + i, y + j, KEY[ch]); }));
}

// painted shadow-board outline: 1 px cream line around the tool's silhouette
function outline(p, rows, x, y) {
  const m = maskOf(rows);
  for (const k of m) {
    const [i, j] = k.split(',').map(Number);
    for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      if (!m.has(`${i + a},${j + b}`)) p.px(x + i + a, y + j + b, C.cream);
    }
  }
}

// Pegboard with a painted outline per tool; lift = index of the tool held up (dy px off its hook), -1 none.
export function pegboard(p, x, y, lift, dy) {
  const w = F1.peg.w, h = F1.peg.h;
  p.rect(x - 1, y - 1, w + 3, h + 3, C.void);
  p.rect(x, y, w, h, C.wood0);
  p.rect(x + 2, y + 2, w - 4, h - 4, C.brass);
  p.dith(x + 2, y + 2, w - 4, h - 4, null, C.wood1, 6);
  for (let j = y + 4; j < y + h - 3; j += 4) for (let i = x + 4; i < x + w - 3; i += 4) p.px(i, j, C.wood0);
  p.hl(x, y, w, C.wood1); p.vl(x, y, h, C.wood1);
  SLOTS.forEach(([rows, dx, dy0], k) => {
    const tx = x + dx, ty = y + dy0;
    outline(p, rows, tx, ty);
    const hx = tx + (rows[0].length >> 1);
    p.px(hx, ty - 2, C.steel2); p.px(hx, ty - 1, C.void); // hook
    const up = k === lift ? dy : 0;
    if (up) p.dith(tx + 1, ty + 1, rows[0].length, rows.length, null, C.wood0, 4); // shadow left on the board
    drawTool(p, rows, tx, ty - up);
  });
}

// ------------------------------------------------------------------ corridor
function corridor(ctx, p) {
  // tech's workbench + monitor, hanging lamp
  lamp(ctx, 312, 30, { cone: 58, drop: 6, spread: 1 });
  workbench(p, 284, GY - 24, 58, false);
  const mx = 318;
  p.rect(mx, GY - 38, 18, 13, C.void); p.rect(mx + 1, GY - 37, 16, 11, C.stone2); p.hl(mx + 1, GY - 37, 16, C.cream);
  p.rect(mx + 3, GY - 35, 12, 7, C.ink); p.hl(mx + 4, GY - 34, 6, C.amber); p.hl(mx + 4, GY - 32, 9, C.rust2); p.hl(mx + 4, GY - 30, 4, C.rust2);
  p.rect(mx + 7, GY - 26, 4, 2, C.stone1);
  // shelf with jars over the bench
  p.rect(288, 70, 30, 2, C.void); p.hl(288, 70, 30, C.wood1);
  [C.amber, C.steel1, C.mint1, C.cream].forEach((c, i) => { p.rect(290 + i * 7, 63, 5, 7, C.void); p.rect(291 + i * 7, 64, 3, 6, c); p.hl(291 + i * 7, 64, 3, C.steel2); });
  // crate stack + oil drum
  crate(ctx, 352, GY - 18, { seed: 3 });
  crate(ctx, 375, GY - 18, { seed: 5 });
  crate(ctx, 363, GY - 36, { seed: 8 });
  drum(p, 401, GY - 24);
  // the vim booth stands just outside the Tool Bin; copper riser with a valve by the shaft
  vimBooth(p, 0);
  pipeV(ctx, 436, 30, GY - 6, { r: 1, color: 'rust', flanges: 24 });
  p.disc(437, 64, 4, C.void); p.ring(437, 64, 3, C.red); p.px(437, 64, C.steel2);
  gauges(p, 384, 50);
  // east stub past the lab: junction box, and the extinguisher on its bracket below it
  junctionBox(ctx, 930, 52, { w: 12, h: 14 });
  pipeV(ctx, 936, 30, 52, { r: 1, color: 'steel', flanges: 0 });
  extinguisher(p, 928, 82);
}

// ------------------------------------------------------------------ vim booth (gag)
// A narrow call-box booth with a lit "vim" header. Inside: a dark back wall with an editor screen (a column of
// tildes). door 0 = open (the door stands edge-on against the hinge post), 1 = shut (full panel, small window).
const BOOTH = F1.vim;
export function vimBooth(p, door, top = 0) {
  const { x, w } = BOOTH, y = top + BOOTH.y, gy = top + GY;
  if (!top) p.dith(x - 2, GY - 2, w + 4, 2, null, C.void, 9);
  // frame: posts, roof cap, sill
  p.rect(x, y, w, gy - y, C.void);
  p.rect(x + 1, y + 1, w - 2, gy - y - 2, C.navy2);
  p.vl(x + 1, y + 12, gy - y - 13, C.steel1); p.vl(x + w - 2, y + 12, gy - y - 13, C.navy);
  p.rect(x - 1, y - 2, w + 2, 3, C.void); p.hl(x, y - 2, w, C.steel2); p.hl(x, y - 1, w, C.steel0);
  p.rect(x + (w >> 1) - 2, y - 4, 4, 2, C.void); p.hl(x + (w >> 1) - 1, y - 4, 2, C.amber); // roof lamp, unlit
  // header: "vim", lit like a terminal (exact label)
  p.rect(x + 1, y + 1, w - 2, 11, C.ink);
  p.text(GAG_ART.vimDoor, x + ((w - 17) >> 1), y + 3, C.mint2);
  p.hl(x + 1, y + 11, w - 2, C.steel0);
  // the doorway
  const o = { x: x + 3, y: y + 13, w: w - 6, h: gy - y - 16 };
  p.rect(o.x, o.y, o.w, o.h, C.ink);
  p.dith(o.x, o.y, o.w, o.h, null, C.navy, 6);
  // editor screen on the back wall: a column of tildes, a cursor
  p.rect(o.x + 3, o.y + 6, o.w - 6, 20, C.void);
  for (let k = 0; k < 4; k++) { p.px(o.x + 4, o.y + 10 + k * 4, C.mint0); p.px(o.x + 5, o.y + 9 + k * 4, C.mint0); }
  p.rect(o.x + 4, o.y + 7, 2, 1, C.mint1);
  p.dithV(o.x, o.y + o.h - 10, o.w, 10, C.void, 0, 8);
  // sill
  p.rect(x - 1, gy - 3, w + 2, 3, C.void); p.hl(x, gy - 3, w, C.steel1);
  // the door: hinged on the left post, swinging shut across the doorway
  const dw = Math.max(2, Math.round(2 + door * (o.w - 2)));
  p.rect(o.x, o.y, dw, o.h, C.void);
  if (dw > 2) {
    p.rect(o.x + 1, o.y + 1, dw - 2, o.h - 2, C.steel0);
    p.vl(o.x + 1, o.y + 1, o.h - 2, C.steel1); p.hl(o.x + 1, o.y + 1, dw - 2, C.steel1);
    if (dw >= 10) { // a small wired-glass window and the handle
      const wx = o.x + (dw >> 1) - 3;
      p.rect(wx, o.y + 6, 6, 10, C.void); p.rect(wx + 1, o.y + 7, 4, 8, C.ink); p.dith(wx + 1, o.y + 7, 4, 8, null, C.navy2, 4);
      p.rect(o.x + dw - 4, o.y + 26, 2, 4, C.brass); p.px(o.x + dw - 4, o.y + 26, C.yellow);
      p.hl(o.x + 2, o.y + o.h - 6, dw - 4, C.navy2);
    }
  } else p.vl(o.x + 1, o.y, o.h, C.steel1);
}

// pressure gauge panel on the corridor wall (two dials, needles parked)
function gauges(p, x, y) {
  p.rect(x, y, 28, 15, C.void); p.rect(x + 1, y + 1, 26, 13, C.rust0); p.hl(x + 1, y + 1, 26, C.rust2);
  for (const [gx, a] of [[x + 8, -0.6], [x + 20, 0.4]]) {
    p.disc(gx, y + 8, 5, C.void); p.disc(gx, y + 8, 4, C.cream2); p.ring(gx, y + 8, 4, C.brass);
    p.px(gx - 3, y + 8, C.stone1); p.px(gx + 3, y + 8, C.stone1); p.px(gx, y + 5, C.stone1);
    p.line(gx, y + 8, gx + Math.round(Math.sin(a) * 3), y + 8 - Math.round(Math.cos(a) * 3), C.red);
  }
  p.vl(x + 14, y - 12, 12, C.rust1); p.vl(x + 13, y - 12, 12, C.void);
}

function drum(p, x, y) {
  const w = 16, h = 24;
  p.dith(x - 2, GY - 2, w + 4, 2, null, C.void, 9);
  p.rect(x, y, w, h, C.void);
  p.rect(x + 1, y + 1, w - 2, h - 1, C.rust1);
  p.vl(x + 2, y + 1, h - 1, C.rust3); p.vl(x + 3, y + 1, h - 1, C.rust2); p.vl(x + w - 3, y + 1, h - 1, C.rust0);
  for (const by of [y + 6, y + 15]) { p.hl(x + 1, by, w - 2, C.rust0); p.hl(x + 1, by + 1, w - 2, C.rust2); }
  p.hl(x + 1, y + 1, w - 2, C.rust3); p.rect(x + 4, y, 3, 1, C.steel1);
}

function extinguisher(p, x, y) {
  // bracket + red marker square behind (wordless)
  p.dith(x - 6, y - 6, 20, 30, null, C.rust0, 4);
  p.rect(x - 2, y + 4, 12, 3, C.void); p.hl(x - 1, y + 5, 10, C.steel1);
  // cylinder
  p.rect(x, y, 8, 22, C.void); p.rect(x + 1, y + 1, 6, 20, C.red);
  p.vl(x + 2, y + 2, 18, C.rust3); p.vl(x + 6, y + 1, 20, C.rust0);
  p.hl(x + 1, y + 14, 6, C.cream); p.hl(x + 1, y + 15, 6, C.stone2);
  // valve head + hose
  p.rect(x + 2, y - 3, 4, 3, C.void); p.hl(x + 3, y - 3, 2, C.steel2);
  p.line(x + 5, y - 3, x + 9, y - 5, C.void); p.vl(x + 9, y - 4, 14, C.ink);
}

// ------------------------------------------------------------------ Script Lab
function scriptLab(ctx, p) {
  const { lab } = F1;
  lamp(ctx, lab.x + 66, 40, { cone: 34, drop: 6 });
  shelving(ctx, lab.x + 104, GY - 60, { w: 34, rows: 4, seed: 4 });
  desk(ctx, lab.x + 34, GY - 24, { w: 62 });
  // hydraulic line into the press crown
  pipeV(ctx, F1.stamp.x + 38, 41, F1.stamp.y + 6, { r: 1, color: 'rust', flanges: 10 });
  schematic(p, 724, 52);
  paperFeed(p, 780, GY - 30);
  conveyor(ctx, F1.belt.x, F1.belt.y, F1.belt.w, { h: 20 });
  stampPress(ctx, F1.stamp.x, F1.stamp.y, { label: '', count: '' });
  tray(p, F1.tray.x, F1.tray.y);
}

// Wordless wall schematic over the line: sheet -> cog -> stamped sheet, the same every time.
function schematic(p, x, y) {
  const w = 76, h = 28;
  p.rect(x - 1, y - 1, w + 2, h + 2, C.void);
  p.rect(x, y, w, h, C.navy2);
  for (let i = x + 4; i < x + w; i += 6) p.dith(i, y + 1, 1, h - 2, null, C.steel0, 6);
  for (let j = y + 4; j < y + h; j += 6) p.dith(x + 1, j, w - 2, 1, null, C.steel0, 6);
  p.hl(x, y, w, C.steel1);
  const sheet = (sx, sy, mark) => {
    p.rect(sx, sy, 11, 14, C.steel2); p.rect(sx + 1, sy + 1, 9, 12, C.navy2);
    p.hl(sx + 2, sy + 3, 6, C.steel1); p.hl(sx + 2, sy + 5, 5, C.steel1);
    if (mark) { p.rect(sx + 3, sy + 7, 5, 4, C.amber); p.rect(sx + 4, sy + 8, 3, 2, C.navy2); }
  };
  sheet(x + 5, y + 7, false);
  sheet(x + 60, y + 7, true);
  // cog
  const cx = x + 38, cy = y + 14;
  for (let a = 0; a < 8; a++) { const t = a * Math.PI / 4; p.rect(cx + Math.round(Math.cos(t) * 6) - 1, cy + Math.round(Math.sin(t) * 6) - 1, 3, 3, C.steel2); }
  p.disc(cx, cy, 5, C.steel2); p.disc(cx, cy, 2, C.navy2);
  // arrows
  for (const ax of [x + 19, x + 48]) { p.hl(ax, cy, 9, C.cream); p.px(ax + 7, cy - 1, C.cream); p.px(ax + 7, cy + 1, C.cream); p.px(ax + 6, cy - 2, C.cream); p.px(ax + 6, cy + 2, C.cream); }
  for (const [rx, ry] of [[x + 1, y + 1], [x + w - 2, y + 1], [x + 1, y + h - 2], [x + w - 2, y + h - 2]]) p.px(rx, ry, C.steel2);
}

function paperFeed(p, x, y) {
  // steel stand with a ream of blank sheets
  p.dith(x - 2, GY - 2, 18, 2, null, C.void, 9);
  p.rect(x + 2, y + 8, 3, GY - y - 8, C.void); p.vl(x + 3, y + 8, GY - y - 8, C.steel0);
  p.rect(x + 10, y + 8, 3, GY - y - 8, C.void); p.vl(x + 11, y + 8, GY - y - 8, C.steel0);
  p.rect(x, y + 7, 16, 3, C.void); p.hl(x + 1, y + 7, 14, C.steel1);
  p.rect(x + 1, y, 14, 7, C.void);
  for (let j = 0; j < 6; j++) p.hl(x + 2, y + 1 + j, 12, j % 2 ? C.cream : C.cream2);
  p.hl(x + 2, y + 6, 12, C.stone2);
}

// Output tray: tilted inbox on legs; the top sheet faces you, stamped 42.
function tray(p, x, y) {
  const w = 28;
  p.dith(x - 2, GY - 2, w + 4, 2, null, C.void, 9);
  for (const lx of [x + 3, x + w - 6]) { p.rect(lx, y + 20, 3, GY - y - 20, C.void); p.vl(lx + 1, y + 20, GY - y - 20, C.steel0); }
  // tray body (steel lip at the bottom)
  p.rect(x, y, w, 21, C.void); p.rect(x + 1, y + 1, w - 2, 19, C.steel0);
  // stacked sheet edges, then the top sheet
  p.rect(x + 3, y + 2, w - 6, 15, C.stone3);
  p.rect(x + 2, y + 3, w - 5, 14, C.cream);
  p.rect(x + 3, y + 2, w - 7, 14, C.cream2);
  p.hl(x + 5, y + 4, 10, C.stone2); p.hl(x + 5, y + 6, 7, C.stone2);
  // the stamp: red frame + 42
  const sx = x + 8, sy = y + 7;
  p.rect(sx, sy, 15, 9, C.red); p.rect(sx + 1, sy + 1, 13, 7, C.cream2);
  p.text('42', sx + 2, sy + 1, C.red);
  p.px(sx + 13, sy + 1, C.cream2); // worn corner
  p.rect(x, y + 17, w, 4, C.void); p.hl(x + 1, y + 17, w - 2, C.steel2); p.hl(x + 1, y + 18, w - 2, C.steel1); p.hl(x + 1, y + 19, w - 2, C.navy2);
}

// ------------------------------------------------------------------ live
export function live(ctx, top, t, s, draw, animate) {
  liveFloor(ctx, top, t, s, 1, animate);
  const p = pen(ctx);
  // pegboard: the grabbed tool rises off its hook for a moment
  const T = s.demos.tool, up = toolLift(T.t);
  if (up) pegboard(p, F1.peg.x, top + F1.peg.y, T.idx, up);
  // stamp: ram comes down on a sheet; the counter shows the number of presses (digits only)
  const S = s.demos.stamp, travel = pressTravel(S.t, ANIM.stamp);
  const st = F1.stamp;
  if (travel > 0) {
    stampPress(ctx, st.x, top + st.y, { label: '', count: '', ramY: Math.round(travel * 16) });
    p.hl(st.x + 12, top + st.y + st.h - 19, st.w - 24, C.cream2); // the sheet on the bed
  }
  p.text(String(S.count % 10000).padStart(4, '0'), st.x + 8, top + st.y + 8, C.amber);
  // vim booth: while someone is inside, the door swings shut and the roof lamp glows (steady, no blinking)
  const V = vimPhase(s.demos.vim.t, reduced);
  if (V.inside) {
    vimBooth(p, V.door, top);
    const B0 = F1.vim;
    p.hl(B0.x + (B0.w >> 1) - 1, top + B0.y - 4, 2, C.yellow);
  }
  // the one ambient mover: conveyor belt feeding blank sheets into the press
  const B = F1.belt, off = Math.floor(mt8(t));
  conveyor(ctx, B.x, top + B.y, B.w, { h: 20, offset: off });
  for (let k = 0; k < 3; k++) {
    const sx = B.x + ((off + k * 12) % 36) - 4;
    if (sx < B.x - 1 || sx + 7 > B.x + B.w + 2) continue;
    p.hl(sx, top + B.y - 1, 7, C.cream2); p.px(sx + 6, top + B.y - 1, C.stone2);
  }
}
const mt8 = t => t * 6; // belt speed (px/s); t is already mt()-scaled
