/**
 * The mini sound board: five loopable ambience layers with per-layer levels.
 * Each layer prefers a produced audio loop at /magnifica/media/sfx/<name>.mp3
 * (dropped in by the ElevenLabs sound-effects pipeline, see ASSETS.md) and
 * falls back to a procedural Web Audio version so the board works with no
 * assets at all. Everything is created lazily on first user gesture.
 */

export type LayerName = "wind" | "drone" | "bells" | "rain" | "hum";
export const LAYER_LABELS: Record<LayerName, string> = {
  wind: "Wind",
  drone: "Drone",
  bells: "Bells",
  rain: "Rain",
  hum: "Hum",
};

interface Layer {
  gain: GainNode;
  level: number;
  started: boolean;
  start: () => void;
}

export class Soundscape {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private layers = new Map<LayerName, Layer>();
  private timers: number[] = [];
  on = false;

  levels: Record<LayerName, number> = { wind: 0, drone: 0, bells: 0, rain: 0, hum: 0 };

  setLevel(name: LayerName, v: number) {
    this.levels[name] = v;
    const l = this.layers.get(name);
    if (l && this.ctx) {
      l.level = v;
      if (this.on) {
        if (v > 0 && !l.started) l.start();
        l.gain.gain.setTargetAtTime(v * baseLevel(name), this.ctx.currentTime, 0.4);
      }
    }
  }

  toggle(): boolean {
    this.on = !this.on;
    if (this.on) {
      this.ensure();
      this.ctx?.resume();
      for (const [name, l] of this.layers) {
        if (this.levels[name] > 0 && !l.started) l.start();
        l.gain.gain.setTargetAtTime(
          this.on ? this.levels[name] * baseLevel(name) : 0,
          this.ctx!.currentTime,
          0.6,
        );
      }
    } else if (this.ctx) {
      for (const l of this.layers.values()) l.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    }
    return this.on;
  }

  private ensure() {
    if (this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(ctx.destination);

    (Object.keys(LAYER_LABELS) as LayerName[]).forEach((name) => {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.connect(this.master!);
      const layer: Layer = {
        gain,
        level: this.levels[name],
        started: false,
        start: () => {
          if (layer.started) return;
          layer.started = true;
          this.startLayer(name, gain);
        },
      };
      this.layers.set(name, layer);
    });
  }

  /** Prefer a produced loop file; fall back to the procedural layer. */
  private async startLayer(name: LayerName, out: GainNode) {
    const ctx = this.ctx!;
    try {
      const res = await fetch(`/magnifica/media/sfx/${name}.mp3`);
      const type = res.headers.get("content-type") || "";
      if (res.ok && type.startsWith("audio")) {
        const buf = await ctx.decodeAudioData(await res.arrayBuffer());
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        src.connect(out);
        src.start();
        return;
      }
    } catch {
      /* no asset — procedural fallback below */
    }
    PROCEDURAL[name](ctx, out, this.timers);
  }

  destroy() {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    this.ctx?.close();
    this.ctx = null;
    this.layers.clear();
    this.on = false;
  }
}

/** Per-layer gain trim so sliders feel balanced. */
function baseLevel(name: LayerName): number {
  return { wind: 0.5, drone: 0.4, bells: 0.6, rain: 0.4, hum: 0.35 }[name];
}

function noiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

type Proc = (ctx: AudioContext, out: GainNode, timers: number[]) => void;

const PROCEDURAL: Record<LayerName, Proc> = {
  // filtered noise with a slow breathing LFO
  wind: (ctx, out) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 4);
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    lp.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.value = 0.7;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.3;
    lfo.connect(lfoGain).connect(g.gain);
    src.connect(lp).connect(g).connect(out);
    src.start();
    lfo.start();
  },
  // two detuned low oscillators + a fifth, heavily lowpassed
  drone: (ctx, out) => {
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 300;
    lp.connect(out);
    [55, 55.7, 82.4].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 2 ? "sine" : "triangle";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.12 : 0.2;
      o.connect(g).connect(lp);
      o.start();
    });
  },
  // sparse struck tones with long decay, loosely pentatonic
  bells: (ctx, out, timers) => {
    const notes = [523.25, 587.33, 659.25, 783.99, 880];
    const strike = () => {
      const f = notes[Math.floor(Math.random() * notes.length)] / 2;
      const o = ctx.createOscillator();
      o.frequency.value = f;
      const partial = ctx.createOscillator();
      partial.frequency.value = f * 2.76;
      const g = ctx.createGain();
      const pg = ctx.createGain();
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 7);
      pg.gain.setValueAtTime(0.0001, t);
      pg.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      pg.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      o.connect(g).connect(out);
      partial.connect(pg).connect(out);
      o.start(t);
      partial.start(t);
      o.stop(t + 8);
      partial.stop(t + 3);
      timers.push(window.setTimeout(strike, 5000 + Math.random() * 11000));
    };
    timers.push(window.setTimeout(strike, 800));
  },
  // bright noise, highpassed, with amplitude shimmer
  rain: (ctx, out) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 3);
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2400;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.21;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.12;
    lfo.connect(lfoGain).connect(g.gain);
    src.connect(hp).connect(g).connect(out);
    src.start();
    lfo.start();
  },
  // a low vocal-ish hum with slow vibrato
  hum: (ctx, out) => {
    const o = ctx.createOscillator();
    o.frequency.value = 86;
    const o2 = ctx.createOscillator();
    o2.frequency.value = 172.5;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    const g2 = ctx.createGain();
    g2.gain.value = 0.08;
    const vib = ctx.createOscillator();
    vib.frequency.value = 0.18;
    const vibGain = ctx.createGain();
    vibGain.gain.value = 1.6;
    vib.connect(vibGain).connect(o.frequency);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 500;
    o.connect(g).connect(lp);
    o2.connect(g2).connect(lp);
    lp.connect(out);
    o.start();
    o2.start();
    vib.start();
  },
};
