// Plain-language explanation of a badge result. Pure; the joke verdict labels stay in gauntlet.js.
import { VERDICT, CHIPS } from './gauntlet.js?v=68';

export const OPTION_NAMES = {
  noticeboard: 'A CLAUDE.md LINE',
  command: 'GUARDRAILS OUTSIDE YOUR AGENT (LIMITED ACCOUNTS, APPROVAL STEPS, AUTOMATED CHECKS)',
  cli: 'A TOOL YOUR AGENT ALREADY KNOWS',
  script: 'A SCRIPT',
  skills: 'A SKILL',
  annex: 'A SKILL WITH BUNDLED SCRIPTS',
  hook: 'A HOOK',
  permissions: 'PERMISSION RULES (DENY BY DEFAULT)',
  sandbox: 'THE SANDBOX',
  pods: 'SUBAGENTS',
  warehouse: 'A PLUGIN',
  mcp: 'AN MCP SERVER',
};

export const ROOM_WHERE = {
  noticeboard: [0, 'CLAUDE.md BOARD'], command: [4, "JANITOR'S CLOSET"],
  cli: [1, 'TOOL BIN'], script: [1, 'SCRIPT LAB'],
  skills: [2, 'SKILL LIBRARY'], annex: [2, 'SKILLS WITH SCRIPTS'],
  hook: [3, 'HOOK CHECKPOINT'], permissions: [3, 'PERMISSIONS OFFICE'], sandbox: [3, 'THE SANDBOX'],
  pods: [4, 'SUBAGENT PODS'], warehouse: [4, 'PLUGIN WAREHOUSE'], mcp: [5, 'MCP SERVER ROOM'],
};

export const CHIP_WHY = {
  cli: 'A TOOL YOUR AGENT ALREADY KNOWS DOES IT → USE THAT TOOL (MAYBE ONE CLAUDE.md LINE)',
  always: "MUST HAPPEN EVERY TIME → A HOOK (THE MODEL CAN'T SKIP IT)",
  limit: 'YOUR AGENT MUST NOT RUN CERTAIN PROGRAMS → PERMISSION RULES (DENY BY DEFAULT), THE SANDBOX, OR ONE FIXED SCRIPT',
  deterministic: 'SAME INPUT, SAME OUTPUT → A SCRIPT',
  judgment: "NEEDS YOUR AGENT'S JUDGMENT → A SKILL (INSTRUCTIONS IT FOLLOWS)",
  tokens: 'KEEP IT CHEAP → CHEAPEST OPTION WINS; MCP AND BIG PLUGINS COST CONTEXT EVERY TURN',
  parallel: 'SEVERAL WORKERS AT ONCE → SUBAGENTS',
  team: 'WHOLE TEAM NEEDS THE SAME SETUP → SHIP IT AS A PLUGIN',
  noshell: 'NO SHELL IN WEB, PHONE OR DESKTOP CHAT APPS → CONSIDER AN MCP SERVER',
  secrets: 'YOUR AGENT MUST NEVER SEE THE PASSWORD → IT MUST LIVE ON A SERVER YOUR AGENT CAN\'T REACH → AN MCP SERVER THERE',
  session: 'HOLDS A LIVE CONNECTION (BROWSER, DATABASE) → NEEDS AN MCP SERVER',
  many: 'SAME FOR OTHER AGENTS, PEOPLE AND OPERATING SYSTEMS → GUARDRAILS OUTSIDE YOUR AGENT',
};

const join = names => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} AND ${names[names.length - 1]}`);

export function whereOf(id) {
  const [floor, room] = ROOM_WHERE[id];
  return { floor, room, label: `LEVEL 0${floor} · ${room}` };
}

export function explain(result, badge) {
  const chips = [...(badge ?? [])];
  if (!result?.primary || chips.length === 0) {
    return { headline: 'PICK WHAT YOUR THING NEEDS', use: [], also: [], why: [], where: [], short: '' };
  }
  const p = result.primary;
  const use = [OPTION_NAMES[p]];
  const also = result.supporting.map(id => OPTION_NAMES[id]);
  let headline;
  if (result.verdict === VERDICT.MCP) headline = 'BUILD AN MCP SERVER';
  else if (result.verdict === VERDICT.MCP_BUT) headline = `BUILD AN MCP SERVER — BUT ALSO USE ${join(also)}`;
  else headline = `DON'T BUILD AN MCP — USE ${OPTION_NAMES[p]}`;
  const order = CHIPS.map(c => c.id);
  const why = order.filter(id => chips.includes(id)).map(id => CHIP_WHY[id]);
  const where = [p, ...result.supporting].map(whereOf);
  const short = `→ ${p === 'mcp' ? 'BUILD AN MCP SERVER' : `USE ${OPTION_NAMES[p]}`} · LEVEL 0${ROOM_WHERE[p][0]}`;
  return { headline, use, also, why, where, short };
}
