// Overlay (plate) input logic. The plates themselves are DOM (js/ui/plates.js).
import { CHIPS, evaluate } from '../logic/gauntlet.js?v=68';
import { COPY } from '../logic/copy.js?v=68';
import { SHAFT_X, SHAFT_W } from './levels.js?v=68';
import { liftOptions, chooseTarget, requestTravel, liftBusy } from './lift.js?v=68';
import { answer, noteSurfaceUse } from './decision.js?v=68';
import { play } from '../engine/audio.js?v=68';
import { KEYS } from '../engine/input.js?v=68';

// A HUD button (MAP / BADGE / DIRECTORY) opens its plate, except during an ending or a lift ride. BADGE opens the
// kiosk, so on level 00 it counts as the first use exactly like walking up to the kiosk and pressing E.
export function openPlate(s, type) {
  if (s.sequence || (s.player.inLift && liftBusy(s.lift))) return false;
  if (type === 'kiosk') noteSurfaceUse(s, 'kiosk');
  s.overlay = { type, cursor: 0, t: 0 };
  return true;
}

const pressed = (input, codes) => codes.some(c => input.wasPressed(c));

// Ticking any chip ends intern mode.
export function toggleChip(s, i) {
  const id = CHIPS[i].id;
  s.intern = false;
  if (s.badge.has(id)) s.badge.delete(id); else s.badge.add(id);
  s.result = evaluate(s.badge);
  play('terminal');
}

// INTERN - All Access Badge: clears every chip, unlocks the lift, no fit commentary anywhere.
// Picking it closes the kiosk at once.
export function pressIntern(s) {
  s.intern = true;
  s.badge.clear();
  s.result = evaluate(s.badge);
  if (s.overlay?.type === 'kiosk') s.overlay = null;
  play('terminal');
}

export function chooseFloor(s, i) {
  const opts = liftOptions(s);
  requestTravel(s.lift, chooseTarget(opts[i], s.decision.fate));
  s.player.inLift = true;
  s.player.x = SHAFT_X + SHAFT_W / 2;
  s.overlay = null;
  play('liftButton');
}

export function decide(s, yes) {
  const o = s.overlay;
  const d = s.decision;
  if (!o || o.type !== 'decision' || o.closeAt != null) return;
  if (yes) {
    answer(d, true);
    play('terminal');
    if (d.state === 'off') { o.msg = COPY.decision.recorded; o.closeAt = o.t + 1.8; }
  } else {
    const wasQ1 = d.state === 'q1';
    answer(d, false);
    play('terminal');
    o.msg = wasQ1 ? COPY.decision.no : COPY.decision.recorded;
    o.closeAt = o.t + 2.2;
  }
}

export function overlayInput(s, input, dt) {
  const o = s.overlay;
  o.t += dt;
  if (o.type === 'map' || o.type === 'directory') {
    if (pressed(input, KEYS.back) || (o.t > 0.2 && pressed(input, KEYS.confirm))) s.overlay = null;
    return;
  }
  if (o.type === 'kiosk') {
    const n = CHIPS.length + 1; // the chips, then the intern badge
    if (pressed(input, KEYS.up)) o.cursor = (o.cursor + n - 1) % n;
    if (pressed(input, KEYS.down)) o.cursor = (o.cursor + 1) % n;
    if (pressed(input, [...KEYS.confirm, 'Space'])) {
      if (o.cursor === CHIPS.length) { pressIntern(s); return; } // closes the kiosk
      toggleChip(s, o.cursor);
    }
    if (pressed(input, KEYS.back)) s.overlay = null;
    return;
  }
  if (o.type === 'lift') {
    const n = liftOptions(s).length;
    if (pressed(input, KEYS.up)) o.cursor = (o.cursor + n - 1) % n;
    if (pressed(input, KEYS.down)) o.cursor = (o.cursor + 1) % n;
    if (pressed(input, KEYS.confirm)) chooseFloor(s, o.cursor);
    else if (pressed(input, KEYS.back)) s.overlay = null;
    return;
  }
  if (o.type === 'decision') {
    if (o.closeAt != null) { if (o.t >= o.closeAt) s.overlay = null; return; }
    if (pressed(input, ['KeyY'])) decide(s, true);
    else if (pressed(input, ['KeyN'])) decide(s, false);
    else if (pressed(input, KEYS.back)) s.overlay = null;
  }
}
