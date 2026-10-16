import { W, H } from '../engine/screen.js?v=68';
import { PAL, C } from '../art/palette.js?v=68';
import { drawText } from '../engine/font.js?v=68';
import { COPY } from '../logic/copy.js?v=68';
import { mt, reduced } from '../engine/motion.js?v=68';
import { FRAME, SCREEN, layoutBoot, layoutCrash, scanRows, rainbowBand } from '../logic/bootlayout.js?v=68';

const PER_FILE = 0.9;
const BEZEL = PAL[C.void];
const BG = PAL[C.navy2];
const SCANLINE = PAL[C.navy];
const TEXT = PAL[C.steel3];
const DIM = PAL[C.steel2];
const CRASH_BG = PAL[C.ink];
const CRASH_SCAN = PAL[C.void];
const CRASH_RED = PAL[C.red];
export const RAINBOW = [C.red, C.rust2, C.amber, C.yellow, C.mint1, C.steel2, C.pink].map(i => PAL[i]);
export const BOOT_STRINGS = {
  header: 'LOADING FACILITY.BAS', resume: 'RESUMING...', ready: 'READY', press: 'PRESS ANY KEY', block: 'BLOCK 000',
};

export function bootPhase(t, nFiles, mobile) {
  const files = Math.min(nFiles, Math.floor(t / PER_FILE));
  if (mobile && files >= 3) return { files: 3, phase: 'crash' };
  return { files, phase: files >= nFiles ? 'ready' : 'load' };
}

// thin rainbow outline: palette bands that crawl one step along the frame every RAINBOW_STEP s (still under reduced motion)
function drawFrame(ctx, t) {
  const { inset: i, thick: k } = FRAME;
  const x0 = i, y0 = i, x1 = W - i, y1 = H - i;
  const w = x1 - x0, h = y1 - y0, n = RAINBOW.length;
  const run = (len, at) => {
    let start = 0, band = rainbowBand(at(0), t, n);
    for (let p = 1; p <= len; p++) {
      const b = p < len ? rainbowBand(at(p), t, n) : -1;
      if (b !== band) { ctx.fillStyle = RAINBOW[band]; at.rect(start, p - start); start = p; band = b; }
    }
  };
  const top = p => p; top.rect = (s, l) => ctx.fillRect(x0 + s, y0, l, k);
  const right = p => w + p; right.rect = (s, l) => ctx.fillRect(x1 - k, y0 + s, k, l);
  const bottom = p => w + h + p; bottom.rect = (s, l) => ctx.fillRect(x1 - s - l, y1 - k, l, k);
  const left = p => 2 * w + h + p; left.rect = (s, l) => ctx.fillRect(x0, y1 - s - l, k, l);
  run(w, top); run(h, right); run(w, bottom); run(h, left);
}

function drawScreen(ctx, r, bg, scan) {
  ctx.fillStyle = bg;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = scan;
  for (const y of scanRows(r.y, r.y + r.h)) ctx.fillRect(r.x, y, r.w, 1);
}

export const boot = {
  enter(params = {}) {
    this.mobile = !!params.mobile;
    this.resume = !!params.resume;
    this.t = 0;
    this.files = 0;
    this.phase = 'load';
    this.skipped = false;
    this.crashT = 0;
    this.frozen = null;
  },
  update(dt, input, game) {
    this.t += dt;
    if (this.resume) {
      if (this.t > 1.2) game.setScene('facility');
      return;
    }
    if (this.phase === 'crash') { this.crashT += dt; return; }
    if (this.phase === 'ready') {
      if (input.anyPressed()) game.setScene('facility');
      return;
    }
    const st = bootPhase(this.t, COPY.bootFiles.length, this.mobile);
    this.files = st.files;
    this.phase = st.phase;
    if (!this.mobile && this.phase === 'load' && this.files >= 1 && input.anyPressed()) {
      this.files = COPY.bootFiles.length;
      this.phase = 'ready';
    }
  },
  draw(ctx) {
    if (this.phase === 'crash') { drawCrash(ctx, this); return; }
    ctx.fillStyle = BEZEL;
    ctx.fillRect(0, 0, W, H);
    drawFrame(ctx, mt(this.t));
    drawScreen(ctx, SCREEN, BG, SCANLINE);
    const strings = { ...BOOT_STRINGS, block: `BLOCK ${String(Math.floor(this.t * 23) % 1000).padStart(3, '0')}` };
    const lines = layoutBoot({ files: COPY.bootFiles.slice(0, this.files), phase: this.phase, resume: this.resume, strings });
    for (const l of lines) {
      if (l.cursor) {
        if (reduced || Math.floor(this.t * 2) % 2 === 0) { ctx.fillStyle = TEXT; ctx.fillRect(l.x, l.y, l.w, l.h); }
      } else {
        drawText(ctx, l.text, l.x, l.y, l === lines[lines.length - 1] && !this.resume ? DIM : TEXT);
      }
    }
  },
};

function drawCrash(ctx, b) {
  if (!b.frozen) {
    b.frozen = document.createElement('canvas');
    b.frozen.width = W;
    b.frozen.height = H;
    b.frozen.getContext('2d').drawImage(ctx.canvas, 0, 0);
    b.nextRot = 0;
  }
  const f = b.frozen.getContext('2d');
  if (!reduced && b.crashT >= b.nextRot) {
    b.nextRot = b.crashT + 0.15;
    const y = 44 + Math.floor(Math.random() * (H - 52));
    const h = 2 + Math.floor(Math.random() * 6);
    f.drawImage(b.frozen, 0, y, W, h, 1 + Math.floor(Math.random() * 3), y, W, h);
  }
  ctx.drawImage(b.frozen, 0, 0);
  const { text, rect: r } = layoutCrash(COPY.mobileCrash);
  drawScreen(ctx, r, CRASH_BG, CRASH_SCAN);
  if (Math.floor(b.crashT / 0.8) % 2 === 0) {
    ctx.fillStyle = CRASH_RED;
    ctx.fillRect(r.x, r.y, r.w, 2); ctx.fillRect(r.x, r.y + r.h - 2, r.w, 2);
    ctx.fillRect(r.x, r.y, 2, r.h); ctx.fillRect(r.x + r.w - 2, r.y, 2, r.h);
  }
  for (const l of text) drawText(ctx, l.text, l.x, l.y, CRASH_RED);
}
