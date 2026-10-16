import { SHAFT_X, SHAFT_W } from './levels.js?v=68';
import { canBoard, liftBusy, liftUnlocked } from './lift.js?v=68';
import { COPY } from '../logic/copy.js?v=68';
import { nearestNpc, canTalk } from './npcs.js?v=68';

export const CUE_RANGE = 10;
const KIND_CUE = { kiosk: 'USE KIOSK', decision: 'ANSWER' };
// Cue suffix per door light once badged (off adds nothing).
export const CUE_FIT = { primary: ' · BEST FIT', supporting: ' · ALSO A GOOD FIT', denied: ' · NOT A GOOD FIT', off: '' };

// Nearest interactable on the player's floor: { kind, prop?, cue } or null.
export function targetAt(s) {
  const p = s.player;
  if (p.hidden) return null; // shut in the vim booth
  if (s.lift.moving || (p.inLift && liftBusy(s.lift))) return null;
  if (Math.abs(p.x - (SHAFT_X + SHAFT_W / 2)) < SHAFT_W / 2) {
    if (!liftUnlocked(s)) return { kind: 'lift', locked: true, cue: COPY.liftLocked.cue };
    return { kind: 'lift', cue: canBoard(s.lift, p.floor) ? 'RIDE LIFT' : 'CALL LIFT' };
  }
  let best = null;
  let bestD = Infinity;
  for (const pr of s.props) {
    if (!pr.usable || pr.floor !== p.floor) continue;
    if (pr.kind === 'decision' && s.decision.state === 'off') continue;
    const d = p.x < pr.x ? pr.x - p.x : p.x > pr.x + pr.w ? p.x - (pr.x + pr.w) : 0;
    if (d <= (pr.range ?? CUE_RANGE) && d < bestD) { bestD = d; best = pr; }
  }
  if (!best) {
    const n = nearestNpc(s.npcs, p);
    return n && canTalk(n) && !s.playerBubble ? { kind: 'npc', npc: n, cue: 'TALK' } : null;
  }
  return { kind: best.kind, prop: best, cue: best.cue ?? KIND_CUE[best.kind] ?? 'INSPECT' };
}

// Pure helper for the HUD prompt: cue text incl. door-light state once badged.
export function cueText(s, tgt) {
  if (!tgt) return null;
  let t = tgt.cue;
  const room = tgt.prop?.room;
  if (room && s.badge.size > 0 && !s.intern) t += CUE_FIT[s.result.rooms[room].state];
  return t;
}
