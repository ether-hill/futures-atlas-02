/**
 * The mini sound board: a leader's own ambience layers with per-layer levels.
 * Each layer prefers its produced loop at /magnifica/media/sfx/<scene>/<id>.mp3
 * (generated from the layer's prompt by scripts/sfx.mjs, see ASSETS.md) and
 * falls back to a procedural version of its family so the board works with
 * no assets at all. Everything is created lazily on first user gesture.
 */

import type { SoundFamily, SoundLayer } from "./scenes";

interface Layer {
  def: SoundLayer;
  gain: GainNode | null;
  level: number;
  started: boolean;
}

export class Soundscape {
  private ctx: AudioContext | null = null;
  /** Loop bytes, fetched before the first toggle so it can be instant. */
  private files = new Map<string, ArrayBuffer>();
  private preloading = false;
  private master: GainNode | null = null;
  private layers = new Map<string, Layer>();
  private sources: AudioScheduledSourceNode[] = [];
  private timers: number[] = [];
  private sceneId = "";
  on = false;

  /** Point the board at a scene's layers. Silences whatever was playing. */
  load(sceneId: string, layers: SoundLayer[]) {
    this.silence();
    this.sceneId = sceneId;
    this.files.clear();
    this.preloading = false;
    this.layers.clear();
    for (const def of layers) this.layers.set(def.id, { def, gain: null, level: def.level, started: false });
    if (this.ctx) this.wire();
  }

  get defs(): SoundLayer[] {
    return Array.from(this.layers.values(), (l) => l.def);
  }

  setLevel(id: string, v: number) {
    const l = this.layers.get(id);
    if (!l) return;
    l.level = v;
    if (l.gain && this.ctx && this.on) {
      if (v > 0 && !l.started) this.start(l);
      l.gain.gain.setTargetAtTime(v * baseLevel(l.def.family), this.ctx.currentTime, 0.4);
    }
  }

  private url(id: string) {
    return `/magnifica/media/sfx/${this.sceneId}/${id}.mp3`;
  }

  /**
   * Fetch the loop files ahead of time. Without this the first toggle pays for
   * the downloads and decodes before anything is audible — the whole of the
   * lag. Only the bytes are cached here; decoding needs an AudioContext,
   * which needs a gesture, and is fast once the network is out of the way.
   */
  preload(force = false): void {
    if (this.preloading) return;
    // Four loops are ~1.4 MB. Speculating that much is fine on a desktop
    // connection and rude on a metered one, so a saver or a slow link waits
    // until the button is actually approached (force).
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
      .connection;
    if (!force && conn && (conn.saveData || /^(slow-)?2g$|^3g$/.test(conn.effectiveType ?? ""))) return;
    this.preloading = true;
    for (const id of this.layers.keys()) void this.fetchLoop(id);
  }

  private async fetchLoop(id: string): Promise<ArrayBuffer | undefined> {
    const hit = this.files.get(id);
    if (hit) return hit;
    try {
      const res = await fetch(this.url(id));
      const type = res.headers.get("content-type") || "";
      if (res.ok && type.startsWith("audio")) {
        const bytes = await res.arrayBuffer();
        this.files.set(id, bytes);
        return bytes;
      }
    } catch {
      /* no asset — the procedural layer covers it */
    }
    return undefined;
  }

  toggle(): boolean {
    this.on = !this.on;
    if (this.on) {
      this.ensure();
      this.ctx?.resume();
      for (const l of this.layers.values()) {
        if (l.level > 0 && !l.started) this.start(l);
        // Short constant: 0.6 took roughly two seconds to reach level, which
        // read as the button not having worked.
        l.gain?.gain.setTargetAtTime(l.level * baseLevel(l.def.family), this.ctx!.currentTime, 0.12);
      }
    } else if (this.ctx) {
      for (const l of this.layers.values()) l.gain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.35);
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
    this.wire();
  }

  /** A gain per layer on the current context. */
  private wire() {
    for (const l of this.layers.values()) {
      if (l.gain) continue;
      const gain = this.ctx!.createGain();
      gain.gain.value = 0;
      gain.connect(this.master!);
      l.gain = gain;
    }
  }

  private start(l: Layer) {
    if (l.started || !l.gain) return;
    l.started = true;
    void this.startLayer(l);
  }

  /** Prefer the produced loop; fall back to the procedural family. */
  private async startLayer(l: Layer) {
    const ctx = this.ctx!;
    const out = l.gain!;
    try {
      const bytes = await this.fetchLoop(l.def.id);
      if (bytes && this.layers.get(l.def.id) === l) {
        // decodeAudioData detaches its input, so decode a copy and keep ours
        const buf = await ctx.decodeAudioData(bytes.slice(0));
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        src.connect(out);
        src.start();
        this.sources.push(src);
        return;
      }
      if (!bytes && this.layers.get(l.def.id) !== l) return;
    } catch {
      /* no asset — procedural fallback below */
    }
    PROCEDURAL[l.def.family](ctx, out, this.timers, this.sources);
  }

  /** Stop every source and forget the layers' state, keeping the context. */
  private silence() {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    this.sources = [];
    for (const l of this.layers.values()) {
      l.gain?.disconnect();
      l.gain = null;
      l.started = false;
    }
    this.on = false;
  }

  destroy() {
    this.silence();
    this.ctx?.close();
    this.ctx = null;
    this.layers.clear();
  }
}

/** Per-family gain trim so sliders feel balanced. */
function baseLevel(family: SoundFamily): number {
  return { wind: 0.5, drone: 0.4, bells: 0.6, rain: 0.4, hum: 0.4 }[family];
}

function noiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

type Proc = (ctx: AudioContext, out: GainNode, timers: number[], sources: AudioScheduledSourceNode[]) => void;

const PROCEDURAL: Record<SoundFamily, Proc> = {
  // filtered noise with a slow breathing LFO
  wind: (ctx, out, _t, sources) => {
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
    sources.push(src, lfo);
  },
  // two detuned low oscillators + a fifth, heavily lowpassed
  drone: (ctx, out, _t, sources) => {
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
      sources.push(o);
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
  rain: (ctx, out, _t, sources) => {
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
    sources.push(src, lfo);
  },
  // a low room tone with slow vibrato
  hum: (ctx, out, _t, sources) => {
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
    sources.push(o, o2, vib);
  },
};
