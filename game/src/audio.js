// Procedural WebAudio: every sound is synthesized, nothing is loaded.
// A plucky little banjo-ish loop runs behind the chase; spot effects are
// short oscillator / noise bursts. The context is created lazily on the
// first user gesture, and everything is a no-op until then.

const MELODY = [
  // A bouncy autumn jig: [midi note, beats]. 0 = rest.
  [69, 1], [72, 1], [76, 1], [72, 1], [74, 1], [71, 1], [69, 1], [0, 1],
  [67, 1], [69, 1], [71, 1], [69, 1], [67, 1], [64, 1], [62, 1], [0, 1],
  [69, 1], [72, 1], [76, 1], [79, 1], [76, 1], [74, 1], [72, 1], [74, 1],
  [76, 1], [74, 1], [71, 1], [69, 1], [67, 1], [0, 1], [62, 2], [0, 0],
];
const BEAT = 0.21;

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function createAudio() {
  let ctx = null;
  let muted = false;
  let musicTimer = null;
  let melodyIndex = 0;
  let nextNoteTime = 0;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    const ac = ensure();
    if (!ac || muted) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, when = 0, lowpass = 1200) {
    const ac = ensure();
    if (!ac || muted) return;
    const t0 = ac.currentTime + when;
    const len = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ac.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(t0);
  }

  function pluck(midi, when, vol = 0.05) {
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = midiToFreq(midi);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + BEAT * 0.95);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + BEAT);
  }

  function scheduleMusic() {
    const ac = ensure();
    if (!ac) return;
    while (nextNoteTime < ac.currentTime + 0.35) {
      const [midi, beats] = MELODY[melodyIndex];
      if (midi && !muted) pluck(midi, nextNoteTime - ac.currentTime, 0.045);
      if (melodyIndex % 4 === 0 && !muted) pluck(45, nextNoteTime - ac.currentTime, 0.03);
      nextNoteTime += Math.max(0.25, beats) * BEAT;
      melodyIndex = (melodyIndex + 1) % MELODY.length;
    }
  }

  return {
    /** Call from any user gesture so the browser lets sound start. */
    unlock() {
      ensure();
    },
    setMuted(value) {
      muted = value;
    },
    isMuted() {
      return muted;
    },
    startMusic() {
      if (musicTimer) return;
      ensure();
      if (ctx) nextNoteTime = ctx.currentTime + 0.1;
      musicTimer = window.setInterval(scheduleMusic, 120);
    },
    stopMusic() {
      if (musicTimer) {
        window.clearInterval(musicTimer);
        musicTimer = null;
      }
    },
    /** The turkey's panicked gobble: two quick descending squawks. */
    gobble() {
      tone(520, 0.09, 'sawtooth', 0.12, 0, 300);
      tone(520, 0.09, 'sawtooth', 0.12, 0.11, 280);
      tone(660, 0.07, 'sawtooth', 0.09, 0.22, 380);
    },
    step() {
      noise(0.05, 0.05, 0, 500);
    },
    thud() {
      tone(120, 0.16, 'sine', 0.22, 0, 55);
      noise(0.1, 0.1, 0, 350);
    },
    /** Knife slicing past: a fast filtered whoosh. */
    whoosh() {
      noise(0.22, 0.16, 0, 3200);
      tone(900, 0.18, 'sine', 0.05, 0, 240);
    },
    /** Two-note alarm when the farmer spots the turkey. */
    alarm() {
      tone(880, 0.14, 'square', 0.09);
      tone(1174, 0.14, 'square', 0.09, 0.15);
      tone(880, 0.14, 'square', 0.09, 0.3);
    },
    pickup(kind) {
      if (kind === 'pie') {
        tone(660, 0.1, 'triangle', 0.14);
        tone(880, 0.12, 'triangle', 0.14, 0.09);
        tone(1108, 0.16, 'triangle', 0.14, 0.18);
      } else if (kind === 'feather') {
        tone(523, 0.09, 'triangle', 0.14);
        tone(784, 0.09, 'triangle', 0.14, 0.08);
        tone(1046, 0.09, 'triangle', 0.14, 0.16);
        tone(1318, 0.18, 'triangle', 0.14, 0.24);
      } else {
        tone(784, 0.09, 'triangle', 0.13);
        tone(988, 0.13, 'triangle', 0.13, 0.08);
      }
    },
    /** Happy escape jingle: a rising major run. */
    jingle() {
      [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.11));
    },
    /** Sad trombone for getting caught: wah-wah-wah-wahhh. */
    trombone() {
      const notes = [233, 220, 208, 196];
      notes.forEach((f, i) => tone(f, i === 3 ? 0.7 : 0.22, 'sawtooth', 0.11, i * 0.24, f * 0.94));
    },
  };
}
