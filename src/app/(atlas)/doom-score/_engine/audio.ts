import { hzFor, ROOT_HZ, type ScaleName } from "./scale";

/**
 * The sound of The Doom Score. One shared AudioContext; everything is
 * synthesised, nothing sampled, so the page weighs nothing.
 *
 *  - A drone under the whole sweep: detuned saws an octave below the root
 *    through a low-pass that opens as the playhead nears the present. Quiet
 *    and closed in the 1960s, wide and loud in the crowd.
 *  - Notes: a soft saw plus a sub sine, filter envelope, into a long reverb.
 *    Books and papers hold, forum posts pluck. Numbers at 90% and above
 *    also drop a sub thump.
 *  - Ticks: geiger-counter clicks for the volume layer. Discussion as
 *    radiation.
 */
export type MomentSound = "toll" | "cluster" | "riser" | "heartbeat" | "static" | "thud" | "bell" | "swell";

export class DoomAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private dry: GainNode | null = null;
  private send: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private drone: { oscs: OscillatorNode[]; filter: BiquadFilterNode; gain: GainNode } | null = null;
  private level = 0.7;
  private comp: DynamicsCompressorNode | null = null;
  private recDest: MediaStreamAudioDestinationNode | null = null;

  ensure(): AudioContext {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = (this.ctx = new AC());
      this.master = ctx.createGain();
      this.master.gain.value = this.level;
      const comp = (this.comp = ctx.createDynamicsCompressor());
      comp.threshold.value = -20;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      comp.attack.value = 0.01;
      comp.release.value = 0.3;
      this.master.connect(comp).connect(ctx.destination);

      this.dry = ctx.createGain();
      this.dry.gain.value = 0.8;
      this.dry.connect(this.master);

      // reverb: exponentially decaying noise, 4 s, a touch darker on the tail
      const len = Math.floor(ctx.sampleRate * 4);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) {
          const t = i / len;
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.6) * (0.6 + 0.4 * Math.random());
        }
      }
      const conv = ctx.createConvolver();
      conv.buffer = ir;
      const revLp = ctx.createBiquadFilter();
      revLp.type = "lowpass";
      revLp.frequency.value = 3200;
      this.send = ctx.createGain();
      this.send.gain.value = 0.45;
      this.send.connect(conv).connect(revLp).connect(this.master);

      const nl = ctx.sampleRate * 0.25;
      this.noise = ctx.createBuffer(1, nl, ctx.sampleRate);
      const nd = this.noise.getChannelData(0);
      for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /**
   * Everything scheduled ahead (notes, the rain of clicks, risers) goes through a session that
   * `cancelPending` can silence at once, so a pause, a seek or a new speed never leaves sounds
   * from the old timing playing on. The drone is outside it.
   */
  private session: { dry: GainNode; send: GainNode } | null = null;
  private sessionNodes() {
    if (!this.session) {
      const dry = this.ctx!.createGain();
      const send = this.ctx!.createGain();
      dry.connect(this.dry!);
      send.connect(this.send!);
      this.session = { dry, send };
    }
    return this.session;
  }
  cancelPending() {
    if (!this.ctx || !this.session) return;
    const t = this.ctx.currentTime;
    const { dry, send } = this.session;
    for (const g of [dry, send]) {
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(0, t, 0.02);
    }
    setTimeout(() => (dry.disconnect(), send.disconnect()), 300);
    this.session = null;
  }

  private out(node: AudioNode, wet = 1, lasting = false) {
    const { dry, send } = lasting ? { dry: this.dry!, send: this.send! } : this.sessionNodes();
    node.connect(dry);
    if (wet > 0) {
      const g = this.ctx!.createGain();
      g.gain.value = wet;
      node.connect(g).connect(send);
    }
  }

  /** The mix as a MediaStream, for recording a sweep to video. */
  stream(): MediaStream {
    const ctx = this.ensure();
    if (!this.recDest) {
      this.recDest = ctx.createMediaStreamDestination();
      this.comp!.connect(this.recDest);
    }
    return this.recDest.stream;
  }

  /** Mute everything, drone included, with a short ramp. */
  setMuted(muted: boolean) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(muted ? 0.0001 : this.level, t, 0.08);
  }

  startDrone() {
    const ctx = this.ensure();
    if (this.drone) return;
    const t = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 160;
    filter.Q.value = 0.9;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 2.5);
    const base = ROOT_HZ / 2;
    const oscs: OscillatorNode[] = [];
    const parts: [OscillatorType, number, number][] = [
      ["sawtooth", base, -7],
      ["sawtooth", base, 6],
      ["sawtooth", base * 1.5, 3], // the fifth, quietly, for body
      ["sine", base / 2, 0],
    ];
    parts.forEach(([type, f, cents], i) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = cents;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.25 : i === 3 ? 0.7 : 0.5;
      o.connect(g).connect(filter);
      o.start(t);
      oscs.push(o);
    });
    filter.connect(gain);
    this.out(gain, 0.6, true);
    this.drone = { oscs, filter, gain };
  }

  /** 0 = the 1960s, 1 = the crowd. */
  setDroneIntensity(x: number) {
    if (!this.drone || !this.ctx) return;
    const t = this.ctx.currentTime;
    const k = Math.max(0, Math.min(1, x));
    this.drone.filter.frequency.setTargetAtTime(160 + k * k * 1400, t, 0.4);
    this.drone.gain.gain.setTargetAtTime(0.04 + k * 0.17, t, 0.4);
  }

  /** Silence everything at once and let the context go: the page is leaving, or hidden. */
  dispose() {
    const ctx = this.ctx;
    if (!ctx) return;
    this.drone = null;
    this.session = null;
    this.ctx = this.master = this.dry = this.send = this.comp = null;
    this.recDest = null;
    void ctx.close().catch(() => {});
  }

  stopDrone() {
    if (!this.drone || !this.ctx) return;
    const { oscs, gain } = this.drone;
    const t = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setTargetAtTime(0.0001, t, 0.5);
    for (const o of oscs) o.stop(t + 2.5);
    this.drone = null;
  }

  /** A pitched note for a row with a number. Louder for reach, longer for books. */
  note(p: number, scale: ScaleName, opts: { gain?: number; dur?: number; glideTo?: number } = {}) {
    const ctx = this.ensure();
    const t = ctx.currentTime + 0.01;
    const dur = opts.dur ?? 1.4;
    const g = (opts.gain ?? 1) * 0.2 * (1.5 - 0.5 * (p / 100)); // low notes a little louder, as they sound quieter
    const f = hzFor(p, scale);
    const high = p / 100; // brighter and edgier as the number climbs

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(f, t);
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(f, t);
    osc2.detune.value = 5 + high * 9;
    if (opts.glideTo != null) {
      const f2 = hzFor(opts.glideTo, scale);
      osc.frequency.exponentialRampToValueAtTime(f2, t + dur * 0.6);
      osc2.frequency.exponentialRampToValueAtTime(f2, t + dur * 0.6);
    }
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(f / 2, t);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 2 + high * 6;
    // the low notes (the small chances) keep enough overtones to be heard on laptop and phone speakers,
    // which give almost nothing below 200 Hz
    const peak = Math.min(9000, Math.max(1500, f * (2.5 + high * 6)));
    lp.frequency.setValueAtTime(Math.max(400, f * 0.8), t);
    lp.frequency.exponentialRampToValueAtTime(peak, t + 0.04 + (1 - high) * 0.08);
    lp.frequency.exponentialRampToValueAtTime(Math.max(500, f * 1.1), t + dur);

    const env = ctx.createGain();
    const attack = dur > 1.6 ? 0.18 : 0.012;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(g, t + attack);
    env.gain.exponentialRampToValueAtTime(g * 0.45, t + dur * 0.4);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    const mix = ctx.createGain();
    mix.gain.value = 0.45;
    const subG = ctx.createGain();
    subG.gain.value = 0.5;
    osc.connect(mix);
    osc2.connect(mix);
    mix.connect(lp).connect(env);
    sub.connect(subG).connect(env);
    this.out(env, 0.9 + high * 0.4);
    for (const o of [osc, osc2, sub]) {
      o.start(t);
      o.stop(t + dur + 0.05);
    }

    if (p >= 90) {
      // the thump: a pitched-down sine, the floor giving way
      const th = ctx.createOscillator();
      th.type = "sine";
      th.frequency.setValueAtTime(110, t);
      th.frequency.exponentialRampToValueAtTime(34, t + 0.35);
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(0.0001, t);
      tg.gain.exponentialRampToValueAtTime(0.5 * (opts.gain ?? 1), t + 0.01);
      tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      th.connect(tg);
      this.out(tg, 0.5);
      th.start(t);
      th.stop(t + 0.6);
    }
  }

  /** How far ahead a sound must be scheduled to be heard when the picture shows it. */
  latency(): number {
    const ctx = this.ensure();
    return (ctx.baseLatency || 0) + ((ctx as AudioContext & { outputLatency?: number }).outputLatency || 0);
  }

  /**
   * A key moment. Three sounds to choose between, same call each time so it
   * reads as a marker and never as a note:
   *   "bell"  the struck bell, inharmonic partials, long ring
   *   "thud"  a low pitched-down strike, the floor giving way, dry and short
   *   "swell" the drone opens for a moment, no new pitch, like a held breath
   */
  /** `rise`: for the riser, seconds from now to the crest, so the hit lands on the moment however late it was started. */
  moment(kind: MomentSound = "toll", gain = 1, rise = 1.6) {
    const ctx = this.ensure();
    const t = ctx.currentTime + 0.005;
    if (kind === "toll") {
      // a funeral bell: the root two octaves down, inharmonic partials, a slow four-second decay
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.5 * gain, t + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);
      for (const [f, g] of [
        [ROOT_HZ / 2, 1],
        [ROOT_HZ / 2 * 2.0, 0.5],
        [ROOT_HZ / 2 * 2.98, 0.3],
        [ROOT_HZ / 2 * 4.2, 0.18],
        [ROOT_HZ / 2 * 5.9, 0.08],
      ] as const) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        const og = ctx.createGain();
        og.gain.value = g;
        o.connect(og).connect(env);
        o.start(t);
        o.stop(t + 4.3);
      }
      this.out(env, 1);
      return;
    }
    if (kind === "cluster") {
      // a stab: root, flat second and tritone together, sawtooth through a closing filter, a second long
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.16 * gain, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.Q.value = 3;
      lp.frequency.setValueAtTime(2400, t);
      lp.frequency.exponentialRampToValueAtTime(140, t + 1.2);
      for (const semi of [0, 1, 6, 12, 13]) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = ROOT_HZ * Math.pow(2, semi / 12);
        o.detune.value = (Math.random() - 0.5) * 12;
        const og = ctx.createGain();
        og.gain.value = semi >= 12 ? 0.35 : 0.6;
        o.connect(og).connect(lp);
        o.start(t);
        o.stop(t + 1.35);
      }
      lp.connect(env);
      this.out(env, 0.7);
      return;
    }
    if (kind === "riser") {
      // a reversed-cymbal swell: filtered noise rising for 1.6 s to crest on the moment, then cut
      const R = Math.max(0.12, rise);
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 0.8;
      bp.frequency.setValueAtTime(300, t);
      bp.frequency.exponentialRampToValueAtTime(6000, t + R);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.35 * gain, t + R);
      env.gain.exponentialRampToValueAtTime(0.0001, t + R + 0.15);
      src.connect(bp).connect(env);
      this.out(env, 0.5);
      src.start(t);
      src.stop(t + R + 0.2);
      // and the floor drops under the crest
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(120, t + R);
      o.frequency.exponentialRampToValueAtTime(35, t + R + 0.4);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + R);
      g.gain.exponentialRampToValueAtTime(0.6 * gain, t + R + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + R + 0.8);
      o.connect(g);
      this.out(g, 0.2);
      o.start(t + R);
      o.stop(t + R + 0.85);
      return;
    }
    if (kind === "heartbeat") {
      // lub-dub: two low thumps 0.22 s apart
      for (const [dt, gg] of [
        [0, 1],
        [0.22, 0.7],
      ] as const) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(90, t + dt);
        o.frequency.exponentialRampToValueAtTime(38, t + dt + 0.18);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t + dt);
        g.gain.exponentialRampToValueAtTime(0.75 * gain * gg, t + dt + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.32);
        o.connect(g);
        this.out(g, 0.15);
        o.start(t + dt);
        o.stop(t + dt + 0.35);
      }
      return;
    }
    if (kind === "static") {
      // a burst of broken radio: gated noise, five stutters, falling filter
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 2.5;
      bp.frequency.setValueAtTime(3200, t);
      bp.frequency.exponentialRampToValueAtTime(700, t + 0.6);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      for (let i = 0; i < 5; i++) {
        const on = t + i * 0.12;
        env.gain.setValueAtTime(0.3 * gain, on);
        env.gain.exponentialRampToValueAtTime(0.0001, on + 0.07);
      }
      src.connect(bp).connect(env);
      this.out(env, 0.4);
      src.start(t);
      src.stop(t + 0.7);
      return;
    }
    if (kind === "bell") {
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.22 * gain, t + 0.006);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      for (const [f, g] of [
        [ROOT_HZ * 4, 1],
        [ROOT_HZ * 4 * 2.76, 0.35],
        [ROOT_HZ * 4 * 5.4, 0.12],
      ] as const) {
        const o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        const og = ctx.createGain();
        og.gain.value = g;
        o.connect(og).connect(env);
        o.start(t);
        o.stop(t + 2.3);
      }
      this.out(env, 0.8);
      return;
    }
    if (kind === "thud") {
      // a drum: sine dropping from 150 to 40 Hz in a third of a second, plus a short noise snap on top
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.3);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.7 * gain, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(g);
      this.out(g, 0.2);
      o.start(t);
      o.stop(t + 0.75);
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 900;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.25 * gain, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      src.connect(lp).connect(ng);
      this.out(ng, 0.3);
      src.start(t);
      src.stop(t + 0.08);
      return;
    }
    // swell: the drone opens and lifts for a second and a half, then settles back
    if (this.drone) {
      const f = this.drone.filter.frequency, g = this.drone.gain.gain;
      const f0 = f.value, g0 = g.value;
      f.cancelScheduledValues(t);
      g.cancelScheduledValues(t);
      f.setTargetAtTime(Math.min(4000, f0 * 3 + 600), t, 0.12);
      g.setTargetAtTime(Math.min(0.5, g0 * 2.2 + 0.06), t, 0.12);
      f.setTargetAtTime(f0, t + 0.9, 0.5);
      g.setTargetAtTime(g0, t + 0.9, 0.5);
    }
  }

  /** A geiger click for the volume layer. `bright` 0..1 opens the filter and lengthens the click as the month fills. */
  tick(gain = 0.12, delay = 0, bright = 0.5) {
    if (gain <= 0) return;
    const ctx = this.ensure();
    const t = ctx.currentTime + 0.005 + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.7 + bright * 0.5 + Math.random() * 0.4;
    const hp = ctx.createBiquadFilter();
    hp.type = "bandpass";
    hp.Q.value = 1.2 - bright * 0.6;
    hp.frequency.value = 1400 + bright * 4200 + Math.random() * 900;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain * 1.6, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.012 + bright * 0.02);
    src.connect(hp).connect(env);
    this.out(env, 0.25);
    src.start(t);
    src.stop(t + 0.05);
  }
}
