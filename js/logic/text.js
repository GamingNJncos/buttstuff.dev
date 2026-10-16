export function dotLeader(label, value, width) {
  const dots = Math.max(3, width - label.length - value.length - 2);
  return `${label} ${'.'.repeat(dots)} ${value}`;
}

export function wrap(s, max) {
  const out = [];
  let line = '';
  for (const word of s.split(' ')) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= max) line += ` ${word}`;
    else { out.push(line); line = word; }
    while (line.length > max) { out.push(line.slice(0, max)); line = line.slice(max); }
  }
  if (line) out.push(line);
  return out.length ? out : [''];
}

export function typewriter(s, t, cps) {
  return [...s].slice(0, Math.floor(t * cps)).join('');
}
