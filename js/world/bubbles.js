// Speech bubble layout (pure): wrap, then place bubbles so they never overlap each other or the
// speakers' heads, and stay on screen. Later bubbles yield to earlier ones (stack up, else push aside).
import { textWidth } from '../engine/font.js?v=68';
import { wrap } from '../logic/text.js?v=68';
import { groundY } from './levels.js?v=68';

export const LINE_H = 9;

// Pop-in: a new bubble opens top-down over POP_FRAMES drawn frames, so no single frame changes more than a third
// of it (well under 2 % of the screen). seen = Map(key -> frames drawn so far); popStep returns the next map
// for the bubbles on screen now (bubbles gone from screen are forgotten).
export const POP_FRAMES = 3;
export function popStep(seen, keys) {
  const next = new Map();
  for (const k of keys) next.set(k, Math.min(POP_FRAMES, (seen.get(k) ?? 0) + 1));
  return next;
}
// Rows of a bubble h px tall (frame included) shown on its n-th drawn frame (1-based).
export const popRows = (h, n) => Math.ceil((h * Math.max(1, Math.min(POP_FRAMES, n))) / POP_FRAMES);
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export function resolveBoxes(items, view, avoid = []) {
  const placed = [];
  const clampR = r => {
    r.x = Math.max(view.x + 1, Math.min(view.x + view.w - 1 - r.w, r.x));
    r.y = Math.max(view.y + 1, Math.min(view.y + view.h - 1 - r.h, r.y));
    return r;
  };
  for (const it of items) {
    const r = clampR({ x: Math.round(it.ax - it.w / 2), y: it.bottom - it.h, w: it.w, h: it.h });
    for (let k = 0; k < 16; k++) {
      const hit = [...placed, ...avoid].find(o => overlaps(r, o));
      if (!hit) break;
      const up = hit.y - r.h - 2;
      if (up >= view.y + 1 && k < 8) { r.y = up; continue; }
      const right = hit.x + hit.w + 2, left = hit.x - r.w - 2;
      const canR = right + r.w <= view.x + view.w - 1, canL = left >= view.x + 1;
      if (canR && (!canL || Math.abs(right + r.w / 2 - it.ax) <= Math.abs(left + r.w / 2 - it.ax))) r.x = right;
      else if (canL) r.x = left;
      else r.y = Math.min(view.y + view.h - 1 - r.h, hit.y + hit.h + 2);
      clampR(r);
    }
    placed.push(r);
  }
  return placed;
}

const speakerHead = (s, who) => (who === 'player'
  ? { x: Math.round(s.player.x) - 7, y: Math.round(s.player.y) - 27, w: 14, h: 12 }
  : { x: who.x, y: groundY(who.floor) - 23 - (who.raise ?? 0), w: 10, h: 9 });

// All visible speech bubbles in draw order with resolved rects.
export function speechLayout(s, view) {
  const items = [];
  const heads = [];
  const add = (who, text, ticker, age) => {
    const head = speakerHead(s, who);
    heads.push(head);
    let lines = wrap(text, 24);
    if (ticker) lines = [lines[Math.floor(age / 1.4) % lines.length]];
    const w = Math.max(...lines.map(l => textWidth(l))) + 6;
    const h = lines.length * LINE_H + 3;
    const key = `${who === 'player' ? 'player' : who.id ?? 'gag'}|${text}`; // one bubble = one speaker + one line
    items.push({ lines, w, h, ax: head.x + head.w / 2, bottom: head.y - 3, head, key });
  };
  if (s.playerBubble && s.player.alive && !s.player.hidden) add('player', s.playerBubble.text, false, s.playerBubble.age ?? 0);
  // a gag prop speaking (the vim booth): who = a speaker-shaped anchor over the prop
  if (s.gagBubble && s.gagBubble.floor === s.player.floor) add(s.gagBubble.who, s.gagBubble.text, false, 0);
  for (const n of s.npcs) if (n.bubble && n.floor === s.player.floor) add(n, n.bubble.text, n.bubble.ticker, n.bubble.age);
  // extra keep-out rects (e.g. the lift car and the player in the ascension), set by the scene
  const rects = resolveBoxes(items, view, [...heads, ...(s.bubbleAvoid ?? [])]);
  return items.map((it, i) => ({ ...it, rect: rects[i] }));
}
