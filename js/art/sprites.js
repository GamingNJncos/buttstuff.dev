// Character sprites as palette-key strings. Keys map to C names (palette indices); '$slot' keys are
// filled per outfit / per call through `colors`.
import { PAL, C } from './palette.js?v=68';

export const KEYMAP = {
  '.': null, o: 'void', i: 'ink', n: 'navy', N: 'navy2', s: 'skin', S: 'skinDark', h: 'hairDark',
  g: 'void', w: 'steel2', W: 'cream2', p: 'navy2', P: 'steel0', b: 'void', B: 'stone1', k: 'ink', K: 'navy',
  e: 'void', m: 'skinDark', r: 'red', u: 'yellow', A: 'amber', G: 'steel1', T: 'steel3',
  c: '$top', C: '$top2', l: '$leg', L: '$leg2', a: '$acc', y: '$hair', Y: '$hair2', x: '$hat', X: '$hat2',
};

export function parseSprite(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const px = [];
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`row ${y} width ${row.length} != ${w}`);
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (!(ch in KEYMAP)) throw new Error(`unknown sprite key "${ch}"`);
      if (KEYMAP[ch]) px.push([x, y, KEYMAP[ch]]);
    }
  });
  return { w, h, px };
}

const colOf = (key, colors) => {
  if (key[0] === '$') {
    const v = colors[key.slice(1)];
    return v == null ? null : PAL[typeof v === 'number' ? v : C[v]];
  }
  return PAL[C[key]];
};

export function drawSprite(ctx, spr, x, y, { flip = false, colors = {} } = {}) {
  x = Math.round(x); y = Math.round(y);
  for (const [px, py, key] of spr.px) {
    const c = colOf(key, colors);
    if (!c) continue;
    ctx.fillStyle = c;
    ctx.fillRect(x + (flip ? spr.w - 1 - px : px), y + py, 1, 1);
  }
}

// ---------------------------------------------------------------- player 14x26
// Heavyset, black tee, dark ponytail, glasses. Faces right.
const P_TOP = [
  '....ooooo.....',
  '...ohhhhhoo...',
  '..ohhhhhhhho..',
  '.ohhhhhhhhhho.',
  '.ohhhhhssssso.',
  'ohhhhgggggggo.',
  'ohohhsgwggwgo.',
  'oho.ohsssssso.',
  'oho.ohsssssSo.',
  'oho..osssmsso.',
  '.o....ossssoo.',
  '...ookkkkoo...',
  '..okkKKkkkko..',
  '.okkKKKkkkkko.',
  '.okkKKKkkkkkko',
  'okkkKKkkkkkkko',
  'okkksskkkkkkko',
  'okkksskkkkkkko',
  '.okkssskkkkko.',
  '..ooppppppoo..',
];
const P_LEGS = {
  idle: [
    '...oppppPppo..',
    '...oppo.oPpo..',
    '...oppo.oppo..',
    '...oppo.oppo..',
    '...oPpo.oPpo..',
    '..obbbo.obbbo.',
  ],
  walk1: [
    '...oppppPppo..',
    '..oppo..oppo..',
    '..oppo...oppo.',
    '.oppo....oppo.',
    '.oPpo.....oPpo',
    'obbbo....obbbo',
  ],
  walk2: [
    '...oppppPppo..',
    '....oppPppo...',
    '....opppppo...',
    '.....oppPo....',
    '.....opppo....',
    '....obbbbbo...',
  ],
};
export const PLAYER = {
  idle: parseSprite([...P_TOP, ...P_LEGS.idle]),
  walk1: parseSprite([...P_TOP, ...P_LEGS.walk1]),
  walk2: parseSprite([...P_TOP, ...P_LEGS.walk2]),
};

// ---------------------------------------------------------------- NPC 10x22
const N_BASE = [
  '...oooo...',
  '..oyyyyoo.',
  '.oyyyyyyyo',
  '.oyyysssso',
  '.oyyssesso',
  '.oysssssso',
  '..osssmso.',
  '...ossso..',
  '..occacco.',
  '.ocCcacCco',
  'occCcaccCo',
  'occCcaccCo',
  'occCcaccCo',
  'occscaccCo',
  '.occcacco.',
  '..oLllLo..',
  '..ollollo.',
  '..olo.olo.',
  '..olo.olo.',
  '..olo.olo.',
  '..oLo.oLo.',
  '.obbo.obbo',
];

const repl = (rows, map) => rows.map((r, i) => (map[i] != null ? map[i] : r));
const CAP = { 0: '..ooooo...', 1: '.oxxxxxo..', 2: '.oXXXXXXXo' };

export const OUTFITS = {
  jumpsuit: { colors: { top: 'steel0', top2: 'navy2', leg: 'steel0', leg2: 'navy2', acc: 'navy2', hat: 'amber', hat2: 'rust2' }, rows: CAP },
  cardigan: { colors: { top: 'rust1', top2: 'rust0', leg: 'navy2', leg2: 'navy', acc: 'cream' } },
  labcoat: { colors: { top: 'cream', top2: 'stone2', leg: 'steel0', leg2: 'navy2', acc: 'steel1' }, rows: { 15: '.occcccCo.', 16: '.occo.cCo.' } },
  guard: { colors: { top: 'navy2', top2: 'navy', leg: 'navy', leg2: 'ink', acc: 'amber', hat: 'navy', hat2: 'ink' }, rows: { 0: '..oooooo..', 1: '.oxxAxxxo.', 2: '.oXXXXXXXo' } },
  hoodie: { colors: { top: 'mint0', top2: 'navy2', leg: 'stone0', leg2: 'hairDark', acc: 'mint1' }, rows: { 7: '..occcco..' } },
  suit: { colors: { top: 'ink', top2: 'navy', leg: 'ink', leg2: 'navy', acc: 'red' }, rows: { 8: '..oWaWco..' } },
  hivis: { colors: { top: 'amber', top2: 'rust2', leg: 'navy2', leg2: 'navy', acc: 'cream2', hat: 'yellow', hat2: 'amber' }, rows: { 0: '...oooo...', 1: '..oxxxxo..', 2: '.oXXXXXXXo', 11: 'oCaaaaaaCo' } },
  whites: { colors: { top: 'cream2', top2: 'cream', leg: 'cream', leg2: 'stone2', acc: 'stone3' } }, // the Ludovico chair man
  greybeard: { colors: { top: 'wood1', top2: 'wood0', leg: 'stone0', leg2: 'hairDark', acc: 'brass' }, rows: { 5: '.oysssyyyo', 6: '..oyyyyyo.', 7: '..oyyyyo..', 8: '..ocyyco..' } },
};

const npcCache = new Map();
// frame 0 = base, 1 = idle action, 2 = blink
export function npcSprite(outfit = 'jumpsuit', frame = 0, idle = 'type') {
  const k = `${outfit}|${frame}|${idle}`;
  if (npcCache.has(k)) return npcCache.get(k);
  const o = OUTFITS[outfit] ?? OUTFITS.jumpsuit;
  let rows = repl(N_BASE, o.rows ?? {});
  if (frame === 1) {
    if (idle === 'type') rows = repl(rows, { 12: rows[12].slice(0, 7) + 'sso', 13: rows[13].slice(0, 3) + 'c' + rows[13].slice(4) });
    else if (idle === 'sip') rows = repl(rows, { 6: rows[6].slice(0, 7) + 'oWW', 7: rows[7].slice(0, 7) + 'WWW', 13: rows[13].slice(0, 3) + 'c' + rows[13].slice(4) });
    else if (idle === 'glasses') rows = repl(rows, { 4: rows[4].slice(0, 5) + 'GGGso'.slice(0, 5) });
    else rows = repl(rows, { 4: rows[4].replace('e', 's') });
  }
  if (frame === 2) rows = repl(rows, { 4: rows[4].replace('e', 's') });
  const spr = parseSprite(rows);
  npcCache.set(k, spr);
  return spr;
}
export const npcColors = (n) => ({ ...(OUTFITS[n.outfit] ?? OUTFITS.jumpsuit).colors, hair: n.hair });

export const NPC = npcSprite('jumpsuit');
export const NPC_BEARD = npcSprite('greybeard');
export const GUN = parseSprite(['ooooooo', 'oTTTTGo', 'ooGo...', '.oGo...']);
