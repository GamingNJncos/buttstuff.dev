// Proximity read boxes (pure): which readable object is in range, what it says, where the box goes.
import { COPY, READ, ROOM_CARDS, shortCard, fitNote } from '../logic/copy.js?v=68';
import { wrap } from '../logic/text.js?v=68';
import { PAMPHLETS } from '../logic/demos.js?v=68';

export const READ_RANGE = 6;
export const BOX_W = 176; // canvas px (VT323 ≈ 2.5 px/char at 1x → ~64 chars fit)
export const WRAP = 56;
export const FIT_WRAP = 60; // fit sub-box body: all caps (≈2.5 px/char), inset ≈160 px wide

// Nearest readable prop the player stands in front of (same floor, not riding), or null.
export function readableAt(s) {
  const p = s.player;
  if (p.hidden) return null; // shut in the vim booth
  if (s.lift.moving || (p.inLift && s.lift.gate !== 'open')) return null;
  let best = null;
  let bestD = Infinity;
  for (const pr of s.props) {
    if (!pr.read || pr.floor !== p.floor) continue;
    // big signs only read when you stand under their middle, not anywhere in the room
    const x0 = pr.kind === 'sign' ? pr.x + pr.w / 2 - 30 : pr.x - READ_RANGE;
    const x1 = pr.kind === 'sign' ? pr.x + pr.w / 2 + 30 : pr.x + pr.w + READ_RANGE;
    if (p.x < x0 || p.x > x1) continue;
    const d = Math.abs(p.x - (pr.x + pr.w / 2)) + (pr.kind === 'sign' ? 40 : 0); // signs lose ties to terminals/screens
    if (d < bestD) { bestD = d; best = pr; }
  }
  return best;
}

const fit = (lines, n = 12) => lines.flatMap(l => (l === '' ? [] : wrap(l, WRAP))).slice(0, n);
// '§' marks a section label line in the box.
const cardLines = id => [
  ...shortCard(id).flatMap(([label, text]) => [`§${label.toUpperCase()}`, ...wrap(text, WRAP)]),
  `§MORE`, ...wrap(ROOM_CARDS[id].more, WRAP),
];

export function readContent(s, pr) {
  if (pr.broken) return { title: 'OFFLINE', lines: fit([pr.hitText ?? 'ACCESS DENIED. QUERY LOGGED.', 'SOMEONE SHOT IT.']) };
  if ((pr.kind === 'terminal' || pr.kind === 'board' || pr.kind === 'sign') && pr.room) {
    // the card stays exactly the card; fit status goes in ONE sub-box appended at the bottom
    const n = fitNote(pr.room, s.result, s.intern);
    const fit = n && { state: n.state, head: n.head, lines: n.body ? wrap(n.body, FIT_WRAP) : [] };
    return { title: ROOM_CARDS[pr.room].title, lines: cardLines(pr.room), status: n ? n.state : 'off', fit };
  }
  if (pr.kind === 'pamphlet') { const m = PAMPHLETS[pr.floor]; return m ? { title: m.title, lines: fit([m.text]) } : null; }
  const t = READ[pr.id];
  return t ? { title: t.title, lines: fit(t.lines) } : null;
}

// Box shown after E at a locked lift.
export const lockedLiftContent = () => ({ title: COPY.liftLocked.title, lines: fit([COPY.liftLocked.body]) });

export const boxHeight = n => 15 + n * 8;
// Extra canvas px for the fit sub-box (margin 3 + border/padding 4 + heading 6 + body lines).
export const fitHeight = fit => (fit ? 13 + fit.lines.length * 8 : 0);

// Place a box of size (bw, bh) beside the object + player, never over either; flips to the side with
// room, else goes above. All in world px; view = { x, y, w, h } (camera rect).
export function placeBox(obj, playerX, view, bw, bh, avoid = []) {
  const L = Math.min(obj.x, playerX - 8), R = Math.max(obj.x + obj.w, playerX + 8);
  const gap = 4;
  const vy0 = view.y + 30, vy1 = view.y + view.h - 4;
  const y = Math.max(vy0, Math.min(vy1 - bh, obj.y));
  const roomR = view.x + view.w - 2 - (R + gap), roomL = L - gap - (view.x + 2);
  const prefRight = (obj.x + obj.w / 2) < view.x + view.w / 2;
  const cx = Math.max(view.x + 2, Math.min(view.x + view.w - 2 - bw, (L + R) / 2 - bw / 2));
  const above = { side: 'above', x: cx, y: Math.max(view.y + 2, obj.y - bh - gap) };
  const cands = [];
  const ys = [y, vy1 - bh, ...avoid.map(a => a.y + a.h + 2), ...avoid.map(a => a.y - bh - 2)].filter(v => v >= vy0 - 28 && v + bh <= vy1);
  for (const yy of ys) {
    const r = { side: 'right', x: R + gap, y: yy }, l = { side: 'left', x: L - gap - bw, y: yy };
    if (prefRight) { if (roomR >= bw) cands.push(r); if (roomL >= bw) cands.push(l); } else { if (roomL >= bw) cands.push(l); if (roomR >= bw) cands.push(r); }
  }
  cands.push(above);
  const free = c => !avoid.some(a => c.x < a.x + a.w && a.x < c.x + bw && c.y < a.y + a.h && a.y < c.y + bh);
  return cands.find(free) ?? cands[0];
}
