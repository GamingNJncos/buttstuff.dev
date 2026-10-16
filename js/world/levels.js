// World geometry. One floor = 135 px of room + 45 px service slab (pitch 180).
export const ROOM_H = 135;
export const SLAB_H = 45;
export const FH = ROOM_H + SLAB_H; // 180
export const WW = 960;
export const SHAFT_X = 452;
export const SHAFT_W = 104;
export const VIEW_H = 240;
// Camera offset: a thin strip of the floor above (22 px), the room, its slab, then a peek of the floor below
// (the reference framing).
export const CAM_DY = 22;

export const FLOOR_NAMES = { 0: 'LOBBY', 1: 'WORKSHOP', 2: 'LIBRARY', 3: 'SECURITY', 4: 'WORKER BAYS', 5: 'SERVER ROOM' };
export const ZONE_NAMES = { 0: 'LOBBY', 1: 'WORKSHOP', 2: 'LIBRARY', 3: 'SECURITY', 4: 'WORKER BAYS', 5: 'SERVER ROOM', 6: '??', [-1]: 'ASCENSION' };

export const floorTop = f => f * FH;
export const groundY = f => f * FH + ROOM_H - 6;
export const camYFor = f => floorTop(f) - CAM_DY;

export function floorLabel(f) {
  if (f === -1) return 'ASCENSION';
  if (f in FLOOR_NAMES) return `0${f} ${FLOOR_NAMES[f]}`;
  return '??';
}

// Floor 00 new-hire tour, west to east: spawn, welcome banner, two stations, CLAUDE.md board, decision
// booth (shaft) reception + directory, badge kiosk.
export const SPAWN_X = 30;

export const ROOMS = [
  { id: 'noticeboard', floor: 0, x: 278, w: 82 },
  { id: 'cli', floor: 1, x: 24, w: 210 },
  { id: 'script', floor: 1, x: 604, w: 316 }, // starts past the pamphlet stand by the lift
  { id: 'skills', floor: 2, x: 24, w: 210 },
  { id: 'annex', floor: 2, x: 604, w: 316 }, // starts past the pamphlet stand by the lift
  // level 03 west of the lift, walking west: the pamphlet stand, the Hook Checkpoint (ends short of the shaft),
  // then the Permissions Office at the far west end
  { id: 'hook', floor: 3, x: 236, w: 180 },
  { id: 'permissions', floor: 3, x: 16, w: 210 },
  { id: 'sandbox', floor: 3, x: 612, w: 308 },
  // level 04: the Subagent Pods fill the west side; east of the lift the Plugin Warehouse (starts past the pamphlet
  // stand, with clear space), then the janitor's closet at the east end (user: guardrails live somewhere gross)
  { id: 'pods', floor: 4, x: 24, w: 412 },
  { id: 'warehouse', floor: 4, x: 608, w: 188 },
  { id: 'command', floor: 4, x: 802, w: 130 },
  // starts past the pamphlet stand by the lift, with clear space; the MCP gate and the Ludovico chair stand past it
  { id: 'mcp', floor: 5, x: 612, w: 130 },
];

export const onGround = h => ROOM_H - 6 - h;

// Level 05 server racks: plain, unlabelled 42U cabinets (x = left edge). West hall rows + the server room.
export const RACK = { w: 28, h: 72 };
export const RACK_XS = [24, 60, 96, 184, 220, 256, 400, 622, 700];
// Level 05 Ludovico chair (far east, past the MCP gate): the strapped man lies in side profile facing a pull-down
// screen a ceiling projector throws the slogans onto; shooting the screen frees him.
export const LUDO = { floor: 5, chairX: 820, screen: { x: 854, y: 54, w: 90, h: 66 } };

// Per-room interactable placement overrides (x relative to room, y local to the floor).
const TERM = {
  noticeboard: { dx: 9, y: 60, w: 64, h: 42 }, // centred under its label (room centre)
};

const roomProps = ROOMS.flatMap(r => {
  const t = TERM[r.id];
  const board = r.id === 'noticeboard';
  return [
    {
      id: `term-${r.id}`, kind: board ? 'board' : 'terminal', room: r.id, floor: r.floor,
      x: t ? r.x + t.dx : r.x + (r.w >> 1) - 9, y: t ? t.y : onGround(30), w: t ? t.w : 18, h: t ? t.h : 30,
      usable: false, read: true, shootable: true,
    },
    { id: `sign-${r.id}`, kind: 'sign', room: r.id, floor: r.floor, x: r.x + 12, y: 22, w: r.w - 24, h: 17, usable: false, read: false, shootable: true },
  ];
});

// Tour stations: a read-only exhibit (pops its card by proximity) under a two-line wall plate.
export const STATION_H = 50;
export const STATION_SIGN = { y: 24, w: 66, h: 26 };
export const STATIONS = [
  { id: 'station-llm', x: 148, w: 36 },
  { id: 'station-harness', x: 220, w: 40 },
];

const stationProps = STATIONS.flatMap(st => [
  { id: st.id, kind: 'station', floor: 0, x: st.x, y: onGround(STATION_H), w: st.w, h: STATION_H, usable: false, read: true, shootable: true },
  {
    id: `sign-${st.id}`, kind: 'sign', floor: 0, x: st.x + (st.w >> 1) - (STATION_SIGN.w >> 1), y: STATION_SIGN.y, w: STATION_SIGN.w, h: STATION_SIGN.h,
    usable: false, read: false, shootable: true,
  },
]);

// The lift call box on each landing wall, just east of the shaft column (x = left edge).
export const CALL_BOX = { x: SHAFT_X + SHAFT_W + 11, w: 12 };

// Pamphlet stands, one per floor 01..05 (the lobby has none: its CLAUDE.md board already covers it). Read-only:
// walking up pops PAMPHLETS[floor] as a card. Each stands right by the lift, on the side the player reaches first,
// in clear space between the lift and the first room it explains. explains = the rooms its pamphlet covers.
// 01, 02, 04: east (the Script Lab / annex / warehouse open next to the lift); 03: west, before the Hook Checkpoint
// (and the Permissions Office past it).
export const PAMPHLET = { w: 16, h: 28 };
export const PAMPHLET_STANDS = [
  { floor: 1, x: 584, explains: ['cli', 'script'] },
  { floor: 2, x: 584, explains: ['skills', 'annex'] },
  { floor: 3, x: 422, explains: ['hook', 'permissions', 'sandbox'] },
  { floor: 4, x: 584, explains: ['pods', 'command', 'warehouse'] },
  { floor: 5, x: 584, explains: ['mcp'] },
];
export const pamphletAt = f => PAMPHLET_STANDS.find(st => st.floor === f);
const pamphletProps = PAMPHLET_STANDS.map(({ floor: f, x }) => ({
  id: `pamphlet-${f}`, kind: 'pamphlet', floor: f, x, y: onGround(PAMPHLET.h), w: PAMPHLET.w, h: PAMPHLET.h,
  usable: false, read: true, shootable: false,
}));

// "The concept in action" demo interactables (E). range = E reach beyond the prop's edges (default CUE_RANGE);
// 0 keeps a demo's E zone clear of neighbouring read zones.
export const DEMOS = [
  // level 00: plunger button just east of the CLAUDE.md board (board card first, then the button, then the booth)
  { id: 'demo-donottouch', demo: 'doNotTouch', floor: 0, x: 360, y: onGround(40), w: 13, h: 40, range: 0, cue: 'PRESS' },
  // level 01: Tool Bin pegboard (wall) and the Script Lab stamp machine
  { id: 'demo-toolbin', demo: 'toolBin', floor: 1, x: 150, y: 46, w: 76, h: 54, range: 0, cue: 'GRAB A TOOL' },
  { id: 'demo-stamp', demo: 'stamp', floor: 1, x: 832, y: onGround(66), w: 44, h: 66, cue: 'PRESS' },
  // level 02: the skill book on its lectern at the west end of the Skill Library (walk past it, or READ)
  { id: 'demo-skillbook', demo: 'skillBook', floor: 2, x: 37, y: onGround(74), w: 59, h: 74, cue: 'READ' },
  // level 03: Hook Checkpoint, walking west from the lift — the caged red button (the exit 2 gate: never opens) at
  // the east end, then the walkway gate (exit 1: complains, then opens) at the west end, into the Permissions
  // Office (its door with the allow list); the sandbox pen's pick-up item. Each gate carries its exit-code plate;
  // cueFrame = the gate plus that plate (zones/f3.js draws the plate in it; the cue brackets frame it).
  { id: 'demo-hookgate', demo: 'hookGate', floor: 3, x: 343, y: onGround(37), w: 56, h: 37, range: 0, cue: 'TRY THE GATE', cueFrame: { x: 331, y: 41, w: 78, h: 88 } },
  { id: 'demo-exit1gate', demo: 'exit1Gate', floor: 3, x: 270, y: onGround(39), w: 22, h: 39, cue: 'TRY THE GATE', cueFrame: { x: 243, y: 41, w: 78, h: 88 } },
  { id: 'demo-permdoor', demo: 'permDoor', floor: 3, x: 174, y: onGround(64), w: 30, h: 64, cue: 'TRY THE DOOR' },
  { id: 'demo-sandbox', demo: 'sandbox', floor: 3, x: 850, y: onGround(12), w: 10, h: 12, range: 5, cue: 'PICK UP' },
  // level 04: the subagent pods' START console (west end of the pods room) and the hand truck of 29 subagent
  // binders (east end of the pods room); the PLUGIN crate you unpack onto the shelf (west end of the warehouse);
  // the janitor's main shutoff valve (west wall of the closet, at the east end of the floor)
  { id: 'demo-pods', demo: 'pods', floor: 4, x: 37, y: onGround(32), w: 12, h: 32, range: 4, cue: 'START' },
  { id: 'demo-binders', demo: 'binders', floor: 4, x: 370, y: onGround(56), w: 34, h: 56, cue: 'PICK UP THE BINDERS' },
  { id: 'demo-plugin', demo: 'plugin', floor: 4, x: 617, y: onGround(30), w: 44, h: 30, cue: 'UNPACK THE CRATE' },
  { id: 'demo-valve', demo: 'valve', floor: 4, x: 808, y: 82, w: 24, h: 24, range: 4, cue: 'TURN THE VALVE' },
  // level 05: a locked security gate standing alone in the open, past the server room (walk around it)
  { id: 'demo-mcpdoor', demo: 'mcpDoor', floor: 5, x: 756, y: onGround(52), w: 30, h: 52, cue: 'TRY THE GATE' },
  // gags (each with clear space of its own): the vim booth in the workshop corridor, the auto-compactor at the
  // east end of the library corridor, the prompt-injection poster on the sandbox wall, the dependency tower in
  // the warehouse, past its terminal
  { id: 'gag-vim', demo: 'vimBooth', gag: true, floor: 1, x: 238, y: onGround(62), w: 22, h: 62, range: 4, cue: 'STEP INSIDE' },
  { id: 'gag-compactor', demo: 'compactor', gag: true, floor: 2, x: 392, y: onGround(88), w: 44, h: 88, cue: 'FEED THE COMPACTOR' },
  { id: 'gag-poster', demo: 'poster', gag: true, floor: 3, x: 667, y: 46, w: 51, h: 50, range: 0, cue: 'READ THE POSTER' },
  { id: 'gag-tower', demo: 'tower', gag: true, floor: 4, x: 719, y: onGround(86), w: 56, h: 86, range: 0, cue: 'PULL THE BRICK' },
];
export const GAG_IDS = DEMOS.filter(d => d.gag).map(d => d.id);

// Level 04 subagent pods (glass booths): one worker NPC each, standing at the east end of the pod facing its desk.
// Two side by side west of the room terminal, the third east of it.
export const PODS = [
  { x: 58, w: 56, npc: 'worker1' },
  { x: 114, w: 56, npc: 'worker2' },
  { x: 254, w: 56, npc: 'worker3' },
];
export const podWorkerX = pod => pod.x + pod.w - 18;
// Level 04 water fountains (x = left edge, w 14). npc = who idles at it. The janitor's valve shuts them all: the
// pods room one (its regular drinks there) and the warehouse one next door to the closet, fed by the water main.
export const FOUNTAINS = [
  { floor: 4, x: 318, npc: 'hoarder' },
  { floor: 4, x: 775 },
];

// Level 03 sandbox pen: the item's x (its centre) always stays within [x0, x1]; fences stand just outside.
export const SANDBOX_PEN = { floor: 3, x0: 812, x1: 898 };
export const SANDBOX_ITEM = { w: 10, h: 12, range: 5 };
// Level 03 exit-1 walkway gate: the sliding panel sits at this x; closed, it stops the player GATE_CLEAR px short.
export const EXIT1_GATE_X = 281;

const extras = [
  ...stationProps,
  { id: 'kiosk', kind: 'kiosk', floor: 0, x: 896, y: onGround(60), w: 40, h: 60, usable: true, shootable: true, cue: 'USE KIOSK' },
  { id: 'decision', kind: 'decision', floor: 0, x: 396, y: onGround(30), w: 20, h: 30, usable: true, shootable: false, cue: 'ANSWER' },
  { id: 'sign-lobby', kind: 'sign', floor: 0, x: 732, y: 22, w: 142, h: 65, usable: false, read: false, shootable: true },
  { id: 'scr-directory', kind: 'screen', floor: 0, x: 574, y: 20, w: 152, h: 80, usable: false, read: false, shootable: true },
  ...pamphletProps,
  ...DEMOS.map(d => ({ ...d, kind: 'demo', usable: true, shootable: false })),
  ...RACK_XS.map((x, i) => ({
    id: `rack-${i}`, kind: 'rack', floor: 5, x, y: onGround(RACK.h), w: RACK.w, h: RACK.h, usable: false, read: false, shootable: true,
  })),
  // level 05: the Ludovico screen (shoot it to free the man in the chair); no IMPACT box, he speaks instead
  { id: 'ludo-screen', kind: 'slogan', floor: 5, ...LUDO.screen, usable: false, read: false, shootable: true, quietHit: true },
  // level 04: two stacks of two plain crates (shootable): beside the hand truck in the pods room, and beside the
  // PLUGIN crate in the warehouse
  ...[[406, 18], [406, 36], [665, 18], [665, 36]].map(([x, h], i) => ({
    id: `crate-${i}`, kind: 'crate', floor: 4, x, y: onGround(h), w: 22, h: 18, usable: false, shootable: true,
  })),
];

export const PROPS = [...roomProps, ...extras];

// outfit: jumpsuit | cardigan | labcoat | guard | hoodie | suit | hivis | greybeard
export const NPCS = [
  { id: 'reception', floor: 0, x: 772, outfit: 'cardigan', hair: 'brass', idle: 'type', behind: true, raise: 12 },
  { id: 'visitor', floor: 0, x: 640, outfit: 'suit', hair: 'hairDark', idle: 'glasses' },
  { id: 'ciadmin', floor: 0, x: 826, outfit: 'hoodie', hair: 'hairDark', idle: 'type', behind: true, raise: 12 },
  { id: 'janitor', floor: 0, x: 730, outfit: 'jumpsuit', hair: 'stone2', idle: 'lean' },
  { id: 'tech1', floor: 1, x: 300, outfit: 'jumpsuit', hair: 'skinDark', idle: 'type' },
  { id: 'sysadmin', floor: 1, x: 660, outfit: 'hoodie', hair: 'stone2', idle: 'sip' },
  { id: 'librarian', floor: 2, x: 176, outfit: 'cardigan', hair: 'stone2', idle: 'glasses' },
  { id: 'greybeard', floor: 2, x: 300, outfit: 'greybeard', hair: 'stone3', special: 'greybeard', idle: 'glasses' },
  { id: 'writer', floor: 2, x: 880, outfit: 'labcoat', hair: 'hairDark', idle: 'type' },
  { id: 'guard', floor: 3, x: 36, outfit: 'guard', hair: 'hairDark', idle: 'lean' },
  { id: 'compliance', floor: 3, x: 634, outfit: 'suit', hair: 'brass', idle: 'sip' }, // by the coat bench, clear of the poster
  // pod workers stand inside their glass pods (behind the glass front); idle 'wait' until the pods START
  { id: 'worker1', floor: 4, x: 96, outfit: 'hivis', hair: 'skinDark', idle: 'wait', flip: true, behind: true },
  { id: 'worker2', floor: 4, x: 152, outfit: 'hivis', hair: 'hairDark', idle: 'wait', flip: true, behind: true },
  { id: 'worker3', floor: 4, x: 292, outfit: 'hivis', hair: 'brass', idle: 'wait', flip: true, behind: true },
  { id: 'hoarder', floor: 4, x: 334, outfit: 'cardigan', hair: 'skinDark', idle: 'sip', flip: true }, // at the pods room fountain
  { id: 'srv1', floor: 5, x: 126, outfit: 'labcoat', hair: 'skinDark', idle: 'glasses' },
  // the man in the Ludovico chair: drawn strapped in by zones/f5.js until the screen is shot, then a normal NPC
  { id: 'ludovico', floor: 5, x: LUDO.chairX + 4, outfit: 'whites', hair: 'brass', idle: 'glasses', strapped: true },
  { id: 'srv2', floor: 5, x: 352, outfit: 'hoodie', hair: 'hairDark', idle: 'type' },
  { id: 'srv3', floor: 5, x: 318, outfit: 'jumpsuit', hair: 'brass', idle: 'lean' },
];

export const GUN_SPAWNS = [60, 250, 400, 650, 880].map(x => ({ x }));
