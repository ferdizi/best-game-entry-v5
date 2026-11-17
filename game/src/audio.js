// DREDGEWARD audio: one clear job — every sound is synthesized with
// WebAudio, no files. A tiny blip synth plus a low ambient drone.
export function createAudio() {
  return { ctx: null, muted: false, drone: null };
}
export function ensureAudio(audio) {
  if (audio.ctx || audio.muted) return;
  try {
    audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audio.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 55;
    gain.gain.value = 0.035;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 12;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    lfo.start();
    audio.drone = { osc, gain, lfo };
  } catch (_e) { /* no audio in this browser: the game still plays */ }
}
function blip(audio, freq, dur, type, vol, slideTo) {
  if (!audio.ctx || audio.muted) return;
  try {
    const ctx = audio.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol || 0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch (_e) { /* ignore */ }
}
export const sfx = {
  shoot(audio) { blip(audio, 620, 0.09, 'square', 0.06, 240); },
  reel(audio) { blip(audio, 420, 0.12, 'sine', 0.07, 880); },
  bank(audio) { blip(audio, 660, 0.1, 'sine', 0.09, 990); blip(audio, 990, 0.16, 'sine', 0.07, 1320); },
  hit(audio) { blip(audio, 180, 0.12, 'sawtooth', 0.09, 90); },
  explode(audio) { blip(audio, 140, 0.35, 'sawtooth', 0.12, 40); },
  pickup(audio) { blip(audio, 880, 0.1, 'sine', 0.08, 1170); },
  hurt(audio) { blip(audio, 110, 0.25, 'sawtooth', 0.11, 55); },
  boss(audio) { blip(audio, 70, 0.7, 'sawtooth', 0.13, 45); },
  win(audio) { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(audio, f, 0.22, 'sine', 0.09), i * 130)); },
  lose(audio) { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => blip(audio, f, 0.25, 'triangle', 0.09), i * 150)); },
};
export function toggleMute(audio) {
  audio.muted = !audio.muted;
  if (audio.drone) audio.drone.gain.gain.value = audio.muted ? 0 : 0.035;
  return audio.muted;
}
