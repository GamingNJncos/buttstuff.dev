// Shared floor-prop bodies (terminals, crates) + their live overlays, the surface crust above 00 and the bedrock
// under 05. Every floor 00-05 has its own zone file (zones/f0.js … f5.js).
import { C, pen } from './common.js?v=68';
import { crate } from '../../art/kit/furniture.js?v=68';
import { ROOMS, SHAFT_X, SHAFT_W, WW } from '../levels.js?v=68';
import { doorLight } from './f0.js?v=68';

// Static body of floor props (live overlays add screens, LEDs and damage).
export function bakeProp(ctx, p, pr) {
  const x = pr.x, y = pr.y;
  if (pr.kind === 'terminal') {
    p.rect(x, y + 12, pr.w, pr.h - 12, C.void); p.rect(x + 1, y + 13, pr.w - 2, pr.h - 13, C.steel0); p.vl(x + 1, y + 13, pr.h - 13, C.steel1);
    p.rect(x - 2, y, pr.w + 4, 13, C.void); p.rect(x - 1, y + 1, pr.w + 2, 11, C.stone2); p.rect(x + 1, y + 2, pr.w - 2, 8, C.ink);
  } else if (pr.kind === 'crate') {
    crate(ctx, x, y, { w: pr.w, h: pr.h, label: '', seed: x });
  }
}

export function liveFloor(ctx, top, t, s, f) {
  const p = pen(ctx);
  for (const r of ROOMS.filter(q => q.floor === f)) doorLight(p, r.x + (r.w >> 1) - 5, top + 18, s.result.rooms[r.id].state);
  for (const pr of s.props) {
    if (pr.floor !== f || pr.broken) continue;
    const x = pr.x, y = top + pr.y;
    if (pr.kind === 'terminal') {
      p.dith(x + 1, y + 2, pr.w - 2, 8, null, C.mint0, 5);
      p.hl(x + 2, y + 4, 8, C.mint2); p.hl(x + 2, y + 7, 11, C.mint1);
      p.px(x + pr.w - 3, y + 15, Math.floor(t * 2) % 2 ? C.mint2 : C.mint0);
    }
  }
}

// Surface strip above floor 00 (bake into a WW x 180 canvas; local y 0..180 = world -180..0).
// Only the bottom ~22 px are on screen: a thin night strip, the yard and the capped headframe.
export function bakeSurface(ctx) {
  const p = pen(ctx);
  const G = 170; // yard surface (world -10)
  p.rect(0, 0, WW, 180, C.void);
  for (let j = 120; j < G; j++) p.dith(0, j, WW, 1, C.void, C.ink, Math.min(16, Math.round(((j - 120) / (G - 120)) * 14)));
  for (let i = 0; i < WW; i++) {
    const r = p.rnd(i, 1, 21);
    if (r < 0.05) p.px(i, 140 + Math.floor(p.rnd(i, 2, 21) * 24), r < 0.012 ? C.cream2 : r < 0.025 ? C.steel1 : C.navy2);
  }
  for (let i = 0; i < WW; i++) { const hgt = Math.round(2 + 2 * Math.sin(i / 53) + Math.sin(i / 13 + 1)); p.rect(i, G - hgt, 1, hgt, C.ink); }
  p.disc(860, 162, 3, C.cream); p.px(861, 161, C.cream2);
  // yard + fence
  p.rect(0, G, WW, 4, C.stone0); p.hl(0, G, WW, C.stone2); p.noise(0, G + 1, WW, 3, C.hairDark, 0.3, 4);
  for (let i = 0; i < WW; i++) {
    if (i > 230 && i < 590) continue;
    if (i % 16 === 0) p.vl(i, G - 7, 7, C.steel0);
    if ((i + (i >> 2)) % 3 === 0) p.px(i, G - 6 + (i % 5), C.navy2);
    p.px(i, G - 7, i % 2 ? C.navy2 : C.void);
  }
  // street lamps
  for (const lx of [110, 700, 900]) {
    p.vl(lx, G - 9, 9, C.steel0); p.hl(lx - 2, G - 10, 5, C.amber);
    for (let j = 0; j < 8; j++) p.dith(lx - 2 - (j >> 1), G - 9 + j, 5 + (j >> 1) * 2, 1, null, C.amber, Math.max(0, 3 - (j >> 2)));
  }
  // gatehouse (low) with lit windows
  p.rect(150, G - 9, 50, 9, C.navy2); p.hl(148, G - 10, 54, C.steel0);
  for (const wx of [156, 170, 184]) { p.rect(wx, G - 7, 7, 4, C.amber); p.px(wx + 1, G - 7, C.cream2); }
  // capped headframe: squat steel housing on a concrete collar over the shaft
  const hx = SHAFT_X + (SHAFT_W >> 1);
  p.rect(SHAFT_X - 10, G - 3, SHAFT_W + 20, 13, C.stone1); p.hl(SHAFT_X - 10, G - 3, SHAFT_W + 20, C.stone3);
  for (let j = G; j < 180; j += 4) p.hl(SHAFT_X - 10, j, SHAFT_W + 20, C.stone0);
  p.rect(SHAFT_X + 6, G - 14, SHAFT_W - 12, 11, C.void); p.rect(SHAFT_X + 7, G - 13, SHAFT_W - 14, 10, C.steel0);
  p.hl(SHAFT_X + 7, G - 13, SHAFT_W - 14, C.steel2);
  for (let i = SHAFT_X + 9; i < SHAFT_X + SHAFT_W - 9; i += 6) p.vl(i, G - 11, 7, C.navy2);
  for (let i = 0; i < SHAFT_W - 14; i++) p.px(SHAFT_X + 7 + i, G - 4, ((i >> 2) % 2) ? C.yellow : C.ink);
  p.disc(hx, G - 16, 4, C.void); p.ring(hx, G - 16, 4, C.steel1); p.px(hx, G - 16, C.steel2);
  p.vl(hx + 18, G - 20, 7, C.steel0); p.px(hx + 18, G - 21, C.red);
  // lobby ceiling slab
  p.rect(0, 174, WW, 6, C.stone1); p.hl(0, 174, WW, C.stone2); p.hl(0, 179, WW, C.void);
}

// Bedrock under floor 05 (local 0..180 = world 1080..1260).
export function bakeBedrock(ctx) {
  const p = pen(ctx);
  p.rect(0, 0, WW, 180, C.stone0);
  p.mottle(0, 0, WW, 180, C.hairDark, 12, 10, 3);
  p.mottle(0, 0, WW, 180, C.stone1, 9, 5, 4);
  p.noise(0, 0, WW, 180, C.void, 0.04, 5);
  for (let i = 0; i < 90; i++) {
    const rx = Math.floor(p.rnd(i, 1, 6) * WW), ry = Math.floor(p.rnd(i, 2, 6) * 170);
    p.rect(rx, ry, 5, 3, C.stone1); p.hl(rx, ry, 4, C.stone2); p.px(rx + 4, ry + 2, C.void);
  }
  for (let i = 0; i < WW; i += 1) if (p.rnd(i, 3, 7) < 0.02) p.line(i, 20 + (i % 140), i + 14, 26 + (i % 140), C.rust0);
  p.dithV(0, 0, WW, 12, C.void, 12, 0);
}
