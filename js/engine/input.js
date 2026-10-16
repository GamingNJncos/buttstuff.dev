export const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

export const KEYS = {
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  use: ['KeyE', 'Enter'], // not ArrowUp: the Konami code starts with it
  fire: ['Space'],
  back: ['Escape'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  confirm: ['KeyE', 'Enter'],
};

// On a wrong key, fall back to the longest typed tail that still starts the sequence,
// so an extra key (UP UP UP DOWN ...) does not throw the whole attempt away.
export function createSequenceMatcher(seq) {
  let typed = [];
  return code => {
    typed.push(code);
    for (;;) {
      if (typed.every((c, k) => c === seq[k])) break;
      typed = typed.slice(1);
    }
    if (typed.length === seq.length) { typed = []; return true; }
    return false;
  };
}

const PREVENT = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export function createInput(target = window) {
  const down = new Set();
  let pressed = new Set();
  let order = []; // this step's key presses, in the order they were typed
  const listeners = [];
  target.addEventListener('keydown', e => {
    if (PREVENT.has(e.code)) e.preventDefault();
    down.add(e.code);
    if (e.repeat) return;
    pressed.add(e.code);
    order.push(e.code);
    for (const f of listeners) f(e);
  });
  target.addEventListener('keyup', e => down.delete(e.code));
  target.addEventListener('blur', () => down.clear());
  return {
    isDown: code => down.has(code),
    wasPressed: code => pressed.has(code),
    anyPressed: () => pressed.size > 0,
    codes: () => order,
    onKey: fn => listeners.push(fn),
    endFrame() { pressed = new Set(); order = []; },
  };
}

export function any(input, codes, fn = 'isDown') {
  return codes.some(c => input[fn](c));
}
