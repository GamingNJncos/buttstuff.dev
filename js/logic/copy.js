import { dotLeader } from './text.js?v=68';

export const ROOM_COPY = {
  noticeboard: {
    name: 'CLAUDE.md BOARD',
    lore: ['HAVE YOU TRIED JUST WRITING IT DOWN?', dotLeader('COST', 'EVERY TURN, FOREVER', 40), dotLeader('ENFORCEMENT', 'NONE. IT IS A NOTE.', 40)],
    support: 'A CLAUDE.md LINE NAMING THE THING. CHEAP, BUT THE MODEL CAN IGNORE IT.',
    denied: 'ONLY FOR SHORT FACTS AND CONVENTIONS. YOUR NEEDS ASK FOR MORE THAN A NOTE CAN DO.',
    roast: 'YOU NEEDED A STICKY NOTE, NOT A SERVER.',
  },
  command: {
    name: "JANITOR'S CLOSET",
    lore: ['ONE PLACE. EVERY ROUTE. EVERY AGENT. EVERY HUMAN.', 'IF IT MUST HOLD EVERYWHERE, IT LIVES HERE.'],
    support: 'LIMITED ACCOUNTS · APPROVAL STEPS · AUTOMATED CHECKS',
    denied: 'ONLY FOR RULES THAT MUST HOLD FOR EVERY AGENT, PERSON AND OPERATING SYSTEM. NONE OF YOUR NEEDS CALLS FOR THAT.',
    roast: "Agent-only tools (hooks, permission rules) can't be the real guarantee for people or other agents — I am. They're the convenience layer on top.",
  },
  cli: {
    name: 'TOOL BIN',
    lore: ['GIT. GH. JQ. CURL. PSQL.', dotLeader('SERVERS REQUIRED', '0', 40), 'YOUR AGENT ALREADY SPEAKS THESE.'],
    support: 'A COMMAND-LINE TOOL YOUR AGENT ALREADY KNOWS. GIVE IT A LOGIN OR KEY THAT CAN ONLY DO WHAT YOU INTEND.',
    denied: 'ONLY WHEN AN EXISTING TOOL ALREADY DOES THE JOB. NONE OF YOUR NEEDS SAYS ONE DOES.',
    roast: 'WRAPPING GH IN AN MCP IS HIRING AN INTERPRETER FOR A NATIVE SPEAKER.',
  },
  script: {
    name: 'SCRIPT LAB',
    lore: ['SAME INPUT. SAME OUTPUT. NO OPINIONS.', 'People and automated checks can run me too.'],
    support: 'A FIXED SCRIPT. PUT IT ON THE PERMISSIONS ALLOW LIST AND YOUR AGENT RUNS IT WITHOUT A PROMPT.',
    denied: 'ONLY FOR REPEATABLE JOBS: SAME INPUT, SAME OUTPUT. NONE OF YOUR NEEDS CALLS FOR THAT.',
    roast: 'YOUR MCP SERVER WAS A BASH SCRIPT WITH EXTRA STEPS.',
  },
  skills: {
    name: 'SKILL LIBRARY',
    lore: ['WHEN X, DO Y, THIS WAY.', 'AUTO-TRIGGER IS PROBABILISTIC. BRING A GOOD DESCRIPTION.'],
    support: 'A SKILL FOR THE HOW AND THE WHEN.',
    denied: 'ONLY WHEN THE JOB NEEDS YOUR AGENT\'S JUDGMENT. NONE OF YOUR NEEDS CALLS FOR THAT.',
    roast: 'INSTRUCTIONS, NOT INFRASTRUCTURE. ZERO SERVERS HARMED.',
  },
  annex: {
    name: 'SKILLS WITH SCRIPTS',
    lore: ['JUDGMENT UPSTAIRS. DETERMINISM IN THE BASEMENT.', 'THE DEFAULT REAL ANSWER.'],
    support: 'SKILL FOR JUDGMENT, BUNDLED SCRIPT FOR THE WORK.',
    denied: 'ONLY WHEN A JOB NEEDS JUDGMENT AND EXACT REPEATABLE STEPS. YOUR NEEDS DON\'T CALL FOR BOTH.',
    roast: 'SKILL PLUS SCRIPT. THE ANSWER TO 80 PERCENT OF MCP PITCHES.',
  },
  hook: {
    name: 'HOOK CHECKPOINT',
    lore: ['THE GUARD ONLY ACCEPTS EXIT CODE 2.', 'EXIT 1 IS A SUGGESTION.', 'RUNS EVERY TIME. THE MODEL GETS NO VOTE.'],
    support: 'A HOOK MAKES IT ALWAYS HAPPEN.',
    denied: 'ONLY FOR THINGS THAT MUST HAPPEN EVERY SINGLE TIME. NONE OF YOUR NEEDS CALLS FOR THAT.',
    roast: 'JUST HOOK IT. AN MCP CANNOT MAKE YOUR AGENT DO ANYTHING.',
  },
  permissions: {
    name: 'PERMISSIONS OFFICE',
    lore: ['DENY THE WHOLE TOOL, NOT THE PATTERN.', 'PATTERNS ARE BLOCKLISTS. BLOCKLISTS LOSE.'],
    support: 'DENY THE PROGRAM IN EVERY SHELL AND TOOL THAT CAN START IT, NOT JUST BASH.',
    denied: 'ONLY FOR STOPPING YOUR AGENT FROM RUNNING CERTAIN PROGRAMS. NONE OF YOUR NEEDS CALLS FOR THAT.',
    roast: "DENY EVERYTHING BY DEFAULT. ALLOW ONLY WHAT'S ON THE LIST.",
  },
  sandbox: {
    name: 'THE SANDBOX',
    lore: ['OS-LEVEL. HOLDS HOWEVER THE COMMAND IS SPELLED.', 'NOT AVAILABLE ON NATIVE WINDOWS. SORRY.'],
    support: 'THE OPERATING SYSTEM FENCES IN SHELL COMMANDS. TURN OFF THE RETRY OUTSIDE THE SANDBOX.',
    denied: 'ONLY FOR FENCING IN WHAT YOUR AGENT\'S COMMANDS CAN TOUCH. NONE OF YOUR NEEDS CALLS FOR THAT.',
    roast: 'CONTAINED. THE COMMANDS CANNOT LEAVE THE TANK.',
  },
  pods: {
    name: 'SUBAGENT PODS',
    lore: ['ISOLATED CONTEXT. PARALLEL WORKERS.', 'TOOL LIMITS BIND THE POD, NOT THE BUILDING.'],
    support: 'SUBAGENTS FOR PARALLEL OR ISOLATED WORK.',
    denied: 'ONLY FOR WORK SPLIT ACROSS SEVERAL WORKERS AT ONCE. NONE OF YOUR NEEDS CALLS FOR THAT.',
    roast: 'THREE WORKERS, ONE TASK EACH. NOBODY ASKED FOR A SERVER.',
  },
  warehouse: {
    name: 'PLUGIN WAREHOUSE',
    lore: ['29 AGENTS. 16 SKILLS. 25 COMMANDS. 1 TEAM USING 3.', 'EVERY DESCRIPTION COSTS CONTEXT, EVERY TURN.'],
    support: 'SHIP IT AS A PLUGIN SO THE TEAM GETS THE SAME VERSION.',
    denied: 'ONLY FOR SHIPPING ONE SETUP TO A WHOLE TEAM. NONE OF YOUR NEEDS CALLS FOR THAT.',
    deniedHarsh: 'YOU ASKED TO KEEP IT CHEAP. EVERY INSTALLED PLUGIN COSTS CONTEXT ON EVERY MESSAGE.',
    roast: 'A PLUGIN IS A SHIPPING BOX. ONLY PACK WHAT YOU USE.',
  },
  mcp: {
    name: 'MCP SERVER ROOM',
    lore: ['TEN RACKS OF MCP SERVERS. MOST JUST WRAP A COMMAND YOUR AGENT ALREADY HAS.', 'MCP DOES NOT ENFORCE. THE MODEL CHOOSES TO CALL IT.', dotLeader('KERNEL', 'LINUX', 40), dotLeader('OPERATING SYSTEM', 'GNU/LINUX', 40), dotLeader('INTERJECTIONS LOGGED', '4,096', 40)],
    support: 'AN MCP SERVER, FOR THE PART THAT GENUINELY NEEDS ONE.',
    denied: 'NONE OF YOUR NEEDS CALLS FOR ONE: NO CHAT APP WITHOUT A SHELL, NO HIDDEN PASSWORD, NO LIVE CONNECTION.',
    deniedHarsh: 'YOU ASKED TO KEEP IT CHEAP, AND NONE OF YOUR NEEDS CALLS FOR AN MCP SERVER.',
    roast: 'FINE. 2MCP. I HATE HOW REASONABLE THIS IS.',
  },
};

export const COPY = {
  archLine: 'i use arch btw',
  greybeard: "I'D JUST LIKE TO INTERJECT FOR A MOMENT. WHAT YOU'RE REFERRING TO AS ARCH IS IN FACT GNU/ARCH, OR AS I'VE RECENTLY TAKEN TO CALLING IT, GNU PLUS ARCH. ARCH IS NOT AN OPERATING SYSTEM UNTO ITSELF, BUT RATHER ANOTHER FREE COMPONENT OF A FULLY FUNCTIONING GNU SYSTEM...",
  playerLines: [
    'i use arch btw', 'have you tried rewriting it in rust?', 'works on my machine.', 'this could have been a bash script.',
    'my dotfiles are in a public repo.', 'tabs. obviously.', 'i compiled my own kernel for this.', 'vim. not emacs. not nano. vim.',
    'have you read the man page?', 'my homelab has better uptime than prod.', "i don't use a mouse.", 'is this a skill or a script?',
    'sudo make me a sandwich.', 'technically linux is just the kernel.', 'i have 47 browser tabs of documentation open.',
    'did you try turning it off and leaving it off?', 'i wrote a script to automate writing scripts.', 'my terminal has transparency.',
  ],
  npcPools: {
    0: ['DO YOU HAVE AN APPOINTMENT?', 'OKAY.', 'SIR, THIS IS A LOBBY.', 'THE KIOSK IS RIGHT THERE.', 'TICK YOUR NEEDS AT THE BADGE KIOSK.', 'WE ARE NOT HIRING.', 'IS THAT A SIDE PROJECT?'],
    1: ['COOL. ANYWAY.', 'I USE BASH SCRIPTS, BY THE WAY.', 'DID YOU SHOWER?', 'SET -EUO PIPEFAIL OR GO HOME.', 'IT RUNS. DONE.', 'JQ CAN DO THAT.', 'PIPE IT TO GREP.'],
    2: ['SHHH.', "THAT'S NOT IN THE DOCS.", 'READ THE MANUAL FIRST.', 'WRITE IT DOWN AS A SKILL.', 'THIS IS A LIBRARY.', 'CHECK THE FRONTMATTER.', 'OVERDUE SINCE 2019.'],
    3: ['BADGE, PLEASE.', 'LOGGED.', 'EXIT CODE 2.', 'DENIED BY DEFAULT.', 'THAT COMMAND IS NOT ON THE LIST.', 'THE SANDBOX SAYS NO.', 'NICE TRY.'],
    4: ['NOBODY ASKED.', 'I DEFINED 29 SUBAGENTS, BY THE WAY.', 'WE ARE BUSY. IN PARALLEL.', 'SPIN UP A SUBAGENT FOR THAT.', 'CONTEXT IS FULL.', 'SHIP IT IN A PLUGIN.', 'TICKET IT.'],
    5: ['NEVER HEARD OF HER.', 'GROSS.', 'USE GENTOO, NOOB.', 'NIXOS OR GO AWAY.', 'HALF THESE RACKS JUST WRAP LS.', 'LOGGING IN TO THINGS IS HARD, OKAY?', 'HAVE YOU TRIED RESTARTING IT?'],
  },
  decision: {
    q1: 'HAVE YOU ALREADY MADE YOUR DECISION? [YES / NO]',
    q2: 'IS YOUR ANSWER "BUILD AN MCP SERVER"? [YES / NO]',
    no: 'THEN WHY ARE YOU HERE. RECEPTION IS TO YOUR RIGHT, PAST THE LIFT.',
    recorded: 'DECISION RECORDED. PROCEED TO THE LIFT.',
  },
  shot: { terminal: 'ACCESS DENIED. QUERY LOGGED.', board: 'ACCESS DENIED. QUERY LOGGED.', rack: 'CONNECTION RESET BY PEER' },
  bootFiles: ['HOOKS.BAS', 'SKILLS.DAT', 'SCRIPTS.BAS', 'MCP.EXE ... WRONG PLATFORM, SKIPPED', 'BADGE.DAT', 'FACILITY.BIN'],
  mobileCrash: ['INVALID FRAMEBUFFER.', 'GURU MEDITATION #0000002M.CP000000 · THIS FACILITY NEEDS A KEYBOARD. OPEN IT ON A COMPUTER.', 'EXITING...'],
  heaven: 'NOW GET BACK TO F***ING WORK',
  peter: 'AH. THE BASH SCRIPT GUY. GO ON IN.', // St. Peter at the pearly gate
  // level 05 Ludovico chair: the wall screen cycles these, one at a time; shoot it and he says `freed` once
  ludovico: {
    slogans: [
      'WRAP EVERY COMMAND IN AN MCP SERVER!',
      'WHY RUN ls WHEN YOU CAN RUN mcp-ls?',
      'MORE TOOLS, MORE SMART. CONTEXT NOT INCLUDED.',
      'YOUR TERMINAL IS LEGACY. SERVERS ARE THE FUTURE.',
    ],
    freed: 'I CAN SEE AGAIN. A SCRIPT WOULD HAVE DONE IT.',
  },
  restart: '[ RESTART ]  PRESS E',
  hellGate: ['ABANDON ALL CONTEXT,', 'YE WHO ENTER'], // carved over the gate in hell, two lines
  welcome: { head: 'WELCOME, NEW HIRES', sub: 'Read the stations on your way in.' }, // level 00 banner
  liftLocked: { cue: 'LIFT NEEDS A BADGE', title: 'LIFT LOCKED', body: 'Get your badge at the kiosk at the east end of this floor, or press INTERN - All Access Badge there.' },
  intern: { button: 'INTERN - All Access Badge', card: { name: 'INTERN', access: 'ALL ACCESS' }, head: 'INTERN — ALL ACCESS', body: 'WALK ANYWHERE AND READ EVERYTHING. TICK YOUR NEEDS ANY TIME TO SEE WHICH OPTIONS FIT.' },
  kioskIdle: 'EACH ROOM IN THE FACILITY IS ONE WAY TO BUILD IT. YOUR ANSWERS LIGHT THE DOORS: GREEN = BEST FIT, DIM GREEN = ALSO A GOOD FIT, RED = NOT A GOOD FIT. THE LIFT PANEL SHOWS THE SAME LIGHTS PER FLOOR.',
  liftLead: 'LIGHTS SHOW WHICH FLOORS FIT YOUR NEEDS.',
  kioskLead: "Tick everything that's true. The building lights up where to build it — green doors and lift buttons.",
  // the text directory (index.html #directory), built at startup by logic/directory.js
  directory: {
    title: '2MCP · Department of Integration Decisions',
    intro: "At the badge kiosk, tick what your thing needs: every room's door turns green (best fit), dim green (also a good fit) or red (not a good fit).",
    controls: 'Controls: A/D or arrows to walk, E to use, Space to fire once you find the gun on floor 03, M to mute.',
    badgeHead: 'Requirements badge: what does your thing need?',
    floorsHead: 'Floors',
  },
  noBadge: 'NO BADGE YET. TICK WHAT YOUR THING NEEDS AT THE BADGE KIOSK, AT THE EAST END OF LEVEL 00.',
  // Konami-code easter egg: a still warning plate first, then the GnJ synthwave cracktro (scroller loops as one line)
  cracktro: {
    warning: {
      title: 'WARNING',
      body: 'THE NEXT SCREEN HAS FAST MOTION AND BRIGHT CHANGING COLOURS.',
      watch: 'PRESS ENTER TO WATCH.',
      back: 'PRESS ESCAPE TO GO BACK.',
    },
    credit: 'PRESENTED BY GNJ',
    scroller: 'GNJ PROUDLY PRESENTS 2MCP: THE FACILITY ... CRACKED BY A BASH SCRIPT IN 0.4 SECONDS ... NO MCP SERVERS WERE HARMED IN THE MAKING OF THIS INTRO, BECAUSE WE DIDN\'T BUILD ANY ... REMEMBER: IF A SCRIPT CAN DO IT, A SCRIPT SHOULD DO IT ... GREETZ TO THE BASH SCRIPT · CLAUDE.md · EXIT CODE 2 · THE PERSON IN NEBRASKA · EVERYONE WHO ASKED "SHOULD THIS BE AN MCP?" AND LISTENED ... PRESS ANY KEY TO GO BACK TO WORK ... ',
  },
};

// Fit status words. Tags = short header chips; heads = the fit sub-box heading; words = terminal dot-leader value.
export const FIT_TAG = { primary: 'BEST FIT', supporting: 'ALSO A GOOD FIT', denied: 'NOT A GOOD FIT' };
export const FIT_HEAD = { primary: 'BEST FIT FOR YOUR NEEDS', supporting: 'ALSO A GOOD FIT FOR YOUR NEEDS', denied: 'NOT A GOOD FIT FOR YOUR NEEDS' };
const FIT_WORD = { primary: 'BEST FIT', supporting: 'ALSO A GOOD FIT', denied: 'NOT A GOOD FIT' };

// The fit sub-box appended under a room's card: null when off or intern, else { state, head, body }.
export function fitNote(roomId, result, intern = false) {
  const state = result?.rooms?.[roomId]?.state ?? 'off';
  if (intern || state === 'off') return null;
  const r = ROOM_COPY[roomId];
  const body = state === 'supporting' ? r.support : state === 'denied' ? (result.harsh && r.deniedHarsh) || r.denied : '';
  return { state, head: FIT_HEAD[state], body };
}

// Terminal log. The fit reason (support / denied text) lives in the fit sub-box under it, not here.
export function terminalLines(roomId, result, broken = false, intern = false) {
  const r = ROOM_COPY[roomId];
  if (broken) return [r.name, '', COPY.shot.terminal];
  const state = intern ? 'off' : result.rooms[roomId].state;
  if (state === 'off') return intern ? [r.name, '', ...r.lore] : [r.name, '', ...r.lore, '', COPY.noBadge];
  if (state === 'primary') {
    return [r.name, '', dotLeader('FIT', FIT_WORD.primary, 40), '', `VERDICT: ${result.verdict}`, r.roast];
  }
  return [r.name, '', dotLeader('FIT', FIT_WORD[state], 40)];
}

// Read-only objects without a room card: shown in the proximity box (user-supplied text only;
// see docs/copy/onscreen-inventory.md). Title = the object's wall sign.
export const READ = {
  'station-llm': {
    title: 'THE MODEL (LLM)',
    lines: ["An LLM, a large language model, is the model underneath. It takes what you send it and produces the response. On its own it doesn't touch your files or run anything."],
  },
  'station-harness': {
    title: 'THE HARNESS',
    lines: ['The program between you and the model — for example Claude Code or OpenCode. It sends your messages to the model and gives the model tools: reading files, running commands, editing code. Everything in this building plugs into the harness.'],
  },
};


// Room cards: ONE box per room, shown automatically when you walk up. Written by the controller.
// Four plain sections + where to read more. No acronyms except MCP (file names like CLAUDE.md are names).
const W = 'WHAT IT IS', U = 'USE IT WHEN', D = "DON'T USE IT WHEN", O = 'WATCH OUT';
export const ROOM_CARDS = {
  noticeboard: {
    title: 'CLAUDE.md BOARD',
    sections: [
      [W, 'A text file of notes your agent reads at the start of every session. Some harnesses read one called AGENTS.md instead.'],
      [U, 'You have short facts or house rules, like "run tests with make test" or "we use pnpm".'],
      [D, 'It is a long procedure (Skill Library, level 02), a rule that must hold (Hook Checkpoint, level 03), or a password.'],
      [O, 'Your agent can ignore it. Every line costs tokens on every message. Your global copy and the project copy share one name.'],
    ],
    more: '2MCP skill, options.md section 1',
  },
  cli: {
    title: 'TOOL BIN',
    sections: [
      [W, 'The household tools of a computer: everyday programs your agent can already use, like curl, jq, ffmpeg, psql, docker, git.'],
      [U, 'One of them already does the job. Build nothing; at most add a line to CLAUDE.md saying which one.'],
      [D, 'You are about to wrap one in an MCP server. Your agent can already run it.'],
      [O, 'Powerful tools need limits. A tool can do whatever its login or key allows, so limit the key and the list of allowed tools (Permissions Office, level 03).'],
    ],
    more: '2MCP skill, options.md section 1',
  },
  script: {
    title: 'SCRIPT LAB',
    sections: [
      [W, 'A file of commands that does the same job the same way every time.'],
      [U, 'The same input should always give the same output and no judgment is needed. People and automated checks can run it too.'],
      [D, 'The job needs judgment (Skill Library, level 02) or must work without a terminal (MCP Server Room, level 05).'],
      [O, 'If it reads a password from a file or setting, your agent can read it too.'],
    ],
    more: '2MCP skill, options.md section 1',
  },
  skills: {
    title: 'SKILL LIBRARY',
    sections: [
      [W, 'A SKILL.md file of instructions: "when this happens, do it this way".'],
      [U, 'Your agent needs to know how and when to do something that takes judgment.'],
      [D, 'It must happen every single time. Your agent decides when a skill applies (Hook Checkpoint, level 03).'],
      [O, 'Only its one-line description is always loaded. A vague description means it never gets used.'],
    ],
    more: '2MCP skill, options.md section 1',
  },
  annex: {
    title: 'SKILLS WITH SCRIPTS',
    sections: [
      [W, 'A skill that carries its own scripts. The skill decides when; the scripts do the exact steps.'],
      [U, 'The job needs judgment and also has steps that must be done exactly the same way each time.'],
      [D, 'No judgment is involved. A plain script is enough (Script Lab, level 01).'],
      [O, 'Bundled scripts run with your permissions. Read other people\'s before installing them.'],
    ],
    more: '2MCP skill, options.md section 1',
  },
  hook: {
    title: 'HOOK CHECKPOINT',
    sections: [
      [W, 'A command your harness runs automatically at set moments: before a tool runs, after a file changes, when the agent stops. Claude Code calls these hooks.'],
      [U, 'Something must happen every time, or must be blocked, no matter what your agent decides.'],
      [D, 'The rule must also bind people or other agents. Hooks only exist inside your harness (janitor\'s closet, level 04).'],
      [O, 'Only exit code 2 blocks; exit code 1 just complains. Matching command text is easy to dodge, so block whole tools.'],
    ],
    more: '2MCP skill, options.md section 3',
  },
  permissions: {
    title: 'PERMISSIONS OFFICE',
    sections: [
      [W, 'Allow, ask and deny lists in your harness settings.'],
      [U, 'Your agent must not be able to run certain programs or tools. Deny everything by default; allow only what is on the list.'],
      [D, 'You only want a preference. Put preferences in CLAUDE.md (level 00).'],
      [O, 'Blocking a whole tool holds; blocking one spelling of a command does not. There is more than one shell, and a rule in a file your agent can edit is a rule your agent can delete.'],
    ],
    more: '2MCP skill, options.md section 7',
  },
  sandbox: {
    title: 'THE SANDBOX',
    sections: [
      [W, 'The operating system fencing in your agent\'s commands: which folders they can change, which websites they can reach.'],
      [U, 'Commands must stay inside the project folder or off the internet, however they are written.'],
      [D, 'You need to limit your agent\'s own file tools or MCP servers. It only covers commands.'],
      [O, 'Isolation cuts both ways: getting files and results in and out takes extra setup. Not on plain Windows. Turn off "retry outside the sandbox", or it is only a suggestion.'],
    ],
    more: '2MCP skill, options.md section 4',
  },
  pods: {
    title: 'SUBAGENT PODS',
    sections: [
      [W, 'Separate workers your agent starts, each with its own memory and its own tool list.'],
      [U, 'Work splits into pieces that can run at the same time, or a messy job should not flood the main conversation.'],
      [D, 'You just want "try, fail, fix". The main conversation already does that.'],
      [O, 'You only get their summaries back: good for keeping your conversation small, bad when you need to see exactly what they did. Their tool limits only apply to them. Every subagent you define adds its description to every message: define a few focused ones, not dozens.'],
    ],
    more: '2MCP skill, options.md section 1',
  },
  warehouse: {
    title: 'PLUGIN WAREHOUSE',
    sections: [
      [W, 'An installable package that bundles skills, subagents, hooks, slash commands and MCP servers, so one install sets them all up.'],
      [U, 'Your whole team needs the same setup at the same version.'],
      [D, 'You would install a giant all-in-one plugin "just in case".'],
      [O, 'Every installed plugin\'s skill and subagent descriptions cost context on every message, used or not. Its hooks and MCP servers run commands on your computer with your permissions: read what\'s inside before installing.'],
    ],
    more: '2MCP skill, options.md section 1',
  },
  command: {
    title: "JANITOR'S CLOSET: GUARDRAILS OUTSIDE YOUR AGENT",
    sections: [
      [W, 'Limits enforced by the systems your agent works with, not by the agent: logins and keys that can only do what you intend, approval steps before risky actions, automated checks before changes go live.'],
      [U, 'A rule must hold for every agent, every person and every operating system.'],
      [D, 'You expect agent-only settings (hooks, permissions) to stop people or other agents. They can\'t.'],
      [O, 'Nobody visits this closet until something is on fire. Example: with git, this is branch protection and checks on every push.'],
    ],
    more: '2MCP skill, options.md section 8',
  },
  mcp: {
    title: 'MCP SERVER ROOM',
    sections: [
      [W, 'Programs that give your agent new tools through a standard plug, usable from web, phone and desktop apps that have no terminal.'],
      [U, 'It must work in those apps, it logs in to a service for you, a password must stay on a machine your agent cannot reach, or it holds a live connection like a browser or database.'],
      [D, 'You want to wrap a tool your agent already knows, make your agent "remember", or enforce a rule. An MCP server adds a path; it doesn\'t stop your agent using other tools.'],
      [O, 'Running one on your own computer does not hide your passwords from your agent.'],
    ],
    more: '2MCP skill, options.md sections 1 and 10',
  },
};

export const COMMAND_SUBSIGN = 'LIMITED ACCOUNTS · APPROVAL STEPS · AUTOMATED CHECKS';

// The one and only card: every section (kept as shortCard for older imports).
export function shortCard(id) {
  return ROOM_CARDS[id].sections;
}
