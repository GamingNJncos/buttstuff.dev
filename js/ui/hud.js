// DOM HUD over the canvas: logo + location pill, buttons, [E] prompt, footer tagline.
import { ZONE_NAMES } from '../world/levels.js?v=68';

let root = null;
let els = {};
let last = {};

const SPEAKER = (muted) => `<svg viewBox="0 0 9 7" width="100%" height="100%" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M0 2h2v3H0zM2 1h1v5H2zM3 0h1v7H3z"/>${muted
  ? '<path fill="currentColor" d="M5 2h1v1H5zM7 2h1v1H7zM6 3h1v1H6zM5 4h1v1H5zM7 4h1v1H7z"/>'
  : '<path fill="currentColor" d="M5 2h1v3H5zM7 1h1v5H7z"/>'}</svg>`;

export function createHud(actions) {
  root = document.getElementById('ui');
  if (!root) return null;
  root.querySelectorAll('.hud').forEach(n => n.remove());
  const wrap = document.createElement('div');
  wrap.className = 'hud';
  wrap.innerHTML = `
    <div class="hud__tl">
      <div class="hud__logo">2MCP<span class="acc">//</span>FACILITY</div>
      <div class="hud__pill"><span class="sq">■</span> <span class="loc"></span></div>
      <div class="hud__badge" hidden><span class="lbl">BADGE</span> <span class="txt"></span></div>
    </div>
    <div class="hud__tr">
      <button class="btn hud__btn" data-a="map" tabindex="-1">MAP</button>
      <button class="btn hud__btn" data-a="badge" tabindex="-1">BADGE</button>
      <button class="btn hud__btn" data-a="directory" tabindex="-1">DIRECTORY</button>
      <button class="btn hud__btn hud__snd" data-a="sound" tabindex="-1" aria-label="sound"></button>
    </div>
    <div class="hud__prompt" hidden><span class="key">E</span><span class="cue"></span></div>
    <div class="hud__pew" hidden>PEW ARMED · SPACE</div>
    <div class="hud__foot">TO MCP OR NOT TO MCP. MOST OF THE TIME, NOT.</div>`;
  root.append(wrap);
  els = {
    wrap, loc: wrap.querySelector('.loc'), prompt: wrap.querySelector('.hud__prompt'), cue: wrap.querySelector('.cue'),
    snd: wrap.querySelector('.hud__snd'), pew: wrap.querySelector('.hud__pew'),
    badge: wrap.querySelector('.hud__badge'), badgeTxt: wrap.querySelector('.hud__badge .txt'),
  };
  last = {};
  wrap.querySelectorAll('button').forEach(b => b.addEventListener('click', e => {
    e.currentTarget.blur();
    actions?.[b.dataset.a]?.();
  }));
  return els;
}

export function updateHud({ floor, inLift, cue, muted, armed, hidden, badgeLine, room }) {
  if (!els.wrap) return;
  const loc = inLift ? `GOODS LIFT 2 · LEVEL ${fmt(floor)}` : `${room ?? ZONE_NAMES[floor] ?? '??'} · LEVEL ${fmt(floor)}`;
  if (last.loc !== loc) { els.loc.textContent = loc; last.loc = loc; }
  if (last.cue !== cue) { els.prompt.hidden = !cue; els.cue.textContent = cue ?? ''; last.cue = cue; }
  if (last.muted !== muted) { els.snd.innerHTML = SPEAKER(muted); last.muted = muted; }
  if (last.armed !== armed) { els.pew.hidden = !armed; last.armed = armed; }
  if (last.badge !== badgeLine) { els.badge.hidden = !badgeLine; els.badgeTxt.textContent = badgeLine ?? ''; last.badge = badgeLine; }
  if (last.hidden !== hidden) { els.wrap.classList.toggle('hud--off', !!hidden); last.hidden = hidden; }
}

const fmt = f => (f < 0 ? '↑↑' : f > 5 ? '??' : `0${f}`);

export function removeHud() {
  els.wrap?.remove();
  els = {};
}
