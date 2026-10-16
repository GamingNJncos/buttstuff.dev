// Ascension: the "not an MCP" ending. The lift rises through the hatch above level 00 into heaven,
// St. Peter waves you in, then a palette-dither fade to white, then black and the last word.
// Logic (createAscension / updateAscension / ascensionWhite) is DOM-free.
import { W, H } from '../engine/screen.js?v=68';
import { PAL, C } from '../art/palette.js?v=68';
import { BAYER4 } from '../art/dither.js?v=68';
import { drawText, textWidth } from '../engine/font.js?v=68';
import { COPY } from '../logic/copy.js?v=68';
import { WW, FH, ROOM_H, SHAFT_X, SHAFT_W, groundY } from '../world/levels.js?v=68';
import { hash } from '../engine/hash.js?v=68';
import { pen } from '../art/kit/wall.js?v=68';

export const PETER_HOLD = 2.6;   // St. Peter's line stays up this long before the gate opens
export const GATE_OPEN_TIME = 1; // both leaves swing in over this long
export const IDLE_TIMEOUT = 6;   // gate open and the player doesn't move: fade anyway
export const FADE_UP = 2.5;      // up to white over this long
export const FADE_DOWN = 1.5;    // then from near-white down to black over this long
export const FADE_TOTAL = FADE_UP + FADE_DOWN + 1; // fade to white, to black, the last word
export const HEAVEN_CAM_X = 330; // framing: car, podium and the whole gate
export const HEAVEN_CAM_LIFT = 38; // camera sits this much higher than a normal floor (no lobby below in shot)
export const PETER_X = 575;      // head rect x (bubble anchor)
export const HEAVEN_MIN_X = SHAFT_X + 16; // can't walk back out past the lift side
export const HEAVEN_GATE_X = 624;         // reaching the gate opening starts the fade
export const HEAVEN_MAX_X = 650;

// Phases: 'line' (St. Peter talks, gate closed) -> 'opening' (gate 'opening', gateT 0..1)
// -> 'walk' (gate 'open', player has control) -> 'fade' (on reaching the gate, or IDLE_TIMEOUT without moving).
export function createAscension() {
  return { kind: 'asc', t: 0, phase: 'line', gate: 'closed', gateT: 0, idle: 0, lastX: null, ft: 0, trigger: null, done: false };
}

export function updateAscension(a, dt, p = null) {
  a.t += dt;
  if (a.phase === 'line') {
    if (a.t >= PETER_HOLD) { a.phase = 'opening'; a.gate = 'opening'; }
    return;
  }
  if (a.phase === 'opening') {
    a.gateT = Math.min(1, a.gateT + dt / GATE_OPEN_TIME);
    if (a.gateT >= 1) { a.gate = 'open'; a.phase = 'walk'; a.idle = 0; a.lastX = p ? p.x : null; }
    return;
  }
  if (a.phase === 'walk') {
    if (p && a.lastX != null && Math.abs(p.x - a.lastX) > 1e-6) a.idle = 0;
    else a.idle += dt;
    if (p) a.lastX = p.x;
    const reached = !!p && p.x >= HEAVEN_GATE_X;
    if (reached || a.idle >= IDLE_TIMEOUT) { a.phase = 'fade'; a.ft = 0; a.trigger = reached ? 'gate' : 'timeout'; }
    return;
  }
  a.ft += dt;
  if (a.ft > FADE_TOTAL) a.done = true;
}

// The bubble-only NPC for St. Peter (drawn by the heaven art, spoken through the bubble system).
export function peterNpc() {
  return { id: 'peter', floor: -1, x: PETER_X, ghost: true, raise: 16, bubble: { text: COPY.peter, t: 1e9, age: 0 }, pending: null, cooldown: 1e9, last: -1 };
}

// White level 0..1 (t measured from the start of the fade phase): up to white over FADE_UP, back down over
// black over FADE_DOWN (never a one-frame flip).
export function ascensionWhite(t) {
  if (t < FADE_UP) return Math.max(0, Math.min(1, t / FADE_UP));
  if (t < FADE_UP + FADE_DOWN) return Math.max(0, Math.min(1, 1 - (t - FADE_UP) / FADE_DOWN));
  return 0;
}

// ---------------------------------------------------------------- art
const TOPX = 64;               // heaven is drawn from 64 px above its floor top (camera sits higher)
const GL = ROOM_H - 6;         // cloud ground (local y)
const BH = TOPX + FH;
const GATE = { l0: 602, l1: 616, r0: 724, r1: 738, cx: 670 };
let ART = null;

function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d').imageSmoothingEnabled = false;
  return c;
}

// rounded billow edge: x -> lift above base
function billows(seed, bw, bh) {
  const off = Math.floor(hash(seed * 131) * bw);
  return x => {
    const i = Math.floor((x + off) / bw), u = ((x + off) % bw) / bw, w = 0.45 + 0.55 * hash(seed * 977 + i * 31);
    return Math.round(bh * w * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)));
  };
}

function bakeSky(p) {
  // hard bands with short Bayer ramps: cream at the top, a white glow at the horizon, gold bands
  const B = [[C.cream, -TOPX], [C.yellow, -36], [C.cream, -33], [C.cream2, 26], [C.white, 70], [C.cream2, 98], [C.yellow, 106], [C.cream2, 109], [C.white, 116]];
  for (let y = -TOPX; y < FH; y++) {
    let k = 0;
    for (let q = 1; q < B.length; q++) if (y >= B[q][1]) k = q;
    for (let x = 0; x < WW; x++) {
      let c = B[k][0];
      if (k < B.length - 1) { const d = B[k + 1][1] - y; if (d <= 4 && BAYER4[y & 3][x & 3] < (5 - d) * 3) c = B[k + 1][0]; }
      p.px(x, y, c);
    }
  }
  // soft, hard-edged cloud bands across the upper sky: billowed tops with a white rim, a cream underside
  for (const [base, th, bw, bh, seed, body] of [[-48, 7, 26, 6, 61, C.cream2], [-22, 6, 34, 7, 62, C.cream2], [8, 5, 22, 5, 63, C.white]]) {
    const ft = billows(seed, bw, bh), fb = billows(seed + 50, Math.round(bw * 0.7), 3);
    for (let x = 0; x < WW; x++) {
      // banks with gaps: a slow mask decides where a band has cloud at all
      const mk2 = Math.sin(x * 0.011 + seed) + 0.6 * Math.sin(x * 0.029 + seed * 2);
      if (mk2 < 0.15) continue;
      const t0 = base - ft(x), b0 = base + th + fb(x);
      for (let y = t0; y <= b0; y++) p.px(x, y, y === t0 ? C.white : y === b0 ? C.cream : y === b0 - 1 && (x & 1) ? C.cream : body);
    }
  }
  // light rays fanning down from behind the gate (dither only)
  const sx = GATE.cx, sy = -30;
  for (let y = -TOPX; y < GL; y++) for (let x = 0; x < WW; x++) {
    const a = Math.atan2(y - sy, x - sx);
    if (a <= 0.15 || a >= Math.PI - 0.15) continue;
    const band = Math.floor(a / 0.085);
    if (band % 3) continue;
    const d = Math.hypot(x - sx, y - sy), lv = Math.max(0, Math.round(10 - d / 45));
    if (lv && BAYER4[y & 3][x & 3] < lv) p.px(x, y, y < -30 ? C.cream : y < 26 ? C.cream2 : C.white);
  }
  // sunburst behind the arch
  for (let r = 0; r < 3; r++) for (let x = GATE.cx - 70; x < GATE.cx + 70; x++) for (let y = -10; y < 60; y++) {
    const d = Math.hypot(x - GATE.cx, (y - 30) * 1.1);
    if (d < 64 - r * 14 && BAYER4[y & 3][x & 3] < 4 + r * 4) p.px(x, y, r === 2 ? C.white : C.cream2);
  }
}

// a cloud strip (transparent canvas WW wide) with hard-edged pixel clouds
function cloudStrip(seed, n, h, sizes, fill, under, rim, edge) {
  const c = mk(WW, h), ctx = c.getContext('2d'), p = pen(ctx);
  for (let i = 0; i < n; i++) {
    const cx = Math.floor(hash(seed * 71 + i * 13) * WW), cy = Math.floor(h * 0.35 + hash(seed * 17 + i * 7) * h * 0.4);
    const w = sizes[0] + Math.floor(hash(seed * 29 + i) * (sizes[1] - sizes[0])), hh = Math.max(4, Math.round(w * 0.32));
    const top = billows(seed * 5 + i, Math.max(6, Math.round(w / 3)), Math.round(hh * 0.9));
    for (let k = -1; k <= w + 1; k++) {
      const x = (cx + k) % WW;
      const u = k / w, env = Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2));
      const t0 = cy - Math.round(top(k) * env) - Math.round(hh * 0.35 * env), b0 = cy + Math.round(hh * 0.25 * Math.min(1, env * 3));
      if (b0 - t0 < 1 || env <= 0) continue;
      for (let y = t0; y <= b0; y++) {
        let col = fill;
        if (y === t0) col = rim;
        else if (y >= b0 - 1) col = edge;
        else if (y > cy - 1) col = under;
        p.px(x, y, col);
      }
      if (k <= 0 || k >= w) p.vl(x, t0, b0 - t0 + 1, rim);
    }
  }
  return c;
}

function pearl(p, x, y, r) {
  p.disc(x, y, r, C.white); p.ring(x, y, r, C.stone3);
  p.px(x - (r >> 1), y - (r >> 1), C.white); p.px(x + (r >> 1), y + (r >> 1), C.cream2); p.px(x + (r >> 1) + 1, y + (r >> 1), C.steel3);
}

function gate(p) {
  const { l0, l1, r0, r1, cx } = GATE;
  // glow inside the gateway: pure white with soft gold dither at the bottom
  p.rect(l1, 40, r0 - l1, GL - 40, C.white);
  p.dithV(l1, GL - 20, r0 - l1, 20, C.cream2, 0, 8);
  // marble step
  p.rect(l0 - 8, GL - 5, r1 - l0 + 16, 5, C.stone3); p.rect(l0 - 7, GL - 5, r1 - l0 + 14, 4, C.cream2);
  p.hl(l0 - 7, GL - 5, r1 - l0 + 14, C.yellow); p.hl(l0 - 7, GL - 1, r1 - l0 + 14, C.stone3);
  p.rect(l0 - 4, GL - 9, r1 - l0 + 8, 4, C.stone3); p.rect(l0 - 3, GL - 9, r1 - l0 + 6, 3, C.white); p.hl(l0 - 3, GL - 9, r1 - l0 + 6, C.yellow);
  // pillars of pearl
  for (const x0 of [l0, r0]) {
    p.rect(x0, 40, 14, GL - 49, C.stone3);
    p.rect(x0 + 1, 40, 12, GL - 49, C.white);
    p.vl(x0 + 9, 40, GL - 49, C.cream2); p.vl(x0 + 11, 40, GL - 49, C.steel3); p.vl(x0 + 12, 40, GL - 49, C.cream);
    for (let y = 46; y < GL - 12; y += 9) { p.hl(x0 + 1, y, 12, C.cream); p.px(x0 + 3, y + 3, C.cream2); }
    // gold capital + base bands
    for (const y of [40, GL - 14]) { p.rect(x0 - 2, y, 18, 4, C.amber); p.hl(x0 - 2, y, 18, C.yellow); p.hl(x0 - 2, y + 3, 18, C.brass); }
    pearl(p, x0 + 7, 34, 5);
  }
  // golden arch with pearls
  for (let y = -6; y < 42; y++) for (let x = l0 - 2; x < r1 + 2; x++) {
    const d = Math.hypot(x - cx, (y - 40) * 1.18);
    if (d >= 56 && d < 60) p.px(x, y, d < 57 ? C.yellow : d < 59 ? C.amber : C.brass);
    else if (d >= 49 && d < 51 && y < 40) p.px(x, y, d < 50 ? C.yellow : C.brass);
  }
  for (let a = 0.18; a < Math.PI - 0.1; a += 0.26) pearl(p, Math.round(cx + Math.cos(a) * 54.5), Math.round(40 - (Math.sin(a) * 54.5) / 1.18), 2);
  pearl(p, cx, -14, 6);
  for (const s of [-1, 1]) for (let k = 0; k < 6; k++) p.px(cx + s * (7 + k), -14 - (k >> 1), C.yellow); // wings of the keystone
}

// The gate leaves, live: g = 0 shut (a hand's width apart), 1 swung fully in (foreshortened to their hinges).
function doors(p, top, g) {
  const { l1, r0, cx } = GATE;
  const topAt = x => 40 - Math.round(Math.sqrt(Math.max(0, 52 * 52 - (x - cx) ** 2)) / 1.18) + 12;
  const k = 1 - 0.84 * g;
  const leaf = (hinge, len, dir, drop) => {
    const end = hinge + dir * Math.round(len * k);
    for (let i = 0; i <= len; i += 5) {
      const x = hinge + dir * Math.round(i * k), ty = topAt(hinge + dir * i) + drop;
      p.vl(x, top + ty, GL - 9 - ty, C.amber); if (k > 0.4 || i % 10 === 0) p.vl(x + 1, top + ty, GL - 9 - ty, C.yellow);
      p.px(x, top + ty - 1, C.yellow); p.px(x + 1, top + ty - 2, C.cream2); p.px(x, top + ty - 2, C.yellow);
    }
    const a = Math.min(hinge, end), w = Math.abs(end - hinge) + 2;
    for (const y of [62, 96, GL - 12]) { p.hl(a - 1, top + y, w, C.brass); p.hl(a - 1, top + y - 1, w, C.yellow); }
    for (let i = 4; i < len - 3; i += 10) {
      const x = hinge + dir * Math.round(i * k), r = Math.max(1, Math.round(4 * k));
      if (r > 1) p.ring(x, top + 79, r, C.yellow); p.px(x, top + 79, C.amber);
    }
    // the leaf edge catches the light as it turns
    if (g > 0) p.vl(end + (dir > 0 ? 1 : -1), top + 52, GL - 61, C.white);
  };
  leaf(l1 + 2, cx - 4 - (l1 + 2), 1, 0);
  leaf(r0 - 2, r0 - 2 - (cx + 3), -1, 1);
}

// Light spilling out of the gateway as it opens: a dithered fan over the steps and the cloud floor.
function spill(p, top, g) {
  if (g <= 0) return;
  const { cx } = GATE;
  for (let y = GL - 30; y < GL + 26; y++) {
    const hw = Math.round((30 + Math.max(0, y - (GL - 12)) * 2.4) * g + 4);
    const lv0 = Math.round(9 * g * (y < GL - 9 ? 0.5 : 1));
    for (let x = cx - hw; x < cx + hw; x++) {
      const lv = Math.round(lv0 * (1 - Math.abs(x - cx) / hw));
      if (lv > 0 && BAYER4[(top + y) & 3][x & 3] < lv) p.px(x, top + y, lv > 4 ? C.white : C.yellow);
    }
  }
}

function podium(p) {
  const x = PETER_X - 29, y = GL - 13, w = 22;
  p.rect(x, y, w, 13, C.wood0); p.rect(x + 1, y + 1, w - 2, 11, C.wood1);
  p.vl(x + 2, y + 2, 9, C.brass); p.vl(x + w - 3, y + 2, 9, C.wood0);
  p.rect(x + 6, y + 3, w - 12, 6, C.brass); p.rect(x + 7, y + 4, w - 14, 4, C.yellow); p.px(x + 7, y + 4, C.cream2);
  // slanted top with a big open ledger
  p.rect(x - 2, y - 3, w + 4, 3, C.wood0); p.hl(x - 2, y - 3, w + 4, C.brass);
  p.rect(x + 2, y - 6, 10, 3, C.cream2); p.rect(x + 13, y - 6, 10, 3, C.cream2); p.vl(x + 12, y - 6, 3, C.stone2);
  p.hl(x + 3, y - 5, 7, C.stone3); p.hl(x + 14, y - 5, 6, C.stone3);
  p.vl(x + 20, y - 9, 4, C.ink); p.px(x + 21, y - 10, C.white); // quill
}

// St. Peter, 20x39: bald, white fringe and long beard, robe, gold sash with the keys, clipboard.
const PETER_TOP = [
  '......ssssss........',
  '.....ssssssss.......',
  '....sssssssssS......',
  '...wssssssssssw.....',
  '...wsseessseesw.....',
  '...wsssssnsssSw.....',
  '...wwssssssssww.....',
  '....wwwsmmswww......',
  '....wwwwwwwwwW......',
  '....wwwwwwwwWW......',
  '.....wwwwwwwWW......',
  '...rrwwwwwwWWrr.....',
  '..rrrrwwwwwWrrrr....',
  '.rrrrrrwwwWrrrrRR...',
  '.rrrrrrrwWrrrrrRRs..',
  '.rrcCCCCCcrrrrrRRs..',
  '.rrcpppppcrrrrrRR...',
  '.rscplllpcrrrrrRR...',
  '.rscpppppcrrrrrRR...',
  '.rrcplllpcrrrrrRR...',
  '.rrcpppppcrrrrrRR...',
  '.rrcccccccrrrrrRR...',
  '.yyyyyyyyyyyyyyyY...',
];
const PCOL = { s: C.skin, S: C.skinDark, n: C.skinDark, e: C.ink, m: C.skinDark, w: C.white, W: C.cream2, r: C.white, R: C.cream2, q: C.cream, c: C.wood1, C: C.steel1, p: C.white, l: C.stone2, y: C.yellow, Y: C.amber, k: C.yellow, K: C.amber, b: C.wood0 };
let PETER_SPR = null;

function peterSprite() {
  if (PETER_SPR) return PETER_SPR;
  const W2 = 24, H2 = 46, c = mk(W2, H2), q = pen(c.getContext('2d')), ox = 2, oy = 5;
  PETER_TOP.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') q.px(ox + i, oy + j, PCOL[ch]); }));
  // lower robe, widening to the hem, with folds and the keys hanging off the sash
  for (let j = 23; j < 38; j++) {
    const x0 = 1 - (j > 32 ? 1 : 0), x1 = 17 + (j > 28 ? 1 : 0);
    for (let i = x0; i < x1; i++) {
      let col = C.white;
      if (i >= x1 - 3) col = C.cream2;
      if (i === x1 - 1) col = C.cream;
      if (i === 5 || i === 10) col = j % 3 ? C.cream2 : C.white;
      q.px(ox + i, oy + j, col);
    }
  }
  q.hl(ox + 1, oy + 37, 17, C.cream);
  q.hl(ox + 2, oy + 38, 4, C.wood0); q.hl(ox + 11, oy + 38, 4, C.wood0); q.px(ox + 3, oy + 38, C.skin); q.px(ox + 12, oy + 38, C.skin);
  // keys
  q.vl(ox + 12, oy + 23, 3, C.amber); q.ring(ox + 12, oy + 27, 1, C.yellow); q.vl(ox + 12, oy + 28, 4, C.yellow); q.px(ox + 13, oy + 31, C.yellow); q.px(ox + 13, oy + 29, C.amber);
  q.vl(ox + 14, oy + 23, 2, C.amber); q.ring(ox + 14, oy + 26, 1, C.amber); q.vl(ox + 14, oy + 27, 3, C.amber); q.px(ox + 15, oy + 29, C.amber);
  // halo
  q.hl(ox + 5, 1, 8, C.yellow); q.px(ox + 4, 2, C.yellow); q.px(ox + 13, 2, C.amber); q.hl(ox + 5, 3, 8, C.amber); q.px(ox + 6, 1, C.white); q.px(ox + 7, 1, C.white);
  // outline
  const cc = c.getContext('2d'), d = cc.getImageData(0, 0, W2, H2).data, on = (i, j) => i >= 0 && j >= 0 && i < W2 && j < H2 && d[(j * W2 + i) * 4 + 3] > 0;
  for (let j = 0; j < H2; j++) for (let i = 0; i < W2; i++) if (!on(i, j) && (on(i - 1, j) || on(i + 1, j) || on(i, j - 1) || on(i, j + 1))) q.px(i, j, C.stone1);
  PETER_SPR = c;
  return c;
}

// head (cols 3..14, rows 0..10 of PETER_TOP) lines up with peterNpc()'s head rect: x PETER_X, y ground - 39
function peter(ctx, top) {
  ctx.drawImage(peterSprite(), PETER_X - 5, top + GL - 39 - 5);
}

function groundClouds(p) {
  // stacked rows of billows, each with a hard rim and its own shading: a cloud floor in layers
  const L = [[GL - 2, 22, 7, 41], [GL + 13, 17, 6, 42], [GL + 27, 28, 7, 43], [GL + 40, 14, 5, 44]];
  for (const [base, bw, bh, seed] of L) {
    const f = billows(seed, bw, bh);
    for (let x = 0; x < WW; x++) {
      const t0 = base - f(x);
      for (let y = t0; y < FH; y++) {
        const d = y - t0;
        let c = d === 0 ? C.stone3 : d < 4 ? C.white : BAYER4[y & 3][x & 3] < Math.min(14, (d - 3) * 2) ? C.cream2 : C.white;
        if (d > 9 && BAYER4[y & 3][x & 3] < Math.min(8, d - 9)) c = C.cream;
        p.px(x, y, c);
      }
    }
  }
}

// Cloud underside spilling down through the open hatch over the lobby ceiling (during the ride).
export function drawHeavenSpill(ctx) {
  const p = pen(ctx), f = billows(51, 19, 6);
  for (let x = 0; x < WW; x++) {
    if (x > SHAFT_X - 1 && x < SHAFT_X + SHAFT_W + 1) continue;
    const d = 2 + f(x) + (x > SHAFT_X - 60 && x < SHAFT_X + SHAFT_W + 60 ? 4 : 0);
    p.vl(x, 0, d, C.cream); p.px(x, d, C.stone3);
    if (d > 3) p.px(x, d - 1, BAYER4[d & 3][x & 3] < 8 ? C.cream2 : C.cream);
  }
}

function bake() {
  if (ART) return ART;
  const back = mk(WW, BH), b = back.getContext('2d');
  b.translate(0, TOPX);
  bakeSky(pen(b));
  const far = cloudStrip(3, 26, 70, [22, 46], C.cream2, C.cream2, C.white, C.cream);
  const near = cloudStrip(9, 14, 60, [34, 70], C.white, C.cream2, C.white, C.steel3);
  const mid = mk(WW, BH), m = mid.getContext('2d');
  m.translate(0, TOPX);
  const p = pen(m);
  gate(p);
  podium(p);
  groundClouds(p);
  ART = { back, far, near, mid };
  return ART;
}

function strip(ctx, c, x, y) {
  ctx.drawImage(c, x, y); ctx.drawImage(c, x - WW, y);
}

export function drawHeavenFloor(ctx, top, t, seq = null) {
  const A = bake();
  ctx.drawImage(A.back, 0, top - TOPX);
  // parallax drift: far layer slow, near layer faster
  strip(ctx, A.far, Math.floor(t * 0.7) % WW, top - 40);
  strip(ctx, A.near, Math.floor(t * 2.2 + 300) % WW, top + 18);
  ctx.drawImage(A.mid, 0, top - TOPX);
  const p = pen(ctx), g = seq ? seq.gateT : 0;
  doors(p, top, g);
  spill(p, top, g);
  peter(ctx, top);
  // a few slow golden twinkles
  for (let i = 0; i < 14; i++) {
    const ph = (t * 0.35 + hash(i * 41 + 3)) % 1;
    if (ph > 0.3) continue;
    const x = Math.floor(hash(i * 13 + 1) * WW), y = top - 40 + Math.floor(hash(i * 7 + 2) * 150), big = ph > 0.08 && ph < 0.22;
    p.px(x, y, C.white);
    if (big) { p.px(x - 1, y, C.yellow); p.px(x + 1, y, C.yellow); p.px(x, y - 1, C.yellow); p.px(x, y + 1, C.yellow); }
  }
}

// Hatch above level 00, its leaves swinging down against the shaft walls while the car comes up (0 closed .. 1 open).
export function drawHeavenHatch(ctx, open01) {
  const p = pen(ctx), x = SHAFT_X, w = SHAFT_W, L = w >> 1, th = (open01 * Math.PI) / 2;
  for (const [hx, dir] of [[x, 1], [x + w, -1]]) {
    for (let s = 0; s < L; s++) for (let k = 0; k < 4; k++) {
      const px = Math.round(hx + dir * Math.cos(th) * s - dir * Math.sin(th) * k);
      const py = Math.round(Math.sin(th) * s - Math.cos(th) * k);
      p.px(px, py, k === 3 ? C.steel1 : ((s + k) % 8) < 4 ? C.yellow : C.ink);
    }
  }
  // concrete lip of the opening
  for (const sx of [x - 4, x + w - 2]) { p.rect(sx, 0, 6, 8, C.void); p.rect(sx + 1, 1, 4, 6, C.steel0); p.hl(sx + 1, 1, 4, C.steel2); }
}

// Fade overlay built from 4x4 Bayer tiles (palette colours only, no alpha blending).
const tiles = new Map();
function tile(level, col) {
  const key = `${level}-${col}`;
  if (tiles.has(key)) return tiles.get(key);
  const c = mk(4, 4), x = c.getContext('2d');
  x.fillStyle = PAL[col];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) if (BAYER4[j][i] < level) x.fillRect(i, j, 1, 1);
  tiles.set(key, c);
  return c;
}

function ditherFill(ctx, level, col) {
  if (level <= 0) return;
  if (level >= 16) { ctx.fillStyle = PAL[col]; ctx.fillRect(0, 0, W, H); return; }
  ctx.fillStyle = ctx.createPattern(tile(level, col), 'repeat');
  ctx.fillRect(0, 0, W, H);
}

// cream -> white ramp over 32 steps of the white level
function whiteRamp(ctx, w) {
  ditherFill(ctx, Math.min(16, Math.round((w / 0.7) * 16)), C.cream2);
  if (w > 0.7) ditherFill(ctx, Math.round(((w - 0.7) / 0.3) * 16), C.white);
}

export function drawAscensionScreen(ctx, a) {
  if (a.phase !== 'fade') return;
  const ft = a.ft;
  if (ft >= FADE_UP) { ctx.fillStyle = PAL[C.void]; ctx.fillRect(0, 0, W, H); }
  const w = ascensionWhite(ft);
  if (w > 0) whiteRamp(ctx, w);
  if (ft < FADE_UP + FADE_DOWN) return;
  drawText(ctx, COPY.heaven, (W - textWidth(COPY.heaven)) >> 1, (H >> 1) - 4, PAL[C.cream2]);
  if (a.done) drawText(ctx, COPY.restart, (W - textWidth(COPY.restart)) >> 1, H - 20, PAL[C.steel2]);
}
