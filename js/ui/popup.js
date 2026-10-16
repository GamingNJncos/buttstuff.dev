// Proximity read box: a compact bolted mini-plate placed beside the object (world coords -> canvas px -> CSS).
import { BOX_W, boxHeight, fitHeight, placeBox } from '../world/read.js?v=68';
import { floorTop } from '../world/levels.js?v=68';
import { reduced } from '../engine/motion.js?v=68';

let el = null;
let cur = { key: null, t0: 0, n: -1 };

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function ensure() {
  if (el && el.isConnected) return el;
  const host = document.getElementById('ui');
  if (!host) return null;
  el = document.createElement('div');
  el.className = 'rbox';
  el.hidden = true;
  el.innerHTML = '<span class="bolt tl"></span><span class="bolt tr"></span><span class="bolt bl"></span><span class="bolt br"></span><p class="rbox__t"></p><pre class="rbox__b"></pre><div class="rfit" hidden></div>';
  host.append(el);
  return el;
}

// info: { key, title, lines, obj: {x,y,w,h} (world), playerX, alert, concept } | null
// concept: the amber "concept in action" box (fixed header, demo text) — see world/concept.js.
export function updatePopup(info, cam, scale) {
  const box = ensure();
  if (!box) return;
  if (!info) { if (!box.hidden) { box.hidden = true; cur.key = null; } return; }
  // the concept box's thicker amber frame and hazard strip add ~1 canvas px over a plain box
  const bh = boxHeight(info.lines.length) + fitHeight(info.fit) + (info.concept ? 1 : 0);
  const pos = placeBox(info.obj, info.playerX, { x: cam.x, y: cam.y, w: 427, h: 240 }, BOX_W, bh, info.avoid ?? []);
  if (cur.key !== info.key) {
    cur = { key: info.key, t0: performance.now(), n: -1 };
    box.querySelector('.rbox__t').textContent = info.title;
    box.classList.toggle('rbox--alert', !!info.alert);
    box.classList.toggle('rbox--concept', !!info.concept);
    const f = info.fit;
    const sub = box.querySelector('.rfit');
    sub.hidden = !f;
    sub.className = `rfit${f ? ` rfit--${f.state}` : ''}`;
    sub.innerHTML = f ? `<p class="rfit__h">${esc(f.head)}</p>${f.lines.map(l => `<span class="rfit__b">${esc(l)}</span>`).join('')}` : '';
    box.hidden = false;
  }
  box.style.left = `${Math.round(pos.x - cam.x) * scale}px`;
  box.style.top = `${Math.round(pos.y - cam.y) * scale}px`;
  box.style.width = `${BOX_W * scale}px`;
  const total = info.lines.reduce((a, l) => a + l.length, 0);
  const k = reduced ? 1 : Math.min(1, (performance.now() - cur.t0) / 350);
  const n = Math.floor(total * k);
  if (n !== cur.n) {
    cur.n = n;
    let left = n;
    box.querySelector('.rbox__b').innerHTML = info.lines.map(l => {
      const lab = l.startsWith('§');
      const t = lab ? l.slice(1) : l;
      const shown = t.slice(0, Math.max(0, left)); left -= l.length;
      return `<span class="${lab ? 'rl' : 'rt'}">${esc(shown) || '&nbsp;'}</span>`;
    }).join('');
  }
}

export const worldRect = pr => ({ x: pr.x, y: floorTop(pr.floor) + pr.y, w: pr.w, h: pr.h });
