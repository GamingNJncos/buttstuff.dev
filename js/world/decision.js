export function createDecision() {
  return { state: 'armed', fate: null };
}

export function notifyFirstUse(d, wasDecision) {
  if (d.state === 'armed' && !wasDecision) d.state = 'off';
}

export function useDecision(d) {
  if (d.state === 'armed') d.state = 'q1';
  return d.state;
}

export function answer(d, yes) {
  if (d.state === 'q1') d.state = yes ? 'q2' : 'off';
  else if (d.state === 'q2') { d.fate = yes ? 'hell' : 'heaven'; d.state = 'off'; }
  return d;
}

// Only these E-uses on level 00 count as the "first use" that powers the decision terminal down.
// Reading stations/cards, talking to NPCs (and future demo buttons) never count; neither does a locked lift.
export const FIRST_USE_KINDS = new Set(['kiosk', 'lift', 'decision']);

export function noteSurfaceUse(s, kind) {
  if (s.player.floor !== 0 || s.firstUseOnSurface || !FIRST_USE_KINDS.has(kind)) return false;
  s.firstUseOnSurface = true;
  notifyFirstUse(s.decision, kind === 'decision');
  return true;
}
