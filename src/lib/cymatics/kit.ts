// The parts of the cymatics site's instruments kit that the V2 simulator uses
// (components/projects/instruments/engine/instruments/shared.ts, at 680a369):
// panels, sliders, segmented buttons, the power button, the shared
// AudioContext. Ported as-is; the musical keyboard and the page scaffold are
// left behind. The kit's injected stylesheet is NOT here: its rules live in
// src/app/(atlas)/cymatics-simulator/cymatics.css, on this site's tokens.

let ctx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return ctx;
}

/** The site's mono face (core token), not a literal family: the design-system rule. */
export const MONO = "var(--font-mono), ui-monospace, monospace";

export const reduceMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/** A reusable resumed AudioContext — call from a user gesture before building a graph. */
export async function ensureAudio(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state !== "running") await ctx.resume();
  return ctx;
}

/** Hard-stop all audio (used on power-off): suspends the shared context so every
 *  oscillator and node is frozen — guaranteed silence, not just a gain ramp. */
export function suspendAudio(): void {
  try { const ctx = getAudioContext(); if (ctx.state === "running") ctx.suspend(); } catch { /* no context yet */ }
}

/** A bordered module with a mono caption. Returns the panel and its body element. */
export function panel(caption: string): { el: HTMLElement; body: HTMLElement } {
  const el = document.createElement("div");
  el.className = "inst-panel";
  const cap = document.createElement("div");
  cap.className = "inst-cap";
  cap.textContent = caption;
  const body = document.createElement("div");
  el.append(cap, body);
  return { el, body };
}

/** Responsive grid of controls inside a panel body. */
export function controlGrid(min = 150): HTMLElement {
  const g = document.createElement("div");
  g.style.cssText = `display:grid;grid-template-columns:repeat(auto-fit,minmax(${min}px,1fr));gap:clamp(16px,2.4vw,30px) clamp(20px,3vw,40px)`;
  return g;
}

export interface SliderOpts {
  label: string; min: number; max: number; step?: number; value: number;
  /** Format the live value readout. */
  format?: (v: number) => string;
  onInput: (v: number) => void;
}
export interface Control { el: HTMLElement; set(v: number): void; }

export function slider(o: SliderOpts): Control {
  const fmt = o.format ?? ((v) => String(v));
  const wrap = document.createElement("div");
  wrap.className = "inst-ctl";
  const head = document.createElement("div");
  head.className = "inst-ctl-head";
  const label = document.createElement("span");
  label.className = "inst-ctl-label"; label.textContent = o.label;
  const val = document.createElement("span");
  val.className = "inst-ctl-val"; val.textContent = fmt(o.value);
  head.append(label, val);
  const input = document.createElement("input");
  input.type = "range"; input.className = "inst-range";
  input.min = String(o.min); input.max = String(o.max);
  input.step = String(o.step ?? (o.max - o.min) / 100);
  input.value = String(o.value);
  input.setAttribute("aria-label", o.label);
  input.addEventListener("input", () => {
    const v = parseFloat(input.value);
    val.textContent = fmt(v);
    o.onInput(v);
  });
  wrap.append(head, input);
  return { el: wrap, set(v) { input.value = String(v); val.textContent = fmt(v); } };
}

export interface SegOpts<T extends string> {
  label?: string; options: { value: T; label: string }[]; value: T;
  onChange: (v: T) => void;
}
export function segmented<T extends string>(o: SegOpts<T>): { el: HTMLElement; set(v: T): void } {
  const wrap = document.createElement("div");
  wrap.className = "inst-ctl";
  if (o.label) {
    const head = document.createElement("div");
    head.className = "inst-ctl-head";
    const label = document.createElement("span");
    label.className = "inst-ctl-label"; label.textContent = o.label;
    head.append(label);
    wrap.append(head);
  }
  const seg = document.createElement("div");
  seg.className = "inst-seg";
  seg.setAttribute("role", "group");
  if (o.label) seg.setAttribute("aria-label", o.label);
  let current = o.value;
  const btns = o.options.map((opt) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = opt.label;
    b.setAttribute("aria-pressed", String(opt.value === current));
    b.addEventListener("click", () => { set(opt.value); o.onChange(opt.value); });
    seg.append(b);
    return { b, value: opt.value };
  });
  function set(v: T) {
    current = v;
    for (const { b, value } of btns) b.setAttribute("aria-pressed", String(value === v));
  }
  wrap.append(seg);
  return { el: wrap, set };
}

/** Big POWER control that wires audio start/stop. onToggle resolves before the UI flips. */
export function powerButton(
  onToggle: (on: boolean) => Promise<void> | void,
  labels?: { on: string; off: string },
): { el: HTMLButtonElement; set(on: boolean): void } {
  const onLabel = labels?.on ?? "SOUND ON";
  const offLabel = labels?.off ?? "POWER ON";
  const b = document.createElement("button");
  b.className = "inst-power"; b.type = "button";
  b.dataset.on = "0";
  b.setAttribute("aria-pressed", "false");
  const render = () => {
    const on = b.dataset.on === "1";
    b.innerHTML = `<span class="inst-dot"></span>${on ? onLabel : offLabel}`;
    b.setAttribute("aria-pressed", String(on));
  };
  render();
  // Reflect state set elsewhere (e.g. when interacting auto-powers the instrument)
  // so the label never desyncs from the data-on visual.
  const set = (on: boolean) => { b.dataset.on = on ? "1" : "0"; render(); };
  let busy = false;
  b.addEventListener("click", async () => {
    if (busy) return; busy = true;
    const next = b.dataset.on !== "1";
    try { await onToggle(next); set(next); }
    finally { busy = false; }
  });
  return { el: b, set };
}
