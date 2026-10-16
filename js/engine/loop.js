export function startLoop(update, draw) {
  const STEP = 1 / 60;
  let acc = 0;
  let last = performance.now();
  function frame(now) {
    acc += Math.min(0.25, (now - last) / 1000);
    last = now;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
