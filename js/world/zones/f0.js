// Floor 00 — Lobby, laid out as the new-hire tour (beige stone + steel). 960 px wide; shaft at 452..556.
// West → east: spawn + WELCOME banner, THE MODEL (LLM), THE HARNESS, CLAUDE.md board, decision booth | shaft |
// facility directory, reception under the department sign, badge kiosk at the far east end.
import { C, pen, BAYER4, blockWall, steelPanels, column, ceiling, baseStrip, walkway, slabBand, pipeV } from './common.js?v=68';
import { pressTravel, ANIM } from '../concept.js?v=68';
import { signPlate } from '../../art/kit/signs.js?v=68';
import { screen } from '../../art/kit/screens.js?v=68';
import { lamp, bench } from '../../art/kit/furniture.js?v=68';
import { cableSag } from '../../art/kit/slab.js?v=68';
import { FONT5 } from '../../engine/font.js?v=68';
import { hash } from '../../engine/hash.js?v=68';
import { COPY, ROOM_COPY, READ } from '../../logic/copy.js?v=68';
import { wrap } from '../../logic/text.js?v=68';
import { ROOMS, PROPS, STATIONS, STATION_SIGN, SHAFT_X, SHAFT_W, ROOM_H, WW, FLOOR_NAMES } from '../levels.js?v=68';

const GY = ROOM_H - 6; // 129 walk surface
const WALL_Y = 19;
const STONE = [C.stone1, C.stone2, C.stone3, C.cream];
const EAST = SHAFT_X + SHAFT_W;
const prop = id => PROPS.find(q => q.id === id);
const rect = id => { const q = prop(id); return { x: q.x, y: q.y, w: q.w, h: q.h }; };

export const F0 = {
  notice: ROOMS.find(r => r.id === 'noticeboard'),
  banner: { x: 16, y: 22, w: 112 },
  stations: STATIONS.map(st => ({ ...st, cx: st.x + (st.w >> 1) })),
  sign: rect('sign-lobby'),
  kiosk: rect('kiosk'),
  directory: rect('scr-directory'),
  button: rect('demo-donottouch'),
  booth: { x: 370, w: 72 },
  desk: { x: 747, w: 112, top: 110 },
};

const LIGHT = { primary: C.mint2, supporting: C.mint0, denied: C.red, off: C.navy2 };
// two-line wall plates split at the last space: "THE MODEL / (LLM)", "THE / HARNESS", "CLAUDE.md / BOARD"
const twoLines = t => { const i = t.lastIndexOf(' '); return i < 0 ? [t] : [t.slice(0, i), t.slice(i + 1)]; };

// ------------------------------------------------------------------ bake (static)
export function bake(ctx) {
  const p = pen(ctx);
  p.rect(0, 0, WW, 180, C.void);
  const { notice } = F0;

  // walls: calm stone above a steel wainscot
  blockWall(p, 0, WALL_Y, SHAFT_X, GY - WALL_Y, { ramp: STONE, seed: 3 });
  blockWall(p, EAST, WALL_Y, WW - EAST, GY - WALL_Y, { ramp: STONE, seed: 9 });
  steelPanels(p, 0, 104, SHAFT_X, 19, { pw: 40 });
  steelPanels(p, EAST, 104, WW - EAST, 19, { pw: 40, seed: 5 });
  for (const [a, b] of [[0, SHAFT_X], [EAST, WW]]) {
    p.rect(a, 101, b - a, 3, C.void); p.hl(a, 101, b - a, C.steel2); p.hl(a, 102, b - a, C.steel0);
    p.dithV(a, 104, b - a, 4, C.ink, 6, 0);
  }
  woodPanels(p, notice.x + 6, 55, notice.w - 12, GY - 55);

  // ceiling: a fixture over the banner, each station and the booth; east over directory, desk and kiosk
  ceiling(ctx, 0, SHAFT_X, { lights: [72, ...F0.stations.map(s => s.cx), F0.booth.x + (F0.booth.w >> 1)], seed: 1 });
  ceiling(ctx, EAST, WW, { lights: [650, F0.desk.x + (F0.desk.w >> 1), F0.kiosk.x + (F0.kiosk.w >> 1)], seed: 2 });

  bulkhead(p, 0, 14);
  bulkhead(p, WW - 14, 14);
  column(p, notice.x + notice.w, WALL_Y, GY);
  column(p, SHAFT_X - 9, WALL_Y, GY, { w: 9 });
  column(p, EAST, WALL_Y, GY, { w: 9 });

  pipeV(ctx, 568, WALL_Y, 84, { r: 1, color: 'rust', flanges: 20 });
  cableSag(ctx, 580, 18, 940, { sag: 3, color: C.ink });

  banner(p);
  for (const st of F0.stations) station(ctx, p, st);
  noticeRoom(ctx, p);
  buttonPost(p);
  booth(ctx, p);
  eastWing(ctx, p);
  lobby(ctx, p);

  baseStrip(p, 14, notice.x + notice.w - 14, GY - 6);
  baseStrip(p, notice.x + notice.w + 8, SHAFT_X - 9 - notice.x - notice.w - 8, GY - 6);
  baseStrip(p, EAST + 9, WW - 14 - EAST - 9, GY - 6);
  walkway(p, 0, SHAFT_X, GY);
  walkway(p, EAST, WW - EAST, GY);
  // kiosk floor pad (mint) — it is the floor's main interaction
  const K = F0.kiosk;
  for (let i = -4; i < K.w + 4; i++) p.px(K.x + i, GY + 1, ((K.x + i) % 4) < 2 ? C.mint1 : C.mint0);
  slabBand(ctx, 0, SHAFT_X, ROOM_H, { seed: 3, vpipes: [86, 330], boxes: [150] });
  slabBand(ctx, EAST, WW, ROOM_H, { seed: 4, vpipes: [760], boxes: [860] });
}

// 2x FONT5 headline (11 px advance) with a 1 px drop shadow; returns nothing. x = left edge.
const COMMA2 = [[1, 5], [2, 5], [1, 6], [2, 6], [1, 7]]; // the 5x7 comma is too small to read at 2x
function big(p, str, x, y, col, top, shadow) {
  for (const pass of [0, 1]) [...str].forEach((ch, i) => {
    const g = FONT5[ch] ?? FONT5['?'];
    const cells = [];
    if (ch === ',') cells.push(...COMMA2);
    else for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) if (g[r][q] === '1') cells.push([q, r]);
    for (const [q, r] of cells) {
      if (pass === 0) p.rect(x + i * 11 + q * 2 + 1, y + r * 2 + 1, 2, 2, shadow);
      else p.rect(x + i * 11 + q * 2, y + r * 2, 2, 2, r === 0 ? top : col);
    }
  });
}
const bigW = str => str.length * 11 - 1;

// Welcome banner: a cloth banner on a brass pole over the spawn point.
function banner(p) {
  const { x, y, w } = F0.banner;
  const top = y + 3, bot = 92;
  for (const rx of [x + 12, x + w - 13]) { p.vl(rx, 17, y - 17, C.steel0); p.px(rx, 17, C.steel2); }
  // soft shadow on the wall
  p.dith(x + 2, top + 2, w, bot - top + 5, null, C.stone1, 6);
  // fabric
  p.rect(x, top, w, bot - top, C.rust1);
  p.vl(x, top, bot - top, C.rust0); p.vl(x + w - 1, top, bot - top, C.rust0);
  for (const fx of [x + 20, x + 54, x + 88]) { p.dith(fx, top, 7, bot - top, null, C.rust0, 3); p.dith(fx + 7, top, 2, bot - top, null, C.rust2, 3); }
  p.dithV(x + 1, top, w - 2, 5, C.rust0, 8, 0);
  // stitched hem
  for (let i = x + 3; i < x + w - 3; i += 2) { p.px(i, top + 3, C.rust2); p.px(i, bot - 3, C.rust2); }
  for (let j = top + 3; j < bot - 3; j += 2) { p.px(x + 3, j, C.rust2); p.px(x + w - 4, j, C.rust2); }
  // weighted hem + brass fringe
  p.rect(x, bot, w, 2, C.rust0); p.hl(x, bot, w, C.rust2);
  for (let i = x + 1; i < x + w - 1; i += 2) { p.vl(i, bot + 2, (i >> 1) % 2 ? 3 : 2, C.brass); p.px(i, bot + ((i >> 1) % 2 ? 5 : 4), C.wood0); }
  // pole with brass finials
  p.rect(x - 1, y, w + 2, 3, C.void); p.hl(x, y, w, C.brass); p.hl(x, y + 1, w, C.wood1);
  for (const fx of [x - 2, x + w]) { p.rect(fx, y - 1, 2, 5, C.void); p.px(fx, y, C.brass); p.px(fx + 1, y, C.yellow); p.px(fx, y + 1, C.wood1); }
  // headline: two 2x lines, then the sub-line in two lines
  const head = COPY.welcome.head, cut = head.indexOf(' ');
  [head.slice(0, cut), head.slice(cut + 1)].forEach((l, k) => big(p, l, x + ((w - bigW(l)) >> 1), top + 6 + k * 18, C.cream2, C.white, C.rust0));
  for (let i = x + 10; i < x + w - 10; i += 2) p.px(i, top + 43, C.brass);
  wrap(COPY.welcome.sub, 17).forEach((l, k) => p.textShadow(l, x + ((w - (l.length * 6 - 1)) >> 1), top + 47 + k * 9, C.cream, C.rust0));
}

// Tour station: a plinth with an exhibit on top, a two-line enamel plate on the wall above.
function station(ctx, p, st) {
  const cx = st.cx;
  const title = READ[st.id].title;
  signPlate(ctx, cx - (STATION_SIGN.w >> 1), STATION_SIGN.y, twoLines(title), { style: 'enamel', w: STATION_SIGN.w, h: STATION_SIGN.h, center: true });
  plinth(p, cx, st.w - 4);
  if (st.id === 'station-llm') modelCase(p, cx);
  else harnessRig(p, cx);
}

function plinth(p, cx, w) {
  const x = cx - (w >> 1), y = GY - 20;
  p.dith(x - 3, GY - 1, w + 6, 2, null, C.void, 9);
  p.rect(x, y, w, 20, C.void);
  p.rect(x + 1, y + 1, w - 2, 19, C.stone2);
  p.vl(x + 1, y + 1, 19, C.cream); p.vl(x + 2, y + 1, 19, C.stone3); p.vl(x + w - 2, y + 1, 19, C.stone1);
  p.dith(x + 3, y + 1, w - 5, 19, null, C.stone3, 2);
  p.dithV(x + 1, y + 1, w - 2, 4, C.stone1, 6, 0);
  p.rect(x - 2, y - 3, w + 4, 4, C.void); p.hl(x - 1, y - 3, w + 2, C.steel2); p.hl(x - 1, y - 2, w + 2, C.steel0);
  p.rect(x + 1, GY - 4, w - 2, 3, C.navy2); p.hl(x + 1, GY - 4, w - 2, C.steel0);
}

// THE MODEL: a glass case holding one big chip — a grid of weights.
export function modelChip(cx) { return { x: cx - 8, y: GY - 44, w: 16, h: 12 }; }
// THE MODEL: one big chip — a grid of weights — under a glass dome on a brass ring.
function modelCase(p, cx) {
  const w = 28, x = cx - (w >> 1), y = GY - 54, base = GY - 25, r = 9;
  const c = modelChip(cx);
  // glow around the chip (on the wall, seen through the glass)
  for (let k = 0; k < 4; k++) p.dith(c.x - 4 + k, c.y - 4 + k, c.w + 8 - 2 * k, c.h + 8 - 2 * k, null, C.mint0, 1 + k * 2);
  // post + chip
  p.rect(cx - 2, c.y + c.h + 1, 4, base - (c.y + c.h + 1), C.steel0); p.vl(cx - 2, c.y + c.h + 1, base - (c.y + c.h + 1), C.steel1);
  chip(p, c.x, c.y, c.w, c.h, 7);
  // the glass: faint tint, rounded top, lit left rim
  let pd = r;
  for (let yy = y; yy < base; yy++) {
    const k = yy - y;
    const d = k < r ? Math.round(r - Math.sqrt(r * r - (r - k) ** 2)) : 0;
    const L = x + d, R = x + w - 1 - d;
    if (k === 0) { p.hl(L, yy, R - L + 1, C.steel2); pd = d; continue; }
    p.dith(L + 1, yy, R - L - 1, 1, null, C.steel0, 1);
    const step = Math.max(1, pd - d);
    p.hl(L, yy, step, C.steel2); p.hl(R - step + 1, yy, step, C.steel0);
    pd = d;
  }
  for (let k = 0; k < 14; k += 2) p.px(x + 3, y + 8 + k, C.steel3);
  p.px(x + 5, y + 3, C.steel3); p.px(x + 4, y + 4, C.steel3); p.px(x + 6, y + 2, C.steel2);
  // brass ring the dome sits in
  p.rect(x - 2, base, w + 4, 3, C.void); p.hl(x - 1, base, w + 2, C.brass); p.hl(x - 1, base + 1, w + 2, C.wood1);
}

function chip(p, x, y, w, h, seed) {
  for (let i = 2; i < w - 1; i += 2) { p.px(x + i, y - 1, C.steel2); p.px(x + i, y + h, C.steel2); }
  for (let j = 2; j < h - 1; j += 2) { p.px(x - 1, y + j, C.steel2); p.px(x + w, y + j, C.steel2); }
  p.rect(x, y, w, h, C.void); p.rect(x + 1, y + 1, w - 2, h - 2, C.navy);
  p.hl(x + 1, y + 1, w - 2, C.navy2);
  for (let j = 2; j < h - 1; j += 2) for (let i = 2; i < w - 1; i += 2) p.px(x + i, y + j, hash(i * 7 + j * 13 + seed) > 0.55 ? C.mint1 : C.mint0);
}

// THE HARNESS: an open steel rig; a chip sits in its socket, tools wired in from the top.
export function harnessCables(cx) {
  const sy = GY - 33;
  return [[cx - 12, cx - 4], [cx, cx], [cx + 12, cx + 4]].map(([x0, x1]) => ({ x0, y0: GY - 41, x1, y1: sy }));
}
function harnessRig(p, cx) {
  const x = cx - 17, y = GY - 51, w = 34, h = 28;
  p.rect(x - 1, y - 1, w + 2, h + 2, C.void);
  p.rect(x + 2, y + 2, w - 4, h - 4, C.navy);
  p.dith(x + 2, y + 2, w - 4, h - 4, null, C.navy2, 3);
  // frame bars + gussets
  for (const [bx, by, bw, bh] of [[x, y, w, 2], [x, y + h - 2, w, 2], [x, y, 2, h], [x + w - 2, y, 2, h]]) { p.rect(bx, by, bw, bh, C.steel0); }
  p.hl(x, y, w, C.steel2); p.vl(x, y, h, C.steel1);
  for (const [gx, gy, sx, sy] of [[x + 2, y + 2, 1, 1], [x + w - 3, y + 2, -1, 1], [x + 2, y + h - 3, 1, -1], [x + w - 3, y + h - 3, -1, -1]]) {
    p.px(gx, gy, C.steel1); p.px(gx + sx, gy, C.steel0); p.px(gx, gy + sy, C.steel0);
  }
  // cables (tool -> socket)
  for (const c of harnessCables(cx)) p.line(c.x0, c.y0, c.x1, c.y1, C.rust2);
  // tools: file, terminal, pencil
  const ty = GY - 48;
  const fx = cx - 15; // file
  p.rect(fx, ty, 6, 7, C.void); p.rect(fx + 1, ty, 5, 7, C.cream); p.rect(fx, ty, 1, 7, C.void);
  p.px(fx + 5, ty, C.stone2); p.px(fx + 4, ty, C.cream2); p.hl(fx + 2, ty + 2, 3, C.stone1); p.hl(fx + 2, ty + 4, 2, C.stone1);
  const tx = cx - 3; // terminal
  p.rect(tx - 1, ty - 1, 9, 8, C.void); p.rect(tx, ty, 7, 6, C.ink);
  p.px(tx + 1, ty + 1, C.mint2); p.px(tx + 2, ty + 2, C.mint2); p.px(tx + 1, ty + 3, C.mint2); p.hl(tx + 4, ty + 4, 2, C.mint1);
  const px0 = cx + 9; // pencil (diagonal)
  for (let k = 0; k < 5; k++) { p.px(px0 + 1 + k, ty + 5 - k, C.yellow); p.px(px0 + 2 + k, ty + 5 - k, C.amber); }
  p.px(px0, ty + 6, C.ink); p.px(px0 + 1, ty + 6, C.cream2);
  p.px(px0 + 6, ty, C.pink); p.px(px0 + 7, ty, C.pink); p.px(px0 + 7, ty + 1, C.rust2);
  // socket + seated chip
  const sx = cx - 7, sy = GY - 33;
  p.rect(sx, sy, 14, 9, C.void); p.rect(sx + 1, sy + 1, 12, 7, C.steel0); p.hl(sx + 1, sy + 1, 12, C.steel1);
  chip(p, cx - 4, sy + 2, 8, 5, 3);
  // the lead in from the side: your messages come in here
  p.hl(x - 3, sy + 4, 3, C.rust2); p.vl(x - 3, sy + 4, GY - 23 - (sy + 4), C.rust2); p.px(x - 3, GY - 23, C.steel2);
}

function woodPanels(p, x, y, w, h) {
  p.rect(x, y, w, h, C.wood1);
  for (let i = x; i < x + w; i += 12) { p.vl(i, y, h, C.wood0); p.dith(i + 1, y, 1, h, null, C.brass, 3); }
  p.rect(x, y + h - 26, w, 3, C.wood0); p.hl(x, y + h - 26, w, C.brass);
  p.dithV(x, y, w, 6, C.void, 10, 0);
  p.dithV(x, y + h - 14, w, 14, C.wood0, 0, 6);
}

function bulkhead(p, x, w) {
  p.rect(x, 0, w, 180, C.void);
  p.rect(x + 1, WALL_Y, w - 2, GY - WALL_Y, C.navy2);
  for (let y = WALL_Y; y < GY; y++) for (let i = 1; i < w - 1; i++) if (((x + i + y) % 10) < 5 && (i < 4 || i > w - 5)) p.px(x + i, y, C.amber);
  p.vl(x + 4, WALL_Y, GY - WALL_Y, C.ink); p.vl(x + w - 5, WALL_Y, GY - WALL_Y, C.ink);
  for (let y = WALL_Y + 6; y < GY; y += 12) p.rivet(x + 6, y, C.steel1, C.ink, C.navy2);
}

function noticeRoom(ctx, p) {
  const r = F0.notice;
  const cx = r.x + (r.w >> 1);
  column(p, r.x, WALL_Y, GY, { w: 7 });
  p.rect(r.x + 6, WALL_Y, r.w - 6, 35, C.void);
  steelPanels(p, r.x + 7, WALL_Y + 1, r.w - 7, 33, { pw: 26, ramp: [C.navy, C.navy2, C.steel0, C.steel1] });
  p.hl(r.x + 6, 53, r.w - 6, C.steel1); p.hl(r.x + 6, 54, r.w - 6, C.void);
  // centred on the room = on the board; same two-line plate as the stations
  signPlate(ctx, cx - (STATION_SIGN.w >> 1), STATION_SIGN.y, twoLines(ROOM_COPY.noticeboard.name), { style: 'enamel', w: STATION_SIGN.w, h: STATION_SIGN.h, center: true });
  const bx = cx - 32, by = 60, bw = 64, bh = 42;
  p.rect(bx + 18, by - 7, 28, 3, C.void); p.hl(bx + 19, by - 7, 26, C.brass); p.hl(bx + 19, by - 6, 26, C.wood1);
  for (let j = 0; j < 30; j++) {
    const hw = 13 + Math.round(j * 0.8), lvl = Math.round(3 - j / 10);
    for (let i = -hw; i <= hw; i++) { const X = bx + 32 + i, Y = by - 4 + j; if (X > r.x + 6 && X < r.x + r.w && BAYER4[Y & 3][X & 3] < lvl) p.px(X, Y, C.brass); }
  }
  p.rect(bx - 1, by - 1, bw + 3, bh + 3, C.void);
  p.rect(bx, by, bw, bh, C.wood0); p.hl(bx, by, bw, C.brass); p.vl(bx, by, bh, C.brass);
  p.rect(bx + 3, by + 3, bw - 6, bh - 6, C.rust1);
  p.dith(bx + 3, by + 3, bw - 6, bh - 6, null, C.rust2, 3);
  p.noise(bx + 3, by + 3, bw - 6, bh - 6, C.wood0, 0.06, 7);
  note(p, bx + 5, by + 5, 38, 19, C.cream2, C.cream, ['CLAUDE.MD'], C.red);
  for (let k = 0; k < 3; k++) p.hl(bx + 8, by + 13 + k * 3, 28 - (k * 7) % 11, C.stone1);
  note(p, bx + 45, by + 7, 15, 15, C.yellow, C.amber, ['TO', 'DO'], C.mint1);
  note(p, bx + 7, by + 27, 17, 10, C.mint2, C.mint1, [], C.amber);
  p.hl(bx + 9, by + 30, 12, C.mint0); p.hl(bx + 9, by + 32, 9, C.mint0);
  note(p, bx + 30, by + 23, 28, 13, C.pink, C.rust2, ['NO MCP'], C.red);
  p.line(bx + 23, by + 8, bx + 46, by + 24, C.red);
  graffiti(p, bx, by);
  bench(ctx, bx + 7, GY - 11, { w: 50 });
}

// "AGENTS.MD!" sprayed across the board: tall condensed spray letters (5x7 glyphs, 2 px strokes,
// 14 px tall), two slanted lines, darker outline, drips. Static. x, y = top-left of the board.
function graffiti(p, x, y) {
  const lines = [['AGENTS', x + 5, y + 4], ['.MD!', x + 18, y + 22]];
  const on = new Set();
  const pts = [];
  const put = (X, Y) => { if (!on.has(`${X},${Y}`)) { on.add(`${X},${Y}`); pts.push([X, Y]); } };
  lines.forEach(([str, lx, ly], li) => {
    [...str].forEach((ch, i) => {
      const g = FONT5[ch] ?? FONT5['?'];
      const ox = lx + i * 9 - (ch === '.' ? 3 : 0), oy = ly - Math.round((i + li * 2) * 0.6);
      for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) {
        if (g[r][q] !== '1') continue;
        // columns 0..4 map to x 0,2,3,5,6 with the outer columns 2 px wide: thick verticals, open counters
        const X0 = [0, 2, 3, 4, 6][q], wq = (q === 0 || q === 4) ? 2 : 1;
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < wq; dx++) put(ox + X0 + dx, oy + r * 2 + dy);
        if (q < 4 && g[r][q + 1] === '1') for (let dy = 0; dy < 2; dy++) for (let X = X0 + wq; X < [0, 2, 3, 4, 6][q + 1]; X++) put(ox + X, oy + r * 2 + dy);
      }
    });
  });
  for (const [X, Y] of pts) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) if (!on.has(`${X + dx},${Y + dy}`)) p.px(X + dx, Y + dy, C.rust0);
  for (const [X, Y] of pts) p.px(X, Y, C.red);
  for (const [dx, dy, len] of [[x + 6, y + 18, 6], [x + 34, y + 17, 4], [x + 29, y + 36, 5], [x + 53, y + 34, 6]]) {
    p.vl(dx, dy, len, C.red); p.px(dx + 1, dy, C.rust0); p.px(dx, dy + len, C.rust0);
  }
}

function note(p, x, y, w, h, paper, edge, lines, pin) {
  p.dith(x + 1, y + 1, w, h, null, C.void, 9);
  p.rect(x, y, w, h, paper); p.hl(x, y + h - 1, w, edge); p.vl(x + w - 1, y, h, edge);
  lines.forEach((l, k) => p.text(l, x + 2, y + 2 + k * 6, C.navy, 'f3'));
  p.px(x + (w >> 1), y + 1, pin); p.px(x + (w >> 1) + 1, y + 2, C.void);
}

function lobby(ctx, p) {
  // Institutional backlit sign over reception: the headline in two 2x lines, the department plate underneath.
  const S = F0.sign;
  for (const rx of [S.x + 24, S.x + S.w - 25]) { p.vl(rx, 17, S.y - 17, C.steel0); p.px(rx, 17, C.steel2); }
  p.rect(S.x + 1, S.y + 1, S.w, S.h, C.void);
  p.rect(S.x, S.y, S.w, S.h, C.void);
  p.rect(S.x + 1, S.y + 1, S.w - 2, S.h - 2, C.steel1);
  p.hl(S.x + 1, S.y + 1, S.w - 2, C.steel2); p.hl(S.x + 1, S.y + S.h - 2, S.w - 2, C.steel0);
  p.rect(S.x + 3, S.y + 3, S.w - 6, S.h - 6, C.navy);
  p.hl(S.x + 3, S.y + 3, S.w - 6, C.navy2);
  const head = 'TO MCP OR NOT TO MCP', cut = head.indexOf(' NOT');
  [head.slice(0, cut), head.slice(cut + 1)].forEach((l, k) => big(p, l, S.x + ((S.w - bigW(l)) >> 1), S.y + 6 + k * 17, C.cream2, C.white, C.void));
  p.hl(S.x + 10, S.y + 40, S.w - 20, C.steel0);
  wrap('DEPARTMENT OF INTEGRATION DECISIONS', 21).forEach((l, k) => p.text(l, S.x + ((S.w - (l.length * 6 - 1)) >> 1), S.y + 44 + k * 9, C.steel2));
  for (const [rx, ry] of [[S.x + 4, S.y + 4], [S.x + S.w - 6, S.y + 4], [S.x + 4, S.y + S.h - 6], [S.x + S.w - 6, S.y + S.h - 6]]) p.px(rx, ry, C.steel1);
  // a soft wash of light on the wall just below the sign (dither, not alpha)
  for (let j = 0; j < 5; j++) p.dith(S.x + 6 - j, S.y + S.h + 1 + j, S.w - 12 + 2 * j, 1, null, C.stone3, 3 - Math.floor(j / 2));

  kiosk(p);

  // reception counter (back + countertop items); front panel in fore(). Staff stand at D.x+25 and D.x+79.
  const D = F0.desk;
  p.rect(D.x, D.top, D.w, GY - D.top, C.wood0);
  p.rect(D.x - 2, D.top - 3, D.w + 4, 4, C.void); p.rect(D.x - 1, D.top - 3, D.w + 2, 3, C.stone3); p.hl(D.x - 1, D.top - 3, D.w + 2, C.cream2);
  const mx = D.x + 44; // monitor between the two staff
  p.rect(mx, D.top - 13, 18, 11, C.void); p.rect(mx + 1, D.top - 12, 16, 9, C.stone2); p.hl(mx + 1, D.top - 12, 16, C.cream);
  p.rect(mx + 3, D.top - 10, 12, 5, C.ink); p.hl(mx + 4, D.top - 9, 7, C.mint2); p.hl(mx + 4, D.top - 7, 9, C.mint1);
  p.rect(mx + 8, D.top - 3, 3, 1, C.stone1);
  p.rect(D.x + 4, D.top - 5, 7, 2, C.brass); p.rect(D.x + 5, D.top - 7, 5, 2, C.brass); p.px(D.x + 7, D.top - 8, C.cream2); // bell
  p.rect(D.x + 12, D.top - 5, 14, 2, C.void); p.hl(D.x + 13, D.top - 6, 12, C.cream2); p.hl(D.x + 13, D.top - 5, 12, C.stone3);
  p.rect(D.x + 68, D.top - 6, 5, 6, C.void); p.rect(D.x + 69, D.top - 5, 3, 5, C.mint1); // mug
  lamp(ctx, D.x + 104, D.top - 16, { type: 'desk', cone: 10, spread: 0.8 });
}

function kiosk(p) {
  const { x, y, w, h } = F0.kiosk;
  const cx = x + (w >> 1);
  // overhead beacon: a lit box with a down arrow, hung from the ceiling (wordless; the chevrons pulse in live)
  for (const rx of [cx - 9, cx + 8]) { p.vl(rx, 17, 13, C.steel0); p.px(rx, 17, C.steel2); }
  const bx = cx - 12, by = 30;
  p.rect(bx, by, 24, 18, C.void); p.rect(bx + 1, by + 1, 22, 16, C.mint0); p.rect(bx + 2, by + 2, 20, 14, C.ink);
  p.hl(bx + 1, by + 1, 22, C.mint1);
  for (const [cxx, cyy] of beaconChevrons(cx)) chevron(p, cxx, cyy, C.mint0);
  for (let j = 0; j < 4; j++) p.dith(bx + 2 - j, by + 19 + j, 20 + 2 * j, 1, null, C.mint0, Math.max(0, 3 - j));
  // halo on the wall: it's the floor's main interaction
  for (let j = -6; j < h - 6; j++) {
    const lvl = Math.max(0, 3 - Math.floor(Math.abs(j - 14) / 10));
    p.dith(x - 5, y + j, w + 10, 1, null, C.mint0, lvl);
  }
  // header lightbox
  p.rect(x + 1, y, w - 2, 11, C.void); p.rect(x + 2, y + 1, w - 4, 9, C.mint1); p.hl(x + 2, y + 1, w - 4, C.mint2);
  p.text('BADGE', x + ((w - 29) >> 1), y + 2, C.ink);
  // cabinet
  const by2 = y + 11;
  p.rect(x, by2, w, h - 17, C.void);
  p.rect(x + 1, by2, w - 2, h - 18, C.stone3);
  p.vl(x + 1, by2, h - 18, C.cream); p.vl(x + w - 2, by2, h - 18, C.stone1); p.hl(x + 1, by2 + h - 19, w - 2, C.stone1);
  p.dith(x + 2, by2 + 30, w - 4, h - 49, null, C.stone2, 4);
  // big screen
  p.rect(x + 4, by2 + 3, w - 8, 17, C.void); p.rect(x + 5, by2 + 4, w - 10, 15, C.ink);
  // printer slot + printed badge
  p.rect(x + 6, by2 + 23, w - 12, 3, C.void); p.hl(x + 7, by2 + 24, w - 14, C.ink);
  p.rect(x + 12, by2 + 26, 16, 10, C.cream2); p.hl(x + 12, by2 + 33, 16, C.mint1); p.rect(x + 14, by2 + 28, 4, 4, C.stone2); p.hl(x + 20, by2 + 28, 6, C.stone1); p.hl(x + 20, by2 + 30, 5, C.stone1);
  p.vl(x + 27, by2 + 26, 10, C.stone2);
  // reader + label
  p.rect(x + 5, by2 + 38, 9, 5, C.void); p.rect(x + 6, by2 + 39, 7, 3, C.navy2);
  p.text('PRESS E', x + 16, by2 + 38, C.stone0, 'f3');
  // plinth with hazard edge
  p.rect(x - 2, y + h - 6, w + 4, 6, C.void);
  for (let i = 0; i < w + 2; i++) p.px(x - 1 + i, y + h - 5, ((x + i) % 4) < 2 ? C.yellow : C.ink);
  p.rect(x - 1, y + h - 4, w + 2, 3, C.navy2); p.hl(x - 1, y + h - 4, w + 2, C.steel0);
}

const beaconChevrons = cx => [[cx, 33], [cx, 37], [cx, 41]];
function chevron(p, cx, y, c) {
  for (let k = 0; k < 3; k++) { p.px(cx - 4 + k, y + k, c); p.px(cx - 3 + k, y + k, c); p.px(cx + 3 - k, y + k, c); p.px(cx + 2 - k, y + k, c); }
}

// CLAUDE.md demo: a big red plunger button on a hazard-striped post just east of the board (between the alcove
// and the decision booth), wired back into the board. Wordless. The dome + collar are live (it sinks when pressed).
const buttonCx = () => F0.button.x + (F0.button.w >> 1);
function buttonPost(p) {
  const cx = buttonCx(), hy = GY - 32; // housing top
  // conduit from the housing back west into the board frame
  const bx = F0.notice.x + 9 + 64; // board's east edge
  p.rect(bx, hy + 3, cx - 7 - bx, 3, C.void); p.hl(bx, hy + 4, cx - 7 - bx, C.rust1); p.px(bx, hy + 4, C.rust2);
  // post: hazard-striped column on a steel foot
  p.rect(cx - 3, hy + 9, 7, GY - hy - 11, C.void);
  for (let j = hy + 9; j < GY - 2; j++) for (let i = cx - 2; i <= cx + 2; i++) p.px(i, j, ((i + j) % 6) < 3 ? C.yellow : C.ink);
  p.vl(cx - 2, hy + 9, GY - hy - 11, C.void);
  p.rect(cx - 7, GY - 3, 15, 3, C.void); p.hl(cx - 6, GY - 3, 13, C.steel1); p.hl(cx - 6, GY - 2, 13, C.navy2);
  // housing
  p.rect(cx - 7, hy, 15, 10, C.void); p.rect(cx - 6, hy + 1, 13, 8, C.steel0);
  p.hl(cx - 6, hy + 1, 13, C.steel2); p.hl(cx - 6, hy + 8, 13, C.navy2);
  p.px(cx - 5, hy + 4, C.steel2); p.px(cx + 5, hy + 4, C.steel2);
  // soft red spill on the wall behind the dome
  p.dith(cx - 9, hy - 14, 19, 6, null, C.rust0, 3);
  // the sign (user-approved demo text: "a big DO NOT TOUCH button")
  const lw = 27, ly = hy - 46; // above the booth's header line
  p.vl(cx, ly + 15, hy - ly - 15, C.steel0); p.vl(cx + 1, ly + 15, hy - ly - 15, C.void); // bracket down to the housing
  p.rect(cx - 13, ly, lw, 15, C.void); p.rect(cx - 12, ly + 1, lw - 2, 13, C.red);
  p.hl(cx - 12, ly + 1, lw - 2, C.rust3); p.hl(cx - 12, ly + 13, lw - 2, C.rust0);
  p.text('DO NOT', cx - 11, ly + 2, C.cream2, 'f3'); p.text('TOUCH', cx - 9, ly + 8, C.cream2, 'f3');
}
function buttonDome(p, top, sink) {
  const cx = buttonCx(), hy = top + GY - 32, cy = hy - 3; // collar top
  const dh = 7 - sink, dy = cy - dh; // visible dome rows above the collar
  p.rect(cx - 5, dy, 11, dh, C.void); p.rect(cx - 4, dy - 1, 9, 1, C.void);
  p.rect(cx - 4, dy, 9, dh, C.red); p.hl(cx - 3, dy, 4, C.pink); if (dh > 2) { p.px(cx - 4, dy + 1, C.rust3); p.px(cx - 2, dy + 1, C.pink); }
  p.hl(cx - 4, dy + dh - 1, 9, C.rust1); p.vl(cx + 4, dy, dh, C.rust1);
  // hazard collar
  p.rect(cx - 6, cy, 13, 3, C.void);
  for (let i = cx - 5; i <= cx + 5; i++) p.px(i, cy + 1, ((i + 1) % 4) < 2 ? C.yellow : C.ink);
  p.hl(cx - 5, cy, 11, C.amber);
}

function booth(ctx, p) {
  const B = F0.booth;
  const x = B.x, w = B.w, top = 70;
  // calm back panel (no busy pattern)
  steelPanels(p, x + 3, top + 9, w - 6, GY - top - 9, { ramp: [C.navy, C.navy2, C.steel0, C.steel1], pw: 22, seed: 4 });
  p.dithV(x + 3, top + 9, w - 6, 6, C.ink, 10, 0);
  p.rect(x, top, w, 10, C.void); p.rect(x + 1, top + 1, w - 2, 8, C.navy2); p.hl(x + 1, top + 1, w - 2, C.steel1); p.hl(x + 1, top + 8, w - 2, C.ink);
  p.text('DECISION', x + ((w - 47) >> 1), top + 2, C.amber);
  p.rect(x - 2, top - 2, w + 4, 2, C.void); p.hl(x - 1, top - 2, w + 2, C.steel0);
  column(p, x, top + 9, GY, { w: 3 });
  column(p, x + w - 3, top + 9, GY, { w: 3 });
  const tx = x + ((w - 46) >> 1), ty = GY - 14;
  p.rect(tx, ty, 46, 3, C.void); p.hl(tx + 1, ty, 44, C.steel1); p.hl(tx + 1, ty + 1, 44, C.steel0);
  p.rect(tx + 3, ty + 3, 3, 11, C.void); p.rect(tx + 40, ty + 3, 3, 11, C.void);
  p.vl(tx + 4, ty + 3, 11, C.steel0); p.vl(tx + 41, ty + 3, 11, C.steel0);
  const c = crt();
  p.rect(c.x, c.y, c.w, c.h, C.void);
  p.rect(c.x + 1, c.y + 1, c.w - 2, c.h - 2, C.stone3); p.hl(c.x + 1, c.y + 1, c.w - 2, C.cream); p.vl(c.x + 1, c.y + 1, c.h - 2, C.cream);
  p.vl(c.x + c.w - 2, c.y + 2, c.h - 3, C.stone1);
  p.rect(c.sx - 1, c.sy - 1, c.sw + 2, c.sh + 2, C.stone1);
  p.rect(c.sx, c.sy, c.sw, c.sh, C.ink);
  p.text('00-D', c.x + 2, c.y + c.h - 6, C.stone1, 'f3');
  p.rect(tx + 6, ty - 2, 12, 2, C.void); p.hl(tx + 7, ty - 2, 10, C.stone2);
  const q = 'ALREADY DECIDED?';
  p.text(q, x + ((w - (q.length * 4 - 1)) >> 1), top + 14, C.steel2, 'f3');
}

export function crt() {
  const x = F0.booth.x + ((F0.booth.w - 24) >> 1), y = GY - 36;
  return { x, y, w: 24, h: 22, sx: x + 4, sy: y + 3, sw: 16, sh: 12 };
}

function eastWing(ctx, p) {
  const D = F0.directory;
  screen(ctx, D.x, D.y, D.w, D.h, null, { bezel: 'steel', glow: true });
}

// ------------------------------------------------------------------ fore (in front of NPCs)
export function fore(ctx) {
  const p = pen(ctx);
  const D = F0.desk;
  const y = D.top;
  p.rect(D.x, y, D.w, GY - y, C.void);
  p.rect(D.x + 1, y, D.w - 2, GY - y - 1, C.wood1);
  for (let k = D.x + 1; k < D.x + D.w - 1; k += 8) p.vl(k, y, GY - y - 1, C.wood0);
  p.dithV(D.x + 1, y, D.w - 2, 4, C.void, 9, 0);
  p.rect(D.x + 5, y + 4, D.w - 10, 10, C.void); p.rect(D.x + 6, y + 5, D.w - 12, 8, C.navy);
  const txt = 'RECEPTION';
  p.textShadow(txt, D.x + ((D.w - (txt.length * 6 - 1)) >> 1), y + 5, C.cream, C.ink);
  p.rect(D.x, GY - 3, D.w, 3, C.void); p.hl(D.x + 1, GY - 3, D.w - 2, C.steel0);
}

// ------------------------------------------------------------------ live
export function live(ctx, top, t, s, draw, animate) {
  const p = pen(ctx);
  const { notice } = F0;
  const st = id => s.result.rooms[id].state;
  doorLight(p, notice.x + (notice.w >> 1) - 1, top + 18, st('noticeboard'), t);
  // THE MODEL: two weights in the chip light up in turn (a few px per second)
  const llm = F0.stations.find(q => q.id === 'station-llm'), lp = s.props.find(q => q.id === 'station-llm');
  if (llm && !lp?.broken) {
    const c = modelChip(llm.cx), k = Math.floor(t * 3);
    for (let n = 0; n < 2; n++) {
      const i = 2 + 2 * Math.floor(hash(k * 2 + n) * 7), j = 2 + 2 * Math.floor(hash(k * 2 + n + 50) * 5);
      p.px(c.x + i, top + c.y + j, C.mint2);
    }
  }
  // THE HARNESS: one pulse runs down each cable from tool to socket
  const har = F0.stations.find(q => q.id === 'station-harness'), hp = s.props.find(q => q.id === 'station-harness');
  if (har && !hp?.broken) {
    harnessCables(har.cx).forEach((c, n) => {
      const f = ((t * 0.9 + n * 0.37) % 1);
      p.px(Math.round(c.x0 + (c.x1 - c.x0) * f), top + Math.round(c.y0 + (c.y1 - c.y0) * f), C.mint2);
    });
  }
  // kiosk beacon: the down chevrons light one after another
  const kcx = F0.kiosk.x + (F0.kiosk.w >> 1);
  const lit = Math.floor(t * 2.5) % 4;
  beaconChevrons(kcx).forEach(([cx, cy], n) => { if (n < lit) chevron(p, cx, top + cy, n === lit - 1 ? C.mint2 : C.mint1); });
  // kiosk screen (static content; only a cursor blinks)
  const kp = s.props.find(q => q.id === 'kiosk');
  if (!kp.broken) {
    const { x, y, w } = F0.kiosk;
    const sx = x + 5, sy = top + y + 15;
    p.dith(sx, sy, w - 10, 15, null, C.mint0, 5);
    p.text('NEEDS', sx + 2, sy + 1, C.mint1, 'f3');
    p.text(String(s.badge.size).padStart(2, '0'), sx + 2, sy + 6, C.mint2, 'f3');
    if (Math.floor(t * 2) % 2) p.rect(sx + 11, sy + 6, 2, 5, C.mint2);
    for (let k = 0; k < 12; k++) p.px(sx + 2 + k * 2, sy + 13, k < s.badge.size ? C.mint2 : C.navy2);
    p.px(x + w - 6, top + y + 51, Math.floor(t) % 3 === 0 ? C.amber : C.rust0);
  }
  // decision CRT
  const c = crt();
  const on = s.decision.state !== 'off';
  if (on) {
    p.dith(c.sx, top + c.sy, c.sw, c.sh, null, C.mint0, 5);
    p.text('YES', c.sx + 2, top + c.sy + 1, C.mint2, 'f3');
    p.text('NO', c.sx + 2, top + c.sy + 7, C.mint1, 'f3');
    if (Math.floor(t * 2) % 2) p.rect(c.sx + 11, top + c.sy + 7, 2, 4, C.mint2);
    for (let j = 0; j < 4; j++) p.dith(c.sx - 6 - j, top + c.sy + c.sh + 3 + j, c.sw + 12 + 2 * j, 1, null, C.mint0, Math.max(0, 3 - j));
  } else {
    p.dith(c.sx, top + c.sy, c.sw, c.sh, null, C.navy, 3);
  }
  p.px(c.x + c.w - 4, top + c.y + c.h - 5, on ? C.mint2 : C.red);
  if (!s.props.find(q => q.id === 'scr-directory')?.broken) directory(p, top, s);
  buttonDome(p, top, Math.round(pressTravel(s.demos.button.t, ANIM.press) * 3));
}

export function doorLight(p, x, y, state) {
  const c = LIGHT[state] ?? C.navy2;
  p.rect(x, y, 10, 5, C.void); p.rect(x + 1, y + 1, 8, 3, C.steel0);
  p.rect(x + 2, y + 1, 6, 2, c);
  if (state === 'primary' || state === 'denied') {
    p.px(x + 3, y + 1, state === 'primary' ? C.cream2 : C.rust3);
    for (let j = 0; j < 4; j++) p.dith(x - j, y + 5 + j, 10 + 2 * j, 1, null, state === 'primary' ? C.mint1 : C.red, Math.max(0, 4 - j));
  }
}

export function floorState(s, f) {
  const order = { primary: 3, supporting: 2, denied: 1, off: 0 };
  let best = 'off';
  for (const r of ROOMS) if (r.floor === f) { const v = s.result.rooms[r.id].state; if (order[v] > order[best]) best = v; }
  return best;
}

// Facility directory: floor names only (user: listing every room was too noisy). Dot = best badge state on that floor.
function directory(p, top, s) {
  const D = F0.directory;
  const x = D.x + 4, y = top + D.y + 3, w = D.w - 8;
  p.rect(x, y, w, 9, C.mint0);
  const title = 'FACILITY DIRECTORY';
  p.text(title, x + ((w - (title.length * 6 - 1)) >> 1), y + 1, C.mint2);
  const widest = Math.max(...Object.entries(FLOOR_NAMES).map(([f, n]) => `LEVEL 0${f} · ${n}`.length)) * 6 - 1 + 8;
  const col = x + ((w - widest) >> 1) + 8;
  for (let f = 0; f <= 5; f++) {
    const ry = y + 13 + f * 10;
    const st = floorState(s, f);
    const c = st === 'primary' ? C.mint2 : st === 'supporting' ? C.mint1 : st === 'denied' ? C.red : C.steel0;
    p.rect(col - 8, ry + 2, 4, 4, c);
    p.text(`LEVEL 0${f} · ${FLOOR_NAMES[f]}`, col, ry, f === s.player.floor ? C.cream2 : C.mint1);
  }
}
