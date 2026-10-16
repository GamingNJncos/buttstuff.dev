// Bolted DOM plates rendered as a pure view of s.overlay (kiosk, lift, decision, map, directory).
import { CHIPS } from '../logic/gauntlet.js?v=68';
import { COPY, ROOM_COPY, FIT_TAG } from '../logic/copy.js?v=68';
import { ROOMS, ZONE_NAMES } from '../world/levels.js?v=68';
import { liftOptions } from '../world/lift.js?v=68';
import { explain } from '../logic/explain.js?v=68';
import { drawInternBadge, BADGE_W, BADGE_H } from '../art/badge.js?v=68';

let host = null;
let cur = null; // { sig, el, type }
let actions = {};

export function initPlates(a) {
  host = document.getElementById('ui');
  actions = a ?? {};
  cur = null;
  egg?.el.remove();
  egg = null;
  host?.classList.remove('ui--crack');
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// The plate font (Silkscreen) draws lowercase as capitals: file names like CLAUDE.md keep their real case in a span
// set in a font that has lowercase (.fname).
export const fileCase = s => esc(s).replace(/[A-Za-z_-]+\.md\b/g, m => `<span class="fname">${m}</span>`);
export const NO_NEEDS = 'NO NEEDS TICKED';
const STATE_TAG = { primary: [FIT_TAG.primary, 'tag--mint'], supporting: [FIT_TAG.supporting, 'tag--mint0'], denied: [FIT_TAG.denied, 'tag--red'], off: [NO_NEEDS, 'tag--steel'] };

// Enter / Space on the focused intern badge picks it, but never while the Konami warning or cracktro is up
// (that Enter belongs to the warning plate).
export const badgeKeyPicks = (code, eggPhase = 'off') => eggPhase === 'off' && (code === 'Enter' || code === 'Space' || code === 'NumpadEnter');

// When the Konami warning opens, nothing behind it may keep keyboard focus (a focused kiosk badge would take Enter).
export function dropFocus(doc = globalThis.document) {
  const a = doc?.activeElement;
  if (a && a !== doc.body && typeof a.blur === 'function') a.blur();
}

function plate({ kicker, title, tag, tagClass = '', body, footer = '', cls = '' }) {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `
    <div class="plate ${cls}" role="dialog" aria-label="${esc(title)}">
      <span class="bolt tl"></span><span class="bolt tr"></span><span class="bolt bl"></span><span class="bolt br"></span>
      <div class="plate__bar">
        <div class="plate__heads"><p class="kicker">${esc(kicker)}</p><h2 class="plate__title">${esc(title)}</h2></div>
        ${tag ? `<span class="tag ${tagClass}">${esc(tag)}</span>` : ''}
        <button class="btn btn--close" tabindex="-1" data-a="close" aria-label="close">✕</button>
      </div>
      <div class="plate__body">${body}</div>
      ${footer ? `<div class="plate__foot">${footer}</div>` : ''}
    </div>`;
  ov.addEventListener('click', e => {
    const b = e.target.closest('[data-a]');
    if (!b) { if (e.target === ov) actions.close?.(); return; }
    b.blur();
    actions[b.dataset.a]?.(b.dataset.i != null ? Number(b.dataset.i) : undefined);
  });
  // Enter / Space on the focused intern badge picks it here, so the game never also reads that key
  // (it would reopen the kiosk the player is standing at). Other keys go on to the game as usual.
  ov.addEventListener('keydown', e => {
    if ((egg?.phase ?? 'off') !== 'off') return; // the Konami warning owns Enter while it is up
    if (!e.target.closest?.('.ibadge') || !badgeKeyPicks(e.code)) return;
    e.preventDefault();
    e.stopPropagation();
    if (!e.repeat) actions.intern?.();
  });
  return ov;
}

// the badge picture, drawn once in game pixels and reused by every kiosk plate
let badgeUrl = null;
function badgeSrc() {
  if (badgeUrl) return badgeUrl;
  const c = document.createElement('canvas');
  c.width = BADGE_W; c.height = BADGE_H;
  drawInternBadge(c.getContext('2d'), COPY.intern.card);
  badgeUrl = c.toDataURL('image/png');
  return badgeUrl;
}

function verdictTag(s) {
  if (s.intern) return ['', ''];
  if (!s.badge.size) return [NO_NEEDS, 'tag--steel'];
  return s.result.verdict ? [s.result.verdict, 'tag--mint'] : ['NO MATCH', 'tag--red'];
}

function bestState(s, f) {
  const order = { primary: 3, supporting: 2, denied: 1, off: 0 };
  let best = 'off';
  for (const r of ROOMS) if (r.floor === f) { const v = s.result.rooms[r.id].state; if (order[v] > order[best]) best = v; }
  return best;
}

function build(s, o) {
  if (o.type === 'kiosk') {
    const [tag, tc] = verdictTag(s);
    const e = explain(s.result, s.badge);
    const rows = CHIPS.map((c, i) => `<button class="chip ${s.badge.has(c.id) ? 'chip--on' : ''} ${i === o.cursor ? 'chip--cur' : ''}" tabindex="-1" data-a="toggle" data-i="${i}"><span class="box">${s.badge.has(c.id) ? 'X' : '&nbsp;'}</span>${esc(c.label)}</button>`).join('');
    const list = (h, items, cls = '') => (items.length ? `<p class="res__h">${h}</p><ul class="res__l ${cls}">${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
    const result = s.intern
      ? `<p class="res__head res__head--intern">${esc(COPY.intern.head)}</p><p class="res__note">${esc(COPY.intern.body)}</p>`
      : s.badge.size
        ? `<p class="res__head">${esc(e.headline)}</p>${list('USE:', e.use, 'res__l--use')}${list('ALSO:', e.also)}${list('WHY:', e.why, 'res__l--why')}${list('GO TO:', e.where.map(w => w.label), 'res__l--go')}`
        : `<p class="res__head res__head--idle">PICK WHAT YOUR THING NEEDS</p><p class="res__note">${esc(COPY.kioskIdle)}</p>`;
    // the INTERN - All Access Badge: a pixel lanyard ID card in the right-hand column; Tab reaches it
    const name = esc(COPY.intern.button);
    const badge = `<div class="kbadge"><button class="ibadge ${o.cursor === CHIPS.length ? 'ibadge--cur' : ''}" tabindex="0" data-a="intern" aria-label="${name}" title="${name}"><img src="${badgeSrc()}" alt="" width="${BADGE_W}" height="${BADGE_H}" draggable="false"></button></div>`;
    return plate({
      kicker: 'BADGE KIOSK', title: 'WHAT DOES YOUR THING NEED?', tag: s.badge.size && !s.intern ? tag : '', tagClass: `${tc} tag--small tag--whole`, cls: 'plate--kiosk plate--wide',
      body: `<p class="lead lead--plain">${esc(COPY.kioskLead)}</p><div class="kgrid"><div class="chips">${rows}</div><div class="res">${result}</div>${badge}</div>`,
      footer: '<span class="hint">W/S MOVE · E TOGGLE · ESCAPE WHEN DONE</span>',
    });
  }
  if (o.type === 'lift') {
    const LBL = { ...FIT_TAG, off: '—' };
    const rows = liftOptions(s).map((f, i) => {
      const st = f >= 0 && f <= 5 ? bestState(s, f) : 'off';
      const name = f === -1 ? 'ASCENSION' : ZONE_NAMES[f];
      return `<button class="lrow ${i === o.cursor ? 'lrow--cur' : ''} ${f === s.player.floor ? 'lrow--here' : ''}" tabindex="-1" data-a="go" data-i="${i}"><span class="lv">LEVEL ${f < 0 ? '↑↑' : `0${f}`}</span><span class="nm">${esc(name)}<small>${esc(ROOMS.filter(r => r.floor === f).map(r => ROOM_COPY[r.id].name).join(' · '))}</small></span><span class="st st--${st}">${s.badge.size ? LBL[st] : '—'}</span><span class="dot dot--${st}"></span></button>`;
    }).join('');
    return plate({ kicker: 'GOODS LIFT 2', title: 'SELECT LEVEL', tag: '', tagClass: 'tag--amber', cls: 'plate--lift', body: `<p class="lead">${esc(COPY.liftLead)}</p><div class="lrows">${rows}</div>`, footer: '<span class="hint">W/S MOVE · E GO · ESCAPE TO CANCEL</span>' });
  }
  if (o.type === 'decision') {
    const txt = o.msg ?? (s.decision.state === 'q2' ? COPY.decision.q2 : COPY.decision.q1);
    return plate({
      kicker: 'LEVEL 00 · NEXT TO THE LIFT', title: 'DECISION TERMINAL', cls: 'plate--term',
      body: `<div class="term term--crt"><pre class="term__text">${esc(txt)}${o.msg ? '' : '<span class="cur">█</span>'}</pre></div>`,
      footer: o.msg ? '' : '<button class="btn" tabindex="-1" data-a="yes">[Y] YES</button><button class="btn" tabindex="-1" data-a="no">[N] NO</button>',
    });
  }
  if (o.type === 'map') {
    const lv = [0, 1, 2, 3, 4, 5].map(f => {
      const cards = ROOMS.filter(r => r.floor === f).map(r => {
        const st = s.result.rooms[r.id].state;
        const [t, c] = STATE_TAG[st];
        return `<div class="card ${f === s.player.floor ? 'card--here' : ''}"><div class="card__t">${fileCase(ROOM_COPY[r.id].name)}</div><span class="tag ${c}">${s.badge.size ? t : '—'}</span></div>`;
      }).join('') || '<div class="card"><div class="card__t">RECEPTION · BADGE KIOSK · DECISION TERMINAL</div></div>';
      return `<div class="lvl"><div class="lvl__h">LEVEL 0${f} · ${esc(ZONE_NAMES[f])}${f === s.player.floor ? ' <span class="here">YOU ARE HERE</span>' : ''}</div><div class="cards">${cards}</div></div>`;
    }).join('');
    const [tag, tc] = verdictTag(s);
    return plate({ kicker: 'FACILITY', title: 'MAP', tag, tagClass: tc, cls: 'plate--map', body: `<div class="map">${lv}</div>`, footer: '<span class="hint">TAKE THE LIFT · ESCAPE TO CLOSE</span>' });
  }
  if (o.type === 'directory') {
    const d = document.getElementById('directory');
    return plate({ kicker: 'TEXT VERSION', title: 'FACILITY DIRECTORY', cls: 'plate--map', body: `<div class="dir">${d ? d.innerHTML : ''}</div>`, footer: '<span class="hint">ESCAPE TO CLOSE</span>' });
  }
  return null;
}

function signature(s, o) {
  if (!o) return null;
  const base = `${o.type}|${o.id ?? ''}`;
  if (o.type === 'kiosk') return `${base}|${o.cursor}|${[...s.badge].join(',')}|${!!s.intern}`;
  if (o.type === 'lift') return `${base}|${o.cursor}`;
  if (o.type === 'decision') return `${base}|${s.decision.state}|${o.msg ?? ''}`;
  return base;
}

// Konami egg: the still WARNING plate (two clickable sentences, no kicker), then a full-stage click layer
// over the cracktro so a click or tap goes back. Sits above any open plate, which waits underneath.
let egg = null; // { phase, el }
export function syncEgg(phase, a) {
  if (!host) return;
  if ((egg?.phase ?? 'off') === phase) return;
  egg?.el.remove();
  egg = null;
  host.classList.toggle('ui--crack', phase === 'playing');
  if (phase === 'off') return; // keys are read on window: no focus move (that would draw a focus ring on the canvas)
  dropFocus(document); // e.g. the kiosk's intern badge: Enter on the warning must not pick it
  const el = document.createElement('div');
  if (phase === 'warning') {
    const w = COPY.cracktro.warning;
    el.className = 'overlay egg egg--warn';
    el.innerHTML = `
    <div class="plate plate--warn" role="alertdialog" aria-label="${esc(w.title)}">
      <span class="bolt tl"></span><span class="bolt tr"></span><span class="bolt bl"></span><span class="bolt br"></span>
      <div class="plate__bar"><div class="plate__heads"><h2 class="plate__title">${esc(w.title)}</h2></div></div>
      <div class="plate__body"><p class="warn__b">${esc(w.body)}</p></div>
      <div class="plate__foot"><button class="btn btn--warn" tabindex="-1" data-a="watch">${esc(w.watch)}</button><button class="btn btn--warn" tabindex="-1" data-a="back">${esc(w.back)}</button></div>
    </div>`;
  } else el.className = 'egg egg--play';
  el.addEventListener('click', e => {
    if (phase === 'playing') { a.back?.(); return; }
    const b = e.target.closest('[data-a]');
    if (!b) return;
    b.blur();
    a[b.dataset.a]?.();
  });
  host.append(el);
  egg = { phase, el };
}

export function syncPlates(s) {
  if (!host) return;
  const o = s.overlay;
  const sig = signature(s, o);
  if (!sig) {
    if (cur) { cur.el.remove(); cur = null; document.getElementById('screen')?.focus({ preventScroll: true }); }
    return;
  }
  if (!cur || cur.sig !== sig) {
    const scroll = cur?.el.querySelector('.plate__body')?.scrollTop;
    cur?.el.remove();
    const el = build(s, o);
    if (!el) { cur = null; return; }
    host.append(el);
    cur = { sig, el, shown: -1 };
    const cursorEl = el.querySelector('.chip--cur, .lrow--cur, .ibadge--cur');
    if (scroll != null) el.querySelector('.plate__body').scrollTop = scroll;
    cursorEl?.scrollIntoView?.({ block: 'nearest' });
    // W/S onto the badge focuses it (never while the Konami warning is up: it would take the warning's Enter)
    if (cursorEl?.classList.contains('ibadge') && (egg?.phase ?? 'off') === 'off') cursorEl.focus({ preventScroll: true });
  }
}
