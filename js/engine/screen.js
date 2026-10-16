export const W = 427;
export const H = 240;

// Integer scale: round up only when the overshoot is <= 2 % on each axis, else floor.
export function fitScale(vw, vh) {
  const r = Math.min(vw / W, vh / H);
  const up = Math.round(r);
  if (up > Math.floor(r) && W * up <= vw * 1.02 && H * up <= vh * 1.02) return Math.max(1, up);
  return Math.max(1, Math.floor(r));
}

export function createScreen(canvas) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const ui = document.getElementById('ui');
  function fit() {
    const s = fitScale(innerWidth, innerHeight);
    const w = W * s, h = H * s;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    if (ui) {
      ui.style.width = `${w}px`;
      ui.style.height = `${h}px`;
      ui.style.setProperty('--px', `${s}px`);
    }
  }
  addEventListener('resize', fit);
  fit();
  return ctx;
}
