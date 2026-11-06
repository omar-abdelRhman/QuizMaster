/**
 * SOUND EFFECTS (sounds.js)
 * Generated with the Web Audio API, so no audio files are needed.
 */

let audioCtx = null;

function getCtx() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  } catch (e) {
    return null;
  }
}

function playTone(freq, start, duration, type = "sine", volume = 0.2) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + start;
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration);
}

// Happy rising two-note sound
export function playCorrectSound() {
  playTone(523.25, 0, 0.15, "sine"); // C5
  playTone(783.99, 0.12, 0.3, "sine"); // G5
}

// Low buzzing sound
export function playWrongSound() {
  playTone(220, 0, 0.25, "sawtooth", 0.15);
  playTone(150, 0.2, 0.35, "sawtooth", 0.15);
}
