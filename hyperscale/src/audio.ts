// Synthesised data-center noise, so you can actually hear the pollution the
// build creates. Three layers, mixed and shaped by an "intensity" (0..1) driven
// by the fence-line noise level: a broadband fan/chiller roar (filtered pink
// noise), a low transformer hum, and a high coil whine that only bites when the
// site gets very loud. As intensity rises the mix gets louder and brighter.
// Everything is created lazily on first enable (needs a user gesture).

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function makePinkNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  // Paul Kellet's pink-noise approximation
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buf;
}

export class NoiseAudio {
  enabled = false;
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private fanGain!: GainNode;
  private humGain!: GainNode;
  private whineGain!: GainNode;
  private lp!: BiquadFilterNode;
  private intensity = 0;

  private init() {
    const Ctor: typeof AudioContext =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();
    this.ctx = ctx;

    const comp = ctx.createDynamicsCompressor(); // keep it from ever getting harsh/clipping
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(comp);

    // fan / chiller roar — looping pink noise through a low-pass we open up as it gets louder
    const src = ctx.createBufferSource();
    src.buffer = makePinkNoiseBuffer(ctx, 2.5);
    src.loop = true;
    this.lp = ctx.createBiquadFilter();
    this.lp.type = "lowpass";
    this.lp.frequency.value = 420;
    this.lp.Q.value = 0.5;
    this.fanGain = ctx.createGain();
    this.fanGain.gain.value = 0;
    src.connect(this.lp); this.lp.connect(this.fanGain); this.fanGain.connect(this.master);
    src.start();

    // transformer hum — a low sawtooth, softened
    const hum = ctx.createOscillator();
    hum.type = "sawtooth";
    hum.frequency.value = 100;
    const humLp = ctx.createBiquadFilter();
    humLp.type = "lowpass";
    humLp.frequency.value = 240;
    this.humGain = ctx.createGain();
    this.humGain.gain.value = 0;
    hum.connect(humLp); humLp.connect(this.humGain); this.humGain.connect(this.master);
    hum.start();

    // coil / high-fan whine — only audible at high intensity
    const whine = ctx.createOscillator();
    whine.type = "triangle";
    whine.frequency.value = 2550;
    this.whineGain = ctx.createGain();
    this.whineGain.gain.value = 0;
    whine.connect(this.whineGain); this.whineGain.connect(this.master);
    whine.start();
  }

  /** returns the new enabled state */
  toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) {
      if (!this.ctx) this.init();
      void this.ctx!.resume();
    }
    this.apply();
    return this.enabled;
  }

  setIntensity(x: number) {
    this.intensity = clamp01(x);
    if (this.enabled) this.apply();
  }

  private apply() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const tc = 0.5; // smooth ramps
    const x = this.enabled ? this.intensity : 0;
    // master fades in with the enable and swells with intensity
    this.master.gain.setTargetAtTime(this.enabled ? 0.55 : 0, t, tc);
    this.fanGain.gain.setTargetAtTime(0.03 + x * 0.42, t, tc);
    this.humGain.gain.setTargetAtTime(0.03 + x * 0.10, t, tc);
    this.whineGain.gain.setTargetAtTime(Math.max(0, x - 0.55) * 0.05, t, tc);
    this.lp.frequency.setTargetAtTime(380 + x * x * 4200, t, tc); // brighter/harsher when loud
  }
}
