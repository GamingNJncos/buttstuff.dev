import { floorTop, WW } from './levels.js?v=68';
import { COPY } from '../logic/copy.js?v=68';
import { liftBusy } from './lift.js?v=68';
import { playerHeld } from './concept.js?v=68';

export const BULLET_SPEED = 300;

// Space fires only when armed, cooled down, standing in the open: never while shut in the vim booth or riding the lift.
export function canFire(s) {
  const p = s.player;
  if (!p.hasGun || s.fireCooldown > 0 || p.hidden || playerHeld(s)) return false;
  return !(p.inLift && liftBusy(s.lift));
}

export function fire(p) {
  return { x: p.x + p.facing * 8, y: p.y - 12, dir: p.facing, alive: true };
}

export function propRect(pr) {
  return { x: pr.x, y: floorTop(pr.floor) + pr.y, w: pr.w, h: pr.h };
}

export function stepBullets(bullets, props, dt) {
  const hits = [];
  for (const b of bullets) {
    const nx = b.x + b.dir * BULLET_SPEED * dt;
    const x0 = Math.min(b.x, nx);
    const x1 = Math.max(b.x, nx);
    let hit = null;
    let hitD = Infinity;
    for (const pr of props) {
      if (!pr.shootable || pr.broken) continue;
      const r = propRect(pr);
      if (b.y < r.y || b.y >= r.y + r.h) continue;
      if (x1 < r.x || x0 > r.x + r.w) continue;
      const d = b.dir > 0 ? r.x - b.x : b.x - (r.x + r.w);
      if (d < hitD) { hitD = d; hit = pr; }
    }
    if (hit) {
      hit.broken = true;
      hit.hitAt = { x: b.dir > 0 ? Math.max(b.x, propRect(hit).x) : Math.min(b.x, propRect(hit).x + hit.w), y: b.y, t: 0 };
      hit.hitText = COPY.shot[hit.kind] ?? null;
      b.alive = false;
      hits.push(hit.id);
    } else {
      b.x = nx;
      if (b.x < 0 || b.x > WW) b.alive = false;
    }
  }
  for (let i = bullets.length - 1; i >= 0; i--) if (!bullets[i].alive) bullets.splice(i, 1);
  return hits;
}
