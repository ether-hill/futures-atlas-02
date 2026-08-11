/**
 * Read-aloud player + the bottom dock UI (voice, language, sound board).
 * Speech comes from the host route /api/magnifica/tts (ElevenLabs narrator
 * voices — stock narrators, never clones of the leaders). When the route
 * isn't configured the player falls back to the device's own speech
 * synthesis so the feature still demos, labeled as such.
 */

import { Soundscape, LAYER_LABELS, type LayerName } from "./soundscape";
import type { Scene } from "./scenes";

export interface Part {
  label: string;
  text: string;
}

const VOICES = [
  { key: "daniel", label: "Daniel · deep" },
  { key: "george", label: "George · warm" },
  { key: "charlotte", label: "Charlotte · calm" },
  { key: "lily", label: "Lily · clear" },
];

const LANGS = [
  { key: "en", label: "English", bcp: "en-GB" },
  { key: "fr", label: "Français", bcp: "fr-FR" },
  { key: "es", label: "Español", bcp: "es-ES" },
  { key: "de", label: "Deutsch", bcp: "de-DE" },
  { key: "pt", label: "Português", bcp: "pt-PT" },
  { key: "hi", label: "हिन्दी", bcp: "hi-IN" },
  { key: "ar", label: "العربية", bcp: "ar-SA" },
  { key: "zh", label: "中文", bcp: "zh-CN" },
];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

class Player {
  private audio = new Audio();
  private queue: Part[] = [];
  private i = 0;
  private cache = new Map<string, string>(); // part index+opts → object URL
  private fallback = false;
  playing = false;
  voice = "daniel";
  lang = "en";
  onstate: (s: { playing: boolean; label: string; note?: string }) => void = () => {};

  constructor() {
    this.audio.addEventListener("ended", () => this.advance());
  }

  load(parts: Part[]) {
    this.stop();
    this.queue = parts;
    this.i = 0;
  }

  async toggle() {
    if (this.playing) {
      this.playing = false;
      this.audio.pause();
      speechSynthesis.cancel();
      this.emit();
      return;
    }
    this.playing = true;
    this.emit("Preparing…");
    await this.playCurrent();
  }

  stop() {
    this.playing = false;
    this.audio.pause();
    this.audio.removeAttribute("src");
    speechSynthesis.cancel();
    for (const url of this.cache.values()) URL.revokeObjectURL(url);
    this.cache.clear();
    this.i = 0;
  }

  private emit(note?: string) {
    const part = this.queue[this.i];
    this.onstate({
      playing: this.playing,
      label: part ? `${this.i + 1}/${this.queue.length} · ${part.label}` : "—",
      note,
    });
  }

  private async advance() {
    if (!this.playing) return;
    this.i++;
    if (this.i >= this.queue.length) {
      this.playing = false;
      this.i = 0;
      this.emit();
      return;
    }
    await this.playCurrent();
  }

  private key(i: number) {
    return `${i}:${this.voice}:${this.lang}`;
  }

  private async fetchPart(i: number): Promise<string | null> {
    const k = this.key(i);
    const hit = this.cache.get(k);
    if (hit) return hit;
    const res = await fetch("/api/magnifica/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: this.queue[i].text, voice: this.voice, lang: this.lang }),
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
    const url = URL.createObjectURL(await res.blob());
    this.cache.set(k, url);
    return url;
  }

  private async playCurrent() {
    const part = this.queue[this.i];
    if (!part) return;
    this.emit(this.fallback ? "device voice" : undefined);
    if (!this.fallback) {
      try {
        const url = await this.fetchPart(this.i);
        if (url) {
          if (!this.playing) return;
          this.audio.src = url;
          await this.audio.play();
          this.emit();
          // prefetch the next part while this one plays
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

  const dock = document.createElement("div");
  dock.className = "dock";
  dock.innerHTML = `
    <button type="button" class="dock-play" aria-label="Listen">▶&nbsp; Listen</button>
    <span class="dock-part">${parts.length} parts</span>
    <span class="dock-note"></span>
    <span class="dock-spacer"></span>
    <label class="dock-ctl"><span>Voice</span>
      <select class="dock-voice">${VOICES.map((v) => `<option value="${v.key}">${esc(v.label)}</option>`).join("")}</select>
    </label>
    <label class="dock-ctl"><span>Lang</span>
      <select class="dock-lang">${LANGS.map((l) => `<option value="${l.key}">${esc(l.label)}</option>`).join("")}</select>
    </label>
    <button type="button" class="dock-sound">Soundscape</button>
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
      <p class="dock-hint">Layered ambience loops — synthesized in-browser now, swappable for produced ElevenLabs loops (see project notes).</p>
    </div>`;
  root.appendChild(dock);

  const playBtn = dock.querySelector<HTMLButtonElement>(".dock-play")!;
  const partEl = dock.querySelector<HTMLSpanElement>(".dock-part")!;
  const noteEl = dock.querySelector<HTMLSpanElement>(".dock-note")!;
  const panel = dock.querySelector<HTMLDivElement>(".dock-panel")!;
  const ambBtn = dock.querySelector<HTMLButtonElement>(".dock-amb")!;

  player.onstate = (s) => {
    playBtn.innerHTML = s.playing ? "❚❚&nbsp; Pause" : "▶&nbsp; Listen";
    partEl.textContent = s.label === "—" ? `${parts.length} parts` : s.label;
    noteEl.textContent = s.note || "";
  };

  playBtn.addEventListener("click", () => player.toggle());
  dock.querySelector<HTMLSelectElement>(".dock-voice")!.addEventListener("change", (e) => {
    player.voice = (e.target as HTMLSelectElement).value;
  });
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
