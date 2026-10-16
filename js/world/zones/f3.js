// Floor 03 — Security (cool cast concrete + blue steel, red security stripe). 960 px wide; shaft at 452..556.
// West → east: Permissions Office (filing cabinets, room terminal, counter with the two items, clipboard allow list,
// the permissions door), Hook Checkpoint (the exit-1 walkway gate into the office, room terminal, the rail of hooks,
// the caged red `rm -rf /` button = the exit-2 hook gate; each gate carries its exit-code plate), CCTV, pamphlet
// stand | shaft | call box, The Sandbox (bench + hazmat coats, CCTV monitor of the pen, room terminal, the fenced pen
// with its sand-floor pad and the beach ball you can't carry out). Walking west from the lift you meet the stand,
// the exit 2 gate, the exit 1 gate, then the Permissions Office.
import { C, pen, BAYER4, steelPanels, column, ceiling, baseStrip, walkway, slabBand, pipeRun, pipeV, junctionBox, pamphletRack } from './common.js?v=68';
import { signPlate, bigText } from '../../art/kit/signs.js?v=68';
import { PROP_TEXT } from '../../logic/demos.js?v=68';
import { wrap } from '../../logic/text.js?v=68';
import { filingCabinet, bench } from '../../art/kit/furniture.js?v=68';
import { ROOMS, PROPS, SHAFT_X, SHAFT_W, ROOM_H, WW, PAMPHLET, pamphletAt, SANDBOX_PEN, EXIT1_GATE_X } from '../levels.js?v=68';
import { ROOM_COPY } from '../../logic/copy.js?v=68';
import { bakeProp, liveFloor } from './generic.js?v=68';
import { duct, bulkhead } from './f1.js?v=68';
import { gateShake, doorOpen, ANIM, POSTER_LINES, microWidth } from '../concept.js?v=68';
import { reduced } from '../../engine/motion.js?v=68';

const GY = ROOM_H - 6; // 129 walk surface
const WALL_Y = 19;
const EAST = SHAFT_X + SHAFT_W;
const rect = id => { const q = PROPS.find(p => p.id === id); return { x: q.x, y: q.y, w: q.w, h: q.h }; };

export const F3 = {
  hook: ROOMS.find(r => r.id === 'hook'),
  perm: ROOMS.find(r => r.id === 'permissions'),
  sand: ROOMS.find(r => r.id === 'sandbox'),
  cage: rect('demo-hookgate'),
  gate: rect('demo-exit1gate'),
  door: rect('demo-permdoor'),
};
// hook gate (exit 2): frame = the prop; the yellow `rm -rf /` plate is its header, a hazard band under it, the
// bars live inside the opening below
const CAGE = { x0: F3.cage.x, x1: F3.cage.x + F3.cage.w, top: F3.cage.y - 2 };
CAGE.band = CAGE.top + 13; // hazard band under the header plate
CAGE.open = { x0: CAGE.x0 + 4, x1: CAGE.x1 - 4, y0: CAGE.band + 3, y1: GY - 6 };
const BTN = { cx: F3.cage.x + (F3.cage.w >> 1), cy: GY - 15 };
// exit-1 gate: posts either side of the sliding panel, lamps on the header
const GATE = { x0: F3.gate.x, x1: F3.gate.x + F3.gate.w, head: F3.gate.y, py0: F3.gate.y + 8, py1: GY - 1, pxa: EXIT1_GATE_X - 7, pxb: EXIT1_GATE_X + 7 };
// the exit-code plates: one mounted on top of each gate, same size, same height (bottom edge on the gate's top)
// (y 41: hung right under the room's header band); x and width = the gate's cueFrame in levels.js
const EXIT_PLATE = { h: 49, y: CAGE.top - 49 };
// permissions door: frame = the prop; the panel slides up into the header
const DOOR = { x0: F3.door.x, x1: F3.door.x + F3.door.w, head: F3.door.y, ox0: F3.door.x + 4, ox1: F3.door.x + F3.door.w - 4, oy0: F3.door.y + 6 };
const READER = { x: F3.door.x + F3.door.w + 6, y: 90 }; // lamp centre
const OX = F3.perm.x; // the office's own layout, from its west wall
const COUNTER = { x: OX + 120, y: GY - 24, w: 36 };
const ITEMS = { box: { x: OX + 125, w: 10, h: 8 }, sheet: { x: OX + 141, w: 9, h: 11 } };
const CLIP = { x: OX + 121, y: 49, w: 28, h: 36 };
const HOOKS = { x: 246, y: 93, n: 3 }; // the rail of literal hooks, on the wall west of the exit-1 gate
// sandbox pen: fences stand just outside the item's x range
const PEN = { x0: SANDBOX_PEN.x0 - 12, x1: SANDBOX_PEN.x1 + 7, rail: 76 };
const MON = { x: 722, y: 54, w: 30, h: 22 }; // CCTV monitor showing the pen
const POSTER = rect('gag-poster'); // the prompt-injection poster, taped up between the coats and the monitor
// CCTV: the office's east wall, over the pamphlet stand looking into the checkpoint, the sandbox
const CAMS = [{ x: 218, y: 46, dir: -1 }, { x: 432, y: 46, dir: -1 }, { x: 912, y: 46, dir: -1 }];

// ------------------------------------------------------------------ bake (static)
export function bake(ctx) {
  const p = pen(ctx);
  p.rect(0, 0, WW, 180, C.void);
  const { hook, perm, sand } = F3;
  for (const [a, b] of [[0, SHAFT_X], [EAST, WW]]) {
    concrete(p, a, WALL_Y, b - a, 101 - WALL_Y, { base: C.steel0, dark: C.navy2, lite: C.steel1, seed: a + 5 });
    dado(p, a, 104, b - a, 19);
    p.rect(a, 101, b - a, 3, C.void); p.hl(a, 101, b - a, C.steel2); p.hl(a, 102, b - a, C.navy2);
    p.dithV(a, 104, b - a, 3, C.void, 8, 0);
  }
  // room back walls: blast plating at the checkpoint, dark wallboard in the office, raw concrete at the sandbox
  steelPanels(p, hook.x + 7, 41, hook.w - 14, 60, { pw: 28, ramp: [C.ink, C.navy, C.navy2, C.steel0], seed: 31 });
  p.dithV(hook.x + 7, 41, hook.w - 14, 10, C.void, 9, 0);
  wallboard(p, perm.x + 7, 41, perm.w - 14, 60);
  concrete(p, sand.x + 7, 41, sand.w - 14, 60, { base: C.navy2, dark: C.navy, lite: C.steel0, seed: 77 });
  p.dithV(sand.x + 7, 41, sand.w - 14, 10, C.void, 9, 0);

  ceiling(ctx, 0, SHAFT_X, { lights: [36, 176, 232, 384], seed: 31, pipe: 'pale', trim: C.steel2 });
  ceiling(ctx, EAST, WW, { lights: [650, 862], seed: 32, pipe: 'pale', trim: C.steel2 });
  // a thin steel line along the lift corridor under the tray
  pipeRun(ctx, EAST + 9, 32, sand.x, { r: 1, color: 'steel', flanges: 24, seed: 4 });

  bulkhead(p, 0, 14);
  bulkhead(p, WW - 14, 14);
  column(p, SHAFT_X - 9, WALL_Y, GY, { w: 9 });
  column(p, EAST, WALL_Y, GY, { w: 9 });
  duct(p, sand.x + sand.w, WW - 14, 20);

  for (const r of [hook, perm, sand]) roomShell(ctx, p, r);
  // between the office and the checkpoint: a steel riser down from the ceiling tray
  pipeV(ctx, perm.x + perm.w + 3, 34, GY - 6, { r: 1, color: 'steel', flanges: 0 });

  for (const c of CAMS) camera(p, c.x, c.y, c.dir);
  checkpoint(ctx, p);
  office(ctx, p);
  sandbox(ctx, p);
  pamphletRack(p, pamphletAt(3).x, GY - PAMPHLET.h);
  junctionBox(ctx, 930, 52, { w: 12, h: 14 });
  pipeV(ctx, 936, 30, 52, { r: 1, color: 'steel', flanges: 0 });

  baseStrip(p, 14, SHAFT_X - 9 - 14, GY - 6);
  baseStrip(p, EAST + 9, WW - 14 - EAST - 9, GY - 6);
  walkway(p, 0, SHAFT_X, GY);
  walkway(p, EAST, WW - EAST, GY);
  penFloor(p);
  penFront(p);
  const deck = [C.stone0, C.navy2, C.stone1, C.steel0];
  slabBand(ctx, 0, SHAFT_X, ROOM_H, { seed: 33, vpipes: [96, 420], boxes: [250], deck });
  slabBand(ctx, EAST, WW, ROOM_H, { seed: 34, vpipes: [640], boxes: [900], deck });

  for (const pr of PROPS.filter(q => q.floor === 3 && q.kind === 'terminal')) bakeProp(ctx, p, pr);
}

// Cast concrete: flat cool base, low mottling, form-panel joints with a lit lip, form-tie holes, a darker head.
function concrete(p, x0, y0, w, h, { base, dark, lite, seed }) {
  p.rect(x0, y0, w, h, base);
  p.mottle(x0, y0, w, h, dark, 13, 5, seed);
  p.mottle(x0, y0, w, h, lite, 9, 3, seed + 3);
  p.noise(x0, y0, w, h, dark, 0.03, seed + 1);
  const pw = 48, ph = 27;
  for (let y = y0 + ph; y < y0 + h - 4; y += ph) { p.hl(x0, y, w, dark); p.dith(x0, y + 1, w, 1, null, lite, 6); }
  for (let row = 0; row * ph < h; row++) {
    const off = row % 2 ? pw >> 1 : 0, ry = y0 + row * ph;
    for (let x = Math.ceil((x0 - off) / pw) * pw + off; x < x0 + w; x += pw) {
      if (x <= x0) continue;
      const hh = Math.min(ph, y0 + h - ry);
      p.vl(x, ry + 1, hh - 1, dark); p.dith(x + 1, ry + 1, 1, hh - 1, null, lite, 5);
      for (const dx of [12, 36]) for (const dy of [8, 19]) {
        const tx = x - pw + dx, ty = ry + dy;
        if (tx > x0 + 1 && tx < x0 + w - 2 && ty < y0 + h - 2) { p.px(tx, ty, C.ink); p.px(tx + 1, ty + 1, lite); }
      }
    }
  }
  p.dithV(x0, y0, w, 14, C.void, 8, 0);
}

// Painted steel dado with the red security stripe.
function dado(p, x0, y0, w, h) {
  p.rect(x0, y0, w, h, C.navy2);
  p.dith(x0, y0 + 1, w, h - 2, null, C.steel0, 2);
  for (let x = Math.ceil(x0 / 40) * 40; x < x0 + w; x += 40) { p.vl(x, y0, h, C.navy); p.vl(x + 1, y0, h, C.steel0); }
  p.hl(x0, y0 + 5, w, C.void); p.hl(x0, y0 + 6, w, C.red); p.hl(x0, y0 + 7, w, C.red); p.hl(x0, y0 + 8, w, C.rust0);
  p.dithV(x0, y0 + h - 5, w, 5, C.void, 0, 8);
}

// Office wallboard: dark navy boards with thin seams and a chair rail.
function wallboard(p, x0, y0, w, h) {
  p.rect(x0, y0, w, h, C.navy);
  for (let x = x0; x < x0 + w; x += 12) { p.vl(x, y0, h, C.ink); p.dith(x + 1, y0, 1, h, null, C.navy2, 8); }
  p.noise(x0, y0, w, h, C.navy2, 0.04, 9);
  p.rect(x0, y0 + 44, w, 3, C.void); p.hl(x0, y0 + 44, w, C.steel0); p.hl(x0, y0 + 45, w, C.navy2);
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

// Wall CCTV camera on a bracket (the red light is live).
function camera(p, x, y, dir) {
  p.rect(x - 1, y - 3, 3, 6, C.void); p.vl(x, y - 2, 4, C.steel1);
  p.line(x, y, x + dir * 4, y + 3, C.steel0);
  const bx = dir < 0 ? x - 13 : x + 3;
  p.rect(bx, y + 2, 11, 6, C.void); p.rect(bx + 1, y + 3, 9, 4, C.stone3); p.hl(bx + 1, y + 3, 9, C.cream);
  p.hl(bx + 1, y + 6, 9, C.stone2);
  const lx = dir < 0 ? bx - 2 : bx + 11;
  p.rect(lx, y + 3, 2, 4, C.void); p.px(dir < 0 ? lx : lx + 1, y + 4, C.steel2);
}

// ------------------------------------------------------------------ Hook Checkpoint
function checkpoint(ctx, p) {
  // the cage: heavy posts, the yellow `rm -rf /` plate as its header, a hazard band, a dark recess with the red
  // button. 47-px label + 3 / 4 px padding + 1 px border each side = 54, one px inside each post.
  const { open: o } = CAGE;
  p.rect(CAGE.x0, CAGE.top, CAGE.x1 - CAGE.x0, GY - CAGE.top, C.void);
  p.rect(o.x0, o.y0, o.x1 - o.x0, o.y1 - o.y0, C.ink);
  p.dith(o.x0, o.y0, o.x1 - o.x0, o.y1 - o.y0, null, C.navy, 5);
  p.dithV(o.x0, o.y0, o.x1 - o.x0, 12, C.void, 12, 0);
  // red glow pooled on the recess floor + back wall around the button
  for (let j = -14; j <= 14; j++) for (let i = -16; i <= 16; i++) {
    const d = (i / 16) ** 2 + (j / 14) ** 2, X = BTN.cx + i, Y = BTN.cy + 2 + j;
    if (d < 1 && X > o.x0 && X < o.x1 - 1 && Y >= o.y0 && BAYER4[Y & 3][X & 3] < Math.round((1 - d) * 7)) p.px(X, Y, d < 0.35 ? C.rust1 : C.rust0);
  }
  // pedestal
  const ped = { x: BTN.cx - 6, y: BTN.cy + 5, w: 13 };
  p.rect(ped.x, ped.y, ped.w, o.y1 - ped.y, C.void);
  p.rect(ped.x + 1, ped.y + 1, ped.w - 2, o.y1 - ped.y - 1, C.steel0);
  p.vl(ped.x + 1, ped.y + 1, o.y1 - ped.y - 1, C.steel1); p.vl(ped.x + ped.w - 2, ped.y + 1, o.y1 - ped.y - 1, C.navy2);
  for (let i = 0; i < ped.w - 2; i++) p.px(ped.x + 1 + i, ped.y + 3, ((i >> 1) % 2) ? C.yellow : C.ink);
  p.rect(ped.x - 2, o.y1 - 3, ped.w + 4, 3, C.void); p.hl(ped.x - 1, o.y1 - 3, ped.w + 2, C.steel1);
  // collar + big red mushroom cap
  p.rect(BTN.cx - 11, BTN.cy + 2, 23, 4, C.void);
  for (let i = 0; i < 21; i++) p.px(BTN.cx - 10 + i, BTN.cy + 3, ((i >> 1) % 2) ? C.yellow : C.ink);
  p.hl(BTN.cx - 10, BTN.cy + 4, 21, C.steel0);
  for (let j = 0; j < 6; j++) {
    const hw = [5, 8, 9, 9, 9, 8][j];
    p.hl(BTN.cx - hw - 1, BTN.cy - 5 + j, hw * 2 + 3, C.void);
    p.hl(BTN.cx - hw, BTN.cy - 5 + j, hw * 2 + 1, j < 4 ? C.red : C.rust0);
  }
  p.hl(BTN.cx - 3, BTN.cy - 4, 4, C.rust3); p.px(BTN.cx - 4, BTN.cy - 3, C.rust3); p.px(BTN.cx - 2, BTN.cy - 5, C.pink);
  // frame: the header plate, the hazard band under it, posts
  const pl = { x: CAGE.x0 + 1, y: CAGE.top + 1, w: CAGE.x1 - CAGE.x0 - 2, h: 12 };
  p.rect(pl.x, pl.y, pl.w, pl.h, C.yellow);
  p.hl(pl.x, pl.y, pl.w, C.cream2); p.hl(pl.x, pl.y + pl.h - 1, pl.w, C.amber);
  for (const bx of [pl.x + 1, pl.x + pl.w - 2]) p.px(bx, pl.y + 2, C.amber); // bolts
  labelText(p, 'rm -rf /', pl.x + 3, pl.y + 3, C.ink);
  p.rect(CAGE.x0, CAGE.band, CAGE.x1 - CAGE.x0, 3, C.void);
  for (let i = 1; i < CAGE.x1 - CAGE.x0 - 1; i++) p.px(CAGE.x0 + i, CAGE.band + 1, ((i >> 1) % 2) ? C.yellow : C.ink);
  for (const px0 of [CAGE.x0, CAGE.x1 - 4]) {
    p.rect(px0, CAGE.band + 3, 4, GY - CAGE.band - 3, C.void);
    p.vl(px0 + 1, CAGE.band + 3, GY - CAGE.band - 3, C.steel2); p.vl(px0 + 2, CAGE.band + 3, GY - CAGE.band - 3, C.steel0);
    for (let y = CAGE.band + 8; y < GY - 4; y += 14) p.px(px0 + 1, y, C.steel3);
  }
  // lamp housing on the east post, under the band (the lamp itself is live)
  p.rect(CAGE.x1 - 5, CAGE.band + 3, 7, 7, C.void); p.hl(CAGE.x1 - 4, CAGE.band + 3, 5, C.steel1);
  p.dith(CAGE.x0 - 2, GY - 2, CAGE.x1 - CAGE.x0 + 4, 2, null, C.void, 9);
  // its exit-code plate on top: exit 2 blocks the action (red)
  exitPlate(ctx, p, 'demo-hookgate', PROP_TEXT.exit2, PROP_TEXT.exit2Note, { face: C.red, hi: C.rust3, lo: C.rust0, big: C.cream2, shade: C.rust0, small: C.cream });

  // a rail of literal hooks on the checkpoint wall
  const H = HOOKS;
  const rw = H.n * 7 + 1;
  p.rect(H.x, H.y, rw, 3, C.void); p.hl(H.x + 1, H.y, rw - 2, C.steel2); p.hl(H.x + 1, H.y + 1, rw - 2, C.steel0);
  for (let k = 0; k < H.n; k++) {
    const hx = H.x + 2 + k * 7;
    const y = H.y + 2;
    p.rect(hx - 1, y, 3, 9, C.void); p.rect(hx, y + 7, 4, 3, C.void); p.rect(hx + 2, y + 4, 3, 5, C.void);
    p.vl(hx, y + 1, 7, C.steel3); p.hl(hx + 1, y + 8, 2, C.steel2); p.vl(hx + 3, y + 5, 3, C.steel1); p.px(hx + 3, y + 5, C.steel3);
    p.dith(hx - 1, y + 10, 6, 2, null, C.ink, 6);
  }
  // exit-1 walkway gate: two posts, a header with two lamps (amber = complaint, mint = open), floor track
  const g = GATE;
  p.rect(g.x0, g.head, g.x1 - g.x0, 9, C.void);
  p.rect(g.x0 + 1, g.head + 1, g.x1 - g.x0 - 2, 7, C.steel0); p.hl(g.x0 + 1, g.head + 1, g.x1 - g.x0 - 2, C.steel2);
  p.hl(g.x0 + 1, g.head + 7, g.x1 - g.x0 - 2, C.navy2);
  for (const lx of [g.x0 + 5, g.x1 - 8]) { p.rect(lx - 1, g.head + 2, 5, 5, C.void); }
  for (const px0 of [g.x0, g.x1 - 4]) {
    p.rect(px0, g.head + 9, 4, GY - g.head - 9, C.void);
    p.vl(px0 + 1, g.head + 9, GY - g.head - 9, C.steel2); p.vl(px0 + 2, g.head + 9, GY - g.head - 9, C.steel0);
    for (let y = g.head + 12; y < GY; y += 6) p.px(px0 + 1, y, ((y >> 1) % 2) ? C.yellow : C.steel1);
  }
  p.rect(g.x0 - 2, GY - 2, g.x1 - g.x0 + 4, 2, C.void); p.hl(g.x0 - 1, GY - 2, g.x1 - g.x0 + 2, C.steel1);
  // its exit-code plate on top: exit 1 warns, then the action runs (amber)
  exitPlate(ctx, p, 'demo-exit1gate', PROP_TEXT.exit1, PROP_TEXT.exit1Note, { face: C.amber, hi: C.yellow, lo: C.rust1, big: C.ink, shade: C.rust1, small: C.ink });
}

// An exit-code plate standing on top of its gate, centred on cx: the exit code large (5x7 at 2x), what it does
// under it, a rule, then what kind of hook it is (both in the 3x5 micro font: exact words, wrapped at spaces,
// EXIT_NOTE_WRAP a line; the note centred in its band, the hook lines on the bottom). Two steel feet bolt it to the
// frame. The plate stays inside the checkpoint's columns.
export const EXIT_NOTE_WRAP = 17;
export const exitNoteLines = note => wrap(note, EXIT_NOTE_WRAP);
// The plate's x and width come from the gate's cue frame (levels.js), so the cue brackets fit it exactly.
function exitPlate(ctx, p, id, code, note, col) {
  const { h, y } = EXIT_PLATE, fr = PROPS.find(q => q.id === id).cueFrame, x = fr.x, w = fr.w;
  p.rect(x, y, w, h, C.void);
  p.rect(x + 1, y + 1, w - 2, h - 2, col.face);
  p.hl(x + 1, y + 1, w - 2, col.hi); p.hl(x + 1, y + h - 2, w - 2, col.lo); p.vl(x + w - 2, y + 2, h - 4, col.lo);
  for (const [bx, by] of [[x + 2, y + 2], [x + w - 4, y + 2]]) { p.px(bx, by, col.lo); p.px(bx + 1, by + 1, col.hi); } // bolts
  const bw = [...code].length * 12 - 2;
  bigText(ctx, code, x + ((w - bw) >> 1), y + 2, col.big, 2, { shadow: col.shade });
  const line = (l, ly) => p.text(l, x + ((w - microWidth(l) + 1) >> 1), ly, col.small, 'f3');
  const hook = exitNoteLines(PROP_TEXT.gateHook), hy = y + h - 2 - hook.length * 6; // first hook line
  const ruleY = hy - 4, nl = exitNoteLines(note), band = ruleY - 2 - (y + 18); // rows between the big code and the rule
  nl.forEach((l, i) => line(l, y + 18 + ((band - (nl.length * 6 - 1)) >> 1) + i * 6));
  p.hl(x + 8, ruleY, w - 16, col.lo);
  hook.forEach((l, i) => line(l, hy + i * 6));
  // feet: down to the gate frame under it
  for (const fx of [x + 12, x + w - 15]) { p.rect(fx, y + h, 3, 2, C.void); p.px(fx + 1, y + h, C.steel2); }
}

// Plate lettering: the 5x7 font, but with a plainer lowercase r (the font's r curls into a hook at this size).
const PLATE_R = ['.....', '.....', '#.##.', '##...', '#....', '#....', '#....'];
function labelText(p, s, x, y, c) {
  for (const ch of s) {
    if (ch === 'r') PLATE_R.forEach((row, j) => [...row].forEach((b, i) => { if (b === '#') p.px(x + i, y + j, c); }));
    else p.text(ch, x, y, c);
    x += 6;
  }
}

// Exit-1 sliding panel (live): bars between the posts; arm 0 = down, 1 = up inside the header.
function gatePanel(p, top, arm) {
  const g = GATE, lift = Math.round(arm * (g.py1 - g.py0 - 2));
  const y0 = top + g.py0, y1 = top + g.py1 - lift;
  if (y1 - y0 < 2) return;
  p.rect(g.pxa, y0, g.pxb - g.pxa + 1, y1 - y0, C.void);
  for (let x = g.pxa + 1; x < g.pxb; x += 3) { p.vl(x, y0, y1 - y0, C.steel2); p.vl(x + 1, y0, y1 - y0, C.navy2); }
  for (const cy of [y0 + 3, y1 - 6]) if (cy > y0 && cy < y1 - 1) { p.hl(g.pxa, cy, g.pxb - g.pxa + 1, C.steel1); p.hl(g.pxa, cy + 1, g.pxb - g.pxa + 1, C.navy); }
  p.hl(g.pxa, y1 - 1, g.pxb - g.pxa + 1, C.yellow);
}

// Hook gate bars (live): rattle sideways by dx on a try; a padlock box on the bars.
function cageBars(p, top, dx) {
  const o = CAGE.open;
  for (let x = o.x0 + 2; x < o.x1 - 1; x += 6) {
    p.vl(x + dx, top + o.y0, o.y1 - o.y0, C.steel2); p.vl(x + 1 + dx, top + o.y0, o.y1 - o.y0, C.navy2);
  }
  for (const cy of [o.y0 + 6, o.y1 - 8]) { p.rect(o.x0, top + cy - 1, o.x1 - o.x0, 4, C.void); p.hl(o.x0, top + cy, o.x1 - o.x0, C.steel1); p.hl(o.x0, top + cy + 1, o.x1 - o.x0, C.steel0); }
  const lx = o.x1 - 10 + dx, ly = top + BTN.cy - 6;
  p.rect(lx, ly, 8, 10, C.void); p.rect(lx + 1, ly + 3, 6, 6, C.brass); p.hl(lx + 1, ly + 3, 6, C.cream); p.px(lx + 4, ly + 6, C.void);
  p.rect(lx + 2, ly, 4, 4, C.void); p.vl(lx + 2, ly + 1, 2, C.steel2); p.vl(lx + 5, ly + 1, 2, C.steel2);
}

// ------------------------------------------------------------------ Permissions Office
function office(ctx, p) {
  for (const [x, open] of [[OX + 19, 0], [OX + 39, 2], [OX + 59, 1]]) filingCabinet(ctx, x, GY - 39, { drawers: 4, open });
  // in-tray stack on the middle cabinet
  p.rect(OX + 40, GY - 44, 16, 5, C.void); p.rect(OX + 41, GY - 43, 14, 3, C.cream2); p.hl(OX + 41, GY - 41, 14, C.stone2);
  // the allow list: a clipboard with ONE entry (the script sheet, ticked); the rest of the page is empty
  const c = CLIP;
  p.rect(c.x, c.y, c.w, c.h, C.void); p.rect(c.x + 1, c.y + 1, c.w - 2, c.h - 2, C.wood1); p.hl(c.x + 1, c.y + 1, c.w - 2, C.brass);
  p.rect(c.x + 3, c.y + 5, c.w - 6, c.h - 8, C.cream2); p.vl(c.x + c.w - 4, c.y + 6, c.h - 9, C.cream); p.hl(c.x + 3, c.y + c.h - 4, c.w - 6, C.stone3);
  p.rect(c.x + 9, c.y - 2, 10, 6, C.void); p.rect(c.x + 10, c.y - 1, 8, 4, C.steel1); p.hl(c.x + 10, c.y - 1, 8, C.steel3);
  sheetIcon(p, c.x + 6, c.y + 9);
  // tick
  p.line(c.x + 15, c.y + 13, c.x + 17, c.y + 15, C.mint1); p.line(c.x + 17, c.y + 15, c.x + 22, c.y + 10, C.mint1);
  p.line(c.x + 15, c.y + 14, c.x + 17, c.y + 16, C.mint0); p.line(c.x + 17, c.y + 16, c.x + 22, c.y + 11, C.mint0);
  for (let k = 0; k < 4; k++) p.dith(c.x + 6, c.y + 21 + k * 3, c.w - 12, 1, null, C.stone3, 8);
  // nail + string
  p.px(c.x + 14, c.y - 4, C.steel2);
  // counter (steel, a hatch rail on top) in front of the door
  const k = COUNTER;
  p.dith(k.x - 2, GY - 2, k.w + 4, 2, null, C.void, 9);
  p.rect(k.x, k.y, k.w, GY - k.y, C.void);
  p.rect(k.x + 1, k.y + 1, k.w - 2, GY - k.y - 2, C.navy2);
  p.hl(k.x, k.y, k.w, C.steel2); p.hl(k.x, k.y + 1, k.w, C.steel0);
  p.rect(k.x + 3, k.y + 5, k.w - 6, 12, C.ink); p.rect(k.x + 4, k.y + 6, k.w - 8, 10, C.navy2); p.hl(k.x + 4, k.y + 6, k.w - 8, C.steel0);
  p.rect(k.x + 14, k.y + 10, 8, 1, C.steel2);
  // the door: frame, dark room beyond (a mint glow far inside), card reader beside it
  const d = DOOR;
  p.rect(d.x0 - 1, d.head - 1, d.x1 - d.x0 + 2, GY - d.head + 1, C.void);
  p.rect(d.x0, d.head, d.x1 - d.x0, GY - d.head, C.steel0);
  p.vl(d.x0 + 1, d.head, GY - d.head, C.steel2); p.hl(d.x0, d.head, d.x1 - d.x0, C.steel2); p.vl(d.x1 - 2, d.head + 1, GY - d.head - 1, C.navy2);
  for (let y = d.head + 5; y < GY - 3; y += 12) { p.px(d.x0 + 2, y, C.steel3); p.px(d.x1 - 3, y, C.navy); }
  p.rect(d.ox0, d.oy0, d.ox1 - d.ox0, GY - d.oy0, C.void);
  p.dith(d.ox0, d.oy0 + 20, d.ox1 - d.ox0, GY - d.oy0 - 20, null, C.ink, 6);
  p.dith(d.ox0 + 6, GY - 14, d.ox1 - d.ox0 - 12, 10, null, C.mint0, 4);
  // card reader beside the door: its window is the door's status lamp (live)
  const rx = READER.x - 3, ry = READER.y - 3;
  p.rect(rx, ry, 7, 13, C.void); p.rect(rx + 1, ry + 1, 5, 11, C.stone3); p.hl(rx + 1, ry + 1, 5, C.cream);
  p.rect(rx + 1, ry + 1, 5, 5, C.void); p.hl(rx + 2, ry + 8, 3, C.void); p.hl(rx + 2, ry + 10, 3, C.stone1);
  p.dith(d.x0 - 2, GY - 2, d.x1 - d.x0 + 4, 2, null, C.void, 9);
}

// The listed item as a pictogram: a sheet with printed lines and an amber mark (the fixed script).
function sheetIcon(p, x, y) {
  p.rect(x, y, 7, 9, C.void); p.rect(x + 1, y + 1, 5, 7, C.white);
  p.hl(x + 2, y + 2, 3, C.stone2); p.hl(x + 2, y + 4, 3, C.stone2); p.rect(x + 2, y + 6, 2, 1, C.amber);
}

// Counter items (live, so the tried one can lift): the unlisted red box and the listed script sheet.
function counterItems(p, top, perm) {
  const trying = perm.t >= 0 ? perm.item : null;
  const by = top + COUNTER.y - ITEMS.box.h - (trying === 'unlisted-box' ? 3 : 0);
  const B = ITEMS.box;
  p.rect(B.x, by, B.w, B.h, C.void); p.rect(B.x + 1, by + 1, B.w - 2, B.h - 2, C.red);
  p.hl(B.x + 1, by + 1, B.w - 2, C.rust3); p.vl(B.x + B.w - 2, by + 2, B.h - 3, C.rust0);
  for (let i = 1; i < B.w - 1; i++) p.px(B.x + i, by + 4, (i % 3) ? C.yellow : C.ink);
  const S = ITEMS.sheet, sy = top + COUNTER.y - S.h - (trying === 'fixed-script' ? 3 : 0);
  p.rect(S.x - 1, top + COUNTER.y - 3, S.w + 2, 3, C.void); p.hl(S.x, top + COUNTER.y - 3, S.w, C.steel1); // holder
  p.rect(S.x, sy, S.w, S.h - 2, C.void); p.rect(S.x + 1, sy + 1, S.w - 2, S.h - 4, C.white);
  p.hl(S.x + 2, sy + 2, S.w - 4, C.stone2); p.hl(S.x + 2, sy + 4, S.w - 4, C.stone2); p.rect(S.x + 2, sy + 6, 3, 2, C.amber);
  // shadow under a lifted item
  if (trying) p.dith(trying === 'fixed-script' ? S.x : B.x, top + COUNTER.y - 1, 10, 1, null, C.void, 8);
}

// Door panel (live): steel with a wired window and kick plate; slides up into the header when allowed.
function doorPanel(p, top, open) {
  const d = DOOR, lift = Math.round(open * 50);
  const y0 = top + d.oy0, y1 = top + GY - lift, x = d.ox0, w = d.ox1 - d.ox0;
  if (y1 - y0 < 2) return;
  p.rect(x, y0, w, y1 - y0, C.navy2);
  p.vl(x, y0, y1 - y0, C.steel1); p.vl(x + w - 1, y0, y1 - y0, C.navy);
  const wy = y0 + 8 - lift;
  if (wy + 12 > y0) {
    const a = Math.max(y0, wy);
    p.rect(x + 5, a, w - 10, wy + 12 - a, C.void);
    for (let j = Math.max(a, wy + 1); j < wy + 11; j++) for (let i = x + 6; i < x + w - 5; i++) p.px(i, j, ((i + j) % 4 === 0) ? C.steel1 : C.ink);
  }
  const hy = y0 + 30 - lift;
  if (hy > y0 && hy < y1 - 2) { p.rect(x + w - 6, hy, 4, 2, C.void); p.hl(x + w - 6, hy, 3, C.steel3); }
  const ky = y1 - 8;
  if (ky > y0) { p.rect(x + 1, ky, w - 2, 7, C.steel0); p.hl(x + 1, ky, w - 2, C.steel2); }
  p.hl(x, y1 - 1, w, C.void);
}

// ------------------------------------------------------------------ The Sandbox
function sandbox(ctx, p) {
  // bench + hazmat coats on hooks (getting in and out takes kit)
  bench(ctx, 622, GY - 11, { w: 36 });
  for (const [hx, c, sh] of [[627, C.yellow, C.amber], [640, C.cream2, C.stone3], [653, C.yellow, C.amber]]) coat(p, hx, 64, c, sh);
  p.rect(621, 62, 39, 2, C.void); p.hl(622, 62, 37, C.steel1);
  poster(p);
  // CCTV monitor of the pen on a wall arm (the item dot is live)
  const m = MON;
  p.rect(m.x + 13, m.y - 8, 2, 8, C.steel0);
  p.rect(m.x, m.y, m.w, m.h, C.void); p.rect(m.x + 1, m.y + 1, m.w - 2, m.h - 2, C.stone2); p.hl(m.x + 1, m.y + 1, m.w - 2, C.stone3);
  p.rect(m.x + 3, m.y + 3, m.w - 6, m.h - 7, C.ink);
  p.dith(m.x + 3, m.y + 3, m.w - 6, m.h - 7, null, C.mint0, 5);
  // the pen as drawn on the monitor: fence lines + floor line
  p.vl(m.x + 5, m.y + 6, 9, C.mint1); p.vl(m.x + m.w - 6, m.y + 6, 9, C.mint1); p.hl(m.x + 5, m.y + 6, m.w - 10, C.mint1); p.hl(m.x + 4, m.y + 15, m.w - 8, C.mint1);
  p.px(m.x + m.w - 4, m.y + m.h - 3, C.mint2);
  // the pen: back mesh between the fences, top rail, posts with hazard feet; west gate swung open against the wall
  meshPanel(p, PEN.x0 + 3, PEN.rail, PEN.x1 - PEN.x0 - 3, GY - 6 - PEN.rail);
  meshPanel(p, PEN.x0 - 24, PEN.rail + 4, 20, GY - 10 - PEN.rail);
  p.rect(PEN.x0 - 25, PEN.rail + 3, 22, 2, C.void); p.hl(PEN.x0 - 24, PEN.rail + 3, 20, C.steel1);
  for (const hy of [PEN.rail + 10, GY - 16]) { p.rect(PEN.x0 - 5, hy, 3, 3, C.void); p.px(PEN.x0 - 4, hy + 1, C.steel2); }
  p.rect(PEN.x0 - 1, PEN.rail - 1, PEN.x1 - PEN.x0 + 4, 3, C.void); p.hl(PEN.x0, PEN.rail, PEN.x1 - PEN.x0 + 2, C.steel2);
}

// The prompt-injection poster: a printed notice taped to the concrete (header in red, the order in ink), tape
// strips on the corners, one corner curling off the wall. The lines are the exact poster text, word-wrapped.
function poster(p) {
  const { x, y, w, h } = POSTER;
  p.dith(x + 1, y + 2, w, h, null, C.void, 6); // soft shadow on the wall
  p.rect(x, y, w, h, C.stone2);
  p.rect(x + 1, y + 1, w - 2, h - 2, C.cream2);
  p.dith(x + 1, y + h - 8, w - 2, 7, null, C.cream, 2); // paper yellowing toward the bottom
  p.hl(x + 1, y + 1, w - 2, C.white);
  const head = POSTER_LINES.findIndex(l => l.endsWith(':')); // "NOTICE TO / ALL AGENTS:" is the red header
  POSTER_LINES.forEach((l, i) => {
    const tw = microWidth(l), ly = y + 3 + i * 6 + (i > head ? 1 : 0);
    p.text(l, x + ((w - tw + 1) >> 1), ly, i <= head ? C.red : C.ink, 'f3');
  });
  p.hl(x + 4, y + 3 + (head + 1) * 6 - 1, w - 8, C.rust1); // rule under the header
  // tape: two strips on the top corners, one bottom-left; the bottom-right corner curls off the wall
  for (const [tx, ty] of [[x - 2, y - 1], [x + w - 6, y - 1], [x - 2, y + h - 4]]) { p.rect(tx, ty, 8, 4, C.stone3); p.hl(tx, ty, 8, C.cream); p.dith(tx, ty + 1, 8, 3, null, C.stone2, 3); }
  p.rect(x + w - 5, y + h - 5, 5, 5, C.steel0);
  p.line(x + w - 5, y + h - 1, x + w - 1, y + h - 5, C.stone3);
  for (let k = 0; k < 4; k++) p.hl(x + w - 5, y + h - 4 + k, k, C.stone3);
  p.px(x + w - 2, y + h - 2, C.void);
}

// Drawn over the floor strips: the fence posts and a toy bucket + spade in the corner (it is a sandbox, after all).
function penFront(p) {
  for (const x of [PEN.x0 - 2, PEN.x1]) post(p, x, PEN.rail - 4);
  bucket(p, PEN.x1 - 34, GY + 2);
}

function coat(p, hx, y, c, sh) {
  p.px(hx, y, C.steel2); p.px(hx, y + 1, C.void);
  p.rect(hx - 4, y + 2, 9, 3, C.void); p.rect(hx - 3, y + 2, 7, 2, c);
  for (let j = 0; j < 26; j++) {
    const hw = 4 + (j >> 3);
    p.hl(hx - hw - 1, y + 4 + j, hw * 2 + 3, C.void);
    p.hl(hx - hw, y + 4 + j, hw * 2 + 1, c);
    p.dith(hx - hw, y + 4 + j, hw * 2 + 1, 1, null, sh, Math.max(0, j - 8) >> 1);
    p.px(hx + hw, y + 4 + j, sh); p.px(hx, y + 4 + j, j < 18 ? sh : c);
  }
  p.hl(hx - 7, y + 30, 15, sh);
  p.rect(hx - 2, y + 2, 5, 3, C.ink); p.hl(hx - 1, y + 3, 3, C.steel1); // hood visor
}

// Chain-link mesh: diagonal steel wires on the dark wall, a frame round it.
function meshPanel(p, x, y, w, h) {
  p.rect(x, y, w, h, C.void);
  p.dith(x, y, w, h, null, C.ink, 8);
  for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) {
    const a = (i + j) % 6, b = (i - j + 600) % 6;
    if (a === 0 || b === 0) p.px(x + i, y + j, (a === 0 && b === 0) ? C.steel2 : C.steel0);
  }
  p.hl(x, y, w, C.steel1); p.hl(x, y + h - 1, w, C.steel0); p.vl(x, y, h, C.steel1); p.vl(x + w - 1, y, h, C.steel0);
}

function post(p, x, y) {
  p.rect(x - 1, y, 6, GY - y, C.void);
  p.vl(x, y + 1, GY - y - 1, C.steel2); p.vl(x + 1, y + 1, GY - y - 1, C.steel1); p.vl(x + 2, y + 1, GY - y - 1, C.steel0); p.vl(x + 3, y + 1, GY - y - 1, C.navy2);
  p.rect(x - 1, y - 2, 6, 3, C.void); p.hl(x, y - 2, 4, C.steel3);
  for (let j = 0; j < 12; j++) for (let i = 0; i < 4; i++) p.px(x + i, GY - 12 + j, ((i + j) % 4) < 2 ? C.yellow : C.ink);
}

function bucket(p, x, gy) {
  p.rect(x, gy - 7, 8, 7, C.void); p.rect(x + 1, gy - 6, 6, 5, C.pink); p.hl(x + 1, gy - 6, 6, C.cream2); p.vl(x + 6, gy - 5, 4, C.rust1);
  p.line(x + 1, gy - 8, x + 3, gy - 10, C.void); p.line(x + 3, gy - 10, x + 6, gy - 8, C.void);
  p.line(x + 10, gy - 1, x + 13, gy - 9, C.wood1); p.rect(x + 9, gy - 2, 3, 2, C.steel2);
}

// Pen floor: a sand pad over the base strip + walkway between the fences, edged by yellow boundary lines.
function penFloor(p) {
  const x0 = PEN.x0 + 2, x1 = PEN.x1, y0 = GY - 6;
  p.rect(x0, y0, x1 - x0, 12, C.stone2);
  p.dith(x0, y0, x1 - x0, 12, null, C.stone3, 6);
  p.noise(x0, y0, x1 - x0, 12, C.cream, 0.08, 51);
  p.noise(x0, y0, x1 - x0, 12, C.stone1, 0.1, 52);
  p.dithV(x0, y0 + 7, x1 - x0, 5, C.stone1, 0, 8);
  p.hl(x0, y0, x1 - x0, C.void);
  for (const bx of [x0, x1 - 2]) { p.rect(bx, y0, 2, 12, C.yellow); p.vl(bx + 1, y0, 12, C.amber); }
  p.hl(x0, GY + 5, x1 - x0, C.yellow);
}

// The sandbox item: a beach ball. Four panels (red, white, blue, yellow) curve in toward the top and bottom, lit
// from the top left (a two-pixel shine on the red panel), darker toward the lower right, a dark outline.
// Grid rows top to bottom; '.' = outside.
const BALL_D = 10;
export const BALL_PANELS = [[C.red, C.rust1], [C.cream2, C.cream], [C.steel1, C.steel0], [C.yellow, C.amber]];
const BALL_KEY = { o: C.void, H: C.white, R: C.red, r: C.rust1, W: C.cream2, w: C.cream, B: C.steel1, b: C.steel0, Y: C.yellow, y: C.amber };
const BALL_ROWS = [
  '...oooo...',
  '.ooRWBYoo.',
  '.oRHWWBYo.',
  'oRHRWWBBYo',
  'oRRRWWBBYo',
  'oRRWWBBByo',
  'oRRWWBBbyo',
  '.orrwbbyo.',
  '.oorwbyoo.',
  '...oooo...',
];
export const BALL = BALL_ROWS.map(row => [...row].map(ch => (ch === '.' ? -1 : BALL_KEY[ch])));

// x = centre, gy = the row just under the ball (where it rests).
function beachBall(p, x, gy) {
  const l = x - (BALL_D >> 1), t = gy - BALL_D;
  BALL.forEach((row, j) => row.forEach((c, i) => { if (c >= 0) p.px(l + i, t + j, c); }));
}

// Held ball, drawn after the player (render.js): hugged in front of the chest, both hands on it.
export function drawHeld(ctx, s) {
  const pl = s.player, d = s.demos.sand;
  if (!d.held || pl.floor !== SANDBOX_PEN.floor) return;
  const p = pen(ctx), x = Math.round(pl.x) + pl.facing * 6, gy = Math.round(pl.y) - 6;
  beachBall(p, x, gy);
  // the hands: one on the near side, one tucked under it
  p.px(x - pl.facing * 5, gy - 5, C.skin); p.px(x - pl.facing * 5, gy - 4, C.skinDark);
  p.px(x + pl.facing, gy, C.skin); p.px(x + pl.facing * 2, gy, C.skin);
}

// ------------------------------------------------------------------ live
export function live(ctx, top, t, s, draw, animate) {
  liveFloor(ctx, top, t, s, 3, animate);
  const p = pen(ctx), d = s.demos;
  // hook gate: red lamp while the try is fresh; the bars rattle briefly (still under reduced motion)
  const hk = d.hook.t >= 0;
  cageBars(p, top, gateShake(d.hook.t, reduced));
  lamp(p, CAGE.x1 - 2, top + CAGE.band + 6, hk ? C.red : C.rust0, hk);
  // exit-1 gate: the amber lamp blinks once (the complaint), then the panel slides up and the mint lamp holds
  const g = d.exit1, blink = g.t >= 0 && g.t < ANIM.blink;
  lamp(p, GATE.x0 + 6, top + GATE.head + 3, blink ? C.amber : C.rust0, blink);
  lamp(p, GATE.x1 - 7, top + GATE.head + 3, g.raised ? C.mint2 : C.mint0, g.raised);
  gatePanel(p, top, g.arm);
  // permissions door: lamp red (denied) or mint (allowed); the panel only lifts for the listed item
  const pm = d.perm, res = pm.t >= 0;
  doorPanel(p, top, doorOpen(pm));
  lamp(p, READER.x, top + READER.y, res ? (pm.allowed ? C.mint2 : C.red) : C.navy2, res);
  counterItems(p, top, pm);
  // sandbox item on the pen floor (when not carried); the CCTV monitor tracks it
  if (!d.sand.held) {
    const bx = Math.round(d.sand.x);
    p.hl(bx - 3, top + GY, 6, C.stone1); // its shadow on the sand
    beachBall(p, bx, top + GY);
  }
  const k = (d.sand.x - SANDBOX_PEN.x0) / (SANDBOX_PEN.x1 - SANDBOX_PEN.x0);
  const mx = MON.x + 7 + Math.round(k * (MON.w - 15)), my = top + MON.y + (d.sand.held ? 11 : 13);
  p.rect(mx, my, 2, 2, C.mint2);
  // ambient: CCTV recording lights, slow and out of step (t is mt()-scaled: still under reduced motion)
  CAMS.forEach((c, i) => p.px(c.x - 12, top + c.y + 4, ((t * 0.5 + i * 0.33) % 1) < 0.5 ? C.red : C.rust0));
}

// 3x3 status lamp; lit adds a 1-px halo (no flashing: lamps hold steady for their whole state).
function lamp(p, x, y, c, lit) {
  p.rect(x - 1, y - 1, 3, 3, c);
  if (lit) { p.px(x - 1, y - 1, C.white); p.px(x - 2, y, c); p.px(x + 2, y, c); }
}
