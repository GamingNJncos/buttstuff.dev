// INTERN - All Access Badge: a lanyard ID card drawn in game pixels (palette colours only, no alpha).
// Shown in the badge kiosk plate at the canvas scale (one badge pixel = one game pixel).
import { PAL, C } from './palette.js?v=68';
import { FONT5, textWidth } from '../engine/font.js?v=68';

export const BADGE_W = 88;
export const BADGE_H = 129;

const M = x => BADGE_W - 1 - x; // mirror across the badge's centre line

// 5x7 glyphs at an integer scale (the big name on the card)
function bigText(r, s, x, y, c, k) {
  let i = 0;
  for (const ch of s) {
    const g = FONT5[ch] ?? FONT5['?'];
    for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) if (g[row][col] === '1') r(x + i * 6 * k + col * k, y + row * k, k, k, c);
    i++;
  }
}

function smallText(r, s, x, y, c) {
  let i = 0;
  for (const ch of s) {
    const g = FONT5[ch] ?? FONT5['?'];
    for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) if (g[row][col] === '1') r(x + i * 6 + col, y + row, 1, 1, c);
    i++;
  }
}

// g: a 2D context (or anything with fillStyle + fillRect). card: { name, access } from COPY.intern.card.
export function drawInternBadge(g, card) {
  const r = (x, y, w, h, c) => { g.fillStyle = PAL[c]; g.fillRect(x, y, w, h); };
  const px = (x, y, c) => r(x, y, 1, 1, c);
  const pair = (x, y, c) => { px(x, y, c); px(M(x), y, c); };

  // lanyard: two woven straps in a V that meet over the clip
  for (let y = 0; y < 25; y++) {
    const x = 14 + y;
    r(x, y, 6, 1, C.mint1); r(M(x + 5), y, 6, 1, C.mint1);
    pair(x, y, C.mint0); pair(x + 5, y, C.mint0);
    if (y % 2 === 0) pair(x + 2, y, C.mint2);
  }
  // strap fold over the crimp
  r(38, 24, 12, 4, C.mint1);
  r(38, 24, 1, 4, C.mint0); r(49, 24, 1, 4, C.mint0);
  r(39, 26, 10, 1, C.mint0);
  // metal crimp band with a rivet
  r(37, 28, 14, 4, C.steel2);
  r(37, 28, 14, 1, C.steel3);
  r(37, 31, 14, 1, C.steel0);
  px(37, 28, C.steel1); px(50, 28, C.steel1);
  r(43, 29, 2, 2, C.steel0); px(43, 29, C.white);
  // swivel ring
  r(41, 32, 6, 1, C.steel2);
  r(40, 33, 1, 4, C.steel2); r(47, 33, 1, 4, C.steel1);
  r(41, 37, 6, 1, C.steel0);

  // laminated sleeve (clear plastic over the card), rounded corners, drop shadow
  r(86, 44, 1, 85, C.void); r(4, 128, 83, 1, C.void);
  r(2, 42, 84, 86, C.steel1);
  r(3, 43, 82, 84, C.steel3);
  for (const [x, y] of [[2, 42], [85, 42], [2, 127], [85, 127]]) px(x, y, C.ink);
  // sleeve glare, top-left corner
  r(4, 44, 7, 1, C.white); r(4, 45, 1, 5, C.white);
  // punched slot with an eyelet rivet at each end
  r(38, 45, 12, 3, C.void);
  r(38, 48, 12, 1, C.steel1);
  for (const x of [33, 52]) {
    r(x, 44, 3, 4, C.brass);
    px(x, 44, C.yellow);
    px(x + 2, 47, C.wood1);
    px(x + 1, 45, C.wood0);
  }

  // the card
  r(5, 50, 78, 75, C.cream2);
  r(82, 50, 1, 75, C.cream); r(5, 124, 78, 1, C.cream);
  // amber header band: ALL ACCESS
  r(5, 50, 78, 12, C.amber);
  r(5, 50, 78, 1, C.yellow);
  r(5, 61, 78, 1, C.rust2);
  smallText(r, card.access, (BADGE_W - textWidth(card.access)) >> 1, 52, C.ink);

  // photo square: a pixel portrait in front of a dithered backdrop
  r(29, 65, 30, 30, C.steel0);
  r(30, 66, 28, 28, C.steel1);
  for (let y = 66; y < 80; y++) for (let x = 30 + (y & 1); x < 58; x += 2) px(x, y, C.steel2);
  // shoulders, collar, the intern's own lanyard
  r(35, 86, 18, 1, C.navy2); r(33, 87, 22, 7, C.navy2);
  r(41, 86, 6, 1, C.cream2); r(42, 87, 4, 1, C.cream2); r(43, 88, 2, 1, C.cream2);
  for (let k = 0; k < 6; k++) pair(38 + (k >> 1), 87 + k, C.mint1);
  // neck and head
  r(40, 82, 8, 4, C.skinDark);
  r(37, 70, 14, 14, C.skin);
  pair(37, 83, C.steel1); // round the chin
  // hair
  r(39, 68, 10, 1, C.hairDark);
  r(37, 69, 14, 4, C.hairDark);
  for (let y = 70; y < 77; y++) pair(36, y, C.hairDark);
  pair(37, 73, C.hairDark);
  // ears, eyes, cheeks, mouth
  r(36, 77, 1, 2, C.skinDark); r(51, 77, 1, 2, C.skinDark);
  r(41, 76, 1, 2, C.ink); r(46, 76, 1, 2, C.ink);
  pair(39, 79, C.pink);
  r(42, 80, 4, 1, C.skinDark);

  // INTERN, big, embossed
  const k = 2, nx = (BADGE_W - (textWidth(card.name) + 1) * k + k) >> 1;
  bigText(r, card.name, nx + 1, 99, C.stone3, k);
  bigText(r, card.name, nx, 98, C.ink, k);
  r(9, 114, 70, 1, C.rust2);

  // barcode: one half (30 px) and its mirror, centred under the name
  const bars = [1, 2, 1, 1, 3, 1, 2, 2, 1, 1, 1, 3, 2, 1, 1, 2, 1, 1, 3];
  let bx = 14;
  for (const half of [bars, bars.slice().reverse()]) half.forEach((w, i) => { if (i % 2 === 0) r(bx, 117, w, 5, C.ink); bx += w; });

  // lamination glare at the band's free right end
  for (let i = 0; i < 8; i++) px(74 + i, 51 + i, C.white);
  for (let i = 0; i < 4; i++) px(78 + i, 51 + i, C.white);

  // the clip tongue drops through the slot
  r(42, 38, 4, 9, C.steel2);
  r(42, 38, 1, 9, C.steel3);
  r(45, 38, 1, 9, C.steel0);
  r(42, 38, 4, 1, C.steel1);
}
