// "The concept in action" demos in the world (pure): E on a demo prop runs its behaviour from logic/demos.js,
// starts its little animation and opens the amber concept box beside the player.
import {
  CONCEPT_HEADER, pressDoNotTouch, grabTool, pressStamp, passSkillBook, tryHookGate, tryExit1Gate, tryPermission,
  carrySandboxItem, toggleSandboxItem, penBounds, startPods, POD_SUMMARIES, pickUpBinders, BINDERS_SPEED_FACTOR, unpackPlugin, turnValve,
  tryMcpDoor, readPoster, feedCompactor, enterVimBooth, pullBrick, GAG_ART,
} from '../logic/demos.js?v=68';
import { COPY } from '../logic/copy.js?v=68';
import { wrap } from '../logic/text.js?v=68';
import { WRAP } from './read.js?v=68';
import { bubbleTime } from './npcs.js?v=68';
import { SANDBOX_PEN, SANDBOX_ITEM, EXIT1_GATE_X, PODS, FOUNTAINS, NPCS, PROPS } from './levels.js?v=68';
import { reduced } from '../engine/motion.js?v=68';

// How long a concept box stays up: long enough to read it. CONCEPT_LEAD s to find the box, then READ_CPS
// characters a second, never under CONCEPT_SECONDS or over CONCEPT_MAX (walking away still closes it at once).
export const CONCEPT_SECONDS = 4;
export const CONCEPT_LEAD = 2;
export const READ_CPS = 15;
export const CONCEPT_MAX = 25;
export const conceptSeconds = text => Math.min(CONCEPT_MAX, Math.max(CONCEPT_SECONDS, Math.ceil(CONCEPT_LEAD + text.length / READ_CPS)));
export const CONCEPT_REACH = 28; // walk this far past the object's edge and the box closes
export const TOOL_COUNT = 6; // hammer, wrench, screwdriver, pliers, tape measure, saw
// lamp = hook gate red lamp; shake = hook gate rattle; blink = exit-1 amber complaint before it opens;
// slide = gate panel / door travel; perm = permissions door result (lamp + door)
// pods = workers type this long, then the summaries come back; podsShow = summaries stay up this long after;
// meter = the context meter fills in this long; valve = the hand wheel turns for this long
export const ANIM = {
  press: 0.5, lift: 1.4, stamp: 0.6, wave: 1.5, lamp: 1.6, shake: 0.4, blink: 0.4, slide: 0.3, perm: 1.8,
  pods: 2, podsShow: 10, meter: 0.4, valve: 0.6,
};
export const BOOK_REARM = 40; // after a roll, the skill book re-arms once the player is this far from it
export const GATE_CLEAR = 7; // a closed exit-1 gate stops the player this far from its panel
export const EXIT1_HOLD = 3; // the exit-1 gate stays up at least this long, then drops once the player is clear
export const EXIT1_CLEAR = 16; // ... clear = this far from the panel
// Permissions door: the tray holds an unlisted item and the one listed item; each try feeds the next one.
export const PERM_TRIES = ['unlisted-box', 'fixed-script'];

export const createDemos = () => ({
  button: { t: -1, presses: 0 }, tool: { t: -1, idx: -1, grabs: 0 }, stamp: { t: -1, count: 0 },
  book: { t: -1, waved: false, armed: true, side: 0 },
  hook: { t: -1, tries: 0 },
  exit1: { t: -1, raised: false, arm: 0 }, // arm 0 = panel down (shut) .. 1 = fully up
  perm: { t: -1, tries: 0, allowed: false, item: null },
  sand: { x: SANDBOX_PEN.x0 + 43, held: false },
  pods: { t: -1, runs: 0 },
  binders: { held: false, t: -1, picks: 0 }, // t = seconds since they were picked up (the meter fills)
  plugin: { t: -1, runs: 0 }, // t = seconds since the crate was unpacked
  valve: { t: -1, turns: 0 },
  water: true, // the building's water: on until the janitor's valve is turned
  mcpDoor: { t: -1, tries: 0 },
  ludo: { t: -1, freed: false, said: false }, // t = seconds since the screen was shot (-1 once he is up)
  poster: { reads: 0 },
  compactor: { t: -1, runs: 0 },
  vim: { t: -1, x: 0, visits: 0 }, // x = where the player stood before stepping in
  tower: { t: -1, pulls: 0 },
});

// ---- gags (pure helpers) ----

// The gag boxes carry a long paragraph: they stay up at least this long, longer if the text needs it (walking
// away still closes them).
export const GAG_SECONDS = 12;
export const gagSeconds = text => Math.max(GAG_SECONDS, conceptSeconds(text));

// Words on the gag art, laid out in the 3x5 micro font (advance 4: 12 characters = 47 px). Exact strings, wrapped
// at spaces only (the compactor plate also breaks after its hyphen).
export const MICRO_WRAP = 12;
export const POSTER_LINES = wrap(GAG_ART.poster, MICRO_WRAP);
export const COMPACTOR_PLATE = GAG_ART.compactorPlate.replace('-', '- ').split(' ');
export const TOWER_PLATE_LINES = wrap(GAG_ART.towerPlate, MICRO_WRAP);
export const microWidth = line => line.length * 4 - 1;
// A 3x5 lowercase for the left-pad brick (the micro font has capitals only). Rows top to bottom, '#' = ink.
export const MICRO_LOWER = {
  l: ['#..', '#..', '#..', '#..', '.#.'], e: ['...', '.##', '###', '#..', '.##'], f: ['.##', '#..', '##.', '#..', '#..'],
  t: ['.#.', '###', '.#.', '.#.', '..#'], '-': ['...', '...', '###', '...', '...'], p: ['...', '##.', '#.#', '##.', '#..'],
  a: ['...', '.##', '#.#', '#.#', '.##'], d: ['..#', '.##', '#.#', '#.#', '.##'],
};

// Auto-compactor timeline (s): the scroll feeds in, the ram squashes it, the cube drops onto the tray, it holds,
// then everything resets. still = reduced motion: the finished state at once, nothing moves.
export const COMPACT = { feed: 2, crush: 2.8, eject: 3.2, reset: 6.5 };
export function compactorPose(t, still = false) {
  if (t < 0 || t >= COMPACT.reset) return { feed: 0, ram: 0, cube: -1 };
  if (still) return { feed: 1, ram: 0, cube: 1 };
  const feed = Math.min(1, t / COMPACT.feed);
  const k = t < COMPACT.feed ? 0 : t < COMPACT.crush ? (t - COMPACT.feed) / (COMPACT.crush - COMPACT.feed) : 1;
  const ram = k <= 0 || k >= 1 ? 0 : k < 0.5 ? k * 2 : (1 - k) * 2; // down, then back up
  const cube = t < COMPACT.crush ? -1 : Math.min(1, (t - COMPACT.crush) / (COMPACT.eject - COMPACT.crush));
  return { feed, ram, cube };
}

// Vim booth timeline (s): the door shuts behind you, the booth asks how to get out, then :q!, the door opens
// and you step back out (the concept box opens then). still = reduced motion: the door snaps instead of sliding.
export const VIM = { shut: 0.3, ask: 0.5, askEnd: 2.6, quit: 2.9, quitEnd: 4, open: 4.1, out: 4.4 };
export function vimPhase(t, still = false) {
  if (t < 0 || t >= VIM.out) return { inside: false, door: 0, bubble: null };
  let door = 1;
  if (t < VIM.shut) door = still ? 1 : t / VIM.shut;
  else if (t >= VIM.open) door = still ? 0 : 1 - (t - VIM.open) / (VIM.out - VIM.open);
  const bubble = t >= VIM.ask && t < VIM.askEnd ? 'stuck' : t >= VIM.quit && t < VIM.quitEnd ? 'quit' : null;
  return { inside: true, door, bubble };
}
// The player can't walk or press E while shut in the booth.
export const playerHeld = s => s.demos.vim.t >= 0 && s.demos.vim.t < VIM.out;

// Dependency tower timeline (s): the brick slides out, the stack above it slumps and leans, holds, then it all
// settles back. still = reduced motion: slumped at once, back at once.
export const TOWER = { pull: 0.4, slump: 0.9, hold: 4.6, back: 5.2 };
export function towerPose(t, still = false) {
  if (t < 0 || t >= TOWER.back) return { brick: 0, slump: 0 };
  if (still) return t < TOWER.hold ? { brick: 1, slump: 1 } : { brick: 0, slump: 0 };
  if (t < TOWER.pull) return { brick: t / TOWER.pull, slump: 0 };
  if (t < TOWER.slump) return { brick: 1, slump: (t - TOWER.pull) / (TOWER.slump - TOWER.pull) };
  if (t < TOWER.hold) return { brick: 1, slump: 1 };
  const k = 1 - (t - TOWER.hold) / (TOWER.back - TOWER.hold);
  return { brick: k, slump: k };
}

const gagProp = (s, demo) => s.props.find(q => q.demo === demo);
const openGag = (s, prop, r) => {
  s.concept = { id: prop.id, text: r.text, head: r.head, t: gagSeconds(r.text), floor: prop.floor, x0: prop.x, x1: prop.x + prop.w };
};

// Per-frame gag timers: the vim booth hides/frees the player and speaks; the others just run their clocks.
function stepGags(s, dt) {
  const d = s.demos, p = s.player;
  if (d.compactor.t >= 0) { d.compactor.t += dt; if (d.compactor.t >= COMPACT.reset) d.compactor.t = -1; }
  if (d.tower.t >= 0) { d.tower.t += dt; if (d.tower.t >= TOWER.back) d.tower.t = -1; }
  s.gagBubble = null;
  const v = d.vim;
  if (v.t < 0) return;
  v.t += dt;
  const pr = gagProp(s, 'vimBooth');
  if (v.t >= VIM.out) {
    v.t = -1;
    p.hidden = false; p.x = v.x; p.facing = -1;
    if (pr) openGag(s, pr, enterVimBooth());
    return;
  }
  const ph = vimPhase(v.t);
  if (ph.bubble && pr) {
    const r = enterVimBooth();
    // the booth speaks from just over its roof (raise = how far its top stands above a person's head)
    s.gagBubble = { floor: pr.floor, who: { x: pr.x + (pr.w >> 1) - 5, floor: pr.floor, raise: 129 - 23 - pr.y + 2 }, text: ph.bubble === 'stuck' ? r.lines[0] : r.lines[1] };
  }
}

// ---- level 05 (pure helpers) ----

// The Ludovico screen: one slogan at a time, SLOGAN_SECONDS each, typed out at SLOGAN_CPS characters a second
// (still = reduced motion: the whole line at once). Simple swap, no flashing.
export const SLOGAN_SECONDS = 4;
export const SLOGAN_CPS = 24;
export const SLOGANS = COPY.ludovico.slogans;
export function sloganAt(t, still = false) {
  // reduced motion: one slogan, whole, held still (no typing, no swapping)
  if (still) return { idx: 0, text: SLOGANS[0], chars: SLOGANS[0].length };
  const k = Math.floor(t / SLOGAN_SECONDS);
  const idx = ((k % SLOGANS.length) + SLOGANS.length) % SLOGANS.length;
  const text = SLOGANS[idx];
  const chars = still ? text.length : Math.min(text.length, Math.floor((t - k * SLOGAN_SECONDS) * SLOGAN_CPS));
  return { idx, text, chars };
}
// After the hit: the straps spring open at LUDO_STRAPS s, he stands up (and speaks, once) at LUDO_STAND s.
export const LUDO_STRAPS = 0.25;
export const LUDO_STAND = 0.8;
const ludoNpc = s => s.npcs.find(n => n.id === 'ludovico');

// A bullet hit (facility.stepFx). Only the Ludovico screen does anything here: it frees the man (once).
export function hitProp(s, id) {
  if (id !== 'ludo-screen' || s.demos.ludo.freed) return false;
  s.demos.ludo = { t: 0, freed: true, said: false };
  return true;
}

function stepLudo(s, dt) {
  const l = s.demos.ludo;
  if (l.t < 0) return;
  l.t += dt;
  if (l.t < LUDO_STAND) return;
  const n = ludoNpc(s);
  if (n && n.strapped) n.strapped = false;
  if (n && !l.said) {
    const text = COPY.ludovico.freed;
    n.pending = null; n.cooldown = 0;
    n.bubble = { text, t: bubbleTime(text) + 1.5, age: 0 };
    l.said = true;
  }
  l.t = -1;
}

// Door lamp: red while a try is fresh (the door never opens).
export const mcpDoorLamp = d => d.t >= 0 && d.t < ANIM.lamp;

// ---- level 04 (pure helpers) ----

// Pod phase: 'idle' (dark), 'work' (lit, workers typing, nothing readable yet), 'done' (lit, one summary per pod).
export function podPhase(pods) {
  if (pods.t < 0) return 'idle';
  return pods.t < ANIM.pods ? 'work' : 'done';
}
// What each pod's screen shows: its one-line summary once the job is done, otherwise nothing.
export const podScreens = pods => (podPhase(pods) === 'done' ? [...POD_SUMMARIES] : PODS.map(() => null));

// Pod workers type only while their job runs.
function syncPodWorkers(s) {
  const typing = podPhase(s.demos.pods) === 'work';
  for (const pod of PODS) { const n = s.npcs.find(q => q.id === pod.npc); if (n) n.idle = typing ? 'type' : 'wait'; }
}

// Walking speed multiplier: slowed while you carry the 29 subagent binders.
export const speedFactor = s => (s.demos.binders.held ? BINDERS_SPEED_FACTOR : 1);
// Context meter 0..1 above the player: fills quickly, stays full while carried; null when hidden.
export function contextMeter(b) {
  if (!b.held || b.t < 0) return null;
  return Math.min(1, b.t / ANIM.meter);
}

const bindersProp = s => s.props.find(q => q.demo === 'binders');
const BINDERS_HOME = PROPS.find(p => p.id === 'demo-binders').x; // the hand truck
// Keep the binders' prop on them: on the hand truck (PICK UP THE BINDERS) or in the player's arms (PUT DOWN, anywhere
// on the floor). Leaving the floor (the lift) puts them back on the hand truck.
export function syncBinders(s) {
  const pr = bindersProp(s), b = s.demos.binders;
  if (!pr) return;
  if (b.held && s.player.floor !== pr.floor) s.demos.binders = { ...b, held: false, t: -1 };
  const held = s.demos.binders.held;
  pr.x = held ? Math.round(s.player.x) - (pr.w >> 1) : BINDERS_HOME;
  pr.cue = held ? 'PUT DOWN' : 'PICK UP THE BINDERS';
}

// PLUGIN crate timeline (s): the lid comes off, the five items slide out one after another onto their shelf
// slots, hold there, then all slide back in together and the lid goes back on. still = reduced motion: on the
// shelf at once, back at once. Returns { lid, items: [0..1 per slot] } (0 = in the crate, 1 = on its slot).
export const UNPACK = { step: 0.4, slide: 0.7, hold: 11, back: 0.7 };
export const UNPACK_END = UNPACK.hold + UNPACK.back;
export function unpackPose(t, n = 5, still = false) {
  if (t < 0 || t >= UNPACK_END) return { lid: false, items: Array(n).fill(0) };
  if (still) return { lid: t < UNPACK.hold, items: Array(n).fill(t < UNPACK.hold ? 1 : 0) };
  const ease = k => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
  if (t >= UNPACK.hold) { const k = 1 - ease((t - UNPACK.hold) / UNPACK.back); return { lid: true, items: Array(n).fill(k) }; }
  return { lid: true, items: Array.from({ length: n }, (_, i) => ease((t - 0.2 - i * UNPACK.step) / UNPACK.slide)) };
}

// NPCs idling at a fountain face it and sip while the water runs; with the water off they turn away from it and
// stand there adjusting their glasses (no words).
const FOUNTAIN_IDLE = { on: 'sip', off: 'glasses' };
export const FOUNTAIN_STEP = 4;
export function syncFountains(s) {
  for (const f of FOUNTAINS) {
    if (!f.npc) continue;
    const n = s.npcs.find(q => q.id === f.npc);
    if (!n) continue;
    const home = NPCS.find(q => q.id === f.npc).x;
    const facesIt = f.x < home; // sprites face right; flip to face a fountain on the left
    n.idle = s.demos.water ? FOUNTAIN_IDLE.on : FOUNTAIN_IDLE.off;
    n.flip = s.demos.water ? facesIt : !facesIt;
    n.x = s.demos.water ? home : home + (facesIt ? FOUNTAIN_STEP : -FOUNTAIN_STEP); // a small step back from the dry fountain
  }
}
// Every fountain on the floor flows exactly when the building's water is on.
export const fountainsFlowing = s => FOUNTAINS.map(() => s.demos.water);
// Hand-wheel angle (radians) for a turn t seconds ago: a quarter turn per press, eased; still under reduced motion.
export function valveAngle(v, still = false) {
  const base = v.turns * (Math.PI / 2);
  if (still || v.t < 0 || v.t >= ANIM.valve) return base;
  const k = v.t / ANIM.valve;
  return base - (Math.PI / 2) * (1 - k * (2 - k));
}

// ---- level 03 (pure helpers) ----

// Hook gate rattle: x offset for a try t seconds ago (0 when idle, after the shake, or under reduced motion).
export function gateShake(t, still = false) {
  if (still || t < 0 || t >= ANIM.shake) return 0;
  return [1, -1, 1, 0][Math.floor(t * 20) % 4];
}

// Walking bounds on level 03: while the exit-1 gate's panel is down the player can't cross EXIT1_GATE_X; while
// they hold the sandbox ball they can't leave the pen (stopped at its edge).
export function gateBounds(s, b) {
  const p = s.player;
  if (p.floor !== 3) return b;
  if (s.demos.sand.held) return penBounds(b, SANDBOX_PEN);
  if (s.demos.exit1.raised) return b;
  return p.x <= EXIT1_GATE_X
    ? { min: b.min, max: Math.min(b.max, EXIT1_GATE_X - GATE_CLEAR) }
    : { min: Math.max(b.min, EXIT1_GATE_X + GATE_CLEAR), max: b.max };
}

// Permissions door travel 0..1 for a result t seconds ago: opens only for the listed item. still = reduced motion:
// straight to open, and straight back to shut (no slide).
export function doorOpen(perm, still = reduced) {
  const t = perm.t;
  if (!perm.allowed || t < 0 || t >= ANIM.perm) return 0;
  if (still) return 1;
  if (t < ANIM.slide) return t / ANIM.slide;
  if (t > ANIM.perm - ANIM.slide) return (ANIM.perm - t) / ANIM.slide;
  return 1;
}

const inPen = x => x >= SANDBOX_PEN.x0 && x <= SANDBOX_PEN.x1;
const sandProp = s => s.props.find(q => q.demo === 'sandbox');

// Keep the sandbox item's prop on the item: E reach, cue (PICK UP / PUT DOWN), usable only from inside the pen.
export function syncSandbox(s) {
  const pr = sandProp(s), it = s.demos.sand;
  if (!pr) return;
  pr.x = Math.round(it.x) - (SANDBOX_ITEM.w >> 1);
  pr.cue = it.held ? 'PUT DOWN' : 'PICK UP';
  pr.usable = it.held || (s.player.floor === SANDBOX_PEN.floor && inPen(s.player.x));
}

// The sandbox box: open (and pinned) while the ball is held.
export const sandboxBoxOpen = s => !!s.concept?.pinned && s.concept.id === sandProp(s)?.id;

// Per-frame: a held ball stays in the player's hands inside the pen (gateBounds stops them at its edge). Reaching
// the edge with it opens the sandbox box, pinned: it stays up, wherever they walk in the pen, until PUT DOWN.
// Returns the carry result the frame the box opens, else null.
export function stepSandbox(s) {
  const p = s.player, d = s.demos;
  let opened = null;
  if (d.sand.held && p.floor === SANDBOX_PEN.floor) {
    const r = carrySandboxItem(d.sand, p.x, SANDBOX_PEN);
    d.sand = { x: r.x, held: true };
    if (r.blocked && !sandboxBoxOpen(s)) {
      const pr = sandProp(s);
      s.concept = { id: pr.id, text: r.text, t: conceptSeconds(r.text), pinned: true, floor: pr.floor, x0: SANDBOX_PEN.x0, x1: SANDBOX_PEN.x1 };
      opened = r;
    }
  }
  syncSandbox(s);
  return opened;
}

// Skill book walk-past trigger (pure). b = { armed, side } (side: -1 west of the book, 1 east, 0 unknown).
// Crossing the book's x while armed rolls passSkillBook once and disarms; moving BOOK_REARM px away re-arms.
// Returns { armed, side, roll } where roll is the passSkillBook result or null.
export function walkPastBook(b, px, bx, rand = Math.random) {
  const side = px < bx ? -1 : 1;
  let armed = b.armed, roll = null;
  if (armed && b.side && side !== b.side) { roll = passSkillBook(rand); armed = false; }
  else if (!armed && Math.abs(px - bx) >= BOOK_REARM) armed = true;
  return { armed, side, roll };
}

const bookProp = s => s.props.find(q => q.demo === 'skillBook');

function showBook(s, prop, r) {
  const b = s.demos.book;
  b.t = 0; b.waved = r.waved; b.armed = false;
  s.concept = { id: prop.id, text: r.text, t: conceptSeconds(r.text), floor: prop.floor, x0: prop.x, x1: prop.x + prop.w };
}

// Per-frame walk-past check (the player only has to cross the book; no E needed).
export function stepBook(s, rand = Math.random) {
  const pr = bookProp(s), b = s.demos.book, p = s.player;
  if (!pr || p.floor !== pr.floor || p.inLift) { b.side = 0; return null; }
  const r = walkPastBook(b, p.x, pr.x + pr.w / 2, rand);
  b.armed = r.armed; b.side = r.side;
  if (r.roll) showBook(s, pr, r.roll);
  return r.roll;
}

// E on a demo prop. Mutates s.demos + s.concept; returns the behaviour result.
export function useDemo(s, prop, rand = Math.random) {
  const d = s.demos;
  let r;
  if (prop.demo === 'skillBook') {
    r = passSkillBook(rand);
    showBook(s, prop, r);
    return r;
  } else if (prop.demo === 'doNotTouch') {
    r = pressDoNotTouch();
    d.button.t = 0; d.button.presses++;
  } else if (prop.demo === 'toolBin') {
    r = grabTool();
    d.tool.idx = d.tool.grabs % TOOL_COUNT; d.tool.grabs++; d.tool.t = 0;
  } else if (prop.demo === 'stamp') {
    r = pressStamp(d.stamp.count);
    d.stamp.count = r.count; d.stamp.t = 0;
  } else if (prop.demo === 'hookGate') {
    r = tryHookGate();
    d.hook.t = 0; d.hook.tries++;
  } else if (prop.demo === 'exit1Gate') {
    r = tryExit1Gate();
    d.exit1.t = 0; // the amber lamp blinks once, then stepDemos raises the panel
  } else if (prop.demo === 'permDoor') {
    const item = PERM_TRIES[d.perm.tries % PERM_TRIES.length];
    r = tryPermission(item);
    d.perm = { t: 0, tries: d.perm.tries + 1, allowed: r.allowed, item };
  } else if (prop.demo === 'sandbox') {
    // pick up / put down: no box for a pick-up; the box opens at the pen edge, and putting the ball down closes it
    const was = d.sand.held;
    d.sand = toggleSandboxItem(d.sand, s.player.x, SANDBOX_PEN);
    if (was && !d.sand.held && sandboxBoxOpen(s)) s.concept = null;
    syncSandbox(s);
    return { held: d.sand.held, changed: was !== d.sand.held };
  } else if (prop.demo === 'pods') {
    r = startPods();
    d.pods = { t: 0, runs: d.pods.runs + 1 };
    syncPodWorkers(s);
  } else if (prop.demo === 'binders') {
    // pick up: the box opens, the meter fills and you walk slowly; put down: they go back on the hand truck
    if (d.binders.held) {
      d.binders = { ...d.binders, held: false, t: -1 };
      if (s.concept?.id === prop.id) s.concept = null;
      syncBinders(s);
      return { held: false };
    }
    r = pickUpBinders();
    d.binders = { held: true, t: 0, picks: d.binders.picks + 1 };
    syncBinders(s);
  } else if (prop.demo === 'plugin') {
    r = unpackPlugin();
    if (d.plugin.t < 0) d.plugin = { t: 0, runs: d.plugin.runs + 1 }; // one unpack at a time
  } else if (prop.demo === 'valve') {
    r = turnValve(d.water);
    d.water = r.waterOn;
    d.valve = { t: 0, turns: d.valve.turns + 1 };
    syncFountains(s);
  } else if (prop.demo === 'mcpDoor') {
    r = tryMcpDoor();
    d.mcpDoor = { t: 0, tries: d.mcpDoor.tries + 1 };
  } else if (prop.gag) {
    if (prop.demo === 'poster') {
      r = readPoster();
      d.poster.reads++;
    } else if (prop.demo === 'compactor') {
      r = feedCompactor();
      if (d.compactor.t < 0) d.compactor = { t: 0, runs: d.compactor.runs + 1 }; // one load at a time
    } else if (prop.demo === 'tower') {
      r = pullBrick();
      if (d.tower.t < 0) d.tower = { t: 0, pulls: d.tower.pulls + 1 };
    } else if (prop.demo === 'vimBooth') {
      // step inside: the player is hidden in the booth; the box opens when they step back out (stepGags)
      if (playerHeld(s)) return null;
      const p = s.player;
      d.vim = { t: 0, x: p.x, visits: d.vim.visits + 1 };
      p.hidden = true; p.walking = false; // x stays put, so the camera doesn't jump
      s.concept = null;
      return enterVimBooth();
    } else return null;
    openGag(s, prop, r);
    return r;
  } else return null;
  s.concept = { id: prop.id, text: r.text, t: conceptSeconds(r.text), floor: prop.floor, x0: prop.x, x1: prop.x + prop.w };
  return r;
}

// The skill book's title (level 02): engraved on the brass plate on the lectern front, one line per row.
export const BOOK_TITLE = 'WHEN SOMEONE WALKS PAST, WAVE';
export const BOOK_LINES = ['WHEN SOMEONE', 'WALKS PAST,', 'WAVE'];
export const HAND_RISE = 10; // px the little hand rises out of the pages

// Waving hand over the skill book: null when idle or after a quiet roll. rise 0..HAND_RISE (pops up, holds,
// ducks back); tilt -1/0/1 waves every 0.5 s while fully up. still = reduced motion: up, but no waving.
export function handPose(b, still = false) {
  if (!b || !b.waved || b.t < 0 || b.t >= ANIM.wave) return null;
  const t = b.t, up = 0.2, down = 0.25;
  const rise = t < up ? Math.round((t / up) * HAND_RISE)
    : t > ANIM.wave - down ? Math.round(((ANIM.wave - t) / down) * HAND_RISE) : HAND_RISE;
  const tilt = still || rise < HAND_RISE ? 0 : [-1, 0, 1, 0][Math.floor((t - up) * 8) % 4];
  return { rise, tilt };
}

// Advance demo animations and the concept box timer; the box closes when its reading time (conceptSeconds) runs
// out or when the player walks off. The pinned sandbox box ignores both: only putting the ball down closes it.
// still = reduced motion: the exit-1 gate panel jumps straight up / down instead of sliding.
export function stepDemos(s, dt, still = reduced) {
  const d = s.demos;
  for (const k of ['button', 'tool', 'stamp']) if (d[k].t >= 0) { d[k].t += dt; if (d[k].t > 2) d[k].t = -1; }
  if (d.book.t >= 0) { d.book.t += dt; if (d.book.t > ANIM.wave) d.book.t = -1; }
  if (d.hook.t >= 0) { d.hook.t += dt; if (d.hook.t > ANIM.lamp) d.hook.t = -1; }
  if (d.perm.t >= 0) { d.perm.t += dt; if (d.perm.t > ANIM.perm) d.perm.t = -1; }
  const g = d.exit1;
  if (g.t >= 0) {
    g.t += dt;
    if (g.t >= ANIM.blink) g.raised = true;
    const p = s.player;
    if (g.raised && g.t > EXIT1_HOLD && (p.floor !== 3 || Math.abs(p.x - EXIT1_GATE_X) > EXIT1_CLEAR)) { g.raised = false; g.t = -1; }
  }
  g.arm = still ? (g.raised ? 1 : 0) : Math.max(0, Math.min(1, g.arm + (g.raised ? 1 : -1) * dt / ANIM.slide));
  if (d.pods.t >= 0) { d.pods.t += dt; if (d.pods.t > ANIM.pods + ANIM.podsShow) d.pods.t = -1; syncPodWorkers(s); }
  if (d.binders.held) d.binders.t += dt;
  syncBinders(s);
  if (d.plugin.t >= 0) { d.plugin.t += dt; if (d.plugin.t >= UNPACK_END) d.plugin.t = -1; }
  if (d.valve.t >= 0) { d.valve.t += dt; if (d.valve.t > ANIM.valve) d.valve.t = -1; }
  if (d.mcpDoor.t >= 0) { d.mcpDoor.t += dt; if (d.mcpDoor.t > ANIM.lamp) d.mcpDoor.t = -1; }
  stepLudo(s, dt);
  stepGags(s, dt);
  const c = s.concept;
  if (!c) return;
  if (c.pinned) { if (!d.sand.held) s.concept = null; return; }
  c.t -= dt;
  const p = s.player;
  const away = p.floor !== c.floor || p.x < c.x0 - CONCEPT_REACH || p.x > c.x1 + CONCEPT_REACH;
  if (c.t <= 0 || away) s.concept = null;
}

// Box content: fixed header line, then (gags) the concept's own heading as a label line, then the demo text.
export const conceptContent = (text, head) => ({ title: CONCEPT_HEADER, lines: [...(head ? [`§${head}`] : []), ...wrap(text, WRAP)] });

// 0..1 ram/plunger travel for a press that started t seconds ago (down fast, back up slower); 0 when idle.
export function pressTravel(t, dur) {
  if (t < 0 || t >= dur) return 0;
  const k = t / dur;
  return k < 0.25 ? k / 0.25 : Math.max(0, 1 - (k - 0.25) / 0.75);
}

// Tool lift height in px for a grab t seconds ago.
export function toolLift(t) {
  if (t < 0 || t >= ANIM.lift) return 0;
  if (t < 0.15) return Math.round((t / 0.15) * 6);
  if (t > ANIM.lift - 0.25) return Math.round(((ANIM.lift - t) / 0.25) * 6);
  return 6;
}
