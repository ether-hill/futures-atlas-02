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
  /** Spoken before `text`, as its own short clip: the section's title. Not
   *  folded into `text`, because the read-along maps spoken words onto page
   *  words and the title is not part of the passage it would be mapped to. */
  title?: string;
  text: string;
  /** id of the page section this part narrates; scrolled to when it starts. */
  anchor?: string;
  /** selector, within the anchor, of the element to highlight word by word. */
  highlight?: string;
}

/**
 * One narrator, one language, neither chosen at runtime — the dock is a
 * transport, not a settings panel. The route still accepts a lang, so Dutch
 * remains one field away if it is ever wanted in the UI again.
 */
const LANG_BCP = "en-GB";

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

  // Walk text nodes rather than rebuilding innerHTML, so existing markup
  // survives — links, list items, emphasis. Subtrees marked data-nospeak are
  // skipped: they are on screen but not in the narration (year chips, "Source"
  // links, section ledes), and counting them would desynchronise the marker.
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (node.parentElement?.closest("[data-nospeak]")) return NodeFilter.FILTER_REJECT;
      return /\S/.test(node.nodeValue ?? "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const texts: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n as Text);

  const spans: HTMLElement[] = [];
  for (const t of texts) {
    const frag = document.createDocumentFragment();
    for (const p of (t.nodeValue ?? "").split(/(\s+)/)) {
      if (!p) continue;
      if (/^\s+$/.test(p)) {
        frag.appendChild(document.createTextNode(p));
      } else {
        const s = document.createElement("span");
        s.dataset.w = String(spans.length);
        s.textContent = p;
        frag.appendChild(s);
        spans.push(s);
      }
    }
    t.parentNode?.replaceChild(frag, t);
  }

  el.dataset.wordsReady = "1";
  return spans;
}

class Player {
  private audio = new Audio();
  private queue: Part[] = [];
  private cache = new Map<string, Clip>();
  private inflight = new Map<string, Promise<Clip | null>>();
  private warmQueue: number[] = [];
  private warming = false;
  private fallback = false;
  private raf = 0;
  private words: HTMLElement[] = [];
  private times: WordTimes = [];
  private lastWord = -1;
  private lastFollow = 0;
  private target: HTMLElement | null = null;
  /** Which clip of the current part is sounding: its title, or the passage. */
  private stage: "title" | "body" = "body";

  i = 0;
  playing = false;
  lang = "en";

  /** Narration level, 0–1. Separate from the ambience mixer. */
  setVolume(v: number) {
    this.audio.volume = Math.min(1, Math.max(0, v));
  }

  /** Fraction 0–1 of the whole script, weighted by part length. */
  private weights: number[] = [];
  private totalWeight = 1;

  onstate: (s: { playing: boolean; label: string; note?: string; index: number }) => void = () => {};
  onprogress: (fraction: number) => void = () => {};

  constructor() {
    this.audio.addEventListener("ended", () => {
      if (this.stage === "title") this.playBody();
      else this.advance();
    });
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
    this.warmQueue.length = 0; // a route change abandons any speculative work
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

  private fetchPart(i: number): Promise<Clip | null> {
    return this.fetchText(this.queue[i].text, this.key(i));
  }

  /** The title clip of part i, if it has a title. */
  private fetchTitle(i: number): Promise<Clip | null> {
    const t = this.queue[i]?.title;
    return t ? this.fetchText(t, `${this.key(i)}:title`) : Promise.resolve(null);
  }

  private async fetchText(text: string, k: string): Promise<Clip | null> {
    const hit = this.cache.get(k);
    if (hit) return hit;
    // Coalesce: hovering a node while it is already being fetched must not
    // start a second identical request.
    const pending = this.inflight.get(k);
    if (pending) return pending;
    const p = this.request(text, k).finally(() => this.inflight.delete(k));
    this.inflight.set(k, p);
    return p;
  }

  private async request(text: string, k: string): Promise<Clip | null> {
    const res = await fetch("/api/magnifica/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, lang: this.lang }),
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
      spoken: data.spoken ?? text,
      alignment: data.alignment ?? null,
    };
    this.cache.set(k, clip);
    return clip;
  }

  /**
   * Fetch a part without playing it, so pressing Listen is instant. Called on
   * intent (hover/focus) rather than on load: generating speech costs
   * characters, and a visitor who never presses play should not spend them.
   *
   * Warms run strictly one at a time. The account allows three concurrent
   * generations, and a mouse sweep across the timeline would otherwise fire one
   * request per node and come back with 429s — which is exactly what happened.
   * Playback's own fetch is not queued, so pressing play never waits behind a
   * speculative prefetch.
   */
  warm(i: number) {
    if (this.fallback || i < 0 || i >= this.queue.length) return;
    if (this.cache.has(this.key(i)) || this.warmQueue.includes(i)) return;
    this.warmQueue.push(i);
    this.drainWarm();
  }

  private async drainWarm() {
    if (this.warming) return;
    this.warming = true;
    try {
      while (this.warmQueue.length) {
        const i = this.warmQueue.shift()!;
        if (this.cache.has(this.key(i))) continue;
        await this.fetchTitle(i).catch(() => {});
        await this.fetchPart(i).catch(() => {});
      }
    } finally {
      this.warming = false;
    }
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

  /**
   * Keep the word being spoken inside a comfortable band. Only nudges when it
   * has actually left that band, and not more than once a second, so it never
   * fights the reader or stacks smooth-scrolls on top of each other.
   */
  private follow(word: HTMLElement) {
    const now = performance.now();
    if (now - this.lastFollow < 1000) return;
    const r = word.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.top > vh * 0.3 && r.bottom < vh * 0.68) return; // already well placed
    this.lastFollow = now;
    window.scrollBy({ top: r.top - vh * 0.42, behavior: "smooth" });
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
            const w = this.words[idx];
            w?.classList.add("is-now");
            for (let k = 0; k < idx; k++) this.words[k]?.classList.add("is-read");
            if (w) this.follow(w);
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

  /** A part sounds as its title (if it has one) and then its passage. */
  private async playCurrent() {
    const part = this.queue[this.i];
    if (!part) return;
    this.emit(this.fallback ? "device voice" : undefined);
    this.focusSection(part);
    this.stage = part.title ? "title" : "body";
    if (this.stage === "title") await this.playTitle();
    else await this.playBody();
  }

  private async playTitle() {
    const part = this.queue[this.i];
    if (!part?.title) return this.playBody();
    if (!this.fallback) {
      try {
        const clip = await this.fetchTitle(this.i);
        if (clip) {
          if (!this.playing) return;
          this.clearHighlight();
          this.audio.src = clip.url;
          await this.audio.play();
          this.startTracking();
          this.emit();
          this.fetchPart(this.i).catch(() => {}); // the passage, ready by the time the title ends
          return;
        }
        this.fallback = true;
      } catch {
        this.emit("voice unavailable, using device voice");
        this.fallback = true;
      }
    }
    this.speakFallback(part);
  }

  private async playBody() {
    const part = this.queue[this.i];
    if (!part) return;
    this.stage = "body";
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
          if (this.i + 1 < this.queue.length) {
            this.fetchTitle(this.i + 1).catch(() => {});
            this.fetchPart(this.i + 1).catch(() => {});
          }
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

  /** The device voice: the title as one utterance, then the passage. */
  private speakFallback(part: Part) {
    if (!("speechSynthesis" in window)) {
      this.playing = false;
      this.emit("no speech available on this device");
      return;
    }
    const title = this.stage === "title";
    const u = new SpeechSynthesisUtterance(title ? part.title! : part.text);
    const bcp = LANG_BCP;
    u.lang = bcp;
    const v = speechSynthesis.getVoices().find((v) => v.lang.startsWith(bcp.slice(0, 2)));
    if (v) u.voice = v;
    u.rate = 0.95;
    u.onend = () => {
      if (!this.playing) return;
      if (title) {
        this.stage = "body";
        this.speakFallback(part);
      } else this.advance();
    };
    // No alignment from the device voice, so mark the passage without words.
    if (!title && part.anchor && part.highlight) {
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

/** Whatever control is showing the ambience state, told to re-read it. */
let syncAmbience: () => void = () => {};

/**
 * "Begin experience": the ambience comes on and the narration starts from the
 * top. One gesture does both — the click is what unlocks the audio context and
 * the first play, so they have to happen here rather than on scroll.
 */
export async function begin() {
  if (!scape.on) scape.toggle();
  syncAmbience();
  await player.goTo(0);
}

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
    <div class="dock-row">
      <button type="button" class="dock-play" aria-label="Listen">▶&nbsp; Listen</button>
      <div class="dock-timeline">
        <div class="dock-track"><div class="dock-fill"></div></div>
        ${nodes}
      </div>
      <button type="button" class="dock-sound" aria-label="Audio controls"><svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 15v4M5 5v6"/><path d="M12 9v10M12 5v0"/><path d="M19 13v6M19 5v4"/><path d="M3 11h4M10 9h4M17 13h4"/></svg></button>
    </div>
    <div class="dock-panel" hidden>
      <div class="dock-panel-head">
        <span class="lbl">Audio Controls</span>
        <button type="button" class="dock-close" aria-label="Close audio controls">×</button>
      </div>
      <label class="dock-slider"><span>Voice</span>
        <input type="range" min="0" max="100" value="100" data-vol />
      </label>
      <div class="dock-amb-row">
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
  const panel = dock.querySelector<HTMLDivElement>(".dock-panel")!;
  const ambBtn = dock.querySelector<HTMLButtonElement>(".dock-amb")!;
  const fill = dock.querySelector<HTMLDivElement>(".dock-fill")!;
  const nodeEls = Array.from(dock.querySelectorAll<HTMLButtonElement>(".dock-node"));

  player.onstate = (s) => {
    playBtn.innerHTML = s.playing ? "❚❚&nbsp; Pause" : "▶&nbsp; Listen";
    // The section name lives on the timeline node, so the transport stays bare.
    nodeEls.forEach((n, i) => {
      n.classList.toggle("on", i === s.index && s.playing);
      n.classList.toggle("done", i < s.index);
    });
  };
  player.onprogress = (f) => {
    fill.style.transform = `scaleX(${f})`;
  };

  playBtn.addEventListener("click", () => player.toggle());

  // Warm the first passage the moment the pointer reaches the button, and the
  // loop files as soon as the browser is idle — between them, both Listen and
  // Soundscape respond immediately rather than after a fetch.
  const warmFirst = () => player.warm(0);
  playBtn.addEventListener("pointerenter", warmFirst, { once: true });
  playBtn.addEventListener("focus", warmFirst, { once: true });
  playBtn.addEventListener("pointerdown", warmFirst, { once: true });

  const soundBtn = dock.querySelector<HTMLButtonElement>(".dock-sound")!;
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void })
    .requestIdleCallback;
  if (idle) idle(() => scape.preload());
  else setTimeout(() => scape.preload(), 1200);
  soundBtn.addEventListener("pointerenter", () => scape.preload(), { once: true });

  nodeEls.forEach((n) => {
    n.addEventListener("pointerenter", () => player.warm(Number(n.dataset.i)), { once: true });
    n.addEventListener("click", () => player.goTo(Number(n.dataset.i)));
  });
  soundBtn.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
  });
  dock.querySelector<HTMLButtonElement>(".dock-close")!.addEventListener("click", () => {
    panel.hidden = true;
  });
  dock.querySelector<HTMLInputElement>("input[data-vol]")!.addEventListener("input", (e) => {
    player.setVolume(Number((e.target as HTMLInputElement).value) / 100);
  });
  syncAmbience = () => {
    ambBtn.textContent = `ambience: ${scape.on ? "on" : "off"}`;
    ambBtn.classList.toggle("on", scape.on);
  };
  syncAmbience();
  ambBtn.addEventListener("click", () => {
    scape.toggle();
    syncAmbience();
  });
  panel.querySelectorAll<HTMLInputElement>("input[data-layer]").forEach((input) => {
    input.addEventListener("input", () => {
      scape.setLevel(input.dataset.layer as LayerName, Number(input.value) / 100);
    });
  });
}

/**
 * v3's transport: no dock. Every panel owns its own play button, and the
 * ambience lives behind one floating icon that expands in place. Only one
 * passage can sound at a time — the shared player enforces that by
 * construction, since starting a part stops whatever was running.
 */
export function mountPanels(root: HTMLElement, parts: Part[], scene: Scene) {
  player.load(parts);
  (Object.keys(LAYER_LABELS) as LayerName[]).forEach((n) => scape.setLevel(n, scene.sound[n] ?? 0));

  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-play]"));

  buttons.forEach((btn) => {
    const i = Number(btn.dataset.play);
    btn.addEventListener("pointerenter", () => player.warm(i), { once: true });
    btn.addEventListener("click", () => {
      // Clicking the panel that is already sounding pauses it; anything else
      // takes over.
      if (player.playing && player.i === i) player.toggle();
      else player.goTo(i);
    });
  });

  player.onstate = (s) => {
    buttons.forEach((b) => {
      const active = Number(b.dataset.play) === s.index && s.playing;
      b.classList.toggle("on", active);
      const lbl = b.querySelector(".x-play-lbl");
      if (lbl) lbl.textContent = active ? "Pause" : "Listen";
      b.setAttribute("aria-label", active ? "Pause this section" : "Listen to this section");
    });
  };
  player.onprogress = () => {};

  // Floating ambience control.
  const amb = document.createElement("div");
  amb.className = "x-amb";
  amb.innerHTML = `
    <button type="button" class="x-amb-btn" aria-expanded="false" aria-controls="x-amb-panel" aria-label="Soundscape">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none"
           stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
      </svg>
    </button>
    <div class="x-amb-panel" id="x-amb-panel" hidden>
      <header>
        <span>Audio Controls</span>
        <button type="button" class="x-amb-close" aria-label="Close audio controls">×</button>
      </header>
      <label class="dock-slider"><span>Voice</span>
        <input type="range" min="0" max="100" value="100" data-vol />
      </label>
      <div class="dock-amb-row"><button type="button" class="dock-amb">ambience: off</button></div>
      ${(Object.keys(LAYER_LABELS) as LayerName[])
        .map(
          (n) => `
        <label class="dock-slider"><span>${LAYER_LABELS[n]}</span>
          <input type="range" min="0" max="100" value="${Math.round((scene.sound[n] ?? 0) * 100)}" data-layer="${n}" />
        </label>`,
        )
        .join("")}
    </div>`;
  root.appendChild(amb);

  const ambBtn = amb.querySelector<HTMLButtonElement>(".x-amb-btn")!;
  const ambPanel = amb.querySelector<HTMLDivElement>(".x-amb-panel")!;
  const toggleBtn = amb.querySelector<HTMLButtonElement>(".dock-amb")!;

  const setOpen = (open: boolean) => {
    ambPanel.hidden = !open;
    amb.classList.toggle("open", open);
    ambBtn.setAttribute("aria-expanded", String(open));
  };
  ambBtn.addEventListener("pointerenter", () => scape.preload(true), { once: true });
  ambBtn.addEventListener("click", () => setOpen(ambPanel.hidden));
  amb.querySelector(".x-amb-close")!.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !ambPanel.hidden) setOpen(false);
  });

  syncAmbience = () => {
    toggleBtn.textContent = `ambience: ${scape.on ? "on" : "off"}`;
    toggleBtn.classList.toggle("on", scape.on);
    amb.classList.toggle("sounding", scape.on);
  };
  syncAmbience();
  toggleBtn.addEventListener("click", () => {
    scape.toggle();
    syncAmbience();
  });
  amb.querySelector<HTMLInputElement>("input[data-vol]")!.addEventListener("input", (e) => {
    player.setVolume(Number((e.target as HTMLInputElement).value) / 100);
  });
  amb.querySelectorAll<HTMLInputElement>("input[data-layer]").forEach((input) => {
    input.addEventListener("input", () => {
      scape.setLevel(input.dataset.layer as LayerName, Number(input.value) / 100);
    });
  });

  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void })
    .requestIdleCallback;
  if (idle) idle(() => scape.preload());
  else setTimeout(() => scape.preload(), 1200);
}

/** Tear down on route change: stop speech, keep ambience running across pages. */
export function unmountDock() {
  player.stop();
  syncAmbience = () => {};
  document.querySelectorAll(".dock, .x-amb").forEach((d) => d.remove());
}
