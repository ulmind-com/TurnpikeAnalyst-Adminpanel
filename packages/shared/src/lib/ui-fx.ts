/**
 * Premium UI feedback: synthesized click/tab sounds (Web Audio, no asset
 * files) plus haptic pulses. Sounds are generated on the fly, so there is
 * nothing to download and no autoplay problem — the AudioContext is created
 * and resumed on the first real user gesture.
 *
 * Haptics use `navigator.vibrate`, which only does anything on Android/Chrome;
 * desktop browsers and iOS Safari ignore it silently.
 */

export type FxType = "tick" | "nav" | "toggle" | "success" | "open" | "remove";

const STORE_KEY = "turnpike.uifx.muted";

let audioCtx: AudioContext | null = null;
let muted = false;

try {
  muted = typeof localStorage !== "undefined" && localStorage.getItem(STORE_KEY) === "1";
} catch {
  /* storage blocked */
}

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try {
      audioCtx = new AC();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

/** A short enveloped oscillator blip. */
function blip(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0) {
  const c = ctx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const SOUND: Record<FxType, () => void> = {
  tick: () => blip(2000, 0.045, "triangle", 0.04),
  nav: () => blip(640, 0.07, "sine", 0.05),
  toggle: () => {
    blip(500, 0.08, "sine", 0.05);
    blip(760, 0.08, "sine", 0.045, 0.04);
  },
  success: () => {
    blip(660, 0.09, "sine", 0.05);
    blip(990, 0.12, "sine", 0.05, 0.08);
  },
  open: () => blip(420, 0.08, "triangle", 0.045),
  remove: () => blip(300, 0.09, "sawtooth", 0.035),
};

const HAPTIC: Record<FxType, number | number[]> = {
  tick: 6,
  nav: 10,
  toggle: 12,
  success: [10, 30, 10],
  open: 8,
  remove: [8, 20],
};

export const uiFx = {
  /** Play a sound (unless muted) and fire the matching haptic pulse. */
  play(type: FxType = "tick") {
    if (!muted) {
      try {
        SOUND[type]();
      } catch {
        /* audio unavailable */
      }
    }
    try {
      navigator.vibrate?.(HAPTIC[type]);
    } catch {
      /* no haptics */
    }
  },
  isMuted: () => muted,
  setMuted(value: boolean) {
    muted = value;
    try {
      localStorage.setItem(STORE_KEY, value ? "1" : "0");
    } catch {
      /* storage blocked */
    }
  },
  toggleMuted() {
    this.setMuted(!muted);
    return muted;
  },
};
