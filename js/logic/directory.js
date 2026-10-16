// The text directory (index.html #directory, also shown by the DIRECTORY plate), built from the game's own data:
// FLOOR_NAMES, ROOMS (every room under its real floor), each room card's title + WHAT IT IS text, and CHIPS.
// Pure: returns an HTML string; main.js puts it into the page at startup.
import { COPY, ROOM_CARDS } from './copy.js?v=68';
import { CHIPS } from './gauntlet.js?v=68';
import { FLOOR_NAMES, ROOMS } from '../world/levels.js?v=68';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Floor heading, e.g. "LEVEL 03 · SECURITY".
export const floorHeading = f => `LEVEL 0${f} · ${FLOOR_NAMES[f]}`;

// One room line: its card title, then what it is.
export function roomLine(id) {
  const c = ROOM_CARDS[id];
  const what = c.sections.find(([label]) => label === 'WHAT IT IS')[1];
  return `${c.title} — ${what}`;
}

// [{ floor, heading, rooms: [line, ...] }] for every floor, west to east inside a floor.
export function directoryFloors() {
  return Object.keys(FLOOR_NAMES).map(Number).sort((a, b) => a - b).map(f => ({
    floor: f,
    heading: floorHeading(f),
    rooms: ROOMS.filter(r => r.floor === f).sort((a, b) => a.x - b.x).map(r => roomLine(r.id)),
  }));
}

export function directoryHtml() {
  const d = COPY.directory;
  const li = items => `<ul>${items.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  return [
    `<h1>${esc(d.title)}</h1>`,
    `<p>${esc(d.intro)} ${esc(d.controls)}</p>`,
    `<h2>${esc(d.badgeHead)}</h2>`,
    `<p>${esc(COPY.kioskLead)}</p>`,
    li(CHIPS.map(c => c.label)),
    `<h2>${esc(d.floorsHead)}</h2>`,
    ...directoryFloors().map(fl => `<h3>${esc(fl.heading)}</h3>${li(fl.rooms)}`),
  ].join('\n');
}
