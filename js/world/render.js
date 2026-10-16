// World renderer: baked static layers per floor (offscreen canvases) + live layer per frame.
import { W, H } from '../engine/screen.js?v=68';
import { PAL, C } from '../art/palette.js?v=68';
import { drawText, textWidth } from '../engine/font.js?v=68';
import { drawSprite, PLAYER, npcSprite, npcColors, GUN } from '../art/sprites.js?v=68';
import { pen } from '../art/kit/wall.js?v=68';
import { drawFloorPlaque, drawShaft, drawShaftHead, drawShaftPit, drawCar, drawCounterweight, drawCables, drawCallBox, CAR_W, CAR_H } from '../art/kit/lift.js?v=68';
import { ROOMS, FH, ROOM_H, WW, SHAFT_X, SHAFT_W, CAM_DY, CALL_BOX, floorTop, groundY, FLOOR_NAMES } from './levels.js?v=68';
import { readableAt } from './read.js?v=68';
import { speechLayout, LINE_H, popStep, popRows, POP_FRAMES } from './bubbles.js?v=68';
import { liftFloor, liftBusy } from './lift.js?v=68';
import { targetAt } from './interact.js?v=68';
import { hash } from '../engine/hash.js?v=68';
import * as f0 from './zones/f0.js?v=68';
import * as f1 from './zones/f1.js?v=68';
import * as f2 from './zones/f2.js?v=68';
import * as f3 from './zones/f3.js?v=68';
import * as f4 from './zones/f4.js?v=68';
import * as f5 from './zones/f5.js?v=68';
import { bakeSurface, bakeBedrock } from './zones/generic.js?v=68';
import { drawHellFloor, drawHellWorld, drawHellShaft } from '../scenes/hell.js?v=68';
import { drawHeavenFloor, drawHeavenHatch, drawHeavenSpill } from '../scenes/ascension.js?v=68';

const CAR_X = SHAFT_X + ((SHAFT_W - CAR_W) >> 1);
const layers = new Map();

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return c;
}

function layer(f) {
  if (layers.has(f)) return layers.get(f);
  const back = canvas(WW, FH);
  const bctx = back.getContext('2d');
  let fore = null;
  if (f === -1) bakeSurface(bctx);
  else if (f === 6) bakeBedrock(bctx);
  else {
    if (f === 0) {
      f0.bake(bctx);
      fore = canvas(WW, FH);
      f0.fore(fore.getContext('2d'));
    } else if (f === 1) f1.bake(bctx);
    else if (f === 2) f2.bake(bctx);
    else if (f === 3) f3.bake(bctx);
    else if (f === 4) {
      f4.bake(bctx);
      fore = canvas(WW, FH);
      f4.fore(fore.getContext('2d'));
    } else if (f === 5) f5.bake(bctx);
    drawShaft(bctx, SHAFT_X, SHAFT_W, 0, FH, { floors: [{ f, top: 0, plaque: [] }], roomH: ROOM_H });
    if (f === 5) drawShaftPit(bctx, SHAFT_X + 2, SHAFT_W - 4, ROOM_H, FH - ROOM_H);
  }
  const L = { back, fore };
  layers.set(f, L);
  return L;
}

// Cached live screen content: re-rendered only when its key changes.
const screens = new Map();
function makeDraw(ctx, top) {
  return {
    cached(key, rect, fn) {
      const [x, y, w, h] = rect;
      const id = rect.join(',');
      let e = screens.get(id);
      if (!e) { e = { c: canvas(w - 8, h - 8), key: null }; screens.set(id, e); }
      if (e.key !== key) {
        const cctx = e.c.getContext('2d');
        cctx.clearRect(0, 0, w - 8, h - 8);
        fn(cctx, 0, 0, w - 8, h - 8);
        e.key = key;
      }
      ctx.drawImage(e.c, x + 4, top + y + 4);
    },
  };
}

const rideTo = (s, f) => s.lift.target === f && (liftBusy(s.lift) || s.player.floor === f);

export function drawWorld(ctx, s, t) {
  ctx.fillStyle = PAL[C.void];
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  const cx = Math.round(s.cam.x), cy = Math.round(s.cam.y);
  ctx.translate(-cx, -cy);
  const fa = Math.max(-1, Math.floor(cy / FH));
  const fb = Math.min(6, Math.floor((cy + H) / FH));
  const heavenRide = rideTo(s, -1) || s.sequence?.kind === 'asc';
  const hellRide = (s.decision.fate === 'hell' && rideTo(s, 6)) || s.sequence?.kind === 'hell';
  const focus = Math.round((cy + CAM_DY) / FH); // only this floor's ticker moves

  for (let f = fa; f <= fb; f++) {
    const top = floorTop(f);
    if (f === -1 && heavenRide) { drawHeavenFloor(ctx, top, t, s.sequence?.kind === 'asc' ? s.sequence : null); continue; }
    if (f === 6 && hellRide) { drawHellFloor(ctx, top, t); continue; }
    ctx.drawImage(layer(f).back, 0, top);
    const animate = f === focus;
    if (f === 0) f0.live(ctx, top, t, s, makeDraw(ctx, top), animate);
    else if (f === 1) f1.live(ctx, top, t, s, makeDraw(ctx, top), animate);
    else if (f === 2) f2.live(ctx, top, t, s, makeDraw(ctx, top), animate);
    else if (f === 3) f3.live(ctx, top, t, s, makeDraw(ctx, top), animate);
    else if (f === 4) f4.live(ctx, top, t, s);
    else if (f === 5) f5.live(ctx, top, t, s);
  }
  if (heavenRide && fa <= 0 && fb >= 0) drawHeavenSpill(ctx);
  drawShaftLive(ctx, s, t, fa, fb, heavenRide, hellRide);

  for (const pr of s.props) if (pr.floor >= fa && pr.floor <= fb) drawDamage(ctx, pr, floorTop(pr.floor), t);
  if (!s.gun.taken && fa <= 3 && fb >= 3) {
    const gy = groundY(3) - GUN.h;
    drawSprite(ctx, GUN, s.gun.x, gy);
    const p = pen(ctx);
    // glint: a small star every ~1.4 s so the pickup is findable
    const gt = t % 1.4;
    if (gt < 0.35) { const gx = s.gun.x + 2; p.px(gx, gy - 1, C.cream2); if (gt < 0.2) { p.px(gx - 1, gy - 1, C.yellow); p.px(gx + 1, gy - 1, C.yellow); p.px(gx, gy - 2, C.yellow); } }
    p.dith(s.gun.x - 2, gy + GUN.h, GUN.w + 4, 1, null, C.void, 8);
  }
  // strapped = the Ludovico chair man, drawn seated by zones/f5.js until he is freed
  const visible = s.npcs.filter(n => !n.ghost && !n.strapped && n.floor >= fa && n.floor <= fb);
  for (const n of visible) if (n.behind) drawNpc(ctx, n, t);
  for (let f = Math.max(0, fa); f <= Math.min(5, fb); f++) { const L = layer(f); if (L.fore) ctx.drawImage(L.fore, 0, floorTop(f)); }
  for (const n of visible) if (!n.behind) drawNpc(ctx, n, t);
  drawCue(ctx, s, t);
  if (s.player.alive) { if (!s.player.hidden) drawPlayer(ctx, s.player, t); f3.drawHeld(ctx, s); f4.drawCarry(ctx, s); }
  const p = pen(ctx);
  for (const b of s.bullets) { p.rect(Math.round(b.x), Math.round(b.y), 3, 1, C.yellow); p.px(Math.round(b.x) - b.dir, Math.round(b.y), C.amber); }
  drawFx(ctx, s);
  drawBubbles(ctx, s);
  if (s.sequence?.kind === 'hell') drawHellWorld(ctx, s.sequence);
  ctx.restore();
}

function drawShaftLive(ctx, s, t, fa, fb, heavenRide, hellRide) {
  const l = s.lift;
  if (hellRide) drawHellShaft(ctx); // the pit floor is torn open; below it the car hangs in the cavern
  // heaven: no shaft above level 00 — the hatch swings open and the car rides up into the open sky
  const headY = 0;
  const carTop = Math.round(l.y) + ROOM_H - 6 - CAR_H + 4;
  // counterweight mirrors the car
  const span = floorTop(5) - floorTop(0);
  const cwY = Math.round(floorTop(0) + span - (l.y - floorTop(0)) * 1) + 40;
  drawCables(ctx, [CAR_X + (CAR_W >> 1) - 3, CAR_X + (CAR_W >> 1), CAR_X + (CAR_W >> 1) + 3], heavenRide ? floorTop(-2) : headY + 18, carTop, {});
  drawCables(ctx, [SHAFT_X + SHAFT_W - 6], headY + 18, cwY, {});
  drawCounterweight(ctx, SHAFT_X + SHAFT_W - 9, cwY);
  if (heavenRide) drawHeavenHatch(ctx, Math.max(0, Math.min(1, (70 - carTop) / 50)));
  else if (fa <= 0) drawShaftHead(ctx, SHAFT_X, SHAFT_W, headY, {});
  for (let f = Math.max(0, fa); f <= Math.min(5, fb); f++) drawFloorPlaque(ctx, SHAFT_X, SHAFT_W, floorTop(f), [`LEVEL 0${f}`, FLOOR_NAMES[f]]);
  const moving = l.moving ? Math.sign(floorTop(l.target) - l.y) : 0;
  const lf = liftFloor(l);
  const readout = lf < 0 ? '↑' : lf > 5 ? '??' : `0${lf}`;
  if (!hellRide && !heavenRide) { // dithered shadow halo behind the car (not in the open cavern)
    const q = pen(ctx), hcx = CAR_X + (CAR_W >> 1), hcy = carTop + (CAR_H >> 1);
    for (let j = -48; j <= 48; j++) for (let i = -38; i <= 38; i++) {
      const d = Math.sqrt((i / 38) ** 2 + (j / 48) ** 2);
      if (d > 1) continue;
      const X = hcx + i, Y = hcy + j;
      if (X < SHAFT_X + 2 || X > SHAFT_X + SHAFT_W - 3) continue;
      if ((X + Y) % 2 === 0 && d > 0.55 && ((X >> 1) + (Y >> 1)) % 2 === 0) q.px(X, Y, C.ink);
    }
  }
  drawCar(ctx, CAR_X, carTop, { readout, lamp: liftBusy(l) || Math.floor(t * 0.5) % 4 !== 0, gateT: l.gateT, arrow: moving, t });
  for (let f = Math.max(0, fa); f <= Math.min(5, fb); f++) {
    const here = !l.moving && l.y === floorTop(f);
    drawCallBox(ctx, CALL_BOX.x, floorTop(f) + 90, {
      ready: here && l.gate === 'open', called: l.target === f && !here, fate: !!s.decision.fate && f === 0, t, digits: readout,
    });
  }
}

// Persistent, visible damage on shot props (drawn over the baked layer).
function screenRect(pr, top) {
  const x = pr.x, y = top + pr.y;
  if (pr.kind === 'kiosk') return [x + 5, y + 15, pr.w - 10, 15];
  if (pr.kind === 'station') return [x + 4, y + 2, pr.w - 8, 22];
  if (pr.kind === 'terminal') return [x + 1, y + 2, pr.w - 2, 8];
  if (pr.kind === 'screen') return [x + 3, y + 3, pr.w - 6, pr.h - 6];
  if (pr.kind === 'slogan') return [x + 4, y + 4, pr.w - 8, pr.h - 8]; // the Ludovico projection screen's face
  return null;
}

function crack(p, x, y, w, h, ix, iy, seed) {
  p.rect(x, y, w, h, C.void);
  p.dith(x, y, w, h, null, C.ink, 6);
  ix = Math.max(x + 1, Math.min(x + w - 2, ix)); iy = Math.max(y + 1, Math.min(y + h - 2, iy));
  for (let k = 0; k < 6; k++) {
    const a = k * 1.05 + hash(seed + k) * 0.8, len = 4 + hash(seed * 3 + k) * Math.max(w, h) * 0.6;
    const ex = Math.round(Math.max(x, Math.min(x + w - 1, ix + Math.cos(a) * len)));
    const ey = Math.round(Math.max(y, Math.min(y + h - 1, iy + Math.sin(a) * len * 0.7)));
    p.line(ix, iy, ex, ey, k % 2 ? C.steel1 : C.steel0);
  }
  p.rect(ix - 1, iy - 1, 3, 3, C.void); p.px(ix, iy, C.steel2);
  for (let k = 0; k < 3; k++) p.px(x + Math.floor(hash(seed + 40 + k) * w), y + Math.floor(hash(seed + 50 + k) * h), C.mint0);
}

function drawDamage(ctx, pr, top, t) {
  if (!pr.broken) return;
  const p = pen(ctx);
  const seed = Math.floor(hash(pr.id.length * 97 + pr.x) * 1e6);
  const x = pr.x, y = top + pr.y, w = pr.w, h = pr.h;
  const hit = pr.hitAt ? { x: Math.round(pr.hitAt.x), y: Math.round(pr.hitAt.y) } : { x: x + (w >> 1), y: y + (h >> 1) };
  const sr = screenRect(pr, top);
  if (sr) {
    const [sx, sy, sw, sh] = sr;
    crack(p, sx, sy, sw, sh, pr.hitAt ? hit.x : sx + (sw >> 1), pr.hitAt && hit.y >= sy && hit.y < sy + sh ? hit.y : sy + (sh >> 1), seed);
    if (pr.kind === 'kiosk') { p.rect(x + 2, y + 1, w - 4, 9, C.navy); p.text('BADGE', x + ((w - 29) >> 1), y + 2, C.navy2); }
  } else if (pr.kind === 'sign') {
    for (let k = 0; k < 3; k++) {
      const lx = x + 6 + Math.floor(hash(seed + k) * (w - 14)), ly = y + 3 + Math.floor(hash(seed + 9 + k) * Math.max(1, h - 11));
      p.rect(lx, ly, 6, 8, C.void); p.dith(lx - 2, ly - 2, 10, 12, null, C.ink, 5);
    }
    p.line(x + w - 2, y + 1, x + w - 12, y + h - 1, C.void); // plate cracked across a corner
  } else if (pr.kind === 'board') {
    p.disc(x + 32, y + 20, 4, C.void); p.ring(x + 32, y + 20, 5, C.wood0);
    for (let k = 0; k < 5; k++) p.px(x + 20 + k * 6, y + h + 2 + (k % 2), C.cream);
  } else if (pr.kind === 'rack') {
    p.dith(x + 4, y + 18, w - 8, 30, null, C.void, 9);
    p.line(hit.x, hit.y - 3, hit.x + 3, hit.y + 3, C.steel1);
    if ((t % 1.7) < 0.08) { p.px(x + 10 + Math.floor(hash(seed + Math.floor(t)) * (w - 20)), y + 30, C.cream2); p.px(x + 12, y + 31, C.amber); }
  } else if (pr.kind === 'crate') {
    p.rect(x + 6, y + 5, w - 12, h - 9, C.void);
    for (let k = 0; k < 4; k++) p.line(x + 6 + k * 3, y + 5, x + 4 + k * 4, y + 1, C.wood1);
  }
  // thin smoke wisp from shot screens/racks (2 px, slow)
  if (sr || pr.kind === 'rack') {
    for (let k = 0; k < 2; k++) {
      const ph = ((t * 0.5 + k * 0.5 + hash(seed + k)) % 1);
      const wx = (sr ? sr[0] + (sr[2] >> 1) : x + (w >> 1)) + Math.round(Math.sin((t + k) * 2) * 2);
      p.px(wx, Math.round((sr ? sr[1] : y + 12) - 2 - ph * 14), ph < 0.5 ? C.steel0 : C.navy2);
    }
  }
}

function drawFx(ctx, s) {
  const p = pen(ctx);
  for (const f of s.fx ?? []) {
    if (f.kind === 'spark') p.px(Math.round(f.x), Math.round(f.y), f.life > 0.15 ? C.cream2 : C.amber);
    else p.px(Math.round(f.x), Math.round(f.y), f.life > 0.5 ? C.steel0 : C.navy2);
  }
}

function npcFrame(n, t) {
  const ph = hash(n.x * 13 + n.floor) * 10;
  const tt = t + ph;
  if ((tt % 3.7) < 0.14) return 2;
  if (n.idle === 'type') return Math.floor(tt * 3.3) % 2;
  if (n.idle === 'sip') return (tt % 5) < 1.1 ? 1 : 0;
  if (n.idle === 'glasses') return (tt % 6) < 0.6 ? 1 : 0;
  return 0;
}

function drawNpc(ctx, n, t) {
  const spr = npcSprite(n.outfit, npcFrame(n, t), n.idle);
  const lean = n.idle === 'lean' && (t + n.x) % 8 < 4 ? 1 : 0;
  const x = n.x + lean, y = groundY(n.floor) - spr.h - (n.raise ?? 0);
  if (!n.behind) pen(ctx).dith(x - 1, groundY(n.floor) - 1, spr.w + 2, 2, null, C.void, 8);
  drawSprite(ctx, spr, x, y, { colors: npcColors(n), flip: n.flip });
}

function drawPlayer(ctx, p, t) {
  const frame = p.walking ? (Math.floor(p.t * 8) % 2 ? PLAYER.walk1 : PLAYER.walk2) : PLAYER.idle;
  const x = Math.round(p.x - (frame.w >> 1));
  const y = Math.round(p.y - frame.h);
  const q = pen(ctx);
  q.dith(x - 1, Math.round(p.y) - 1, frame.w + 2, 2, null, C.void, 10);
  drawSprite(ctx, frame, x, y, { flip: p.facing < 0 });
  // stink lines
  for (let c = 0; c < 3; c++) {
    const sx0 = x + 3 + c * 4;
    for (let k = 0; k < 5; k++) {
      if ((k + c + Math.floor(t * 4)) % 5 === 4) continue;
      const sx = sx0 + Math.round(Math.sin(t * 3 + c * 2 + k * 0.9) * 1.2);
      q.px(sx, y - 2 - k * 2 - ((Math.floor(t * 5) + c) % 2), k < 2 ? C.mint1 : C.mint0);
    }
  }
  // flies orbit the head
  for (let i = 0; i < 3; i++) {
    const a = t * (4 + i) + i * 2.1;
    const fx = Math.round(x + 7 + Math.cos(a) * (8 + i * 2)), fy = Math.round(y + 3 + Math.sin(a * 1.3) * 4);
    q.px(fx, fy, C.void);
    if (Math.floor(t * 20 + i) % 2) q.px(fx, fy - 1, C.steel2);
  }
}

// Interaction cue: 1 px mint corner brackets around the target + bobbing chevron.
function drawCue(ctx, s, t) {
  if (s.sequence) return; // no interaction cues during the endings
  const tgt = targetAt(s);
  const rd = tgt ? null : readableAt(s);
  if (!tgt && !rd) return;
  let x, y, w, h, noArrow = false;
  if (tgt?.kind === 'lift') {
    const ly = Math.round(s.lift.y) + ROOM_H - 6 - CAR_H + 4;
    x = CAR_X - 2; y = ly - 2; w = CAR_W + 4; h = CAR_H + 2;
  } else if (tgt?.kind === 'npc') {
    const n = tgt.npc;
    x = n.x - 2; y = groundY(n.floor) - 22 - (n.raise ?? 0) - 2; w = 14; h = 26;
  } else {
    const pr = tgt ? tgt.prop : rd;
    const f = pr.cueFrame ?? pr; // cueFrame: brackets round the whole thing (e.g. a hook gate and its plate)
    x = f.x - 2; y = floorTop(pr.floor) + f.y - 2; w = f.w + 4; h = f.h + 4;
    if (pr.cueFrame) noArrow = true; // the room sign sits right above it
  }
  const p = pen(ctx);
  const L = 5, col = tgt?.locked ? C.amber : tgt ? C.mint2 : C.mint1;
  for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w - 1, y, -1, 1], [x, y + h - 1, 1, -1], [x + w - 1, y + h - 1, -1, -1]]) {
    p.hl(dx > 0 ? cx : cx - L + 1, cy, L, col); p.vl(cx, dy > 0 ? cy : cy - L + 1, L, col);
  }
  if (!tgt || noArrow) return; // read-only: brackets only, the box pops up by itself
  const bob = Math.round((Math.sin(t * Math.PI * 2) + 1));
  const chx = x + (w >> 1), chy = y - 8 + bob;
  p.rect(chx - 3, chy, 7, 1, C.mint2); p.rect(chx - 2, chy + 1, 5, 1, C.mint2); p.rect(chx - 1, chy + 2, 3, 1, C.mint2); p.px(chx, chy + 3, C.mint2);
  p.px(chx - 3, chy - 1, C.mint0); p.px(chx + 3, chy - 1, C.mint0);
}

let popSeen = new Map();
function drawBubbles(ctx, s) {
  const view = { x: Math.round(s.cam.x), y: Math.round(s.cam.y), w: W, h: H };
  const p = pen(ctx);
  const list = speechLayout(s, view);
  popSeen = popStep(popSeen, list.map(b => b.key));
  for (const b of list) {
    const { x, y, w, h } = b.rect;
    const n = popSeen.get(b.key);
    const opening = n < POP_FRAMES;
    if (opening) { // pop in top-down: only the first rows of the bubble (and no tail) this frame
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 1, y - 1, w + 2, popRows(h + 2, n));
      ctx.clip();
    }
    p.rect(x - 1, y - 1, w + 2, h + 2, C.void);
    p.rect(x, y, w, h, C.cream2); p.hl(x, y + h - 1, w, C.stone3);
    // tail toward the speaker when the bubble sits above their head
    const tx = Math.max(x + 2, Math.min(x + w - 4, Math.round(b.ax)));
    if (y + h <= b.head.y && !opening) {
      const len = Math.min(4, b.head.y - (y + h));
      p.rect(tx, y + h, 2, Math.max(1, len - 1), C.cream2); p.px(tx, y + h + Math.max(1, len - 1), C.void);
    }
    b.lines.forEach((l, i) => drawText(ctx, l, x + 3, y + 2 + i * LINE_H, PAL[C.ink]));
    if (opening) ctx.restore();
  }
}

export { ROOMS };
