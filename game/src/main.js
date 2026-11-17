// DREDGEWARD entry point: one clear job — own the loop and the screens.
// Fixed 1/60 s step, title -> play -> shop -> over, pause, mute, restart,
// and the deterministic ?shot= scenes the screenshots are taken from.
import { STEP, VIEW } from './config.js';
import { attachInput, consumeClick, consumePress, createInput, endFrameInput } from './input.js';
import { createAudio, ensureAudio, sfx, toggleMute } from './audio.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_SHOP, SCREEN_TITLE, beginGame, buyUpgrade, continueFromShop, createWorld, startDive, stepWorld } from './world.js';
import { drawWorld } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const statusEl = document.getElementById('status');

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const world = createWorld(seed);
world.best = Number(localStorage.getItem('dredgeward-best') || '0');
const input = createInput();
attachInput(input, canvas);
const audio = createAudio();
let paused = false;
let last = performance.now();
let acc = 0;

if (shot) {
  stageShot(shot, world);
  drawWorld(ctx, world);
  window.__shotReady = true;
} else {
  world.screen = SCREEN_TITLE;
}

function saveBest() {
  if (world.score > world.best) {
    world.best = world.score;
    try { localStorage.setItem('dredgeward-best', String(world.best)); } catch (_e) { /* private mode */ }
  }
}
function announce() {
  if (!statusEl) return;
  const dive = world.diveIndex + 1;
  statusEl.textContent = world.screen === SCREEN_PLAY
    ? `Dive ${dive} of 8. Score ${world.score}. Hull ${Math.ceil(world.hull)}. Oxygen ${Math.ceil(world.oxygen)} percent. Quota ${world.banked} of ${world.quota}.`
    : world.screen === SCREEN_TITLE
      ? 'Dredgeward. Press Enter to dive.'
      : world.screen === SCREEN_SHOP
        ? 'Dive cleared. Buy upgrades, then press Enter.'
        : world.won ? `You won. Final score ${world.score}. Press R to play again.` : `Game over. Final score ${world.score}. Press R to play again.`;
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  world.time += dt;
  // Global keys, on every screen.
  if (consumePress(input, 'm')) toggleMute(audio);
  if (consumePress(input, 'p') && world.screen === SCREEN_PLAY) paused = !paused;
  if (world.screen === SCREEN_TITLE) {
    if (consumePress(input, 'enter') || consumeClick(input)) {
      ensureAudio(audio);
      beginGame(world);
    }
  } else if (world.screen === SCREEN_SHOP) {
    for (let i = 0; i < 4; i += 1) {
      if (consumePress(input, String(i + 1))) {
        ensureAudio(audio);
        buyUpgrade(world, ['hull', 'harpoon', 'engine', 'magnet'][i]);
      }
    }
    if (consumePress(input, 'enter') || consumeClick(input)) {
      ensureAudio(audio);
      continueFromShop(world);
    }
  } else if (world.screen === SCREEN_OVER) {
    saveBest();
    if (consumePress(input, 'r') || consumeClick(input)) {
      ensureAudio(audio);
      beginGame(world);
    }
  } else if (world.screen === SCREEN_PLAY && !paused) {
    ensureAudio(audio);
    acc += dt;
    while (acc >= STEP) {
      stepWorld(world, STEP, input, audio);
      acc -= STEP;
      if (world.screen !== SCREEN_PLAY) { acc = 0; break; }
    }
    if (world.screen === SCREEN_OVER && world.won) saveBest();
    if (world.screen === SCREEN_OVER && !world.won) { saveBest(); sfx.lose(audio); }
  }
  if (world.screen === SCREEN_PLAY && paused) {
    drawWorld(ctx, world);
    ctx.fillStyle = 'rgba(7,34,46,0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '700 48px Trebuchet MS, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED — press P to dive on', VIEW.width / 2, VIEW.height / 2);
  } else if (!shot) {
    drawWorld(ctx, world);
  }
  announce();
  endFrameInput(input);
}
if (!shot) requestAnimationFrame(frame);
