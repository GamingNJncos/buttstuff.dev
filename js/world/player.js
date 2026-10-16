import { groundY, SPAWN_X } from './levels.js?v=68';

export const SPEED = 110;

export function createPlayer() {
  return { x: SPAWN_X, floor: 0, y: groundY(0), facing: 1, walking: false, t: 0, idle: 0, inLift: false, hasGun: false, alive: true };
}

// factor scales walking speed (1 = normal; the level 04 subagent binders slow you down).
export function updatePlayer(p, dt, move, bounds, factor = 1) {
  p.walking = move !== 0;
  if (move) p.facing = move;
  p.x = Math.max(bounds.min, Math.min(bounds.max, p.x + move * SPEED * factor * dt));
  p.t += dt;
  p.idle = p.walking ? 0 : p.idle + dt;
}
