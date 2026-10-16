import { COPY } from '../logic/copy.js?v=68';

export const TALK_RANGE = 14;
export const REPLY_COOLDOWN = 1;

export function pickReply(len, last, rand = Math.random) {
  if (len <= 1) return 0;
  let i = Math.floor(rand() * (len - 1));
  if (last >= 0 && i >= last) i++;
  return Math.min(i, len - 1);
}

// Shuffle bag: every index once per bag; a refilled bag never starts with the last one drawn.
export function createBag(n) { return { n, order: [], last: -1 }; }
export function drawBag(bag, rand = Math.random) {
  if (bag.n <= 1) return 0;
  if (!bag.order.length) {
    const o = [...Array(bag.n).keys()];
    for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
    if (o[0] === bag.last) [o[0], o[o.length - 1]] = [o[o.length - 1], o[0]];
    bag.order = o;
  }
  bag.last = bag.order.shift();
  return bag.last;
}

export const bubbleTime = text => (text.length > 60 ? 9 : 1.1 + text.length * 0.035);

function pool(n) {
  return n.special === 'greybeard' ? [COPY.greybeard] : COPY.npcPools[n.floor];
}

export function createTalk() {
  return { ambientDone: false, playerBag: createBag(COPY.playerLines.length) };
}

export function nearestNpc(npcs, p) {
  let best = null, bestD = Infinity;
  for (const n of npcs) {
    if (n.floor !== p.floor || n.strapped) continue; // the man strapped in the Ludovico chair can't chat
    const d = Math.abs(n.x + 5 - p.x);
    if (d < TALK_RANGE && d < bestD) { best = n; bestD = d; }
  }
  return best;
}

// A talking NPC is busy while its reply is pending/showing or cooling down.
export const canTalk = n => !!n && n.pending == null && !n.bubble && n.cooldown === 0;

// Player says `line`; the NPC answers as the player's bubble finishes (≤ 0.2 s overlap).
export function startTalk(talk, s, n, line) {
  const t = bubbleTime(line);
  s.playerBubble = { text: line, t, age: 0 };
  n.pending = Math.max(0.3, t - 0.2);
  n.cooldown = 0;
}

export function talkTo(talk, s, n, rand = Math.random) {
  if (!canTalk(n)) return false;
  startTalk(talk, s, n, COPY.playerLines[drawBag(talk.playerBag, rand)]);
  return true;
}

// Ambient: once per run, the first time the player passes an NPC, say the arch line.
export function ambientTalk(talk, s, active) {
  if (talk.ambientDone || !active) return false;
  const n = nearestNpc(s.npcs, s.player);
  if (!canTalk(n)) return false;
  talk.ambientDone = true;
  startTalk(talk, s, n, COPY.archLine);
  return true;
}

// Ticks bubbles, pending replies and cooldowns.
export function updateNpcs(npcs, dt, rand = Math.random) {
  for (const n of npcs) {
    n.cooldown = Math.max(0, (n.cooldown ?? 0) - dt);
    if (n.bubble) {
      n.bubble.t -= dt;
      n.bubble.age += dt;
      if (n.bubble.t <= 0) { n.bubble = null; n.cooldown = REPLY_COOLDOWN; }
    }
    if (n.pending != null) {
      n.pending -= dt;
      if (n.pending <= 0) {
        n.pending = null;
        const lines = pool(n);
        const grey = n.special === 'greybeard';
        if (!n.bag) n.bag = createBag(lines.length);
        const i = grey ? 0 : drawBag(n.bag, rand);
        n.last = i;
        n.bubble = { text: lines[i], t: grey ? 9 : bubbleTime(lines[i]) + 0.4, ticker: grey, age: 0 };
      }
    }
  }
}
