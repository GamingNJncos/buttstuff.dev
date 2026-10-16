let ac = null;
let master = null;
let muted = false;

export const SILENT_SLOTS = ['cassette', 'liftDing', 'liftHum', 'explode', 'hellDrone', 'choir', 'bubble', 'door', 'ludovico', 'cracktro'];

const SOUNDS = {
  liftButton: t => { blip(t, 660, 0.06); blip(t + 0.07, 990, 0.08); },
  terminal: t => { noise(t, 0.02, 0.15); blip(t + 0.02, 1320, 0.05, 'square', 0.12); },
  pickup: t => { blip(t, 520, 0.05); blip(t + 0.06, 780, 0.05); blip(t + 0.12, 1170, 0.09); },
  pew: t => { sweep(t, 1400, 180, 0.18); noise(t, 0.05, 0.2); },
  hit: t => { noise(t, 0.08, 0.25); blip(t, 140, 0.09, 'square', 0.2); blip(t + 0.03, 95, 0.07, 'square', 0.15); },
};

export function initAudio() {
  if (ac || typeof window === 'undefined') return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  master = ac.createGain();
  master.gain.value = 0.25;
  master.connect(ac.destination);
}

export function play(name) {
  if (!ac || muted) return false;
  const f = SOUNDS[name];
  if (!f) return false;
  f(ac.currentTime);
  return true;
}

export function toggleMute() { muted = !muted; return muted; }
export function isMuted() { return muted; }
export function soundNames() { return { implemented: Object.keys(SOUNDS), silent: [...SILENT_SLOTS] }; }

function blip(t, freq, dur, type = 'square', vol = 0.3) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.01);
}

function sweep(t, f0, f1, dur) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.01);
}

function noise(t, dur, vol) {
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  const g = ac.createGain();
  src.buffer = buf;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(g).connect(master);
  src.start(t);
}
