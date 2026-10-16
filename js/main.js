import { createScreen } from './engine/screen.js?v=68';
import { startLoop } from './engine/loop.js?v=68';
import { createInput } from './engine/input.js?v=68';
import { initAudio, toggleMute } from './engine/audio.js?v=68';
import { boot } from './scenes/boot.js?v=68';
import { detectMobile, devParams } from './engine/device.js?v=68';
import { facility } from './scenes/facility.js?v=68';
import { directoryHtml } from './logic/directory.js?v=68';

// the text directory is built from the game's own data (floors, rooms, room cards, badge chips)
const dir = document.getElementById('directory');
if (dir) dir.innerHTML = directoryHtml();

const ctx = createScreen(document.getElementById('screen'));
const input = createInput();
input.onKey(e => {
  initAudio();
  if (e.code === 'KeyM') toggleMute();
});
// a click or tap also unlocks sound (browsers only start audio after a user gesture)
addEventListener('pointerdown', () => initAudio());

const scenes = { boot, facility };
let current = null;
const game = {
  setScene(name, params = {}) {
    current = scenes[name] ?? scenes.facility;
    current.enter(params, game);
  },
};

// Dev-only, and only on localhost / 127.0.0.1 (ignored on the published site):
// ?skipboot=1&floor=N[&x=px][&armed=1] jumps straight into the facility (used by headless checks).
// ?hell=1 skips boot, sets the YES/YES fate and starts the lift ride from level 05 down into hell.
// ?heaven=1 skips boot, sets the not-MCP (YES/NO) fate and starts the ride from level 00 up to the ascension.
const q = devParams(location.search, location.hostname);
if ((q.get('skipboot') === '1' || q.get('hell') === '1' || q.get('heaven') === '1') && !detectMobile()) {
  game.setScene('facility', { floor: Number(q.get('floor') ?? 0), x: q.has('x') ? Number(q.get('x')) : undefined, armed: q.get('armed') === '1', hell: q.get('hell') === '1', heaven: q.get('heaven') === '1' });
} else {
  game.setScene('boot', { mobile: detectMobile() });
}
startLoop(
  dt => { current.update(dt, input, game); input.endFrame(); },
  () => { current.draw(ctx); },
);
