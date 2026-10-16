export const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

// level 0 → all a, 16 → all b
export function ditherRect(ctx, x, y, w, h, a, b, level) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      ctx.fillStyle = BAYER4[(y + j) & 3][(x + i) & 3] < level ? b : a;
      ctx.fillRect(x + i, y + j, 1, 1);
    }
  }
}

// vertical blend top→bottom over h rows
export function ditherV(ctx, x, y, w, h, top, bottom) {
  for (let j = 0; j < h; j++) {
    const level = Math.round((j / Math.max(1, h - 1)) * 16);
    ditherRect(ctx, x, y + j, w, 1, top, bottom, level);
  }
}

// light cone: trapezoid from topW to botW, lit fading toward base downward
export function ditherCone(ctx, cx, y, topW, botW, h, lit, base) {
  for (let j = 0; j < h; j++) {
    const w = Math.round(topW + ((botW - topW) * j) / Math.max(1, h - 1));
    const level = Math.round(10 - (j / Math.max(1, h - 1)) * 10);
    for (let i = 0; i < w; i++) {
      const x = Math.round(cx - w / 2) + i;
      if (BAYER4[(y + j) & 3][x & 3] < level) { ctx.fillStyle = lit; ctx.fillRect(x, y + j, 1, 1); }
    }
  }
  void base;
}
