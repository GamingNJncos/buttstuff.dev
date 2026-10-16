// Floor 05 — Server Room (cold blue-black hall, cyan rack LEDs, raised floor, overhead cable trays). 960 px wide;
// shaft at 452..556. West → east: the server hall (three racks, the cooling unit and its duct, three more racks,
// the emergency power-off box, a crash cart, one more rack) | shaft | call box, pamphlet stand, MCP Server Room
// (racks either side of the room terminal), then in the open past the room: the locked MCP gate standing alone (walk
// round it), and at the far end the Ludovico chair in side profile facing a pull-down screen, a ceiling projector
// throwing the slogans onto it.
import { C, pen, BAYER4, column, ceiling, slabBand, fixture, pamphletRack } from './common.js?v=68';
import { signPlate } from '../../art/kit/signs.js?v=68';
import { ROOMS, PROPS, SHAFT_X, SHAFT_W, ROOM_H, WW, PAMPHLET, pamphletAt, RACK, RACK_XS, LUDO } from '../levels.js?v=68';
import { ROOM_COPY } from '../../logic/copy.js?v=68';
import { wrap } from '../../logic/text.js?v=68';
import { textWidth } from '../../engine/font.js?v=68';
import { hash } from '../../engine/hash.js?v=68';
import { npcColors } from '../../art/sprites.js?v=68';
import { bakeProp, liveFloor } from './generic.js?v=68';
import { duct, bulkhead } from './f1.js?v=68';
import { sloganAt, LUDO_STRAPS, mcpDoorLamp, ANIM } from '../concept.js?v=68';
import { reduced } from '../../engine/motion.js?v=68';

const GY = ROOM_H - 6; // 129 walk surface
const WALL_Y = 19;
const EAST = SHAFT_X + SHAFT_W;
const rect = id => { const q = PROPS.find(p => p.id === id); return { x: q.x, y: q.y, w: q.w, h: q.h }; };

export const F5 = {
  room: ROOMS.find(r => r.id === 'mcp'),
  door: rect('demo-mcpdoor'),
  screen: rect('ludo-screen'),
};
const RACK_TOP = GY - RACK.h; // 57
const TRAY_Y = 42; // overhead cable ladder trays (top rail)
const TRAYS = [[18, 436], [616, 738]];
const DUCT_X1 = 176; // supply duct under the ceiling, west bulkhead → here
const CRAC = { x: 134, w: 38, top: 71 }; // computer-room air conditioner (cooling unit), fed by the duct above
const X = LUDO.chairX; // Ludovico chair origin (seat back-left corner)
const FACE = { x: F5.screen.x + 4, y: F5.screen.y + 4, w: F5.screen.w - 8, h: F5.screen.h - 8 }; // projected face (render.js cracks it)
const SLOGAN_WRAP = 13; // f5 letters per line: 13 * 6 - 1 = 77 px (+1 shadow) inside the 82-px face, >= 2 px padding
const PROJ = { x: X - 14, y: 40, w: 16, h: 8 }; // ceiling projector over the chair, lens on its east end
const EPO = { x: 372, y: 62 }; // emergency power-off box on the wall (red, under a hinged cover)
const CART = { x: 366, w: 22 }; // crash cart (monitor + keyboard on a trolley) the hoodie admin types at
const DOOR = { x0: F5.door.x, x1: F5.door.x + F5.door.w, top: F5.door.y }; // the MCP gate
const LAMP = { x: DOOR.x1 - 10, y: DOOR.top + 20 }; // card reader lamp on the gate leaf

// ------------------------------------------------------------------ racks (pure layout, shared by bake + live)
// Each rack: a full-height stack of units, the old dense look: 1U/2U servers with three status lights each, disk
// shelves, a switch with lit ports, at most one small patch panel, blanks. Racks differ only in unit order and in
// which lights are on.
const PLAN = ['1u', 'switch', 'patch', '2u', '1u', '1u', 'disk', 'blank', '1u', '2u', '1u', 'disk', '1u', 'blank', '2u', '1u'];
const UNIT_H = kind => (kind === '2u' || kind === 'disk' ? 7 : 4);
const UW = RACK.w - 8; // unit face width
function rackUnits(seed) {
  const out = [], end = RACK_TOP + RACK.h - 8;
  let y = RACK_TOP + 7, patch = false;
  for (let k = 0; y + 4 <= end; k++) {
    let kind = PLAN[(k + seed * 3) % PLAN.length];
    if (kind === 'patch') { if (patch) kind = 'blank'; patch = true; }
    if (y + UNIT_H(kind) > end) kind = 'blank';
    out.push({ kind, y, h: UNIT_H(kind) });
    y += UNIT_H(kind);
  }
  return out;
}
const UNITS = RACK_XS.map((x, i) => rackUnits(i));
// Every status light in the building's racks: { id, x, y, c, blink, period, phase, duty }. Servers: three lights
// (mostly mint, some amber, the odd red); disk bays: one light each; switch: about half the ports lit. All are baked
// lit; the blinking ones are redrawn live.
const LEDS = RACK_XS.flatMap((x, i) => UNITS[i].flatMap(u => {
  const ux = x + 4, out = [], h = n => hash(x * 131 + u.y * 17 + n * 7);
  if (u.kind === '1u' || u.kind === '2u') {
    for (let q = 0; q < 3; q++) { const v = h(q); out.push({ x: ux + 12 + q * 2, y: u.y + 1, c: v < 0.6 ? C.mint2 : v < 0.85 ? C.amber : C.red, blink: h(q + 9) < 0.18 }); }
  } else if (u.kind === 'disk') {
    for (let bx = ux + 2, n = 0; bx + 3 < ux + UW - 5; bx += 3, n++) out.push({ x: bx + 1, y: u.y + 4, c: h(n) < 0.6 ? C.mint2 : C.amber, blink: h(n + 9) < 0.35 });
    out.push({ x: ux + UW - 4, y: u.y + 3, c: C.mint1, blink: false });
  } else if (u.kind === 'switch') {
    for (let px0 = ux + 2, n = 0; px0 < ux + UW - 2; px0 += 2, n++) if (h(n) < 0.5) out.push({ x: px0, y: u.y + 2, c: C.mint2, blink: h(n + 9) < 0.4 });
  }
  return out.map((L, k) => ({ ...L, id: `rack-${i}`, period: 1.8 + h(k + 20) * 2.6, phase: h(k + 30) * 4, duty: 0.35 + h(k + 40) * 0.4 }));
}));
const OFF = { [C.mint2]: C.mint0, [C.mint1]: C.mint0, [C.amber]: C.rust1, [C.red]: C.rust0 };
// Patch-panel plug colours (short stubs only), the top bundle's five strands (the old bundle), the side leads.
const STUB = [C.mint1, C.amber, C.pink, C.steel2, C.cream];
const BUNDLE = [C.steel0, C.mint0, C.rust1, C.navy2, C.amber];
const SIDE = [C.mint1, C.amber, C.pink];
const gapRight = i => (i + 1 < RACK_XS.length ? RACK_XS[i + 1] - RACK_XS[i] - RACK.w : 99);

// ------------------------------------------------------------------ bake (static)
export function bake(ctx) {
  const p = pen(ctx);
  p.rect(0, 0, WW, 180, C.void);
  for (const [a, b] of [[0, SHAFT_X], [EAST, WW]]) hallWall(p, a, b);

  ceiling(ctx, 0, SHAFT_X, { lights: [], seed: 51, pipe: 'pale', trim: C.steel1 });
  ceiling(ctx, EAST, WW, { lights: [], seed: 52, pipe: 'pale', trim: C.steel1 });
  for (const lx of [64, 236, 404, 596, 694]) fixture(p, lx, 15, { lit: C.navy2, cone: 34 });

  bulkhead(p, 0, 14);
  bulkhead(p, WW - 14, 14);
  column(p, SHAFT_X - 9, WALL_Y, GY, { w: 9 });
  column(p, EAST, WALL_Y, GY, { w: 9 });
  roomShell(ctx, p, F5.room);

  // supply duct over the west racks, dropping into the cooling unit
  duct(p, 14, DUCT_X1, 20);
  coolingUnit(p);
  trays(p);
  pullScreen(p);
  projector(p);
  epoBox(p);

  // raised floor + slab (the racks, chair, door and cart stand on the floor tiles)
  raisedFloor(p, 14, SHAFT_X - 9);
  raisedFloor(p, EAST + 9, WW - 14);
  slabBand(ctx, 0, SHAFT_X, ROOM_H, { seed: 53, vpipes: [96, 420], boxes: [250] });
  slabBand(ctx, EAST, WW, ROOM_H, { seed: 54, vpipes: [640], boxes: [900] });
  doorFootprint(p);

  RACK_XS.forEach((x, i) => serverRack(p, x, i));
  // every rack hangs its side leads in the gap to its right; a row's gaps also hold a thin manager against the next rack
  RACK_XS.forEach((x, i) => {
    if (gapRight(i) === 8) cableManager(p, RACK_XS[i + 1] - 3);
    sideLeads(p, x, i);
  });
  chairBody(p);
  crashCart(p);
  securityGate(p);
  pamphletRack(p, pamphletAt(5).x, GY - PAMPHLET.h);
  for (const pr of PROPS.filter(q => q.floor === 5 && q.kind === 'terminal')) bakeProp(ctx, p, pr);
}

// ------------------------------------------------------------------ surfaces
// Blue-black acoustic panels (a faint perforation grid), a steel chair rail, louvred kick panels below.
function hallWall(p, x0, x1) {
  const w = x1 - x0;
  p.rect(x0, WALL_Y, w, 101 - WALL_Y, C.ink);
  for (let y = WALL_Y + 2; y < 99; y += 3) for (let x = x0 + ((y >> 1) % 3); x < x1; x += 3) if (x % 40 > 2 && x % 40 < 38) p.px(x, y, C.navy);
  for (let x = Math.ceil(x0 / 40) * 40; x < x1; x += 40) { p.vl(x, WALL_Y, 82, C.void); p.vl(x + 1, WALL_Y, 82, C.navy2); }
  p.hl(x0, 60, w, C.void); p.hl(x0, 61, w, C.navy2);
  p.dithV(x0, WALL_Y, w, 22, C.void, 13, 0);
  p.rect(x0, 101, w, 3, C.void); p.hl(x0, 101, w, C.steel0); p.hl(x0, 102, w, C.navy2);
  p.rect(x0, 104, w, 19, C.navy);
  for (let y = 106; y < 122; y += 3) p.hl(x0, y, w, C.ink);
  for (let x = Math.ceil(x0 / 40) * 40; x < x1; x += 40) { p.vl(x, 104, 19, C.void); p.vl(x + 1, 104, 19, C.navy2); }
  p.dithV(x0, 104, w, 19, C.void, 2, 10);
}

// Raised floor: the tile surface (perforated cold-aisle tiles in front of the racks), the steel lip, and the dark
// void under the tiles with pedestals and a cable run.
function raisedFloor(p, x0, x1) {
  const w = x1 - x0, y = GY - 6;
  p.rect(x0, y, w, 6, C.navy2);
  p.hl(x0, y, w, C.navy); p.dith(x0, y + 1, w, 4, null, C.steel0, 3);
  for (let x = Math.ceil(x0 / 16) * 16; x < x1; x += 16) {
    const perf = RACK_XS.some(rx => x + 16 > rx - 2 && x < rx + RACK.w + 2);
    if (perf) for (let j = 1; j < 5; j++) for (let i = 1 + (j % 2); i < 15; i += 2) if (x + i < x1) p.px(x + i, y + j, C.steel1);
    p.vl(x, y, 6, C.ink);
  }
  p.hl(x0, GY - 1, w, C.steel1);
  // front lip + underfloor
  p.hl(x0, GY, w, C.steel2); p.hl(x0, GY + 1, w, C.steel0);
  p.rect(x0, GY + 2, w, 4, C.void);
  for (let x = Math.ceil(x0 / 16) * 16 + 8; x < x1; x += 16) { p.vl(x, GY + 2, 4, C.steel0); p.px(x - 1, GY + 5, C.navy2); p.px(x + 1, GY + 5, C.navy2); }
  for (let x = x0; x < x1; x++) if ((x >> 2) % 5 !== 0) p.px(x, GY + 4, (x >> 4) % 3 === 0 ? C.mint0 : C.navy);
  p.hl(x0, GY + 5, w, C.ink);
}

function roomShell(ctx, p, r) {
  column(p, r.x, WALL_Y, GY, { w: 7 });
  column(p, r.x + r.w - 7, WALL_Y, GY, { w: 7 });
  p.rect(r.x + 6, WALL_Y, r.w - 12, 21, C.void);
  p.rect(r.x + 7, WALL_Y + 1, r.w - 14, 19, C.navy);
  for (let x = r.x + 7; x < r.x + r.w - 7; x += 24) { p.vl(x, WALL_Y + 1, 19, C.ink); p.vl(x + 1, WALL_Y + 1, 19, C.navy2); }
  p.hl(r.x + 7, WALL_Y + 1, r.w - 14, C.steel0);
  const name = ROOM_COPY[r.id].name;
  const tw = Math.min(r.w - 28, name.length * 6 + 12);
  signPlate(ctx, r.x + ((r.w - tw) >> 1), 22, name, { style: 'enamel', w: tw, h: 17 });
  p.dithV(r.x + 7, 41, r.w - 14, 8, C.void, 10, 0);
}

// ------------------------------------------------------------------ server racks
// The old rack, unlabelled: frame, posts with rail holes, a vented top cap, the stack of units, a plinth with
// casters, the glass door's diagonal glare streak, then every status light on top.
function serverRack(p, x, seed) {
  const top = RACK_TOP, w = RACK.w, bh = RACK.h;
  p.dith(x - 3, GY - 2, w + 7, 3, null, C.void, 11);
  p.rect(x, top, w, bh, C.void);
  p.rect(x + 1, top + 1, w - 2, bh - 2, C.ink);
  for (const px0 of [x + 1, x + w - 4]) {
    p.rect(px0, top + 1, 3, bh - 2, C.navy2); p.vl(px0, top + 1, bh - 2, C.steel0);
    for (let yy = top + 7; yy < top + bh - 7; yy += 2) p.px(px0 + 1, yy, C.void);
  }
  p.rect(x + 1, top + 1, w - 2, 5, C.navy2); p.hl(x + 1, top + 1, w - 2, C.steel1);
  for (let i = x + 4; i < x + w - 4; i += 2) p.px(i, top + 3, C.void);
  for (const u of UNITS[seed]) unit(p, x + 4, u, seed);
  const py = top + bh - 7;
  p.rect(x + 1, py, w - 2, 6, C.navy2); p.hl(x + 1, py, w - 2, C.steel0);
  for (let i = x + 4; i < x + w - 4; i += 2) { p.px(i, py + 2, C.void); p.px(i, py + 3, C.void); }
  p.rect(x + 2, GY - 2, 3, 2, C.steel0); p.rect(x + w - 5, GY - 2, 3, 2, C.steel0);
  for (let q = 0; q < bh - 14; q++) {
    const X = x + 6 + Math.floor(q * 0.35), Y = top + 7 + q;
    if (X < x + w - 6 && BAYER4[Y & 3][X & 3] < 4) p.px(X, Y, C.steel1);
  }
  for (const L of LEDS) if (L.id === `rack-${seed}`) p.px(L.x, L.y, L.c);
}

// One unit (the old kinds): blank, disk shelf, switch or patch panel (sockets; the patch panel has short plug stubs
// that stay inside it), or a 1U/2U server (pull handle, vent, label strip; its lights come from LEDS).
function unit(p, x, u, seed) {
  const { kind, y, h } = u, w = UW;
  const face = kind === 'blank' ? C.navy : (hash(seed * 97 + y * 5) < 0.34 ? C.steel0 : C.navy2);
  p.rect(x, y, w, h, face);
  p.hl(x, y, w, kind === 'blank' ? C.navy2 : C.steel1);
  p.hl(x, y + h - 1, w, C.void);
  p.px(x, y + 1, C.steel2); p.px(x + w - 1, y + 1, C.steel2); // rack ears
  if (kind === 'blank') { for (let i = x + 3; i < x + w - 3; i += 2) p.px(i, y + 2, C.ink); return; }
  if (kind === 'disk') {
    for (let i = x + 2; i + 3 < x + w - 5; i += 3) { p.rect(i, y + 1, 2, 5, C.ink); p.px(i, y + 1, C.steel1); }
    p.rect(x + w - 5, y + 2, 3, 3, C.ink);
  } else if (kind === 'patch' || kind === 'switch') {
    for (let i = x + 2, k = 0; i < x + w - 2; i += 2, k++) {
      p.px(i, y + 1, C.void); p.px(i, y + 2, C.ink);
      if (kind === 'patch' && hash(seed * 41 + k * 3) < 0.6) { const c = STUB[(k + seed) % STUB.length]; p.px(i, y + 1, c); p.px(i, y + 2, c); }
    }
  } else {
    p.rect(x + 2, y + 1, 2, h - 2, C.steel1); p.px(x + 2, y + 1, C.steel3);
    for (let i = x + 6; i < x + Math.floor(w * 0.55); i += 2) p.vl(i, y + 1, h - 2, C.ink);
    const lx = x + Math.floor(w * 0.6);
    p.hl(lx, y + h - 2, w - (lx - x) - 3, C.stone2);
    if (kind === '2u') { p.rect(x + w - 6, y + 2, 3, 3, C.ink); p.px(x + w - 5, y + 3, C.steel2); }
  }
}

// The old right-side patch leads (mint, amber, pink at three lengths), now hanging with a 1 px sag on the way out
// of the side and a rounded bottom curling back toward the rack. They never touch the rack face.
function sideLeads(p, x, seed) {
  const xa = x + RACK.w, y0 = RACK_TOP + 16 + (seed % 3) * 2;
  for (let q = 2; q >= 0; q--) {
    const c = SIDE[q], sy = y0 + q * 2, ex = xa + 1 + q, by = sy + 9 + q * 5 + (seed % 2);
    // plugged in at the right post (never on the face), out of the side, sagging a pixel on the way
    const xs = xa - 3;
    p.px(xs, sy, C.void); p.px(xs, sy - 1, C.steel2);
    for (let i = xs + 1; i < ex; i++) p.px(i, sy + (i - xs > (ex - xs) / 2 ? 1 : 0), c);
    p.vl(ex, sy + 1, by - sy - 1, c);
    p.px(ex - 1, by, c); if (ex - 2 >= xa) p.px(ex - 2, by, c); // rounded bottom
    p.px(ex, by, C.void); p.px(ex - 1, by + 1, C.void); // contact shadow under the curl
  }
}

// Vertical cable manager against the next rack's post: a thin dark channel, steel fingers, a tie every 9 px.
function cableManager(p, x) {
  p.rect(x, RACK_TOP + 4, 3, RACK.h - 6, C.void);
  for (let y = RACK_TOP + 5; y < GY - 3; y++) {
    p.px(x + 1, y, (y >> 1) % 3 ? C.navy2 : C.ink);
    if (y % 4 === 0) p.px(x, y, C.steel0);
    if (y % 9 === 4) p.px(x + 1, y, C.steel1);
  }
}

// A loose cable sagging between two points (a catenary-ish parabola, kept 1 px thick and gap-free).
function droop(p, x0, x1, y, sag, c) {
  let prev = y;
  for (let x = x0; x <= x1; x++) {
    const t = (x - x0) / (x1 - x0), yy = y + Math.round(sag * 4 * t * (1 - t));
    p.vl(x, Math.min(prev, yy) + (yy > prev ? 1 : 0), Math.max(1, Math.abs(yy - prev)), c);
    p.px(x, yy, c);
    prev = yy;
  }
}

// Overhead cable ladder trays on hanger rods, cable bundles laid in them and dropping into each rack's top.
function trays(p) {
  const room = F5.room;
  for (const [a, b] of TRAYS) {
    for (let hx = a + 6; hx < b; hx += 96) {
      // hanger rods drop from the ceiling, from under the duct, or (in the room) from under the header
      const y0 = hx >= room.x && hx < room.x + room.w ? WALL_Y + 21 : hx < DUCT_X1 ? 30 : WALL_Y;
      p.vl(hx, y0, TRAY_Y - y0, C.void); p.vl(hx + 1, y0, TRAY_Y - y0, C.steel0);
    }
    // cables laid in the tray, bulging over the side rail: a dark bed, colour-coded runs, lumps and velcro ties
    for (let x = a; x < b; x++) {
      p.px(x, TRAY_Y - 1, [C.navy2, C.mint0, C.navy2, C.rust1, C.steel0, C.navy2][(x >> 3) % 6]);
      p.px(x, TRAY_Y - 2, (x >> 2) % 3 === 0 ? C.steel0 : C.navy2);
      if (x % 31 > 4 && x % 31 < 12) p.px(x, TRAY_Y - 3, x % 31 === 7 ? C.steel1 : C.navy2);
      if (x % 24 === 0) { p.px(x, TRAY_Y - 1, C.steel1); p.px(x, TRAY_Y - 2, C.steel1); }
    }
    p.rect(a, TRAY_Y, b - a, 4, C.void);
    p.hl(a, TRAY_Y, b - a, C.steel1); p.hl(a, TRAY_Y + 3, b - a, C.steel0);
    for (let x = a + 1; x < b; x += 4) p.vl(x, TRAY_Y + 1, 2, C.navy2);
    p.dith(a, TRAY_Y + 4, b - a, 2, null, C.void, 6);
  }
  // spare runs that slipped off the trays and hang in a slack loop between hangers
  droop(p, 340, 396, TRAY_Y + 4, 7, C.mint0);
  droop(p, 654, 696, TRAY_Y + 4, 6, C.rust1);
  // the old top bundle: five strands (three, a gap, two) from the tray down into each rack's top, one cable tie
  RACK_XS.forEach(rx => {
    if (!TRAYS.some(([a, b]) => rx >= a && rx + RACK.w <= b + 4)) return;
    const y0 = TRAY_Y + 4, len = RACK_TOP - y0;
    BUNDLE.forEach((c, k) => { const cx = rx + 6 + k * 2 + (k > 2 ? 4 : 0); p.vl(cx, y0, len, c); p.vl(cx + 1, y0, len, C.void); });
    p.rect(rx + 5, y0 + 4, 16, 2, C.void); p.hl(rx + 6, y0 + 4, 14, C.steel1);
  });
}

// Cooling unit (computer-room air conditioner): tall steel cabinet with intake louvres, a small status strip and
// a return grille, fed by the supply duct above.
function coolingUnit(p) {
  const { x, w, top } = CRAC;
  // duct drop from the ceiling duct
  p.rect(x + 12, 29, 14, top - 29, C.void); p.rect(x + 13, 29, 12, top - 29, C.steel0); p.vl(x + 13, 29, top - 29, C.steel2); p.vl(x + 24, 29, top - 29, C.navy2);
  for (let y = 36; y < top; y += 12) { p.hl(x + 12, y, 14, C.void); p.hl(x + 12, y + 1, 14, C.steel1); }
  p.dith(x - 2, GY - 1, w + 4, 2, null, C.void, 10);
  p.rect(x, top, w, GY - top, C.void);
  p.rect(x + 1, top + 1, w - 2, GY - top - 2, C.steel0);
  p.vl(x + 1, top + 1, GY - top - 2, C.steel2); p.hl(x + 1, top + 1, w - 2, C.steel1); p.vl(x + w - 2, top + 2, GY - top - 3, C.navy2);
  p.dith(x + 2, top + 2, w - 4, GY - top - 4, null, C.navy2, 3);
  // intake louvres
  p.rect(x + 4, top + 5, w - 8, 18, C.ink);
  for (let y = top + 6; y < top + 23; y += 2) { p.hl(x + 4, y, w - 8, C.steel1); p.hl(x + 4, y + 1, w - 8, C.navy); }
  // status strip (cold blue segments) + two small buttons
  p.rect(x + 5, top + 27, 16, 5, C.void); p.rect(x + 6, top + 28, 14, 3, C.navy);
  p.px(x + 24, top + 29, C.steel1); p.px(x + 28, top + 29, C.steel1);
  // return grille at the bottom
  p.rect(x + 4, GY - 20, w - 8, 14, C.ink);
  for (let j = 0; j < 12; j += 2) for (let i = 0; i < w - 8; i += 2) p.px(x + 4 + i + (j % 4 ? 1 : 0), GY - 19 + j, C.navy2);
  p.rivet(x + 3, top + 3, C.steel3, C.ink, C.steel1); p.rivet(x + w - 5, top + 3, C.steel3, C.ink, C.steel1);
}

// Pull-down projection screen hung from the ceiling on two wires: a roller case, a black masking border round the
// projected face (lit cream, brightest in the middle and falling off to the corners in dither; the slogan is live),
// a weighted bottom bar and a pull cord.
function pullScreen(p) {
  const { x, y, w, h } = F5.screen;
  for (const wx of [x + 8, x + w - 9]) p.vl(wx, WALL_Y, y - 6 - WALL_Y, C.steel0);
  p.rect(x - 3, y - 6, w + 6, 6, C.void); p.rect(x - 2, y - 5, w + 4, 4, C.steel1);
  p.hl(x - 2, y - 5, w + 4, C.steel3); p.hl(x - 2, y - 2, w + 4, C.steel0);
  p.rect(x - 3, y - 4, 2, 2, C.steel2); p.rect(x + w + 1, y - 4, 2, 2, C.steel2);
  p.rect(x, y, w, h, C.ink);
  p.rect(FACE.x, FACE.y, FACE.w, FACE.h, C.cream);
  for (let j = 0; j < FACE.h; j++) for (let i = 0; i < FACE.w; i++) {
    const dx = (i - FACE.w / 2) / (FACE.w / 2), dy = (j - FACE.h / 2) / (FACE.h / 2), r = 0.8 * (dx * dx + dy * dy);
    const XX = FACE.x + i, YY = FACE.y + j, b = BAYER4[YY & 3][XX & 3];
    if (r < 0.3 && b < 6) p.px(XX, YY, C.cream2);
    else if (r > 0.75 && b < Math.min(12, (r - 0.75) * 24)) p.px(XX, YY, C.stone2);
  }
  p.rect(x - 1, y + h, w + 2, 3, C.void); p.hl(x, y + h, w, C.steel2); p.hl(x, y + h + 1, w, C.steel0);
  const cx = x + (w >> 1);
  p.vl(cx, y + h + 3, 3, C.steel0); p.px(cx - 1, y + h + 6, C.steel1); p.px(cx + 1, y + h + 6, C.steel1); p.px(cx, y + h + 7, C.steel1);
}

// Ceiling projector over the chair: a drop rod, a cream case with vents, a power light and the lens on its screen
// end, and its beam: a cone of sparse dither from the lens out to the screen face (baked before the chair and the
// man, who sit in front of it).
function projector(p) {
  const { x, y, w, h } = PROJ, lx = x + w, ly = y + 4;
  const top = FACE.y, bot = FACE.y + FACE.h - 1, sx = FACE.x;
  for (let XX = lx + 1; XX < sx; XX++) {
    const t = (XX - lx) / (sx - lx), y0 = Math.round(ly + (top - ly) * t), y1 = Math.round(ly + (bot - ly) * t);
    for (let YY = y0; YY <= y1; YY++) {
      const edge = YY === y0 || YY === y1;
      if (BAYER4[YY & 3][XX & 3] < (edge ? 7 : Math.round(4 - t * 2))) p.px(XX, YY, edge ? C.steel0 : C.navy2);
    }
  }
  p.rect(x + 6, WALL_Y, 3, y - WALL_Y, C.void); p.vl(x + 7, WALL_Y, y - WALL_Y, C.steel0);
  p.rect(x + 3, y - 2, 9, 2, C.void); p.hl(x + 4, y - 2, 7, C.steel1);
  p.rect(x, y, w, h, C.void); p.rect(x + 1, y + 1, w - 2, h - 2, C.stone2);
  p.hl(x + 1, y + 1, w - 2, C.cream); p.hl(x + 1, y + h - 2, w - 2, C.stone1);
  for (let i = x + 3; i < x + 9; i += 2) p.vl(i, y + 2, h - 4, C.stone1);
  p.px(x + 10, y + 3, C.mint2);
  p.rect(lx - 4, y + 1, 4, h - 2, C.void); p.vl(lx - 3, y + 2, h - 4, C.steel2); p.vl(lx - 2, y + 3, 2, C.white); p.px(lx, ly, C.cream2);
}

// Emergency power-off: a yellow backplate with a red mushroom button under a hinged guard (its conduit runs up).
function epoBox(p) {
  const { x, y } = EPO;
  p.rect(x + 4, WALL_Y, 3, y - WALL_Y, C.void); p.vl(x + 5, WALL_Y, y - WALL_Y, C.steel0);
  p.rect(x, y, 11, 14, C.void); p.rect(x + 1, y + 1, 9, 12, C.yellow); p.hl(x + 1, y + 1, 9, C.cream2); p.vl(x + 9, y + 2, 11, C.amber);
  for (let i = 0; i < 9; i++) p.px(x + 1 + i, y + 12, (i >> 1) % 2 ? C.ink : C.yellow);
  p.disc(x + 5, y + 6, 3, C.void); p.disc(x + 5, y + 6, 2, C.red); p.px(x + 4, y + 5, C.rust3); p.px(x + 6, y + 7, C.rust0);
  p.hl(x, y - 1, 11, C.steel2); p.px(x, y, C.steel2); p.px(x + 10, y, C.steel2); // guard rim
}

// Crash cart: trolley with two shelves, a keyboard tray and a small monitor (screen glow is live).
function crashCart(p) {
  const { x, w } = CART;
  p.dith(x - 2, GY - 1, w + 4, 2, null, C.void, 10);
  for (const lx of [x + 1, x + w - 3]) { p.rect(lx, GY - 30, 2, 28, C.void); p.vl(lx, GY - 30, 28, C.steel1); }
  for (const sy of [GY - 30, GY - 20, GY - 8]) { p.rect(x, sy, w, 3, C.void); p.hl(x + 1, sy, w - 2, C.steel2); p.hl(x + 1, sy + 1, w - 2, C.steel0); }
  p.rect(x + 3, GY - 23, 16, 3, C.void); p.hl(x + 4, GY - 23, 14, C.stone2); // keyboard on its tray
  // monitor on the top shelf
  p.rect(x + 3, GY - 46, 16, 14, C.void); p.rect(x + 4, GY - 45, 14, 12, C.stone2); p.rect(x + 5, GY - 44, 12, 9, C.ink);
  p.rect(x + 9, GY - 32, 4, 2, C.steel0);
  // casters + a coiled cable on the bottom shelf
  for (const cx of [x + 1, x + w - 3]) { p.rect(cx, GY - 2, 3, 2, C.void); p.px(cx + 1, GY - 2, C.steel1); }
  p.ring(x + 11, GY - 12, 3, C.navy2);
}

// Chair (static), in side profile facing the screen (east): base and pedestal, a tufted oxblood seat, the back
// reclined up to the headrest at the west end, a padded arm rest, the leg rest running on toward the screen; behind
// it the clamp rig: a floor post with an arm over the face and the eye-drop bag hung on it (tube to the eye).
function chairBody(p) {
  p.dith(X - 20, GY - 1, 52, 2, null, C.void, 10);
  p.rect(X - 1, GY - 3, 22, 3, C.void); p.hl(X, GY - 3, 20, C.steel1); p.hl(X, GY - 2, 20, C.steel0);
  p.rect(X + 7, GY - 14, 5, 11, C.void); p.vl(X + 8, GY - 14, 11, C.steel2); p.vl(X + 9, GY - 14, 11, C.steel0); p.vl(X + 10, GY - 14, 11, C.navy2);
  p.line(X + 11, GY - 6, X + 24, GY - 13, C.void); p.line(X + 11, GY - 7, X + 24, GY - 14, C.steel0); // leg rest strut
  // reclined backrest: a 5-px cushion on a steel frame, lit on the screen side, tufted
  for (let j = 0; j < 24; j++) {
    const y = GY - 19 - j, bx = X - 3 - (j >> 1);
    p.px(bx - 1, y, C.void); p.rect(bx, y, 5, 1, C.rust1); p.px(bx, y, C.rust0); p.px(bx + 4, y, C.rust2); p.px(bx + 5, y, C.void);
    if (j % 6 === 3) p.px(bx + 2, y, C.rust0);
    if (j % 2 === 0) p.px(bx - 2, y, C.steel0);
  }
  // headrest
  p.rect(X - 19, GY - 49, 8, 8, C.void); p.rect(X - 18, GY - 48, 6, 6, C.rust1); p.hl(X - 18, GY - 48, 6, C.rust2); p.vl(X - 13, GY - 47, 5, C.rust2); p.px(X - 16, GY - 45, C.rust0);
  // seat
  p.rect(X - 3, GY - 19, 23, 5, C.void); p.rect(X - 2, GY - 18, 21, 3, C.rust1); p.hl(X - 2, GY - 18, 21, C.rust2); p.hl(X - 2, GY - 16, 21, C.rust0);
  for (let i = X + 2; i < X + 18; i += 5) p.px(i, GY - 17, C.rust0);
  p.hl(X - 1, GY - 14, 19, C.steel0);
  // arm rest + post
  p.rect(X + 1, GY - 28, 15, 4, C.void); p.rect(X + 2, GY - 27, 13, 2, C.rust1); p.hl(X + 2, GY - 27, 13, C.rust2);
  p.rect(X + 11, GY - 24, 3, 5, C.void); p.vl(X + 12, GY - 24, 5, C.steel1);
  // leg rest (runs on toward the screen, dipping a little)
  for (let i = 0; i < 9; i++) {
    const x = X + 20 + i, y = GY - 18 + Math.round(i * 0.35);
    p.rect(x, y - 1, 1, 5, C.void); p.rect(x, y, 1, 3, C.rust1); p.px(x, y, C.rust2); p.px(x, y + 2, C.rust0);
  }
  // clamp rig: a post bolted to the back of the headrest, an arm out over the face (the dropper is live), and the
  // eye-drop bag hung on a hook at the top of the post, its tube running down to the eye
  p.rect(X - 21, GY - 76, 3, 30, C.void); p.vl(X - 20, GY - 76, 30, C.steel1);
  p.rect(X - 21, GY - 65, 13, 3, C.void); p.hl(X - 20, GY - 64, 11, C.steel2);
  p.hl(X - 20, GY - 76, 3, C.steel1); p.px(X - 18, GY - 75, C.steel1); // hook
  p.rect(X - 19, GY - 74, 6, 9, C.void); p.rect(X - 18, GY - 73, 4, 7, C.cream); p.hl(X - 18, GY - 73, 4, C.white); p.dith(X - 18, GY - 70, 4, 4, null, C.steel2, 6);
  p.line(X - 16, GY - 65, X - 13, GY - 58, C.steel2); p.line(X - 13, GY - 58, X - 11, GY - 54, C.steel2);
}

// The strapped man's head (10 x 9, profile facing the screen): hair, the eye held wide open (white, pupil to the
// screen), a clamp hook above and below it, the nose and chin on the screen side.
const HEAD = [
  '...oooo...',
  '..oyyyyoo.',
  '.oyyyyyyyo',
  '.oyyysTTso',
  '.oyysswwko',
  '.oyyssTTso',
  '.oysssssSo',
  '..osssSmo.',
  '...osso...',
];

// Door footprint marked on the floor tiles: yellow dashes round the base plate (it stands on its own).
function doorFootprint(p) {
  for (let x = DOOR.x0 - 8; x < DOOR.x1 + 8; x++) if (((x - DOOR.x0) >> 2) % 2 === 0) p.px(x, GY - 5, C.yellow);
  for (const x of [DOOR.x0 - 8, DOOR.x1 + 7]) { p.px(x, GY - 4, C.yellow); p.px(x, GY - 3, C.yellow); p.px(x, GY - 2, C.yellow); }
}

// The locked MCP gate: a free-standing barrier gate on its own base plate in the open floor, nothing either side of
// it: braced feet, two hazard-striped posts with caps, a header beam, a barred leaf you see the wall through, and a
// card reader (its lamp and the lever are live). The floor round it is clear: you walk round it.
function securityGate(p) {
  const { x0, x1, top } = DOOR, w = x1 - x0;
  p.dith(x0 - 8, GY - 1, w + 16, 2, null, C.void, 11);
  // base plate + braced feet
  p.rect(x0 - 6, GY - 4, w + 12, 4, C.void); p.hl(x0 - 5, GY - 4, w + 10, C.steel2); p.hl(x0 - 5, GY - 3, w + 10, C.steel0);
  for (let i = 0; i < w + 10; i++) p.px(x0 - 5 + i, GY - 2, ((i >> 1) % 2) ? C.yellow : C.ink);
  for (const [fx, d] of [[x0, -1], [x1 - 1, 1]]) {
    for (let k = 0; k < 7; k++) { p.px(fx + d * k, GY - 11 + k, C.void); p.px(fx + d * k, GY - 10 + k, C.steel1); p.px(fx + d * (k + 1), GY - 10 + k, C.void); }
  }
  // posts + caps
  for (const jx of [x0, x1 - 5]) {
    p.rect(jx, top, 5, GY - 4 - top, C.void);
    for (let y = top + 1; y < GY - 4; y++) for (let i = 1; i < 4; i++) p.px(jx + i, y, ((i + y) % 6) < 3 ? C.yellow : C.ink);
    p.vl(jx + 1, top + 1, GY - 5 - top, C.amber);
    p.rect(jx - 1, top - 3, 7, 3, C.void); p.hl(jx, top - 3, 5, C.steel3); p.hl(jx, top - 2, 5, C.steel1);
  }
  // header beam
  p.rect(x0 + 5, top + 1, w - 10, 4, C.void); p.hl(x0 + 5, top + 1, w - 10, C.steel2); p.hl(x0 + 5, top + 2, w - 10, C.steel1); p.hl(x0 + 5, top + 3, w - 10, C.steel0);
  p.rivet(x0 + 7, top + 2, C.steel3, C.navy, C.steel2); p.rivet(x1 - 9, top + 2, C.steel3, C.navy, C.steel2);
  // barred leaf: rails, stiles and round bars with the wall showing between them
  const lx = x0 + 6, lw = w - 12, ly = top + 7, lb = GY - 8;
  for (let bx = lx + 3; bx < lx + lw - 2; bx += 3) { p.vl(bx, ly, lb - ly, C.steel1); p.vl(bx + 1, ly, lb - ly, C.void); p.px(bx, ly + 2, C.steel3); }
  for (const ry of [ly, ly + ((lb - ly) >> 1), lb - 3]) { p.rect(lx, ry, lw, 3, C.void); p.hl(lx, ry, lw, C.steel2); p.hl(lx, ry + 1, lw, C.steel0); }
  for (const sx of [lx, lx + lw - 2]) { p.rect(sx, ly, 2, lb - ly, C.void); p.vl(sx, ly, lb - ly, C.steel2); }
  for (const hy of [ly + 2, lb - 4]) p.px(lx - 1, hy, C.steel3); // hinge pins
  // card reader housing (lamp live) + lever escutcheon (lever live)
  p.rect(LAMP.x - 3, LAMP.y - 3, 7, 12, C.void); p.rect(LAMP.x - 2, LAMP.y - 2, 5, 10, C.stone3); p.hl(LAMP.x - 2, LAMP.y - 2, 5, C.cream2);
  p.rect(LAMP.x - 2, LAMP.y - 2, 5, 5, C.void); p.hl(LAMP.x - 1, LAMP.y + 5, 3, C.stone1);
  p.rect(LAMP.x - 1, LAMP.y + 11, 4, 6, C.void); p.vl(LAMP.x, LAMP.y + 12, 4, C.steel0);
}

// ------------------------------------------------------------------ live
export function live(ctx, top, t, s) {
  liveFloor(ctx, top, t, s, 5);
  const p = pen(ctx), d = s.demos;
  // rack lights (baked lit): the blinking ones redrawn with slow activity blinks (t is mt()-scaled: still under
  // reduced motion); a shot rack goes dark
  const broken = new Set(s.props.filter(q => q.floor === 5 && q.broken).map(q => q.id));
  for (const L of LEDS) {
    if (broken.has(L.id)) { p.px(L.x, top + L.y, OFF[L.c]); continue; }
    if (L.blink) p.px(L.x, top + L.y, ((t + L.phase) % L.period) < L.period * L.duty ? L.c : OFF[L.c]);
  }
  // cooling unit status strip: a slow sweep along the cold segments
  const seg = Math.floor(t * 0.8) % 7;
  for (let i = 0; i < 7; i++) p.px(CRAC.x + 7 + i * 2, top + CRAC.top + 29, i === seg ? C.steel3 : C.steel0);
  // crash cart monitor: a few lines of mint (no words) and a slow cursor
  const cm = { x: CART.x + 5, y: top + GY - 44 };
  p.dith(cm.x, cm.y, 12, 9, null, C.mint0, 4);
  p.hl(cm.x + 1, cm.y + 1, 7, C.mint1); p.hl(cm.x + 1, cm.y + 3, 9, C.mint1); p.hl(cm.x + 1, cm.y + 5, 5, C.mint1);
  if (Math.floor(t * 1.2) % 2) p.px(cm.x + 7, cm.y + 5, C.mint2);
  // the Ludovico screen: one slogan at a time, typed out (whole line under reduced motion); dead once shot
  const scr = s.props.find(q => q.id === 'ludo-screen');
  if (!scr.broken) slogan(p, top, s.t);
  // the man in the chair (strapped until the screen is shot; then the NPC system draws him standing)
  const n = s.npcs.find(q => q.id === 'ludovico');
  const open = d.ludo.freed && (d.ludo.t < 0 || d.ludo.t >= LUDO_STRAPS);
  if (n && n.strapped) seatedMan(p, top, npcColors(n), scr.broken);
  straps(p, top, open);
  clampRig(p, top, !!(n && n.strapped));
  // MCP gate: red lamp while a try is fresh (never mint: it never opens); the lever jiggles once
  const lit = mcpDoorLamp(d.mcpDoor);
  p.rect(LAMP.x - 1, top + LAMP.y - 1, 3, 3, lit ? C.red : C.rust0);
  if (lit) { p.px(LAMP.x - 1, top + LAMP.y - 1, C.white); p.px(LAMP.x - 2, top + LAMP.y, C.red); p.px(LAMP.x + 2, top + LAMP.y, C.red); }
  const jig = !reduced && d.mcpDoor.t >= 0 && d.mcpDoor.t < ANIM.shake ? (Math.floor(d.mcpDoor.t * 20) % 2) : 0;
  const ly = top + LAMP.y + 12 + jig;
  p.rect(LAMP.x - 5, ly - 1, 7, 3, C.void); p.hl(LAMP.x - 4, ly, 6, C.steel3); p.px(LAMP.x - 4, ly + 1, C.steel1);
}

// Slogan text projected on the screen: dark letters with a soft shadow, lines centred, a small cursor while typing.
function slogan(p, top, time) {
  const { text, chars } = sloganAt(time, reduced);
  const lines = wrap(text, SLOGAN_WRAP);
  const y0 = top + FACE.y + ((FACE.h - (lines.length * 9 - 2)) >> 1);
  let left = chars, cx = 0, cy = 0;
  lines.forEach((l, k) => {
    const shown = l.slice(0, Math.max(0, left));
    left -= l.length + 1;
    if (!shown) return;
    const x = FACE.x + ((FACE.w - textWidth(l)) >> 1), y = y0 + k * 9;
    p.text(shown, x + 1, y + 1, C.stone2);
    p.text(shown, x, y, C.ink);
    cx = x + shown.length * 6; cy = y;
  });
  if (chars < text.length && cx) p.rect(cx, cy, 2, 7, C.navy2);
}

// The man strapped in, in side profile, lying back along the chair facing the screen: gown along the backrest,
// thighs on the seat, shins on the leg rest, bare feet up, forearm on the arm rest; head on the headrest with the eye
// clamped wide open (white, pupil on the screen).
function seatedMan(p, top, col, dead) {
  const Y = top + GY, skin = C.skin, hair = C[col.hair] ?? C.brass;
  const shirt = C.cream2, shade = C.cream;
  // torso along the backrest (back edge in shade, the screen side lit)
  for (let y = Y - 46; y <= Y - 20; y++) {
    const bx = X - 3 - ((Y - 19 - y) >> 1);
    p.px(bx + 2, y, C.void); p.rect(bx + 3, y, 6, 1, shirt); p.px(bx + 3, y, shade); p.px(bx + 8, y, C.white); p.px(bx + 9, y, C.void);
  }
  // thighs on the seat
  p.rect(X - 1, Y - 24, 22, 6, C.void); p.rect(X, Y - 23, 20, 4, shade); p.hl(X, Y - 23, 20, shirt); p.hl(X, Y - 20, 20, C.stone2);
  // shins on the leg rest, bare feet up
  for (let i = 0; i < 8; i++) {
    const x = X + 20 + i, y = Y - 18 + Math.round(i * 0.35);
    p.rect(x, y - 6, 1, 6, C.void); p.rect(x, y - 5, 1, 4, shade); p.px(x, y - 5, shirt); p.px(x, y - 2, C.stone2);
  }
  p.rect(X + 27, Y - 25, 4, 8, C.void); p.rect(X + 28, Y - 24, 2, 6, skin); p.px(X + 29, Y - 24, C.skinDark); p.px(X + 28, Y - 19, C.skinDark);
  // arm: upper arm down the torso's lit side to the elbow, forearm along the arm rest, hand
  for (let k = 0; k < 11; k++) {
    const ax = X - 6 + Math.round(k * 0.55), ay = Y - 41 + k;
    p.px(ax - 1, ay, C.void); p.px(ax, ay, shade); p.px(ax + 1, ay, shirt); p.px(ax + 2, ay, C.void);
  }
  p.rect(X - 1, Y - 32, 14, 4, C.void); p.rect(X, Y - 31, 12, 2, shirt); p.hl(X, Y - 30, 12, shade);
  p.rect(X + 12, Y - 32, 4, 4, C.void); p.rect(X + 12, Y - 31, 3, 2, skin); p.px(X + 14, Y - 30, C.skinDark);
  // head on the headrest
  const map = { o: C.void, y: hair, s: skin, S: C.skinDark, m: C.skinDark, w: C.white, k: dead ? C.navy2 : C.void, T: C.steel3 };
  HEAD.forEach((r, j) => [...r].forEach((ch, i) => { if (map[ch] != null) p.px(X - 16 + i, Y - 56 + j, map[ch]); }));
}

// Leather straps: buckled over chest, wrist and ankle; sprung open, they hang loose off the chair.
function straps(p, top, open) {
  const Y = top + GY;
  if (!open) {
    for (const [x, y, w, h] of [[X - 11, Y - 37, 9, 2], [X + 8, Y - 33, 2, 6], [X + 24, Y - 23, 2, 7]]) {
      p.rect(x - 1, y - 1, w + 2, h + 2, C.void); p.rect(x, y, w, h, C.wood0); p.hl(x, y, w, C.wood1);
    }
    p.px(X - 4, Y - 37, C.brass); p.px(X + 8, Y - 31, C.brass); p.px(X + 24, Y - 20, C.brass);
    return;
  }
  // loose ends hanging off the backrest, the arm rest and the leg rest
  for (const [x, y, len] of [[X - 12, Y - 34, 9], [X + 9, Y - 24, 6], [X + 25, Y - 15, 6]]) {
    p.rect(x - 1, y, 4, len + 1, C.void); p.vl(x, y, len, C.wood0); p.vl(x + 1, y, len - 2, C.wood1); p.px(x, y + len - 1, C.brass);
  }
}

// Eyelid clamp dropper from the rig arm down to the eye, a spring wire to the lower hook (pulled up, claws open,
// once he is gone).
function clampRig(p, top, onFace) {
  const Y = top + GY, x = X - 10;
  p.rect(x - 1, Y - 63, 3, onFace ? 9 : 5, C.void); p.vl(x, Y - 63, onFace ? 10 : 5, C.steel1);
  if (onFace) { p.px(x + 2, Y - 53, C.steel1); p.vl(x + 3, Y - 53, 3, C.steel1); }
  else { p.px(x - 1, Y - 58, C.steel3); p.px(x + 1, Y - 58, C.steel3); }
}
