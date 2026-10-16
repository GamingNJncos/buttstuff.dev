import { PROPS, NPCS, GUN_SPAWNS, camYFor } from './levels.js?v=68';
import { createPlayer } from './player.js?v=68';
import { createLift } from './lift.js?v=68';
import { createDecision } from './decision.js?v=68';
import { createTalk } from './npcs.js?v=68';
import { createDemos, syncSandbox } from './concept.js?v=68';
import { evaluate } from '../logic/gauntlet.js?v=68';

export function createState(rand = Math.random) {
  const spawn = GUN_SPAWNS[Math.min(GUN_SPAWNS.length - 1, Math.floor(rand() * GUN_SPAWNS.length))];
  const s = {
    player: createPlayer(),
    lift: createLift(),
    badge: new Set(),
    intern: false, // INTERN - All Access Badge: lift unlocked, no fit commentary
    result: evaluate([]),
    props: PROPS.map(p => ({ ...p, broken: false, hitText: null })),
    npcs: NPCS.map(n => ({ ...n, bubble: null, pending: null, cooldown: 0, last: -1 })),
    gun: { x: spawn.x, taken: false },
    bullets: [],
    fireCooldown: 0,
    decision: createDecision(),
    firstUseOnSurface: false,
    liftUnlocked: false,
    liftNote: null,
    overlay: null,
    playerBubble: null,
    talk: createTalk(),
    cam: { x: 0, y: camYFor(0) },
    t: 0,
    sequence: null,
    demos: createDemos(),
    concept: null,
  };
  syncSandbox(s);
  return s;
}
