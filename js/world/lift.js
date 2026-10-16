import { floorTop, FH } from './levels.js?v=68';

export const GATE_TIME = 0.4;

// Gate: 'open' -> 'closing' -> 'closed' (car travels) -> 'opening' -> 'open'.
// gateT: 0 = fully open, 1 = fully closed.
export function createLift() {
  return { y: floorTop(0), target: 0, moving: false, speed: 160, gate: 'open', gateT: 0 };
}

export const liftFloor = l => Math.round(l.y / FH);
export const liftBusy = l => l.moving || l.gate !== 'open';
export const atFloor = (l, f) => l.y === floorTop(f);

export function requestTravel(l, target) {
  l.target = target;
  return l;
}

export function canBoard(l, floor) {
  return !l.moving && l.gate === 'open' && atFloor(l, floor);
}

// Returns 'arrived' exactly once per trip (when the car stops, before the gate opens), else null.
export function updateLift(l, dt) {
  const ty = floorTop(l.target);
  if (l.gate === 'open') {
    if (l.y === ty) return null;
    l.gate = 'closing';
  }
  if (l.gate === 'closing') {
    l.gateT = Math.min(1, l.gateT + dt / GATE_TIME);
    if (l.gateT >= 1) l.gate = 'closed';
    return null;
  }
  if (l.gate === 'opening') {
    l.gateT = Math.max(0, l.gateT - dt / GATE_TIME);
    if (l.gateT <= 0) l.gate = 'open';
    return null;
  }
  // closed: travel
  if (l.y === ty) {
    l.moving = false;
    l.gate = 'opening';
    return null;
  }
  l.moving = true;
  const d = Math.sign(ty - l.y);
  l.y += d * l.speed * dt;
  if ((d > 0 && l.y >= ty) || (d < 0 && l.y <= ty)) {
    l.y = ty;
    l.moving = false;
    l.gate = 'opening';
    return 'arrived';
  }
  return null;
}

export function chooseTarget(selected, fate) {
  return fate === 'hell' ? 6 : selected;
}

export function liftOptions(s) {
  const opts = [0, 1, 2, 3, 4, 5];
  if (s.decision.fate === 'heaven') opts.unshift(-1);
  return opts;
}

// Gate: the lift stays locked (call + board) until the badge has a chip or the decision terminal set a fate.
// Once unlocked it stays unlocked for the run.
export function liftUnlocked(s) {
  if (!s.liftUnlocked && (s.badge.size > 0 || s.decision.fate || s.intern)) s.liftUnlocked = true;
  return !!s.liftUnlocked;
}

export function liftUse(s) {
  if (!liftUnlocked(s)) return 'locked';
  if (canBoard(s.lift, s.player.floor)) return 'panel';
  if (!liftBusy(s.lift) || s.lift.target !== s.player.floor) requestTravel(s.lift, s.player.floor);
  return 'called';
}
