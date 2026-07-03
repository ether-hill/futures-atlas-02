/**
 * Procedural soundscape — no samples, everything synthesised in WebAudio.
 * Layers: valley wind (filtered noise), the electrical hum of live IT load,
 * the whoosh of cooling fans, a gas-turbine roar, plus one-shot UI cues.
 * Gains track the sim every frame; the context starts on first user gesture.
 */

interface Layers {
  wind: GainNode;
  hum: GainNode;
  fans: GainNode;
  turbine: GainNode;
}

export interface AudioState {
  itLoad: number; // 0..1 of installed IT actually running
  coolLoad: number; // 0..1 cooling duty
  gasLoad: number; // 0..1 peaker dispatch
  windF: number; // 0..1 live wind
  night: number; // 0..1
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private layers: Layers | null = null;
  muted: boolean;

  constructor() {
    this.muted = localStorage.getItem("gw-muted") === "1";
  }

  /** Build the graph — must be called from a user gesture. */
  start(): void {
    if (this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.7;
    master.connect(ctx.destination);
    this.master = master;

    const noiseBuf = this.makeNoise(ctx);
    const noiseSrc = (filterType: BiquadFilterType, freq: number, q = 0.8): GainNode => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      const filt = ctx.createBiquadFilter();
      filt.type = filterType;
      filt.frequency.value = freq;
      filt.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(filt).connect(gain).connect(master);
      src.start();
      return gain;
    };

    // wind: slow-breathing low rumble
    const wind = noiseSrc("lowpass", 320, 0.4);
    // fans: broadband whoosh
    const fans = noiseSrc("bandpass", 950, 0.9);
    // turbine: tighter, angrier band
    const turbine = noiseSrc("bandpass", 240, 2.5);

    // hum: 60 Hz + harmonic, softly detuned
    const humGain = ctx.createGain();
    humGain.gain.value = 0;
    humGain.connect(master);
    for (const [f, g] of [[60, 0.5], [120, 0.3], [180, 0.12]] as const) {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = g;
      osc.connect(og).connect(humGain);
      osc.start();
    }

    this.layers = { wind, hum: humGain, fans, turbine };
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      // pink-ish: integrate white noise a touch so it's less hissy
      const white = Math.random() * 2 - 1;
      last = last * 0.94 + white * 0.06;
      d[i] = last * 3.2;
    }
    return buf;
  }

  update(s: AudioState): void {
    if (!this.ctx || !this.layers) return;
    const t = this.ctx.currentTime;
    const set = (g: GainNode, v: number) => g.gain.setTargetAtTime(v, t, 0.4);
    set(this.layers.wind, 0.05 + s.windF * 0.11 + s.night * 0.02);
    set(this.layers.hum, s.itLoad * 0.05);
    set(this.layers.fans, s.coolLoad * 0.09);
    set(this.layers.turbine, s.gasLoad * 0.14);
  }

  /** Short synthesised UI cues. */
  blip(kind: "place" | "demolish" | "cash" | "alarm" | "warn" | "click"): void {
    if (!this.ctx || !this.master || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const note = (freq: number, dur: number, type: OscillatorType, vol: number, when = 0) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t + when);
      g.gain.linearRampToValueAtTime(vol, t + when + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + when + dur);
      osc.connect(g).connect(this.master!);
      osc.start(t + when);
      osc.stop(t + when + dur + 0.05);
    };
    switch (kind) {
      case "place": note(180, 0.14, "triangle", 0.25); note(90, 0.2, "sine", 0.3, 0.02); break;
      case "demolish": note(140, 0.3, "sawtooth", 0.12); note(70, 0.35, "sine", 0.22, 0.04); break;
      case "cash": note(660, 0.12, "sine", 0.16); note(880, 0.18, "sine", 0.16, 0.09); break;
      case "alarm": note(520, 0.16, "square", 0.09); note(392, 0.22, "square", 0.09, 0.18); break;
      case "warn": note(330, 0.2, "triangle", 0.14); break;
      case "click": note(2200, 0.03, "sine", 0.05); break;
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem("gw-muted", this.muted ? "1" : "0");
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.7, this.ctx.currentTime, 0.1);
    }
    return this.muted;
  }
}
