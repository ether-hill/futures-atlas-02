"use client";

/**
 * A theremin, built here. No iframe, no samples, no library.
 *
 * ── What it is doing ────────────────────────────────────────────────────────
 *
 * A real theremin is heterodyne: two oscillators run above hearing, a hand
 * near an antenna shifts one of them, and what reaches the speaker is the
 * DIFFERENCE between the two. A browser has no antenna and cannot sense a hand
 * in the air, so this does not pretend to. It keeps the part that is actually
 * playable — two continuous axes, no keys, no discrete steps — and drives one
 * audible oscillator directly from them. X is pitch, Y is volume, exactly as
 * the two antennas are.
 *
 * The signal path: oscillator → glide on the frequency parameter → lowpass
 * that opens as you play louder → gain → convolution reverb on a send →
 * compressor → out. The impulse response is generated, not loaded: exponential
 * decay over noise, which is a plausible small room and costs no download.
 *
 * ── The three things that matter in the audio ───────────────────────────────
 *
 * 1. **Nothing starts until you press power.** An AudioContext created on page
 *    load is suspended by the browser anyway, and a page that quietly holds an
 *    audio graph open is rude. It is built on the first press and torn down —
 *    context closed, not just paused — when you switch off or leave.
 * 2. **Every parameter change is ramped, never set.** A bare `.value =` on a
 *    running oscillator is a step discontinuity, which is a click. Pitch uses
 *    an exponential ramp (frequency is perceived logarithmically), gain a
 *    linear one, and both go through `setTargetAtTime` so a fast sweep glides
 *    instead of zippering.
 * 3. **Volume floors at silence rather than zero.** `exponentialRampToValue`
 *    cannot reach 0, so the gain ramp is linear and the oscillator keeps
 *    running while you are not touching the pad — starting and stopping an
 *    oscillator per gesture is what makes cheap web synths pop.
 *
 * Scale snap is the concession to it being hard. A real theremin is continuous
 * and every pitch between the notes is available, most of them wrong; snapping
 * X to a scale makes it playable, and turning snap off gives the problem back.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/** Semitone offsets from the root. Chromatic is the instrument's own default. */
const SCALES: Record<string, number[]> = {
  Chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  Pentatonic: [0, 3, 5, 7, 10],
  Whole: [0, 2, 4, 6, 8, 10],
};

const WAVES: OscillatorType[] = ["sine", "triangle", "sawtooth", "square"];
const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

/** A2. Low enough to have body, high enough that two octaves stay useful. */
const ROOT_HZ = 110;

const hzToNote = (hz: number) => {
  const semis = Math.round(12 * Math.log2(hz / 440));
  const name = NOTE_NAMES[((semis + 9) % 12 + 12) % 12];
  return `${name}${Math.floor((semis + 9) / 12) + 4}`;
};

interface Nodes {
  ctx: AudioContext;
  osc: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  wet: GainNode;
}

export function Theremin() {
  const [on, setOn] = useState(false);
  const [wave, setWave] = useState<OscillatorType>("sine");
  const [scale, setScale] = useState<keyof typeof SCALES>("Chromatic");
  const [octaves, setOctaves] = useState(2);
  const [glide, setGlide] = useState(0.08);
  const [reverb, setReverb] = useState(0.3);
  const [readout, setReadout] = useState<{ hz: number; vol: number } | null>(null);

  const nodes = useRef<Nodes | null>(null);
  const pad = useRef<HTMLDivElement>(null);

  /** Tear the graph down completely — closed, not suspended. */
  const stop = useCallback(() => {
    const n = nodes.current;
    if (!n) return;
    nodes.current = null;
    try {
      n.gain.gain.setTargetAtTime(0, n.ctx.currentTime, 0.02);
      n.osc.stop(n.ctx.currentTime + 0.2);
      window.setTimeout(() => void n.ctx.close().catch(() => {}), 300);
    } catch {
      /* already gone */
    }
    setReadout(null);
  }, []);

  const start = useCallback(() => {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor();

    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.value = ROOT_HZ;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    // A generated impulse: exponentially decaying noise. A plausible small
    // room, and nothing to download.
    const seconds = 2.2;
    const ir = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = ir.getChannelData(c);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.6);
      }
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;

    const wet = ctx.createGain();
    wet.gain.value = reverb;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;

    osc.connect(filter).connect(gain);
    gain.connect(comp);
    gain.connect(wet).connect(conv).connect(comp);
    comp.connect(ctx.destination);
    osc.start();

    nodes.current = { ctx, osc, filter, gain, wet };
  }, [wave, reverb]);

  // Power. Also the only place a context is ever created.
  useEffect(() => {
    if (on) start();
    else stop();
    return stop;
    // start/stop are stable enough for this: re-running on every slider change
    // would rebuild the graph mid-note, which is the one thing to avoid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  // Live parameter changes go to the running graph rather than rebuilding it.
  useEffect(() => {
    const n = nodes.current;
    if (n) n.osc.type = wave;
  }, [wave]);
  useEffect(() => {
    const n = nodes.current;
    if (n) n.wet.gain.setTargetAtTime(reverb, n.ctx.currentTime, 0.05);
  }, [reverb]);

  const play = (e: React.PointerEvent) => {
    const n = nodes.current;
    const el = pad.current;
    if (!n || !el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    const y = 1 - Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);

    const steps = SCALES[scale];
    const semisSpan = octaves * 12;
    let semis = x * semisSpan;
    if (scale !== "Chromatic") {
      // snap to the nearest degree of the scale, in any octave it reaches
      const oct = Math.floor(semis / 12);
      const within = semis - oct * 12;
      const nearest = steps.reduce((a, b) => (Math.abs(b - within) < Math.abs(a - within) ? b : a));
      semis = oct * 12 + nearest;
    }
    const hz = ROOT_HZ * Math.pow(2, semis / 12);
    const t = n.ctx.currentTime;

    // Exponential for pitch (frequency is heard logarithmically), linear for
    // gain (an exponential ramp cannot reach silence), both smoothed so a fast
    // sweep glides rather than zippers.
    n.osc.frequency.setTargetAtTime(hz, t, Math.max(glide, 0.005));
    n.gain.gain.setTargetAtTime(y * 0.32, t, 0.03);
    // The filter opens as you play louder — quiet notes sit back, loud ones
    // arrive. It is the one thing that makes a bare oscillator sound played.
    n.filter.frequency.setTargetAtTime(500 + y * 4200, t, 0.05);

    setReadout({ hz, vol: y });
  };

  const release = () => {
    const n = nodes.current;
    if (!n) return;
    n.gain.gain.setTargetAtTime(0, n.ctx.currentTime, 0.08);
    setReadout(null);
  };

  return (
    <div className="mt-[clamp(28px,4vw,52px)]">
      {/* transport */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
        <button
          type="button"
          onClick={() => setOn((v) => !v)}
          aria-pressed={on}
          className={`inline-flex items-center gap-2.5 rounded-full border px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
            on ? "border-accent text-accent-deep" : "border-ink/25 text-ink/70 hover:border-ink/50"
          }`}
        >
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ background: on ? "var(--accent)" : "color-mix(in oklab, var(--c-ink) 35%, transparent)" }}
          />
          {on ? "Power on" : "Power"}
        </button>

        <Control label="Wave">
          <div className="flex">
            {WAVES.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWave(w)}
                aria-pressed={wave === w}
                className={`border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
                  wave === w
                    ? "border-accent bg-accent/10 text-accent-deep"
                    : "border-ink/20 text-ink/55 hover:text-ink"
                } -ml-px first:ml-0`}
              >
                {w.slice(0, 3)}
              </button>
            ))}
          </div>
        </Control>

        <Control label="Scale">
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value as keyof typeof SCALES)}
            className="border border-ink/20 bg-transparent px-2 py-1.5 font-mono text-[11px] text-ink"
          >
            {Object.keys(SCALES).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Control>

        <Slider label="Range" value={octaves} min={1} max={4} step={1} onChange={setOctaves} suffix=" oct" />
        <Slider label="Glide" value={glide} min={0} max={0.4} step={0.01} onChange={setGlide} suffix="s" />
        <Slider label="Space" value={reverb} min={0} max={0.9} step={0.01} onChange={setReverb} />
      </div>

      {/* the field */}
      <div
        ref={pad}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          play(e);
        }}
        onPointerMove={(e) => e.buttons > 0 && play(e)}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={release}
        role="application"
        aria-label="Playing field. Horizontal is pitch, vertical is volume. Press and drag."
        className="fa-theremin relative mt-6 aspect-[16/7] w-full touch-none select-none overflow-hidden border border-ink/[0.14]"
        style={{ cursor: on ? "crosshair" : "not-allowed" }}
      >
        {/* octave rules, so the axis is legible rather than a mystery */}
        {Array.from({ length: octaves + 1 }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute top-0 h-full w-px bg-ink/[0.12]"
            style={{ left: `${(i / octaves) * 100}%` }}
          />
        ))}

        {readout && (
          <span
            aria-hidden
            className="pointer-events-none absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${(Math.log2(readout.hz / ROOT_HZ) / octaves) * 100}%`,
              top: `${(1 - readout.vol) * 100}%`,
              background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 55%, transparent) 0%, transparent 70%)",
            }}
          />
        )}

        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/40">
          <span>{on ? "Press and drag" : "Power on to play"}</span>
          <span className="tabular-nums text-ink/60">
            {readout ? `${hzToNote(readout.hz)} · ${readout.hz.toFixed(1)} Hz` : "—"}
          </span>
        </span>
      </div>
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">{label}</span>
      {children}
    </label>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="flex items-center gap-2.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">{label}</span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-[92px] accent-[var(--accent)]"
      />
      <span className="w-[46px] font-mono text-[10px] tabular-nums text-ink/55">
        {step < 1 ? value.toFixed(2) : value}
        {suffix}
      </span>
    </label>
  );
}
