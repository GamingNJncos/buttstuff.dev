// 32-colour indexed palette. Ramps: void/navy, steel, stone, rust, wood/brass, mint, signal, skin/hair, cream.
export const PAL = [
  '#0a0910', '#141322', '#20233d', '#2f3c5c', // 0-3 void/navy
  '#46607e', '#6a8fa8', '#98bccb', '#c8dde3', // 4-7 steel
  '#3b3431', '#5e544c', '#877b6b', '#b0a68f', // 8-11 stone
  '#5a2618', '#87452a', '#b0703f', '#d39a5c', // 12-15 rust/copper
  '#3e2a1c', '#6b4a2b', '#a88a4a',            // 16-18 wood/brass
  '#1d4f4a', '#4fb894', '#9af0bf',            // 19-21 mint phosphor
  '#f2b23a', '#c8372d', '#d97aa6', '#e8d44d', // 22-25 amber, red, pink, yellow
  '#e3a87a', '#a8683f', '#3a2a22',            // 26-28 skin, skin-dark/warm hair, dark hair
  '#d8d1b8', '#f3ecd0', '#fffdf4',            // 29-31 cream/white
];

export const C = {
  void: 0, ink: 1, navy: 2, navy2: 3, steel0: 4, steel1: 5, steel2: 6, steel3: 7,
  stone0: 8, stone1: 9, stone2: 10, stone3: 11, rust0: 12, rust1: 13, rust2: 14, rust3: 15,
  wood0: 16, wood1: 17, brass: 18, mint0: 19, mint1: 20, mint2: 21,
  amber: 22, red: 23, pink: 24, yellow: 25, skin: 26, skinDark: 27, hairDark: 28,
  cream: 29, cream2: 30, white: 31,
};

const h = i => PAL[i];

// Legacy names used by Phase 1 code, mapped onto the palette.
export const P = {
  black: h(0), night: h(1), wall: h(2), wall2: h(3), slab: h(4), trim: h(5), grey: h(6), white: h(30),
  skin: h(26), hair: h(28), blonde: h(18), brown: h(17), coat: h(14),
  shirt: h(1), pants: h(3), shoe: h(0),
  green: h(20), dimgreen: h(19), red: h(23), amber: h(22), cyan: h(6),
  blue: h(4), yellow: h(25), orange: h(14), purple: h(24), phosphor: h(21),
};
export const HELL = { sky1: h(12), sky2: h(13), rock: h(8), fire1: h(14), fire2: h(25) };
export const HEAVEN = { sky1: h(31), sky2: h(30), cloud: h(31), gold: h(18) };

const identity = [...Array(32).keys()];
export const ZONE_REMAP = {
  base: identity,
  hell: identity.map(i => ([2, 3, 4, 5].includes(i) ? [12, 13, 13, 14][i - 2] : i)),
  heaven: identity.map(i => ([0, 1, 2, 3].includes(i) ? [29, 30, 30, 31][i] : i)),
};
