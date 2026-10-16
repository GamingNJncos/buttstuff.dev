// Floor 04 — Worker Bays (warm painted block + taupe steel, safety-yellow trim). 960 px wide; shaft at 452..556.
// West → east: Subagent Pods (START console, three glass pods with a desk, a screen and a worker each, room
// terminal, a water fountain and its regular, the hand truck stacked with the 29 subagent binders, a plain crate
// stack) | shaft | call box, pamphlet stand, Plugin Warehouse (the PLUGIN crate and the racking shelf it unpacks
// onto, a plain crate stack, room terminal, the dependency tower gag, the second fountain), the Janitor's Closet at
// the east end (the building's main shutoff valve on the water main, room terminal, the narrow closet with mops and
// a bucket).
import { C, pen, BAYER4, blockWall, column, ceiling, baseStrip, walkway, slabBand, pipeRun, pipeV, pamphletRack } from './common.js?v=68';
import { signPlate } from '../../art/kit/signs.js?v=68';
import { ROOMS, PROPS, SHAFT_X, SHAFT_W, ROOM_H, WW, PAMPHLET, pamphletAt, PODS, FOUNTAINS } from '../levels.js?v=68';
import { ROOM_COPY } from '../../logic/copy.js?v=68';
import { bakeProp, liveFloor } from './generic.js?v=68';
import { duct, bulkhead } from './f1.js?v=68';
import { podPhase, podScreens, contextMeter, valveAngle, towerPose, unpackPose, ANIM, TOWER_PLATE_LINES, MICRO_LOWER, microWidth } from '../concept.js?v=68';
import { GAG_ART, PROP_TEXT } from '../../logic/demos.js?v=68';
import { wrap } from '../../logic/text.js?v=68';
import { FONT3 } from '../../engine/font.js?v=68';
import { PLAYER } from '../../art/sprites.js?v=68';
import { reduced } from '../../engine/motion.js?v=68';

const GY = ROOM_H - 6; // 129 walk surface
const WALL_Y = 19;
const EAST = SHAFT_X + SHAFT_W;
const rect = id => { const q = PROPS.find(p => p.id === id); return { x: q.x, y: q.y, w: q.w, h: q.h }; };

export const F4 = {
  pods: ROOMS.find(r => r.id === 'pods'),
  closet: ROOMS.find(r => r.id === 'command'),
  wh: ROOMS.find(r => r.id === 'warehouse'),
  start: rect('demo-pods'),
  valve: rect('demo-valve'),
  crate: rect('demo-plugin'),
  truck: rect('demo-binders'),
};
// The closet's plate keeps its existing wording (the room card's full name doesn't fit a 146-px room).
const CLOSET_PLATE = "JANITOR'S CLOSET";

// pods: cap with the summary screen on top, glass booth below
const POD = { capY: 48, capH: 14, glassY: 62 };
const podScreen = pod => ({ x: pod.x + 3, y: POD.capY + 2, w: pod.w - 6, h: 11 }); // 1-px bezel, 48 x 9 inside
// janitor's valve: vertical main with a gate valve and a face-on hand wheel; pressure gauge above
const VALVE = { cx: F4.valve.x + 11, cy: F4.valve.y + 12, r: 11, px: F4.valve.x + 9, gauge: { cx: F4.valve.x + 11, cy: 64 } };
const MAIN_Y = 42; // water main (r1) along the back walls, closet → the warehouse fountain next door
const CONDUIT_Y = 46; // START console → pod caps
const CX0 = F4.closet.x; // the closet's own layout, from its west wall
const CLOSET = { x0: CX0 + 84, x1: CX0 + 114, top: 56 }; // the narrow broom closet at the room's east end
const CLOSET_X1 = F4.closet.x + F4.closet.w - 7; // inside edge of the closet room's east column
const LEAK = { x: CLOSET.x0 - 6, y: 48, period: 2.4 }; // dripping joint; one drop every period seconds (steady, slow)
const STRAPS = [F4.crate.x + 1, F4.crate.x + F4.crate.w - 4]; // hazard marks on the closed lid's ends
const FOUNT = { w: 14 };
const MAIN_FOUNTAIN = FOUNTAINS.find(f => f.floor === 4 && f.x > SHAFT_X); // fed by the water main; the rest from below
const TWR = rect('gag-tower'); // the dependency tower, past the warehouse terminal, before its fountain
// The warehouse's racking shelf the PLUGIN crate unpacks onto: steel uprights, two amber beams, a label plate
// under each slot. Slot order = PROP_TEXT.shelf; row 1 holds three slots, row 2 two. Items rest on their beam.
const SHELF = { x0: 616, x1: 712, beams: [52, 72] };
export const SHELF_LABEL_WRAP = 9;
export const SHELF_SLOTS = (() => {
  const rows = [[0, 1, 2], [3, 4]], widths = [[26, 38, 22], [44, 44]];
  const out = [];
  rows.forEach((row, r) => {
    let x = SHELF.x0 + 3;
    row.forEach((i, k) => {
      const w = widths[r][k];
      out[i] = { x, w, beam: SHELF.beams[r], label: PROP_TEXT.shelf[i], lines: wrap(PROP_TEXT.shelf[i], SHELF_LABEL_WRAP) };
      x += w + 2;
    });
  });
  return out;
})();
// The hand truck of binders (side on, facing east): frame + handle at the west edge, toe plate and the stack of
// binders east of it, the wheel under the frame. Six labelled spines show; the tag on the handle says how many.
const TRUCK = { fx: F4.truck.x + 3, top: F4.truck.y, toe: GY - 3, bx: F4.truck.x + 8, bw: 24, bh: 7, n: 6 };

// ------------------------------------------------------------------ bake (static)
export function bake(ctx) {
  const p = pen(ctx);
  p.rect(0, 0, WW, 180, C.void);
  const { pods, closet, wh } = F4;
  for (const [a, b] of [[0, SHAFT_X], [EAST, WW]]) {
    blockWall(p, a, WALL_Y, b - a, 101 - WALL_Y, { ramp: [C.stone0, C.stone1, C.stone2, C.stone3], bw: 24, bh: 10, seed: a + 41 });
    p.dithV(a, WALL_Y, b - a, 16, C.void, 9, 0);
    dado(p, a, 104, b - a, 19);
    p.rect(a, 101, b - a, 3, C.void); p.hl(a, 101, b - a, C.yellow); p.hl(a, 102, b - a, C.amber);
    p.dithV(a, 104, b - a, 3, C.void, 8, 0);
  }
  // room back walls: dark ribbed panels at the pods, grimy tile in the closet, corrugated sheet in the warehouse
  ribbed(p, pods.x + 7, 41, pods.w - 14, 60);
  tiles(p, closet.x + 7, 41, closet.w - 14, 60);
  grime(p, closet.x + 7, 41, closet.w - 14, 60);
  p.dith(closet.x + 7, 104, closet.w - 14, 19, null, C.void, 6); // filthier dado in the closet
  p.noise(closet.x + 7, 104, closet.w - 14, 19, C.rust0, 0.05, 86);
  corrugated(p, wh.x + 7, 41, wh.w - 14, 60);

  ceiling(ctx, 0, SHAFT_X, { lights: [96, 214, 374], seed: 41, pipe: 'stone', trim: C.amber });
  ceiling(ctx, EAST, WW, { lights: [690, 850], seed: 42, pipe: 'stone', trim: C.amber });

  bulkhead(p, 0, 14);
  bulkhead(p, WW - 14, 14);
  column(p, SHAFT_X - 9, WALL_Y, GY, { w: 9 });
  column(p, EAST, WALL_Y, GY, { w: 9 });
  duct(p, closet.x + closet.w, WW - 14, 20);

  for (const r of [pods, closet, wh]) roomShell(ctx, p, r);

  podsRoom(ctx, p);
  closetRoom(ctx, p);
  warehouse(ctx, p);
  for (const f of FOUNTAINS.filter(q => q.floor === 4)) fountain(ctx, p, f.x, f !== MAIN_FOUNTAIN);
  pamphletRack(p, pamphletAt(4).x, GY - PAMPHLET.h);

  baseStrip(p, 14, SHAFT_X - 9 - 14, GY - 6);
  baseStrip(p, EAST + 9, WW - 14 - EAST - 9, GY - 6);
  walkway(p, 0, SHAFT_X, GY);
  walkway(p, EAST, WW - EAST, GY);
  slabBand(ctx, 0, SHAFT_X, ROOM_H, { seed: 43, vpipes: [96, 420], boxes: [250] });
  slabBand(ctx, EAST, WW, ROOM_H, { seed: 44, vpipes: [640], boxes: [900] });

  // floor-standing things stand on the walkway, in front of the hazard curb (like the people)
  for (const pod of PODS) podBody(p, pod);
  startConsole(p);
  handTruck(p);
  bucket(p, CLOSET.x0 + 6, GY);
  // closet floor: grime trodden into the walkway, and a puddle under the leak spreading to the bucket
  p.dith(F4.closet.x + 7, GY, F4.closet.w - 14, 6, null, C.hairDark, 5);
  p.noise(F4.closet.x + 7, GY, F4.closet.w - 14, 6, C.void, 0.08, 87);
  for (let j = 0; j < 3; j++) p.dith(LEAK.x - 14 + j * 3, GY + j, 36 - j * 6, 1, null, j ? C.steel0 : C.steel1, 9 - j * 2);
  p.dith(LEAK.x + 6, GY + 1, 30, 1, null, C.steel0, 5);
  pluginCrate(ctx, p);
  p.dith(CX - 11, GY - 1, 31, 2, null, C.void, 9); // the dependency tower's floor shadow (tower is live)
  for (const pr of PROPS.filter(q => q.floor === 4 && (q.kind === 'terminal' || q.kind === 'crate'))) bakeProp(ctx, p, pr);
}

// Glass fronts of the pods: drawn over the workers standing inside (render.js draws this after "behind" NPCs).
export function fore(ctx) {
  const p = pen(ctx);
  for (const pod of PODS) podGlass(p, pod);
}

// ------------------------------------------------------------------ surfaces
// Painted steel dado: warm dark with an amber pinstripe and panel seams.
function dado(p, x0, y0, w, h) {
  p.rect(x0, y0, w, h, C.stone0);
  p.dith(x0, y0 + 1, w, h - 2, null, C.hairDark, 3);
  for (let x = Math.ceil(x0 / 48) * 48; x < x0 + w; x += 48) { p.vl(x, y0, h, C.hairDark); p.vl(x + 1, y0, h, C.stone1); }
  p.hl(x0, y0 + 6, w, C.void); p.hl(x0, y0 + 7, w, C.rust1);
  p.dithV(x0, y0 + h - 5, w, 5, C.void, 0, 8);
}

// Pods room: dark ribbed panels (calm; the lit glass carries the contrast).
function ribbed(p, x0, y0, w, h) {
  p.rect(x0, y0, w, h, C.stone0);
  for (let x = x0 + 2; x < x0 + w; x += 6) { p.vl(x, y0, h, C.stone1); p.vl(x + 1, y0, h, C.hairDark); p.dith(x + 2, y0, 1, h, null, C.void, 6); }
  p.hl(x0, y0 + 30, w, C.void); p.hl(x0, y0 + 31, w, C.stone1);
  p.dithV(x0, y0, w, 12, C.void, 10, 0);
}

// Closet: small grimy tiles with dark grout, rust stains running down, a damp band at the bottom.
function tiles(p, x0, y0, w, h) {
  p.rect(x0, y0, w, h, C.stone1);
  for (let y = y0; y < y0 + h; y += 6) { p.hl(x0, y, w, C.stone0); p.dith(x0, y + 1, w, 1, null, C.stone2, 4); }
  for (let row = 0; row * 6 < h; row++) for (let x = x0 + (row % 2) * 4; x < x0 + w; x += 8) p.vl(x, y0 + row * 6, Math.min(6, y0 + h - (y0 + row * 6)), C.stone0);
  p.noise(x0, y0, w, h, C.stone2, 0.03, 61);
  p.mottle(x0, y0, w, h, C.stone0, 9, 6, 62);
  for (const sx of [x0 + 34, x0 + 71, Math.min(x0 + 118, x0 + w - 6)]) { p.dith(sx, y0 + 6, 3, h - 6, null, C.rust0, 5); p.dith(sx + 1, y0 + 6, 1, h - 12, null, C.hairDark, 6); }
  p.dithV(x0, y0 + h - 16, w, 16, C.stone0, 0, 9);
  p.dithV(x0, y0, w, 14, C.void, 10, 0);
}

// Closet grime (the floor's dirtiest corner): soot blotches, rust and water stains, mould spots, a damp tide line,
// cracked and missing tiles. Drawn over the tiles before the props.
function grime(p, x0, y0, w, h) {
  p.mottle(x0, y0, w, h, C.hairDark, 7, 9, 81);
  p.mottle(x0, y0, w, h, C.void, 11, 5, 82);
  p.noise(x0, y0, w, h, C.hairDark, 0.06, 83);
  for (const [sx, len] of [[x0 + 8, 46], [x0 + 52, 30], [x0 + 92, 52], [Math.min(x0 + 128, x0 + w - 7), 38]]) {
    p.dithV(sx, y0 + 2, 5, len, C.rust0, 7, 1); p.dithV(sx + 1, y0 + 2, 2, len - 6, C.rust1, 4, 0);
  }
  // tide line of old damp + mould along it
  p.dithV(x0, y0 + h - 26, w, 26, C.hairDark, 0, 12);
  for (let i = 0; i < w; i++) if (p.rnd(x0 + i, 7, 84) < 0.35) p.px(x0 + i, y0 + h - 26 + Math.floor(p.rnd(i, 8, 84) * 3), C.stone0);
  for (let k = 0; k < 40; k++) {
    const mx = x0 + Math.floor(p.rnd(k, 1, 85) * w), my = y0 + h - 30 + Math.floor(p.rnd(k, 2, 85) * 26);
    p.px(mx, my, C.mint0); if (k % 3 === 0) p.px(mx + 1, my, C.mint0);
  }
  // cracked + missing tiles
  for (const [tx, ty] of [[x0 + 20, y0 + 18], [x0 + 60, y0 + 30], [Math.min(x0 + 112, x0 + w - 9), y0 + 12], [x0 + 84, y0 + 42]]) {
    p.rect(tx, ty, 7, 5, C.void); p.dith(tx, ty, 7, 5, null, C.stone0, 4);
  }
  p.line(x0 + 40, y0 + 8, x0 + 47, y0 + 20, C.void); p.line(x0 + 100, y0 + 24, x0 + 106, y0 + 31, C.void);
}

// Warehouse: corrugated sheet (vertical ribs, low contrast).
function corrugated(p, x0, y0, w, h) {
  p.rect(x0, y0, w, h, C.stone1);
  for (let x = x0; x < x0 + w; x++) {
    const k = (x - x0) % 6;
    if (k === 0) p.vl(x, y0, h, C.stone0);
    else if (k === 1) p.dith(x, y0, 1, h, null, C.stone2, 6);
    else if (k === 5) p.dith(x, y0, 1, h, null, C.stone0, 8);
  }
  p.dithV(x0, y0, w, 14, C.void, 10, 0);
  p.dithV(x0, y0 + h - 12, w, 12, C.stone0, 0, 8);
}

function roomShell(ctx, p, r) {
  column(p, r.x, WALL_Y, GY, { w: 7 });
  column(p, r.x + r.w - 7, WALL_Y, GY, { w: 7 });
  p.rect(r.x + 6, WALL_Y, r.w - 12, 21, C.void);
  blockWall(p, r.x + 7, WALL_Y + 1, r.w - 14, 19, { ramp: [C.hairDark, C.stone0, C.stone1, C.stone2], bw: 24, bh: 10, seed: r.x, grime: false });
  p.hl(r.x + 7, WALL_Y + 1, r.w - 14, C.stone1);
  const name = r.id === 'command' ? CLOSET_PLATE : ROOM_COPY[r.id].name;
  const tw = Math.min(r.w - 28, name.length * 6 + 12);
  signPlate(ctx, r.x + ((r.w - tw) >> 1), 22, name, { style: 'enamel', w: tw, h: 17 });
  p.dithV(r.x + 7, 41, r.w - 14, 8, C.void, 10, 0);
}

// ------------------------------------------------------------------ Subagent Pods
function podsRoom(ctx, p) {
  // conduit from the START console up the wall and along the top of the pods, a drop into each cap
  const sx = F4.start.x + (F4.start.w >> 1);
  const lastCx = PODS[PODS.length - 1].x + (PODS[PODS.length - 1].w >> 1);
  p.rect(sx - 1, CONDUIT_Y, 3, F4.start.y - CONDUIT_Y + 2, C.void); p.vl(sx, CONDUIT_Y + 1, F4.start.y - CONDUIT_Y, C.steel0);
  p.rect(sx - 1, CONDUIT_Y - 1, lastCx - sx + 3, 3, C.void); p.hl(sx, CONDUIT_Y, lastCx - sx + 1, C.steel0);
  for (let x = sx + 12; x < lastCx; x += 24) p.px(x, CONDUIT_Y, C.steel2);
  for (const pod of PODS) { const cx = pod.x + (pod.w >> 1); p.rect(cx - 1, CONDUIT_Y, 3, POD.capY - CONDUIT_Y, C.void); p.vl(cx, CONDUIT_Y + 1, POD.capY - CONDUIT_Y - 1, C.steel0); }
}

// Pod (back part, on the walkway): cap with the screen bezel, dark glass interior, desk + monitor seen side-on.
function podBody(p, pod) {
  const { x, w } = pod, gy = POD.glassY;
  p.dith(x - 2, GY - 1, w + 4, 2, null, C.void, 9);
  // interior
  p.rect(x, gy, w, GY - gy, C.void);
  p.rect(x + 3, gy, w - 6, GY - gy, C.navy);
  p.dith(x + 3, gy, w - 6, GY - gy, null, C.ink, 7);
  p.dithV(x + 3, GY - 18, w - 6, 18, C.navy2, 0, 6);
  p.rect(x + 3, GY - 3, w - 6, 3, C.navy2); p.hl(x + 3, GY - 3, w - 6, C.steel0); // floor plate
  // desk (standing height) toward the west end, the worker stands at the east end facing it
  const dx0 = x + 6, dx1 = x + 36, dy = GY - 18;
  p.rect(dx0, dy, dx1 - dx0, 3, C.void); p.hl(dx0 + 1, dy, dx1 - dx0 - 2, C.stone3); p.hl(dx0 + 1, dy + 1, dx1 - dx0 - 2, C.stone2);
  for (const lx of [dx0 + 2, dx1 - 4]) { p.rect(lx, dy + 3, 2, GY - 3 - dy - 3, C.void); p.vl(lx, dy + 3, GY - 3 - dy - 3, C.steel0); }
  p.hl(dx0 + 2, GY - 9, dx1 - dx0 - 4, C.navy2);
  // monitor in profile (screen faces the worker, away from us) on a stand + keyboard at the near edge
  const mx = x + 20;
  p.rect(mx - 1, dy - 15, 5, 13, C.void); p.rect(mx, dy - 14, 2, 11, C.stone1); p.vl(mx + 2, dy - 14, 11, C.ink);
  p.rect(mx - 1, dy - 3, 3, 3, C.void); p.vl(mx, dy - 3, 3, C.steel0);
  p.rect(x + 28, dy - 1, 7, 1, C.steel1);
  // mug + paper tray at the far end of the desk
  p.rect(dx0 + 2, dy - 4, 3, 4, C.cream); p.px(dx0 + 2, dy - 4, C.stone3);
  p.rect(dx0 + 7, dy - 2, 8, 2, C.stone3); p.hl(dx0 + 7, dy - 2, 8, C.cream2);
  // cap: steel housing, screen bezel (screen face is live), corner rivets
  const cy = POD.capY;
  p.rect(x - 1, cy, w + 2, POD.capH, C.void);
  p.rect(x, cy + 1, w, POD.capH - 2, C.stone1); p.hl(x, cy + 1, w, C.stone3); p.hl(x, cy + POD.capH - 2, w, C.stone0);
  p.dith(x, cy + 2, w, POD.capH - 4, null, C.stone2, 3);
  const sc = podScreen(pod);
  p.rect(sc.x, sc.y, sc.w, sc.h, C.void);
  p.rivet(x + 1, cy + 3, C.stone3, C.ink, C.stone2); p.rivet(x + w - 3, cy + 3, C.stone3, C.ink, C.stone2);
  // light strip housing under the cap (the strip itself is live)
  p.rect(x + 3, gy, w - 6, 2, C.ink);
}

// Glass front (fore layer): frame posts, a top rail, a bottom track and two clean glare streaks kept clear of the
// worker's head.
function podGlass(p, pod) {
  const { x, w } = pod, gy = POD.glassY;
  for (const [px0, a, b] of [[x, C.stone3, C.stone1], [x + w - 3, C.stone2, C.stone0]]) {
    p.rect(px0, gy, 3, GY - gy, C.void); p.vl(px0 + 1, gy, GY - gy, a); p.vl(px0 + (px0 === x ? 2 : 0), gy, GY - gy, b);
    for (let y = gy + 6; y < GY - 4; y += 14) p.px(px0 + 1, y, C.cream);
  }
  p.hl(x + 3, gy + 2, w - 6, C.stone2);
  p.rect(x, GY - 3, w, 3, C.void); p.hl(x + 1, GY - 3, w - 2, C.stone2); p.hl(x + 1, GY - 2, w - 2, C.stone0);
  for (let q = 0; q < 16; q++) {
    for (const [ox, oy, len] of [[5, 6, 16], [5, 28, 10]]) {
      if (q >= len) continue;
      const X = x + ox + (q >> 1), Y = gy + oy + 14 - q;
      if (Y > gy + 2) { p.px(X, Y, C.steel2); if (q % 2) p.px(X + 2, Y, C.steel1); }
    }
  }
  p.dith(x + w - 7, gy + 5, 1, 34, null, C.steel1, 6);
}

// START console: a pedestal, a steel head with a hazard collar, and a big mushroom button on top (lit live).
function startConsole(p) {
  const { x, y, w } = F4.start;
  p.dith(x - 2, GY - 1, w + 4, 2, null, C.void, 9);
  // pedestal + foot
  p.rect(x + 3, y + 12, w - 6, GY - y - 12, C.void);
  p.rect(x + 4, y + 12, w - 8, GY - y - 13, C.stone1); p.vl(x + 4, y + 12, GY - y - 13, C.stone3); p.vl(x + w - 5, y + 12, GY - y - 13, C.stone0);
  p.rect(x + 1, GY - 3, w - 2, 3, C.void); p.hl(x + 2, GY - 3, w - 4, C.stone2);
  // head + hazard collar under the button
  p.rect(x, y + 4, w, 9, C.void);
  p.rect(x + 1, y + 6, w - 2, 6, C.stone2); p.hl(x + 1, y + 6, w - 2, C.cream); p.hl(x + 1, y + 11, w - 2, C.stone0);
  for (let i = 0; i < w - 2; i++) p.px(x + 1 + i, y + 5, ((i >> 1) % 2) ? C.yellow : C.ink);
  p.px(x + 3, y + 8, C.mint0); p.px(x + w - 4, y + 8, C.stone0);
}

// Mushroom button rows (half-widths), top to bottom.
const DOME = [3, 4, 5, 5];

// ------------------------------------------------------------------ Janitor's Closet
function closetRoom(ctx, p) {
  const v = VALVE;
  // water main: along the back walls from the warehouse fountain to the valve, then the valve's riser to the floor
  const fx = MAIN_FOUNTAIN.x + FOUNT.w - 4;
  pipeRun(ctx, fx, MAIN_Y, v.px + 2, { r: 1, color: 'pale', flanges: 40, seed: 3 });
  pipeV(ctx, fx - 1, MAIN_Y + 1, FY - 9, { r: 1, color: 'pale', flanges: 0 });
  pipeV(ctx, v.px, MAIN_Y - 1, GY - 6, { r: 2, color: 'pale', flanges: 22 });
  // gate valve body on the riser (the hand wheel in front is live)
  const by = v.cy - 9;
  p.rect(v.cx - 7, by, 15, 18, C.void);
  p.rect(v.cx - 6, by + 1, 13, 16, C.rust1); p.hl(v.cx - 6, by + 1, 13, C.rust3); p.vl(v.cx - 6, by + 1, 16, C.rust2); p.vl(v.cx + 6, by + 1, 16, C.rust0);
  p.rect(v.cx - 9, by - 2, 19, 3, C.void); p.hl(v.cx - 8, by - 2, 17, C.steel2); p.hl(v.cx - 8, by - 1, 17, C.steel0);
  p.rect(v.cx - 9, by + 17, 19, 3, C.void); p.hl(v.cx - 8, by + 17, 17, C.steel2); p.hl(v.cx - 8, by + 18, 17, C.steel0);
  // pressure gauge on a short stem above the valve (needle is live)
  const g = v.gauge;
  p.rect(g.cx - 1, g.cy + 5, 3, by - 2 - g.cy - 5, C.void); p.vl(g.cx, g.cy + 5, by - 2 - g.cy - 5, C.steel1);
  p.disc(g.cx, g.cy, 6, C.void); p.disc(g.cx, g.cy, 5, C.cream2); p.ring(g.cx, g.cy, 5, C.steel1);
  for (const [dx, dy, c] of [[-3, 2, C.stone2], [-3, -2, C.stone2], [0, -4, C.stone2], [3, -2, C.mint1], [3, 2, C.mint1]]) p.px(g.cx + dx, g.cy + dy, c);
  // status lamp housing beside the gauge (the lamp is live: mint = water on, red = off)
  p.rect(v.cx + 8, g.cy - 3, 7, 7, C.void); p.hl(v.cx + 9, g.cy - 3, 5, C.steel1); p.rect(v.cx + 10, g.cy + 4, 3, 2, C.steel0);
  // lock-out tag hanging from the valve body (no lettering)
  p.vl(v.cx + 5, by + 20, 3, C.ink); p.rect(v.cx + 3, by + 23, 5, 7, C.void); p.rect(v.cx + 4, by + 24, 3, 5, C.yellow); p.px(v.cx + 5, by + 25, C.void);
  // one dim bare bulb on a cord (steady), a weak yellowish cone, cobweb in the corner
  const bx = CX0 + 40;
  p.vl(bx, 41, 13, C.ink); p.rect(bx - 1, 54, 3, 2, C.steel0); p.rect(bx - 1, 56, 3, 3, C.brass); p.px(bx, 57, C.cream);
  for (let j = 0; j < 26; j++) for (let i = -5 - (j >> 1); i <= 5 + (j >> 1); i++) {
    const X = bx + i, Y = 59 + j, k = Math.abs(i) / (6 + (j >> 1));
    if (BAYER4[Y & 3][X & 3] < Math.round((2 - j / 14) * (1 - k * k))) p.px(X, Y, C.stone2);
  }
  for (let i = 0; i < 9; i++) { p.px(CLOSET_X1 - 1 - i, 41 + (i >> 1), C.stone2); p.px(CLOSET_X1 - 1 - (i >> 1), 41 + i, C.stone2); }
  p.line(CLOSET_X1 - 9, 45, CLOSET_X1 - 1, 49, C.stone1);
  // leaking pipe along the closet ceiling: rusty, a bad joint wrapped in tape, a water streak down the wall
  pipeRun(ctx, v.px + 5, LEAK.y, CLOSET_X1, { r: 1, color: 'rust', flanges: 0, seed: 9 });
  p.rect(LEAK.x - 3, LEAK.y - 1, 7, 5, C.void); p.rect(LEAK.x - 2, LEAK.y, 5, 3, C.stone2); p.hl(LEAK.x - 2, LEAK.y, 5, C.stone3);
  p.px(LEAK.x - 1, LEAK.y + 1, C.stone1); p.px(LEAK.x + 1, LEAK.y + 2, C.stone1);
  p.dith(LEAK.x - 1, LEAK.y + 4, 3, 101 - LEAK.y - 4, null, C.stone0, 8);
  p.dith(LEAK.x, LEAK.y + 4, 1, 101 - LEAK.y - 4, null, C.rust0, 6);
  // clutter between the valve and the terminal: stacked paint cans, a sagging box, a rag
  const cx0 = CX0 + 27;
  for (const [x, y, c] of [[cx0, GY - 8, C.stone2], [cx0 + 8, GY - 8, C.rust1], [cx0 + 3, GY - 16, C.steel1]]) {
    p.rect(x, y, 8, 8, C.void); p.rect(x + 1, y + 1, 6, 7, c); p.hl(x + 1, y + 1, 6, C.stone3); p.vl(x + 6, y + 2, 6, C.stone0);
    p.dith(x + 1, y + 1, 3, 7, null, C.hairDark, 4); p.px(x + 2, y + 3, C.cream);
  }
  p.rect(cx0 + 17, GY - 12, 12, 12, C.void); p.rect(cx0 + 18, GY - 11, 10, 11, C.wood1); p.hl(cx0 + 18, GY - 11, 10, C.brass);
  p.line(cx0 + 18, GY - 11, cx0 + 23, GY - 8, C.wood0); p.dith(cx0 + 18, GY - 6, 10, 6, null, C.hairDark, 7);
  p.rect(cx0 + 19, GY - 14, 6, 3, C.stone3); p.px(cx0 + 21, GY - 13, C.stone1);
  // the narrow closet: door frame, dark inside, shelf of bottles, mops + a broom, the door leaf swung open
  const c = CLOSET;
  p.rect(c.x0 - 3, c.top - 3, c.x1 - c.x0 + 6, GY - c.top + 3, C.void);
  p.rect(c.x0 - 2, c.top - 2, c.x1 - c.x0 + 4, GY - c.top + 2, C.stone3); p.hl(c.x0 - 2, c.top - 2, c.x1 - c.x0 + 4, C.cream);
  p.vl(c.x1 + 1, c.top - 1, GY - c.top + 1, C.stone1);
  p.rect(c.x0, c.top, c.x1 - c.x0, GY - c.top, C.void);
  p.dith(c.x0, c.top + 8, c.x1 - c.x0, GY - c.top - 8, null, C.ink, 6);
  p.rect(c.x0 + 2, 70, c.x1 - c.x0 - 4, 2, C.wood0); p.hl(c.x0 + 2, 70, c.x1 - c.x0 - 4, C.wood1);
  [C.mint1, C.amber, C.red, C.steel2].forEach((col, i) => { p.rect(c.x0 + 4 + i * 6, 62, 4, 8, C.ink); p.rect(c.x0 + 5 + i * 6, 63, 2, 7, col); p.px(c.x0 + 5 + i * 6, 62, C.stone2); });
  mop(p, c.x0 + 6, 76, c.x0 + 9);
  mop(p, c.x0 + 15, 74, c.x0 + 13);
  // broom: handle + bristles
  p.line(c.x0 + 26, 72, c.x0 + 23, GY - 9, C.wood1);
  p.rect(c.x0 + 19, GY - 9, 9, 3, C.wood0); for (let i = 0; i < 9; i += 2) p.vl(c.x0 + 19 + i, GY - 6, 5, C.brass);
  // door leaf, open toward us (seen edge-on, a thin slab with a knob)
  p.rect(c.x1 + 2, c.top - 2, 7, GY - c.top + 2, C.void);
  p.rect(c.x1 + 3, c.top - 1, 5, GY - c.top, C.stone2); p.vl(c.x1 + 3, c.top - 1, GY - c.top, C.stone3); p.vl(c.x1 + 7, c.top - 1, GY - c.top, C.stone0);
  p.px(c.x1 + 4, 94, C.brass); p.px(c.x1 + 5, 94, C.wood0);
  p.dith(c.x0 - 2, GY - 6, c.x1 - c.x0 + 12, 6, null, C.void, 6);
}

// Mop leaning in the closet: handle from (x, top) to the head at hx on the floor.
function mop(p, x, top, hx) {
  p.line(x, top, hx, GY - 10, C.wood1); p.line(x + 1, top, hx + 1, GY - 10, C.wood0);
  p.rect(hx - 4, GY - 10, 10, 2, C.steel0);
  for (let i = 0; i < 10; i++) { const len = 6 + ((i * 7) % 4); p.vl(hx - 4 + i, GY - 8, len - 2, i % 2 ? C.stone3 : C.cream); }
}

// Yellow mop bucket on castors with a wringer (stands on the walkway in front of the closet).
function bucket(p, x, gy) {
  p.dith(x - 2, gy - 1, 24, 2, null, C.void, 9);
  p.rect(x, gy - 13, 20, 11, C.void);
  p.rect(x + 1, gy - 12, 18, 9, C.yellow); p.hl(x + 1, gy - 12, 18, C.cream2); p.vl(x + 18, gy - 11, 8, C.amber);
  p.dith(x + 1, gy - 7, 18, 4, null, C.amber, 6);
  p.rect(x + 2, gy - 12, 8, 2, C.stone1); // grey water
  // wringer + mop handle
  p.rect(x + 11, gy - 18, 8, 6, C.void); p.rect(x + 12, gy - 17, 6, 4, C.stone2); p.hl(x + 12, gy - 17, 6, C.stone3);
  p.line(x + 5, gy - 13, x + 8, gy - 38, C.wood1); p.line(x + 6, gy - 13, x + 9, gy - 38, C.wood0);
  for (const cx of [x + 2, x + 17]) { p.rect(cx - 1, gy - 2, 3, 2, C.void); p.px(cx, gy - 2, C.steel1); }
}

// ------------------------------------------------------------------ Plugin Warehouse
function warehouse(ctx, p) {
  // the racking shelf the PLUGIN crate unpacks onto: steel uprights with punched holes, two amber beams, a dark
  // bay over each beam (the items are live), a short divider post between slots, a label plate under each slot
  const S = SHELF, top = S.beams[0] - 8;
  for (const sl of SHELF_SLOTS) {
    p.rect(sl.x, sl.beam - 8, sl.w, 8, C.stone0);
    p.dith(sl.x, sl.beam - 8, sl.w, 8, null, C.hairDark, 6);
    p.dithV(sl.x, sl.beam - 8, sl.w, 3, C.void, 8, 0);
  }
  for (const sl of SHELF_SLOTS.slice(1)) {
    const prev = SHELF_SLOTS[SHELF_SLOTS.indexOf(sl) - 1];
    if (prev.beam !== sl.beam) continue;
    p.rect(sl.x - 2, sl.beam - 8, 2, 8, C.void); p.vl(sl.x - 2, sl.beam - 7, 7, C.steel0);
  }
  for (const by of S.beams) {
    p.rect(S.x0, by, S.x1 - S.x0, 4, C.void);
    p.hl(S.x0, by, S.x1 - S.x0, C.yellow); p.hl(S.x0, by + 1, S.x1 - S.x0, C.amber); p.hl(S.x0, by + 2, S.x1 - S.x0, C.rust1);
  }
  for (const ux of [S.x0, S.x1 - 3]) {
    p.rect(ux, top, 3, GY - top, C.void); p.vl(ux + 1, top, GY - top, C.steel0); p.vl(ux + 2, top, GY - top, C.navy2);
    for (let y = top + 4; y < GY - 2; y += 5) p.px(ux + 1, y, C.navy);
    p.rect(ux - 1, GY - 2, 5, 2, C.void);
  }
  // label plates: cream card, ink micro lettering, one plate per slot under its beam
  for (const sl of SHELF_SLOTS) {
    const h = sl.lines.length * 6 + 3, y = sl.beam + 4;
    p.rect(sl.x, y, sl.w, h, C.void);
    p.rect(sl.x + 1, y + 1, sl.w - 2, h - 2, C.cream2); p.hl(sl.x + 1, y + h - 2, sl.w - 2, C.stone3);
    sl.lines.forEach((l, i) => p.text(l, sl.x + ((sl.w - microWidth(l) + 1) >> 1), y + 2 + i * 6, C.ink, 'f3'));
  }
}

// What each slot holds, 7 px tall at most, drawn live (they slide out of the crate). Rows top to bottom.
const ITEM_KEY = { o: C.void, M: C.mint1, m: C.mint2, W: C.cream, S: C.skin, Y: C.yellow, A: C.amber, H: C.steel2, h: C.steel1, K: C.navy2, g: C.mint2, N: C.navy, a: C.amber };
export const SHELF_ITEMS = [
  ['.ooooo.', 'oMMMMMo', 'oMmMMMo', 'oMMMMMo', 'oWWWWWo', 'ooooooo'], // skills: a little book
  ['.ooo.', 'oSSSo', '.ooo.', 'oYYYo', 'oYAYo', 'oYYYo', '.o.o.'], // subagents: a worker in hi-vis
  ['..oo.', '.oHo.', '.oHo.', '.oho.', 'oHoHo', 'oHHHo', '.ooo.'], // hooks: a steel hook
  ['ooooooo', 'oKKKKgo', 'oKKKgKo', 'oKKgKKo', 'oKgKKKo', 'oKKKKKo', 'ooooooo'], // slash commands: a / key
  ['ooooooo', 'oNNNNNo', 'oNgNaNo', 'ooooooo', 'oNNNNNo', 'oNgNNNo', 'ooooooo'], // MCP servers: a little rack
];
const itemRest = i => { const sl = SHELF_SLOTS[i], r = SHELF_ITEMS[i]; return { x: sl.x + ((sl.w - r[0].length) >> 1), y: sl.beam - r.length }; };
// Where an item waits inside the crate (hidden under its top edge), spread across its width.
const itemStart = i => ({ x: F4.crate.x + 8 + i * 6, y: F4.crate.y + 6 });

// Draw item i at progress k (0 in the crate .. 1 on its slot): it rises out of the crate first, then slides
// across to its slot. Pixels still inside the crate (under its top edge) stay hidden.
function shelfItem(p, top, i, k) {
  const r = SHELF_ITEMS[i], a = itemStart(i), b = itemRest(i), lift = F4.crate.y - 12;
  const RISE = 0.3;
  let x, y;
  if (k < RISE) { const q = k / RISE; x = a.x; y = a.y + (lift - a.y) * q; } else { const q = (k - RISE) / (1 - RISE); x = a.x + (b.x - a.x) * q; y = lift + (b.y - lift) * q; }
  x = Math.round(x); y = Math.round(y);
  const cx0 = F4.crate.x, cx1 = F4.crate.x + F4.crate.w, ctop = F4.crate.y + 1;
  r.forEach((row, j) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    const X = x + c, Y = y + j;
    if (Y >= ctop && X >= cx0 && X < cx1) return;
    p.px(X, top + Y, ITEM_KEY[ch]);
  }));
}

// ------------------------------------------------------------------ hand truck of subagent binders (pods room)
function handTruck(p) {
  const T = TRUCK, fx = T.fx;
  p.dith(fx - 4, GY - 1, T.bx + T.bw - fx + 6, 2, null, C.void, 9);
  // the wheel under the frame (behind the toe plate)
  p.disc(fx + 2, GY - 5, 5, C.void); p.disc(fx + 2, GY - 5, 4, C.ink); p.ring(fx + 2, GY - 5, 3, C.steel0);
  p.px(fx + 2, GY - 5, C.steel2); p.px(fx + 1, GY - 8, C.steel1);
  // frame rail, top to the toe plate, and the handle grip bent back at the top
  p.rect(fx - 1, T.top + 3, 4, T.toe - T.top - 3, C.void);
  p.vl(fx, T.top + 4, T.toe - T.top - 4, C.steel2); p.vl(fx + 1, T.top + 4, T.toe - T.top - 4, C.steel0);
  p.rect(fx - 5, T.top, 8, 4, C.void); p.hl(fx - 4, T.top + 1, 6, C.steel2); p.hl(fx - 4, T.top + 2, 6, C.steel0);
  p.rect(fx - 5, T.top + 1, 2, 2, C.ink); // rubber grip end
  // toe plate along the floor under the binders
  p.rect(fx, T.toe, T.bx + T.bw - fx + 1, 3, C.void); p.hl(fx + 1, T.toe, T.bx + T.bw - fx - 1, C.steel2); p.hl(fx + 1, T.toe + 1, T.bx + T.bw - fx - 1, C.steel0);
  // the tag on a string from the handle: how many subagents there are
  const tx = fx - 15, ty = T.top + 9;
  p.line(fx - 3, T.top + 4, tx + 7, ty, C.stone3);
  p.rect(tx, ty, 13, 11, C.void); p.rect(tx + 1, ty + 1, 11, 9, C.cream2); p.hl(tx + 1, ty + 9, 11, C.stone3);
  p.px(tx + 6, ty + 1, C.stone2); // the punched hole
  p.text(PROP_TEXT.binderTag, tx + 1, ty + 2, C.red);
}

// Binder spines: face colour and lettering colour, bottom to top (light lettering on dark faces: the 3x5 letters
// fill the spine, so dark letters would run into its dark edges).
const BINDERS = [[C.red, C.cream2], [C.navy2, C.cream2], [C.wood0, C.yellow], [C.steel0, C.cream], [C.rust0, C.cream2], [C.navy, C.mint2]];
const BINDER_DX = [0, 1, -1, 1, 0, -1];
// The stack on the hand truck (live: it is gone while you carry it). Each spine reads AGENT.
function truckBinders(p, top) {
  const T = TRUCK;
  for (let i = 0; i < T.n; i++) {
    const x = T.bx + BINDER_DX[i], y = top + T.toe - (i + 1) * T.bh;
    const [face, ink] = BINDERS[i % BINDERS.length];
    p.rect(x, y, T.bw, T.bh, C.void);
    p.rect(x + 1, y + 1, T.bw - 2, T.bh - 2, face);
    p.vl(x + T.bw - 2, y + 1, T.bh - 2, C.ink); // the spine's shaded end
    p.text(PROP_TEXT.binderSpine, x + 2, y + 1, ink, 'f3');
  }
}

// The PLUGIN crate: planks on a pallet skid, frame boards, steel corner brackets, hazard edges, the PLUGIN plate on
// its front. The lid is live (it props open while unpacked).
function pluginCrate(ctx, p) {
  const { x, y, w, h } = F4.crate;
  const top = y + 5, bot = y + h - 5;
  p.dith(x - 3, GY - 1, w + 6, 2, null, C.void, 9);
  // skid
  p.rect(x + 1, bot, w - 2, 5, C.void);
  for (let i = x + 3; i < x + w - 6; i += 12) { p.rect(i, bot + 1, 6, 4, C.wood0); p.hl(i, bot + 1, 6, C.wood1); }
  // body planks
  p.rect(x, top, w, bot - top, C.void);
  p.rect(x + 1, top + 1, w - 2, bot - top - 2, C.wood1);
  for (let yy = top + 6; yy < bot - 2; yy += 6) { p.hl(x + 1, yy, w - 2, C.wood0); p.dith(x + 1, yy + 1, w - 2, 1, null, C.brass, 4); }
  p.noise(x + 1, top + 1, w - 2, bot - top - 2, C.wood0, 0.08, 71);
  p.noise(x + 1, top + 1, w - 2, bot - top - 2, C.brass, 0.04, 72);
  // heavy frame boards + centre board
  for (const [fx, fw] of [[x + 1, 4], [x + w - 5, 4]]) {
    p.rect(fx, top + 1, fw, bot - top - 2, C.wood0); p.vl(fx, top + 1, bot - top - 2, C.brass); p.vl(fx + fw - 1, top + 1, bot - top - 2, C.hairDark);
  }
  p.rect(x + 1, top + 1, w - 2, 3, C.wood0); p.hl(x + 1, top + 1, w - 2, C.brass);
  p.rect(x + 1, bot - 4, w - 2, 3, C.wood0); p.hl(x + 1, bot - 4, w - 2, C.brass);
  // steel corner brackets
  for (const [cx, cy] of [[x, top], [x + w - 5, top], [x, bot - 5], [x + w - 5, bot - 5]]) {
    p.rect(cx, cy, 5, 5, C.void); p.rect(cx + 1, cy + 1, 3, 3, C.steel1); p.px(cx + 1, cy + 1, C.steel3); p.px(cx + 2, cy + 2, C.navy2);
  }
  // the PLUGIN plate, centred on the front between the hazard edges (35-px word + 1 px pad + 1 px border each side)
  const tw = [...PROP_TEXT.crate].length * 6 - 1, pw = tw + 4, px0 = x + ((w - pw) >> 1), py0 = top + 5;
  p.rect(px0, py0, pw, 11, C.void);
  p.rect(px0 + 1, py0 + 1, pw - 2, 9, C.cream2); p.hl(px0 + 1, py0 + 9, pw - 2, C.stone3);
  p.text(PROP_TEXT.crate, px0 + 2, py0 + 2, C.ink);
}

// Lid (live): closed flush on top, or propped open (hinged at the east end, lifted at the west) with the dark,
// straw-packed inside showing.
function crateLid(p, top, open) {
  const { x, y, w } = F4.crate;
  const ly = top + y;
  if (!open) {
    p.rect(x - 1, ly, w + 2, 6, C.void);
    p.rect(x, ly + 1, w, 4, C.wood1); p.hl(x, ly + 1, w, C.stone3); p.hl(x, ly + 2, w, C.brass); p.hl(x, ly + 4, w, C.wood0);
    for (const sx of STRAPS) for (let j = 1; j < 5; j++) for (let i = 0; i < 3; i++) p.px(sx + i, ly + j, ((i + j) % 6) < 3 ? C.yellow : C.ink);
    return;
  }
  p.rect(x, ly + 1, w, 5, C.void);
  p.dith(x + 1, ly + 3, w - 2, 3, null, C.wood0, 5); // packing straw
  for (let i = 0; i < w + 2; i++) {
    const yy = ly - 1 - Math.round((1 - i / (w + 1)) * 7);
    p.rect(x - 1 + i, yy, 1, 4, C.void);
    p.px(x - 1 + i, yy + 1, C.stone3); p.px(x - 1 + i, yy + 2, C.wood1);
  }
}

// ------------------------------------------------------------------ water fountains
// Wall-mounted drinking fountain: back plate, bowl, bubbler, push button, drain trap; the warehouse one is fed from
// the water main above, the pods one from below the floor.
const FY = 107; // fountain bowl rim (waist height)
function fountain(ctx, p, x, fromBelow) {
  const w = FOUNT.w;
  if (fromBelow) pipeV(ctx, x + w - 5, FY + 10, GY - 6, { r: 1, color: 'pale', flanges: 0 });
  p.rect(x + 1, FY - 9, w - 2, 22, C.void); p.rect(x + 2, FY - 8, w - 4, 20, C.stone2); p.hl(x + 2, FY - 8, w - 4, C.stone3);
  p.dith(x + 2, FY - 8, w - 4, 20, null, C.stone1, 4);
  // bowl
  p.rect(x - 1, FY - 1, w + 2, 6, C.void);
  p.rect(x, FY, w, 4, C.steel2); p.hl(x, FY, w, C.steel3); p.hl(x, FY + 3, w, C.steel0);
  p.rect(x + 2, FY + 1, w - 4, 2, C.navy2); // basin (water level is live)
  // bubbler + push button
  p.rect(x + 2, FY - 4, 3, 4, C.void); p.vl(x + 3, FY - 3, 3, C.steel3);
  p.rect(x + w - 3, FY + 1, 3, 3, C.void); p.px(x + w - 2, FY + 2, C.mint1);
  // body below the bowl + drain trap
  p.rect(x + 3, FY + 5, w - 6, 7, C.void); p.rect(x + 4, FY + 5, w - 8, 6, C.steel0); p.vl(x + 4, FY + 5, 6, C.steel1);
  p.rect(x + 5, FY + 12, 3, 5, C.void); p.vl(x + 6, FY + 12, 4, C.steel1);
  p.dith(x - 1, FY + 5, w + 2, 2, null, C.void, 8);
}

// Water arc from the bubbler into the bowl (relative to the fountain's x and the rim).
const ARC = [[3, -5], [3, -6], [4, -8], [5, -9], [6, -10], [7, -10], [8, -9], [9, -8], [10, -6], [10, -5], [11, -3], [11, -2], [11, -1]];

// ------------------------------------------------------------------ live
export function live(ctx, top, t, s) {
  liveFloor(ctx, top, t, s, 4);
  const p = pen(ctx), d = s.demos;
  // pods: dark until START; lit while working (workers type, screens show a filling bar — never the work);
  // then each screen shows its one-line summary
  const phase = podPhase(d.pods), screens = podScreens(d.pods);
  const lit = phase === 'idle' ? 0 : Math.min(6, 1 + Math.floor(d.pods.t / 0.08)); // ramps in, one dither step per frame or so
  PODS.forEach((pod, i) => {
    const { x, w } = pod, gy = top + POD.glassY;
    p.hl(x + 4, gy, w - 8, lit ? C.cream2 : C.stone1); p.hl(x + 4, gy + 1, w - 8, lit ? C.cream : C.ink);
    if (lit) for (let j = 0; j < 40; j++) {
      const hw = Math.min((w >> 1) - 4, 10 + (j >> 1)), cx = x + (w >> 1);
      for (let k = -hw; k <= hw; k++) {
        const X = cx + k, Y = gy + 2 + j;
        if (BAYER4[Y & 3][X & 3] < Math.round(lit * (1 - j / 44) * (1 - (k / (hw + 1)) ** 2))) p.px(X, Y, C.mint0);
      }
    }
    // worker's monitor: screen edge + a glow on the worker's side while the job runs
    const mx = x + 20, my = top + GY - 18 - 14;
    p.vl(mx + 2, my, 11, phase === 'work' ? C.mint2 : C.ink);
    if (phase === 'work') p.dith(mx + 3, my - 1, 6, 13, null, C.mint0, 6);
    // summary screen
    const sc = podScreen(pod), sx = sc.x + 1, sy = top + sc.y + 1, sw = sc.w - 2, sh = sc.h - 2;
    p.rect(sx, sy, sw, sh, C.ink);
    if (phase === 'idle') { p.px(sx + 2, sy + sh - 2, C.mint0); return; }
    p.dith(sx, sy, sw, sh, null, C.mint0, 3);
    if (phase === 'work') {
      const k = Math.min(1, d.pods.t / ANIM.pods);
      p.rect(sx + 3, sy + 3, sw - 6, 3, C.void); p.rect(sx + 3, sy + 3, Math.round((sw - 6) * k), 3, C.mint1);
    } else {
      const txt = screens[i], tw = txt.length * 4 - 1;
      p.text(txt, sx + ((sw - tw) >> 1), sy + 2, C.mint2, 'f3');
    }
  });
  // START button: lit while the pods run, pushed in for a moment
  const st = F4.start, pressed = d.pods.t >= 0 && d.pods.t < 0.2;
  const bcx = st.x + (st.w >> 1), by = top + st.y + (pressed ? 1 : 0), on = phase !== 'idle';
  DOME.forEach((hw, j) => {
    if (pressed && j === DOME.length - 1) return;
    p.hl(bcx - hw - 1, by + j, hw * 2 + 2, C.void);
    p.hl(bcx - hw, by + j, hw * 2, j === 0 ? (on ? C.white : C.mint1) : j < 2 ? (on ? C.mint2 : C.mint1) : (on ? C.mint1 : C.mint0));
  });
  p.px(bcx - 2, by + 1, on ? C.white : C.mint2);
  // the janitor's hand wheel (turns a quarter per press) + the gauge needle (up = water on, down = off)
  wheel(p, VALVE.cx, top + VALVE.cy, VALVE.r, valveAngle(d.valve, reduced));
  const g = VALVE.gauge, ga = d.water ? -Math.PI / 4 : Math.PI * 0.8;
  p.line(g.cx, top + g.cy, g.cx + Math.round(Math.cos(ga) * 3), top + g.cy + Math.round(Math.sin(ga) * 3), C.red);
  p.px(g.cx, top + g.cy, C.void);
  p.rect(VALVE.cx + 10, top + g.cy - 1, 3, 3, d.water ? C.mint2 : C.red); p.px(VALVE.cx + 10, top + g.cy - 1, d.water ? C.white : C.rust3);
  // fountains: every one runs exactly while the building's water is on
  FOUNTAINS.filter(f => f.floor === 4).forEach((f, i) => {
    p.hl(f.x + 2, top + FY + 1, FOUNT.w - 4, d.water ? C.steel1 : C.navy2);
    if (!d.water) return;
    // a 2-px stream: bright core, a softer underside, a sparkle running along it
    ARC.forEach(([ax, ay], k) => {
      p.px(f.x + ax + 1, top + FY + ay + 1, C.steel2);
      p.px(f.x + ax, top + FY + ay, (k + Math.floor(t * 8) + i) % 5 === 0 ? C.white : C.steel3);
    });
    p.px(f.x + 9, top + FY - 1, Math.floor(t * 6) % 2 ? C.white : C.steel2);
    p.px(f.x + 12, top + FY - 1, Math.floor(t * 6) % 2 ? C.steel2 : C.white);
  });
  // the closet leak: a drop swells at the joint, falls, and rings the puddle (slow; still under reduced motion)
  const ph = (t % LEAK.period) / LEAK.period;
  if (ph < 0.55) { p.px(LEAK.x, top + LEAK.y + 4, C.steel2); if (ph > 0.3) p.px(LEAK.x, top + LEAK.y + 5, C.steel3); }
  else if (ph < 0.9) {
    const k = (ph - 0.55) / 0.35, y = Math.round(top + LEAK.y + 5 + k * k * (GY - LEAK.y - 6));
    p.px(LEAK.x, y, C.steel3); p.px(LEAK.x, y - 1, C.steel1);
  } else { p.px(LEAK.x - 2, top + GY, C.steel3); p.px(LEAK.x + 2, top + GY, C.steel3); p.px(LEAK.x, top + GY - 1, C.steel2); }
  // the PLUGIN crate: lid propped open while unpacked, the kit sliding out onto its shelf slots and back
  // (reduced motion: on the shelf at once, back at once)
  const up = unpackPose(d.plugin.t, SHELF_ITEMS.length, reduced);
  crateLid(p, top, up.lid);
  up.items.forEach((k, i) => { if (k > 0) shelfItem(p, top, i, k); });
  // the binders on the hand truck (gone while you carry them)
  if (!d.binders.held) truckBinders(p, top);
  // the dependency tower (reduced motion: slumped at once, back at once)
  drawTower(p, top, towerPose(d.tower.t, reduced));
}

// ------------------------------------------------------------------ dependency tower (gag, live)
// The "dependency" comic: a tall, narrow, precarious column of many small mismatched blocks, the plate perched on
// top, and the whole thing balanced on ONE tiny block near the floor. pullBrick slides the left-pad brick out to
// the left; everything above it slumps toward the gap and tips a few px.
// left-pad in the 3x5 lowercase (concept.MICRO_LOWER; the micro font itself is capitals only)
function microText(p, s, x, y, c) {
  [...s].forEach((ch, i) => MICRO_LOWER[ch].forEach((row, j) => [...row].forEach((b, k) => { if (b === '#') p.px(x + i * 4 + k, y + j, c); })));
}
// Layout: CX = the column's centre line; blocks are [dx from CX, y, w, h, kind], bottom to top. The prop box spans
// the brick slid fully out (CX - 31) to the plate's east edge (CX + 24).
const CX = TWR.x + 31;
const TB = {
  below: [ // everything under the brick (it never moves)
    [-4, 117, 9, 12, 'stone'], // floor block
    [0, 113, 5, 4, 'tiny'], // the whole tower stands on this one tiny block
    [-7, 110, 23, 3, 'plank'],
    [-6, 100, 11, 10, 'crate'], [5, 104, 7, 6, 'pink'], [12, 106, 4, 4, 'amber'], [5, 101, 4, 3, 'stone'],
    [-6, 93, 16, 7, 'steel'], [10, 95, 4, 5, 'drum'],
    [-7, 87, 8, 6, 'amber'], [1, 88, 6, 5, 'mint'], [7, 86, 5, 7, 'crate'],
  ],
  brick: { x: CX - 17, y: 79, w: 33, h: 7 },
  above: [ // what slumps when the brick goes
    [-8, 70, 13, 9, 'drum'], [5, 74, 6, 5, 'stone'], [11, 76, 4, 3, 'mint'],
    [-6, 64, 9, 6, 'crate'], [3, 66, 5, 4, 'pink'], [-9, 66, 3, 4, 'amber'],
  ],
  plate: { x: CX - 23, y: 43, w: 47, h: 21 },
};
export const TOWER_BOX = TB;
export const BRICK_SLIDE = 14;

// A block drawn row by row; lean > 0 pushes its top rows right (a toppling parallelogram).
const BLOCK = { crate: [C.wood1, C.brass, C.wood0], drum: [C.navy2, C.steel1, C.navy], pink: [C.pink, C.white, C.rust1],
  amber: [C.amber, C.yellow, C.rust1], stone: [C.stone2, C.stone3, C.stone1], box: [C.wood1, C.brass, C.wood0],
  steel: [C.steel0, C.steel2, C.navy2], mint: [C.mint1, C.mint2, C.mint0], plank: [C.wood0, C.wood1, C.hairDark],
  tiny: [C.yellow, C.white, C.amber] };
function block(p, x, y, w, h, kind, lean = 0) {
  const [f, hi, lo] = BLOCK[kind];
  for (let j = 0; j < h; j++) {
    const o = h > 1 ? Math.round(lean * (h - 1 - j) / (h - 1)) : 0, X = x + o;
    p.hl(X, y + j, w, C.void);
    if (j === 0 || j === h - 1) continue;
    p.hl(X + 1, y + j, w - 2, j === 1 ? hi : j === h - 2 ? lo : f);
    p.px(X + 1, y + j, hi); p.px(X + w - 2, y + j, lo);
    if (kind === 'drum' && (j === 3 || j === h - 4)) p.hl(X + 1, y + j, w - 2, C.steel0);
    if (kind === 'box' && j > 1 && j < h - 2) { p.hl(X + (w >> 1) - 3, y + j, 6, C.stone3); p.px(X + (w >> 1), y + j, C.cream2); }
    if (kind === 'crate' && j > 1 && j < h - 2) p.px(X + 2 + Math.round((w - 5) * (h - 2 - j) / (h - 3)), y + j, C.wood0);
  }
}

function drawTower(p, top, pose) {
  const s = pose.slump, y = v => top + v;
  // everything under the brick stays put
  for (const [dx, by, w, h, kind] of TB.below) block(p, CX + dx, y(by), w, h, kind);
  // the left-pad brick slides out to the left; the blocks over the gap it leaves drop and tip toward it
  const B = TB.brick, out = Math.round(pose.brick * BRICK_SLIDE), bx = B.x - out, gap = bx + B.w;
  for (const [dx, by, w, h, kind] of TB.above) {
    const x0 = CX + dx, over = x0 + w / 2 > gap - 4;
    block(p, x0 + Math.round(s * (over ? 2 : 1)), y(by + Math.round(s * (over ? 5 : 2))), w, h, kind, Math.round(s * (over ? 3 : 1)));
  }
  p.rect(bx, y(B.y), B.w, B.h, C.void);
  p.rect(bx + 1, y(B.y + 1), B.w - 2, B.h - 2, C.rust1);
  p.hl(bx + 1, y(B.y + 1), B.w - 2, C.rust2); p.hl(bx + 1, y(B.y + B.h - 2), B.w - 2, C.rust0);
  microText(p, GAG_ART.brick, bx + 1, y(B.y + 1), C.cream2);
  // the plate perched on top: sinks and tips toward the gap (right end lower), drawn column by column
  plate(p, TB.plate.x + Math.round(s * 2), y(TB.plate.y), s);
}

// Tower plate, sheared: column i sits dy(i) px lower (s = slump 0..1; left end drops 2, right end 6).
function plate(p, x, y0, s) {
  const { w, h } = TB.plate;
  const ink = new Set();
  TOWER_PLATE_LINES.forEach((l, li) => {
    const lx = (w - (l.length * 4 - 1) + 1) >> 1;
    [...l].forEach((ch, ci) => {
      const g = FONT3[ch] ?? FONT3['?'];
      for (let b = 0; b < 15; b++) if (g[b] === '1') ink.add(`${lx + ci * 4 + (b % 3)},${2 + li * 6 + ((b / 3) | 0)}`);
    });
  });
  for (let i = 0; i < w; i++) {
    const X = x + i, Y = y0 + Math.round(s * (2 + (4 * i) / (w - 1)));
    const edge = i === 0 || i === w - 1;
    p.vl(X, Y, h, C.void);
    if (edge) continue;
    p.vl(X, Y + 1, h - 2, C.brass); p.px(X, Y + 1, C.cream); p.px(X, Y + h - 2, C.wood1);
    for (let j = 2; j < h - 2; j++) if (ink.has(`${i},${j}`)) p.px(X, Y + j, C.ink);
  }
}

// Face-on hand wheel: rim lit top-left, four spokes at angle a, steel hub.
function wheel(p, cx, cy, r, a) {
  // rim: 1-px dark outline outside and inside a 2-px red ring
  for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) {
    const dd = Math.sqrt(i * i + j * j);
    if (dd > r + 0.5 || dd < r - 3.5) continue;
    const ring = dd <= r - 0.5 && dd > r - 2.5;
    p.px(cx + i, cy + j, !ring ? C.void : i + j < -r * 0.6 ? C.rust3 : i + j > r * 0.6 ? C.rust0 : C.red);
  }
  for (let k = 0; k < 4; k++) {
    const aa = a + k * Math.PI / 2, ex = Math.cos(aa), ey = Math.sin(aa);
    for (let q = 3; q < r - 1; q++) { p.px(cx + Math.round(ex * q), cy + Math.round(ey * q), C.red); p.px(cx + Math.round(ex * q + 0.5), cy + Math.round(ey * q + 0.5), C.rust0); }
  }
  p.disc(cx, cy, 3, C.void); p.disc(cx, cy, 2, C.steel1); p.px(cx - 1, cy - 1, C.steel3); p.px(cx + 1, cy + 1, C.navy2);
}

// While you carry the 29 subagent binders (drawn after the player, render.js): the stack hugged in front of you,
// taller than your head, and the context meter above you.
export function drawCarry(ctx, s) {
  const b = s.demos.binders, pl = s.player;
  if (!b.held || pl.floor !== 4) return;
  const p = pen(ctx), x = Math.round(pl.x) + pl.facing * 4 - 7, gy = Math.round(pl.y) - 9;
  // six binders lying flat, 4 px each, edges a little out of line
  for (let i = 0; i < TRUCK.n; i++) {
    const y = gy - (i + 1) * 4, xx = x + BINDER_DX[i];
    const [face] = BINDERS[i % BINDERS.length];
    p.rect(xx, y, 14, 4, C.void); p.hl(xx + 1, y + 1, 12, face); p.hl(xx + 1, y + 2, 12, face);
    p.px(xx + (pl.facing > 0 ? 11 : 2), y + 1, C.cream); // a label edge
  }
  // the hands under the stack and on its near side
  p.px(x + 2, gy, C.skin); p.px(x + 11, gy, C.skin);
  p.px(pl.facing > 0 ? x - 1 : x + 14, gy - 6, C.skin); p.px(pl.facing > 0 ? x - 1 : x + 14, gy - 5, C.skinDark);
  drawMeter(p, contextMeter(b), pl);
}

// Context meter above the player: a small segmented bar that fills to full (amber, the last segments red). No words.
function drawMeter(p, k, pl) {
  if (k == null) return;
  const w = 26, x = Math.round(pl.x) - (w >> 1), y = Math.round(pl.y) - PLAYER.idle.h - 22;
  // dark case with a pale bezel so it reads against any wall, segments filling left to right
  p.rect(x - 1, y - 1, w + 2, 9, C.void);
  p.rect(x, y, w, 7, C.cream2); p.rect(x + 1, y + 1, w - 2, 5, C.ink);
  const inner = w - 4, n = Math.round(inner * k);
  for (let i = 0; i < n; i++) if (i % 3 !== 2) p.vl(x + 2 + i, y + 2, 3, i >= inner - 6 ? C.red : C.amber);
  for (let i = 0; i < n; i++) if (i % 3 !== 2) p.px(x + 2 + i, y + 2, i >= inner - 6 ? C.rust3 : C.yellow);
  // a small tick under the bar points down at the player
  p.rect(Math.round(pl.x) - 1, y + 7, 3, 2, C.void); p.px(Math.round(pl.x), y + 7, C.cream2);
}
