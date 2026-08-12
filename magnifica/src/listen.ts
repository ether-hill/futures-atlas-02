/**
 * Read-aloud player + the bottom dock (playhead timeline, language, sound board).
 *
 * Speech comes from the host route /api/magnifica/tts, which returns audio
 * together with ElevenLabs character-level alignment. Three things hang off
 * that alignment:
 *
 *   - a playhead timeline with a node per section, weighted by text length so
 *     the fill reflects real reading time rather than section count;
 *   - the page scrolling itself to each section as that section begins;
 *   - a read-along highlight that follows the narrator word by word.
 *
 * The highlight is only possible when the words on the page are the words
 * being spoken, which is to say in English. In Dutch the audio is a
 * translation, so word mapping is meaningless and the reader falls back to
 * marking the whole passage as the one being read. Both languages scroll and
 * drive the timeline identically.
 *
 * When the route isn't configured the player falls back to the device's own
 * speech synthesis, labelled as such, with no alignment and so no highlight.
 */

import { Soundscape, LAYER_LABELS, type LayerName } from "./soundscape";
import type { Scene } from "./scenes";

export interface Part {
  label: string;
  text: string;
  /** id of the page section this part narrates; scrolled to when it starts. */
  anchor?: string;
  /** selector, within the anchor, of the element to highlight word by word. */
  highlight?: string;
}

/** One narrator for the whole project. */
const VOICE_LABEL = "Charlotte · calm";

const LANGS = [
  { key: "en", label: "English", bcp: "en-GB" },
  { key: "nl", label: "Nederlands", bcp: "nl-NL" },
];

interface Alignment {
  chars: string[];
  starts: number[];
  ends: number[];
}
interface Clip {
  url: string;
  spoken: string;
  alignment: Alignment | null;
}
/** Start/end seconds per spoken word. */
type WordTimes = { start: number; end: number }[];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Collapse alignment characters into per-word spans. */
function wordsFromAlignment(a: Alignment): WordTimes {
  const out: WordTimes = [];
  let start: number | null = null;
  let end = 0;
  for (let i = 0; i < a.chars.length; i++) {
    const ch = a.chars[i];
    if (/\s/.test(ch)) {
      if (start !== null) {
        out.push({ start, end });
        start = null;
      }
      continue;
    }
    if (start === null) start = a.starts[i];
    end = a.ends[i];
  }
  if (start !== null) out.push({ start, end });
  return out;
}

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/**
 * Wrap each word of an element's text in a span so it can be lit individually.
 * Idempotent, and it leaves the text itself untouched — only markup is added.
 */
function prepareWords(el: HTMLElement): HTMLElement[] {
  if (el.dataset.wordsReady === "1") {
    return Array.from(el.querySelectorAll<HTMLElement>("[data-w]"));
  }
  // Rebuilding the contents would destroy any markup inside — links in the
  // honesty gate, for one. Rich elements keep the passage-level mark only.
  if (el.children.length > 0) return [];
  const text = el.textContent ?? "";
  const parts = text.split(/(\s+)/);
  el.textContent = "";
  const spans: HTMLElement[] = [];
  for (const p of parts) {
    if (!p) continue;
    if (/^\s+$/.test(p)) {
      el.appendChild(document.createTextNode(p));
    } else {
      const s = document.createElement("span");
      s.dataset.w = String(spans.length);
      s.textContent = p;
      el.appendChild(s);
      spans.push(s);
    }
  }
  el.dataset.wordsReady = "1";
  return spans;
}

class Player {
  private audio = new Audio();
  private queue: Part[] = [];
  private cache = new Map<string, Clip>();
  private fallback = false;
  private raf = 0;
  private words: HTMLElement[] = [];
  private times: WordTimes = [];
  private lastWord = -1;
  private target: HTMLElement | null = null;

  i = 0;
  playing = false;
  lang = "en";

  /** Fraction 0–1 of the whole script, weighted by part length. */
  private weights: number[] = [];
  private totalWeight = 1;

  onstate: (s: { playing: boolean; label: string; note?: string; index: number }) => void = () => {};
  onprogress: (fraction: number) => void = () => {};

  constructor() {
    this.audio.addEventListener("ended", () => this.advance());
  }

  load(parts: Part[]) {
    this.stop();
    this.queue = parts;
    this.i = 0;
    this.weights = parts.map((p) => Math.max(p.text.length, 1));
    this.totalWeight = this.weights.reduce((a, b) => a + b, 0) || 1;
  }

  /** Progress through the whole script, for the timeline fill. */
  private fraction(): number {
    const done = this.weights.slice(0, this.i).reduce((a, b) => a + b, 0);
    const d = this.audio.duration;
    const within = d && isFinite(d) ? this.audio.currentTime / d : 0;
    return Math.min(1, (done + within * (this.weights[this.i] ?? 0)) / this.totalWeight);
  }

  /** Node offsets for the timeline, same weighting as the fill. */
  offsets(): number[] {
    const out: number[] = [];
    let acc = 0;
    for (const w of this.weights) {
      out.push(acc / this.totalWeight);
      acc += w;
    }
    return out;
  }

  async toggle() {
    if (this.playing) {
      this.playing = false;
      this.audio.pause();
      speechSynthesis.cancel();
      this.stopTracking();
      this.emit();
      return;
    }
    this.playing = true;
    this.emit("Preparing…");
    await this.playCurrent();
  }

  /** Jump to a part from the timeline. */
  async goTo(i: number) {
    if (i < 0 || i >= this.queue.length) return;
    this.clearHighlight();
    this.audio.pause();
    speechSynthesis.cancel();
    this.i = i;
    this.playing = true;
    this.emit("Preparing…");
    await this.playCurrent();
  }

  stop() {
    this.playing = false;
    this.audio.pause();
    this.audio.removeAttribute("src");
    speechSynthesis.cancel();
    this.stopTracking();
    this.clearHighlight();
    for (const c of this.cache.values()) URL.revokeObjectURL(c.url);
    this.cache.clear();
    this.i = 0;
    this.onprogress(0);
  }

  private emit(note?: string) {
    const part = this.queue[this.i];
    this.onstate({
      playing: this.playing,
      label: part ? `${this.i + 1}/${this.queue.length} · ${part.label}` : "—",
      note,
      index: this.i,
    });
  }

  private async advance() {
    if (!this.playing) return;
    this.clearHighlight();
    this.i++;
    if (this.i >= this.queue.length) {
      this.playing = false;
      this.i = 0;
      this.stopTracking();
      this.onprogress(1);
      this.emit();
      return;
    }
    await this.playCurrent();
  }

  private key(i: number) {
    return `${i}:${this.lang}`;
  }

  private async fetchPart(i: number): Promise<Clip | null> {
    const k = this.key(i);
    const hit = this.cache.get(k);
    if (hit) return hit;
    const res = await fetch("/api/magnifica/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: this.queue[i].text, lang: this.lang }),
    });
    if (!res.ok) {
      let code = "";
      try {
        code = (await res.json()).code;
      } catch {
        /* not json */
      }
      if (code === "not_configured" || code === "no_translation" || code === "bad_key") return null;
      throw new Error(code || `http ${res.status}`);
    }
    const data = await res.json();
    const bytes = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0));
    const clip: Clip = {
      url: URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" })),
      spoken: data.spoken ?? this.queue[i].text,
      alignment: data.alignment ?? null,
    };
    this.cache.set(k, clip);
    return clip;
  }

  /** Bring the section this part narrates into view. */
  private focusSection(part: Part) {
    if (!part.anchor) return;
    document.getElementById(part.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /**
   * Arm the read-along. Word mapping needs the page text and the spoken text to
   * be the same words — true in English, false for a translation — so it is
   * checked rather than assumed, and the passage-level mark is used otherwise.
   */
  private armHighlight(part: Part, clip: Clip) {
    this.clearHighlight();
    if (!part.anchor || !part.highlight) return;
    const section = document.getElementById(part.anchor);
    const el = section?.querySelector<HTMLElement>(part.highlight);
    if (!el) return;

    this.target = el;
    el.classList.add("is-reading");

    if (!clip.alignment) return;
    const times = wordsFromAlignment(clip.alignment);
    const spans = prepareWords(el);
    // Only follow word-by-word when the counts line up; a translation will not.
    if (times.length !== spans.length || wordCount(clip.spoken) !== spans.length) return;
    this.words = spans;
    this.times = times;
  }

  private clearHighlight() {
    this.target?.classList.remove("is-reading");
    for (const w of this.words) w.classList.remove("is-now", "is-read");
    this.words = [];
    this.times = [];
    this.lastWord = -1;
    this.target = null;
  }

  private startTracking() {
    cancelAnimationFrame(this.raf);
    const tick = () => {
      this.onprogress(this.fraction());
      if (this.times.length) {
        const t = this.audio.currentTime;
        let idx = this.lastWord;
        // times are ordered; walk forward from where we were
        while (idx + 1 < this.times.length && this.times[idx + 1].start <= t) idx++;
        while (idx >= 0 && this.times[idx].start > t) idx--;
        if (idx !== this.lastWord) {
          if (this.lastWord >= 0) {
            this.words[this.lastWord]?.classList.remove("is-now");
            this.words[this.lastWord]?.classList.add("is-read");
          }
          if (idx >= 0) {
            this.words[idx]?.classList.add("is-now");
            for (let k = 0; k < idx; k++) this.words[k]?.classList.add("is-read");
          }
          this.lastWord = idx;
        }
      }
      if (this.playing) this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private stopTracking() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private async playCurrent() {
    const part = this.queue[this.i];
    if (!part) return;
    this.emit(this.fallback ? "device voice" : undefined);
    this.focusSection(part);

    if (!this.fallback) {
      try {
        const clip = await this.fetchPart(this.i);
        if (clip) {
          if (!this.playing) return;
          this.audio.src = clip.url;
          await this.audio.play();
          this.armHighlight(part, clip);
          this.startTracking();
          this.emit();
          if (this.i + 1 < this.queue.length) this.fetchPart(this.i + 1).catch(() => {});
          return;
        }
        this.fallback = true; // route not configured → device voices from here on
      } catch {
        this.emit("voice unavailable, using device voice");
        this.fallback = true;
      }
    }
    this.speakFallback(part);
  }

  private speakFallback(part: Part) {
    if (!("speechSynthesis" in window)) {
      this.playing = false;
      this.emit("no speech available on this device");
      return;
    }
    const u = new SpeechSynthesisUtterance(part.text);
    const bcp = LANGS.find((l) => l.key === this.lang)?.bcp || "en-GB";
    u.lang = bcp;
    const v = speechSynthesis.getVoices().find((v) => v.lang.startsWith(bcp.slice(0, 2)));
    if (v) u.voice = v;
    u.rate = 0.95;
    u.onend = () => this.advance();
    // No alignment from the device voice, so mark the passage without words.
    if (part.anchor && part.highlight) {
      const el = document.getElementById(part.anchor)?.querySelector<HTMLElement>(part.highlight);
      if (el) {
        this.target = el;
        el.classList.add("is-reading");
      }
    }
    this.emit("device voice");
    speechSynthesis.speak(u);
  }
}

const player = new Player();
const scape = new Soundscape();

/** Render the listen dock into `root` for the given script + scene. */
export function mountDock(root: HTMLElement, parts: Part[], scene: Scene) {
  player.load(parts);
  (Object.keys(LAYER_LABELS) as LayerName[]).forEach((n) => scape.setLevel(n, scene.sound[n] ?? 0));

  const offsets = player.offsets();
  const nodes = parts
    .map(
      (p, i) => `
      <button type="button" class="dock-node" data-i="${i}" style="left:${(offsets[i] * 100).toFixed(3)}%"
        title="${esc(p.label)}" aria-label="Play: ${esc(p.label)}">
        <i></i><span>${esc(p.label)}</span>
      </button>`
    )
    .join("");

  const dock = document.createElement("div");
  dock.className = "dock";
  dock.innerHTML = `
    <div class="dock-timeline">
      <div class="dock-track"><div class="dock-fill"></div></div>
      ${nodes}
    </div>
    <div class="dock-row">
      <button type="button" class="dock-play" aria-label="Listen">▶&nbsp; Listen</button>
      <span class="dock-part">${parts.length} parts</span>
      <span class="dock-note"></span>
      <span class="dock-spacer"></span>
      <span class="dock-voice-fixed">${esc(VOICE_LABEL)}</span>
      <label class="dock-ctl"><span>Lang</span>
        <select class="dock-lang">${LANGS.map((l) => `<option value="${l.key}">${esc(l.label)}</option>`).join("")}</select>
      </label>
      <button type="button" class="dock-sound">Soundscape</button>
    </div>
    <div class="dock-panel" hidden>
      <div class="dock-panel-head">
        <span class="lbl">Sound board</span>
        <button type="button" class="dock-amb">ambience: off</button>
      </div>
      ${(Object.keys(LAYER_LABELS) as LayerName[])
        .map(
          (n) => `
        <label class="dock-slider"><span>${LAYER_LABELS[n]}</span>
          <input type="range" min="0" max="100" value="${Math.round((scene.sound[n] ?? 0) * 100)}" data-layer="${n}" />
        </label>`,
        )
        .join("")}
      <p class="dock-hint">Layered ambience loops, mixed in the browser over the produced beds.</p>
    </div>`;
  root.appendChild(dock);

  const playBtn = dock.querySelector<HTMLButtonElement>(".dock-play")!;
  const partEl = dock.querySelector<HTMLSpanElement>(".dock-part")!;
  const noteEl = dock.querySelector<HTMLSpanElement>(".dock-note")!;
  const panel = dock.querySelector<HTMLDivElement>(".dock-panel")!;
  const ambBtn = dock.querySelector<HTMLButtonElement>(".dock-amb")!;
  const fill = dock.querySelector<HTMLDivElement>(".dock-fill")!;
  const nodeEls = Array.from(dock.querySelectorAll<HTMLButtonElement>(".dock-node"));

  player.onstate = (s) => {
    playBtn.innerHTML = s.playing ? "❚❚&nbsp; Pause" : "▶&nbsp; Listen";
    partEl.textContent = s.label === "—" ? `${parts.length} parts` : s.label;
    noteEl.textContent = s.note || "";
    nodeEls.forEach((n, i) => {
      n.classList.toggle("on", i === s.index && s.playing);
      n.classList.toggle("done", i < s.index);
    });
  };
  player.onprogress = (f) => {
    fill.style.transform = `scaleX(${f})`;
  };

  playBtn.addEventListener("click", () => player.toggle());
  nodeEls.forEach((n) =>
    n.addEventListener("click", () => player.goTo(Number(n.dataset.i))),
  );
  dock.querySelector<HTMLSelectElement>(".dock-lang")!.addEventListener("change", (e) => {
    player.lang = (e.target as HTMLSelectElement).value;
  });
  dock.querySelector<HTMLButtonElement>(".dock-sound")!.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });
  ambBtn.addEventListener("click", () => {
    const on = scape.toggle();
    ambBtn.textContent = `ambience: ${on ? "on" : "off"}`;
    ambBtn.classList.toggle("on", on);
  });
  panel.querySelectorAll<HTMLInputElement>("input[data-layer]").forEach((input) => {
    input.addEventListener("input", () => {
      scape.setLevel(input.dataset.layer as LayerName, Number(input.value) / 100);
    });
  });
}

/** Tear down on route change: stop speech, keep ambience running across pages. */
export function unmountDock() {
  player.stop();
  document.querySelectorAll(".dock").forEach((d) => d.remove());
}
