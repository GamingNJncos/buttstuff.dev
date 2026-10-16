export const CHIPS = [
  { id: 'cli', label: "A tool your agent already knows can do it (curl, jq, ffmpeg, psql…)" },
  { id: 'always', label: "It must happen every single time — no exceptions" },
  { id: 'limit', label: "Your agent must NOT be able to run certain programs or commands (rm, kubectl, sending email…)" },
  { id: 'deterministic', label: "Same input should always give the same output" },
  { id: 'judgment', label: "It needs your agent's judgment to do well" },
  { id: 'tokens', label: "Keep it cheap — don't eat my context window" },
  { id: 'parallel', label: "Split the work across several workers at once" },
  { id: 'team', label: "My whole team needs the exact same setup" },
  { id: 'noshell', label: "It must work in chat apps with no shell: web, phone or desktop" },
  { id: 'secrets', label: "Your agent must never see the password or key" },
  { id: 'session', label: "It holds a live connection open (browser, database)" },
  { id: 'many', label: "It must behave the same for other agents, people and operating systems" },
];

export const ROOM_IDS = ['noticeboard', 'command', 'cli', 'script', 'skills', 'annex', 'hook', 'permissions', 'sandbox', 'pods', 'warehouse', 'mcp'];

export const VERDICT = {
  NOT: 'NOT 2MCP',
  HOOK: 'NOT 2MCP — JUST HOOK IT 🪝',
  MCP: '2MCP',
  MCP_BUT: '2MCP, BUT…',
};

const FITS = {
  cli: ['cli', 'noticeboard'],
  always: ['hook'],
  limit: ['permissions', 'sandbox', 'script'],
  deterministic: ['script'],
  judgment: ['skills'],
  parallel: ['pods'],
  team: ['warehouse'],
  many: ['command'],
  noshell: ['mcp'],
  secrets: ['mcp'],
  session: ['mcp'],
};

// The verdict follows the best-fit room: the MCP room says 2MCP (BUT… when other rooms also fit), the Hook
// Checkpoint says JUST HOOK IT, every other room (the Permissions Office included) says NOT 2MCP.
export function verdictFor(primary, supporting = []) {
  if (!primary) return null;
  if (primary === 'mcp') return supporting.length ? VERDICT.MCP_BUT : VERDICT.MCP;
  if (primary === 'hook') return VERDICT.HOOK;
  return VERDICT.NOT;
}

export function evaluate(badgeInput) {
  const b = new Set(badgeInput);
  const has = id => b.has(id);
  const rooms = Object.fromEntries(ROOM_IDS.map(id => [id, { state: 'off' }]));
  if (b.size === 0) return { verdict: null, primary: null, supporting: [], rooms, harsh: false };

  const fits = new Set();
  for (const id of b) for (const r of FITS[id] ?? []) fits.add(r);
  if (has('deterministic') && has('judgment')) fits.add('annex');

  let primary;
  if (has('noshell') || has('secrets') || has('session')) primary = 'mcp';
  else if (has('many')) primary = 'command';
  else if (has('cli')) primary = 'cli';
  else if (has('always') && has('judgment')) primary = has('deterministic') ? 'annex' : 'skills';
  else if (has('always')) primary = 'hook';
  else if (has('limit')) primary = 'permissions';
  else if (has('deterministic') && has('judgment')) primary = 'annex';
  else if (has('deterministic')) primary = 'script';
  else if (has('judgment')) primary = 'skills';
  else if (has('parallel')) primary = 'pods';
  else if (has('team')) primary = 'warehouse';
  else { primary = 'noticeboard'; fits.add('script'); }

  fits.delete(primary);
  const supporting = ROOM_IDS.filter(id => fits.has(id));

  const verdict = verdictFor(primary, supporting);

  for (const id of ROOM_IDS) {
    rooms[id] = { state: id === primary ? 'primary' : fits.has(id) ? 'supporting' : 'denied' };
  }
  return { verdict, primary, supporting, rooms, harsh: has('tokens') };
}
