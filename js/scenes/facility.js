import { W } from '../engine/screen.js?v=68';
import { KEYS, any } from '../engine/input.js?v=68';
import { play, isMuted, toggleMute } from '../engine/audio.js?v=68';
import { mt, reduced } from '../engine/motion.js?v=68';
import { createEgg, eggKey, eggActive, eggWatch, eggBack, cracktroTime } from '../logic/cracktro.js?v=68';
import { drawCracktro } from './cracktro.js?v=68';
import { COPY, ROOM_COPY } from '../logic/copy.js?v=68';
import { createState } from '../world/state.js?v=68';
import { WW, FH, SHAFT_X, SHAFT_W, ROOMS, floorTop, groundY, camYFor, ROOM_H } from '../world/levels.js?v=68';
import { updatePlayer } from '../world/player.js?v=68';
import { updateLift, liftUse, liftBusy, canBoard, requestTravel, liftUnlocked } from '../world/lift.js?v=68';
import { targetAt, cueText } from '../world/interact.js?v=68';
import { noteSurfaceUse, useDecision } from '../world/decision.js?v=68';
import { updateNpcs, ambientTalk, talkTo } from '../world/npcs.js?v=68';
import { speechLayout } from '../world/bubbles.js?v=68';
import { fire, stepBullets, canFire } from '../world/gun.js?v=68';
import { drawWorld } from '../world/render.js?v=68';
import { overlayInput, openPlate, toggleChip, pressIntern, chooseFloor, decide } from '../world/ui.js?v=68';
import { CHIPS } from '../logic/gauntlet.js?v=68';
import { createHud, updateHud, removeHud } from '../ui/hud.js?v=68';
import { initPlates, syncPlates, syncEgg } from '../ui/plates.js?v=68';
import { updatePopup, worldRect } from '../ui/popup.js?v=68';
import { readableAt, readContent, lockedLiftContent } from '../world/read.js?v=68';
import { useDemo, stepDemos, stepBook, stepSandbox, gateBounds, conceptContent, speedFactor, hitProp, playerHeld } from '../world/concept.js?v=68';
import { hash } from '../engine/hash.js?v=68';
import { explain } from '../logic/explain.js?v=68';
import { CAR_W, CAR_H } from '../art/kit/lift.js?v=68';
import { enterHell, updateHell, drawHellScreen, HELL_CAM_X } from './hell.js?v=68';
import { createAscension, updateAscension, drawAscensionScreen, peterNpc, HEAVEN_CAM_X, HEAVEN_CAM_LIFT, HEAVEN_MIN_X, HEAVEN_MAX_X } from './ascension.js?v=68';

function updateCamera(s, dt, snap = false) {
  const p = s.player;
  const riding = p.inLift && liftBusy(s.lift);
  const heavenCam = s.sequence?.kind === 'asc' || (s.decision.fate === 'heaven' && s.lift.target === -1 && (riding || p.floor === -1));
  // heaven: rise a little higher than a normal floor so the lobby below drops out of shot
  const lift = heavenCam ? HEAVEN_CAM_LIFT * Math.max(0, Math.min(1, -s.lift.y / FH)) : 0;
  const ty = (riding ? camYFor(0) + s.lift.y : camYFor(p.floor)) - lift;
  s.cam.y = snap ? ty : s.cam.y + (ty - s.cam.y) * Math.min(1, dt * 8);
  if (Math.abs(ty - s.cam.y) < 0.5) s.cam.y = ty;
  // hell: hold a fixed framing (car + the whole gate) from the moment the lift heads down there
  const hellCam = s.sequence?.kind === 'hell' || (s.decision.fate === 'hell' && s.lift.target === 6 && (riding || p.floor === 6));
  const fixed = hellCam || heavenCam;
  const tx = hellCam ? HELL_CAM_X : heavenCam ? HEAVEN_CAM_X : Math.max(0, Math.min(WW - W, p.x - W / 2));
  s.cam.x = snap || !fixed ? tx : s.cam.x + (tx - s.cam.x) * Math.min(1, dt * 3);
  if (Math.abs(tx - s.cam.x) < 0.5) s.cam.x = tx;
}

function use(s) {
  const tgt = targetAt(s);
  if (!tgt) return;
  // a locked lift press does nothing, so it doesn't count as the first use either
  noteSurfaceUse(s, tgt.kind === 'lift' && !liftUnlocked(s) ? 'lift-locked' : tgt.kind);
  if (tgt.kind === 'lift') {
    const r = liftUse(s);
    if (r === 'locked') { s.liftNote = { t: 4 }; play('terminal'); return; }
    if (r === 'panel') s.overlay = { type: 'lift', cursor: Math.max(0, [0, 1, 2, 3, 4, 5].indexOf(s.player.floor) + (s.decision.fate === 'heaven' ? 1 : 0)), t: 0 };
    play('liftButton');
  } else if (tgt.kind === 'kiosk') {
    s.overlay = { type: 'kiosk', cursor: 0, t: 0 };
    play('terminal');
  } else if (tgt.kind === 'decision') {
    if (useDecision(s.decision) !== 'off') s.overlay = { type: 'decision', t: 0 };
    play('terminal');
  } else if (tgt.kind === 'demo') {
    const r = useDemo(s, tgt.prop);
    const d = tgt.prop.demo;
    play(d === 'toolBin' || d === 'plugin' || d === 'tower' || r?.waved || ((d === 'sandbox' || d === 'binders') && r?.held) ? 'pickup' : d === 'hookGate' || d === 'mcpDoor' || d === 'poster' || (d === 'permDoor' && !r?.allowed) ? 'terminal' : 'liftButton');
  } else if (tgt.kind === 'npc') {
    talkTo(s.talk, s, tgt.npc);
  }
}

function stepFx(s, dt) {
  for (const id of stepBullets(s.bullets, s.props, dt)) {
    const pr = s.props.find(q => q.id === id);
    play('hit');
    if (hitProp(s, id)) play('ludovico');
    if (!pr.quietHit) s.hitPop = { id, t: 1.5 };
    const h = pr.hitAt;
    for (let k = 0; k < 7; k++) {
      const a = hash(k * 31 + Math.floor(s.t * 60)) * Math.PI * 2;
      s.fx.push({ kind: 'spark', x: h.x, y: h.y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 50 - 30, life: 0.3 });
    }
    for (let k = 0; k < 3; k++) s.fx.push({ kind: 'smoke', x: h.x + k - 1, y: h.y - 2, vx: (k - 1) * 3, vy: -12, life: 1 + k * 0.2 });
  }
  for (const f of s.fx) { f.life -= dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.kind === 'spark') f.vy += 160 * dt; }
  s.fx = s.fx.filter(f => f.life > 0);
  if (s.hitPop) { s.hitPop.t -= dt; if (s.hitPop.t <= 0) s.hitPop = null; }
}

// Ascension: the car's gate opens, St. Peter talks, the pearly gate swings in, then the player walks to it.
function stepAscension(s, dt, input) {
  const a = s.sequence, p = s.player;
  updateLift(s.lift, dt);
  if (a.phase === 'walk') {
    const move = (any(input, KEYS.right) ? 1 : 0) - (any(input, KEYS.left) ? 1 : 0);
    updatePlayer(p, dt, move, { min: HEAVEN_MIN_X, max: HEAVEN_MAX_X });
    if (p.x > SHAFT_X + SHAFT_W) p.inLift = false;
  } else p.walking = false;
  updateAscension(a, dt, p);
  const peter = s.npcs.find(n => n.id === 'peter');
  if (peter && (a.phase === 'walk' || a.phase === 'fade')) peter.bubble = null;
  // keep St. Peter's bubble off the car and the player
  const carX = SHAFT_X + ((SHAFT_W - CAR_W) >> 1), carTop = Math.round(s.lift.y) + ROOM_H - 6 - CAR_H + 4;
  s.bubbleAvoid = [{ x: carX - 2, y: carTop - 2, w: CAR_W + 4, h: CAR_H + 4 }, { x: Math.round(p.x) - 9, y: Math.round(p.y) - 30, w: 18, h: 30 }];
}

function onArrive(s) {
  const p = s.player;
  p.floor = s.lift.target;
  p.y = groundY(p.floor);
  if (p.floor === 6) s.sequence = enterHell(p);
  if (p.floor === -1) { s.sequence = createAscension(); s.npcs.push(peterNpc()); }
}

export const facility = {
  enter(params = {}) {
    this.s = createState();
    const s = this.s;
    if (Number.isInteger(params.floor) && params.floor >= 0 && params.floor <= 5) {
      s.player.floor = params.floor; s.player.y = groundY(params.floor);
      s.lift.y = floorTop(params.floor); s.lift.target = params.floor;
      if (params.floor > 0) s.liftUnlocked = true; // dev jump past the lobby: don't strand the tester
    }
    if (Number.isFinite(params.x)) s.player.x = params.x;
    if (params.armed) { s.player.hasGun = true; s.gun.taken = true; }
    if (params.hell) { // dev-only (?hell=1): YES / YES fate, riding down from level 05
      s.decision.fate = 'hell'; s.decision.state = 'off';
      s.player.floor = 5; s.player.y = groundY(5); s.lift.y = floorTop(5);
      s.player.x = SHAFT_X + SHAFT_W / 2; s.player.inLift = true;
      requestTravel(s.lift, 6);
    }
    if (params.heaven) { // dev-only (?heaven=1): YES / NO fate, riding up from level 00 to the ascension
      s.decision.fate = 'heaven'; s.decision.state = 'off';
      s.player.x = SHAFT_X + SHAFT_W / 2; s.player.inLift = true;
      requestTravel(s.lift, -1);
    }
    s.fx = [];
    s.hitPop = null;
    this.egg = createEgg();
    updateCamera(s, 0, true);
    const close = () => { s.overlay = null; };
    initPlates({
      close,
      toggle: i => { if (s.overlay?.type === 'kiosk') { s.overlay.cursor = i; toggleChip(s, i); } },
      intern: () => { if (s.overlay?.type === 'kiosk') { s.overlay.cursor = CHIPS.length; pressIntern(s); } },
      go: i => { if (s.overlay?.type === 'lift') chooseFloor(s, i); },
      yes: () => decide(s, true),
      no: () => decide(s, false),
    });
    const open = type => { if (openPlate(s, type) && type === 'kiosk') play('terminal'); };
    createHud({ map: () => open('map'), badge: () => open('kiosk'), directory: () => open('directory'), sound: () => toggleMute() });
  },
  update(dt, input, game) {
    const s = this.s, egg = this.egg;
    // Konami egg: while the warning or the cracktro is up the whole facility waits exactly where it was
    if (!s.sequence) {
      const was = egg.phase;
      for (const code of input.codes()) eggKey(egg, code);
      if (was !== 'off' || eggActive(egg)) { egg.t += dt; return; }
    }
    s.t += dt;
    if (s.sequence) {
      if (s.sequence.kind === 'hell') updateHell(s.sequence, dt, s.player);
      else stepAscension(s, dt, input);
      if (s.sequence.done && any(input, KEYS.confirm, 'wasPressed')) { removeHud(); s.overlay = null; syncPlates(s); updatePopup(null); game.setScene('boot', { resume: true }); }
      updateCamera(s, dt);
      return;
    }
    const p = s.player;
    // the lift keeps running even while a plate is open
    const wasBusy = liftBusy(s.lift);
    const arrived = updateLift(s.lift, dt);
    if (p.inLift && (wasBusy || arrived)) p.y = s.lift.y + ROOM_H - 6;
    if (arrived && p.inLift) onArrive(s);
    if (s.sequence) return;
    if (s.overlay) {
      stepFx(s, dt);
      overlayInput(s, input, dt);
      updateCamera(s, dt);
      return;
    }

    const held = playerHeld(s); // shut in the vim booth: no walking, no E
    const move = held ? 0 : (any(input, KEYS.right) ? 1 : 0) - (any(input, KEYS.left) ? 1 : 0);
    const riding = p.inLift && liftBusy(s.lift);
    updatePlayer(p, dt, move, riding ? { min: SHAFT_X + 16, max: SHAFT_X + SHAFT_W - 16 } : gateBounds(s, { min: 22, max: WW - 22 }), speedFactor(s));
    if (stepSandbox(s)) play('terminal');
    if (!liftBusy(s.lift)) p.inLift = canBoard(s.lift, p.floor) && Math.abs(p.x - (SHAFT_X + SHAFT_W / 2)) < SHAFT_W / 2;

    if (!riding && !held && any(input, KEYS.use, 'wasPressed')) use(s);
    if (s.liftNote) { s.liftNote.t -= dt; if (s.liftNote.t <= 0 || liftUnlocked(s) || Math.abs(p.x - (SHAFT_X + SHAFT_W / 2)) >= SHAFT_W / 2) s.liftNote = null; }

    if (!s.gun.taken && p.floor === 3 && !riding && Math.abs(p.x - (s.gun.x + 3)) < 6) {
      s.gun.taken = true;
      p.hasGun = true;
      play('pickup');
    }
    s.fireCooldown = Math.max(0, s.fireCooldown - dt);
    if (canFire(s) && any(input, KEYS.fire, 'wasPressed')) {
      s.bullets.push(fire(p));
      s.fireCooldown = 0.25;
      play('pew');
    }
    stepFx(s, dt);
    stepDemos(s, dt);
    if (!riding) { const r = stepBook(s); if (r) play(r.waved ? 'pickup' : 'terminal'); }

    ambientTalk(s.talk, s, !riding);
    updateNpcs(s.npcs, dt);
    if (s.playerBubble) { s.playerBubble.t -= dt; s.playerBubble.age += dt; if (s.playerBubble.t <= 0) s.playerBubble = null; }
    updateCamera(s, dt);
  },
  draw(ctx) {
    const s = this.s, egg = this.egg;
    const crack = egg.phase === 'playing';
    if (crack) drawCracktro(ctx, cracktroTime(egg.t, reduced), reduced);
    else drawWorld(ctx, s, mt(s.t));
    if (!crack && s.sequence?.kind === 'hell') drawHellScreen(ctx, s.sequence);
    if (!crack && s.sequence?.kind === 'asc') drawAscensionScreen(ctx, s.sequence);
    syncEgg(egg.phase, { watch: () => eggWatch(egg), back: () => eggBack(egg) });
    const p = s.player;
    const tgt = s.overlay || s.sequence || eggActive(egg) ? null : targetAt(s);
    updateHud({
      floor: p.inLift && liftBusy(s.lift) ? Math.round(s.lift.y / FH) : p.floor,
      inLift: p.inLift,
      cue: tgt ? cueText(s, tgt) : null,
      muted: isMuted(),
      armed: p.hasGun,
      hidden: !!s.sequence || crack,
      badgeLine: s.intern ? COPY.intern.head : explain(s.result, s.badge).short,
      room: (() => { const r = ROOMS.find(q => q.floor === p.floor && p.x >= q.x && p.x <= q.x + q.w); return r ? ROOM_COPY[r.id].name : null; })(),
    });
    syncPlates(s);
    // proximity box: a fresh hit wins, else the readable object in front of the player
    let info = null;
    if (!s.overlay && !s.sequence && !eggActive(egg)) {
      const hp = s.hitPop && s.props.find(q => q.id === s.hitPop.id);
      if (s.concept) {
        const c = conceptContent(s.concept.text, s.concept.head), pr = s.props.find(q => q.id === s.concept.id);
        info = { key: `concept-${s.concept.id}-${s.concept.head ?? ''}-${s.concept.text}`, title: c.title, lines: c.lines, obj: worldRect(pr), playerX: s.player.x, concept: true };
      } else if (hp) info = { key: `hit-${hp.id}`, title: 'IMPACT', lines: [hp.hitText ?? 'DIRECT HIT.'], obj: worldRect(hp), playerX: s.player.x, alert: true };
      else if (s.liftNote) {
        const c = lockedLiftContent();
        info = { key: 'lift-locked', title: c.title, lines: c.lines, obj: { x: SHAFT_X + 8, y: floorTop(p.floor) + 40, w: SHAFT_W - 16, h: 89 }, playerX: p.x };
      } else {
        const rd = readableAt(s);
        const c = rd && readContent(s, rd);
        if (c) info = { key: `${rd.id}-${rd.broken}-${[...s.badge].join()}-${!!s.intern}`, title: c.title, lines: c.lines, status: c.status, fit: c.fit, obj: worldRect(rd), playerX: s.player.x };
      }
    }
    const scale = (document.getElementById('screen')?.clientWidth ?? W * 3) / W;
    const cam = { x: Math.round(s.cam.x), y: Math.round(s.cam.y) };
    if (info) info.avoid = speechLayout(s, { ...cam, w: W, h: 240 }).map(b => b.rect);
    updatePopup(info, cam, scale);
  },
};
