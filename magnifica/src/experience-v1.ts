/**
 * The immersive per-leader "experience" view — the cinematic long-form format,
 * prototyped on the Dalai Lama and intended as the template for the rest.
 *
 * Everything rendered here comes from the Leader record; this module invents no
 * prose and asserts no biography. The section headings and connective lines are
 * Magnifica's own editorial voice, exactly as on the classic view. In
 * particular:
 *
 *   - the honesty gate sits immediately under the hero, before any excerpt, and
 *     every excerpt slide is captioned "not a real quote";
 *   - "The real record" is built from `grounding` — the only sourced, factual
 *     material in the record — so the timeline the reference design uses for
 *     biography is here used for citations instead. Years are shown only when
 *     the sourced claim itself carries one.
 *
 * Leaders without an entry in EXPERIENCES_V1 keep the classic reading view.
 */
import type { Leader } from "./leaders";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface ExperienceSpec {
  /** Display name split out of Leader.name for the hero. */
  displayName: string;
  displayTitle: string;
  /** Loop id for the hero, then the backdrops used behind the quote slides. */
  hero: string;
  backdrops: string[];
}

export const EXPERIENCES_V1: Record<string, ExperienceSpec> = {
  "dalai-lama": {
    displayName: "Tenzin Gyatso",
    displayTitle: "The Fourteenth Dalai Lama",
    hero: "dalai-lama",
    backdrops: ["dalai-lama-02", "dalai-lama-03", "dalai-lama-04", "dalai-lama-02"],
  },
};

export const hasExperienceV1 = (id: string) => id in EXPERIENCES_V1;

type Section =
  | { kind: "chapter"; n: string; label: string; body: string }
  | { kind: "list"; n: string; label: string; items: string[] }
  | { kind: "record"; n: string; label: string; items: { claim: string; url: string }[] }
  | { kind: "quote"; n: string; text: string; index: number };

/** Interleave the argument sections with the excerpt slides. */
function sections(l: Leader): Section[] {
  const out: Section[] = [];
  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  out.push({ kind: "chapter", n: num(), label: "The premise", body: l.summary });
  if (l.excerpts[0]) out.push({ kind: "quote", n: num(), text: l.excerpts[0], index: 0 });
  out.push({ kind: "list", n: num(), label: "Where he would agree", items: l.convergence });
  if (l.excerpts[1]) out.push({ kind: "quote", n: num(), text: l.excerpts[1], index: 1 });
  out.push({ kind: "list", n: num(), label: "Where he would differ", items: l.divergence });
  if (l.excerpts[2]) out.push({ kind: "quote", n: num(), text: l.excerpts[2], index: 2 });
  out.push({ kind: "record", n: num(), label: "The real record", items: l.grounding });
  if (l.excerpts[3]) out.push({ kind: "quote", n: num(), text: l.excerpts[3], index: 3 });

  return out;
}

/** A year, only if the sourced claim states one itself. */
const yearOf = (claim: string) => claim.match(/\b(19|20)\d{2}\b/)?.[0] ?? "";

function renderSection(s: Section, spec: ExperienceSpec, qi: { i: number }): string {
  if (s.kind === "quote") {
    const backdrop = spec.backdrops[qi.i % spec.backdrops.length];
    qi.i++;
    return `
    <section class="x1-quote" id="x1-${s.n}" data-x1-sect="${s.n}" data-backdrop="${esc(backdrop)}">
      <div class="x1-bg" aria-hidden="true"></div>
      <div class="x1-quote-in">
        <span class="x1-eyebrow" data-reveal>Predicted excerpt ${s.index + 1}</span>
        <blockquote data-reveal>${esc(s.text)}</blockquote>
        <p class="x1-attrib" data-reveal>Speculative — not a real quote</p>
      </div>
    </section>`;
  }

  if (s.kind === "record") {
    const items = s.items
      .map((g) => {
        const y = yearOf(g.claim);
        return `
        <li data-reveal>
          <span class="x1-year">${y || "—"}</span>
          <span class="x1-claim">${esc(g.claim)}
            ${g.url ? `<a href="${esc(g.url)}" target="_blank" rel="noopener">Source</a>` : ""}
          </span>
        </li>`;
      })
      .join("");
    return `
    <section class="x1-sect x1-record" id="x1-${s.n}" data-x1-sect="${s.n}">
      <div class="x1-sect-in">
        <span class="x1-num" data-reveal>Chapter ${s.n}</span>
        <h2 data-reveal>${esc(s.label)}</h2>
        <p class="x1-lede" data-reveal>
          Everything on this page except the following is speculative. These are
          real, sourced statements — the record the prediction was built from.
        </p>
        <ol class="x1-timeline">${items}</ol>
      </div>
    </section>`;
  }

  if (s.kind === "list") {
    const items = s.items.map((t) => `<li data-reveal>${esc(t)}</li>`).join("");
    return `
    <section class="x1-sect" id="x1-${s.n}" data-x1-sect="${s.n}">
      <div class="x1-sect-in">
        <span class="x1-num" data-reveal>Chapter ${s.n}</span>
        <h2 data-reveal>${esc(s.label)}</h2>
        <p class="x1-lede" data-reveal>Read against <i>Magnifica humanitas</i>.</p>
        <ul class="x1-points">${items}</ul>
      </div>
    </section>`;
  }

  return `
  <section class="x1-sect" id="x1-${s.n}" data-x1-sect="${s.n}">
    <div class="x1-sect-in">
      <span class="x1-num" data-reveal>Chapter ${s.n}</span>
      <h2 data-reveal>${esc(s.label)}</h2>
      <p class="x1-body" data-reveal>${esc(s.body)}</p>
    </div>
  </section>`;
}

export function experienceV1View(l: Leader): string {
  const spec = EXPERIENCES_V1[l.id];
  const secs = sections(l);
  const qi = { i: 0 };
  const body = secs.map((s) => renderSection(s, spec, qi)).join("");

  const rail = secs
    .map(
      (s) =>
        `<a href="#x1-${s.n}" data-rail="${s.n}"><i></i><span>${
          s.kind === "quote" ? "Excerpt" : esc(s.label)
        }</span></a>`
    )
    .join("");

  const sources = l.grounding
    .map((g) => `<li><a href="${esc(g.url)}" target="_blank" rel="noopener">${esc(g.claim)}</a></li>`)
    .join("");

  return `
  <div class="x1">
    <section class="x1-hero" data-backdrop="${esc(spec.hero)}">
      <div class="x1-bg x1-bg-hero" aria-hidden="true"></div>
      <div class="x1-hero-in">
        <span class="x1-eyebrow" data-reveal>${esc(l.tradition)}</span>
        <h1 data-reveal>${esc(spec.displayName)}</h1>
        <p class="x1-hero-title" data-reveal>${esc(spec.displayTitle)}</p>
        <p class="x1-hero-doc" data-reveal>
          <span lang="bo">${esc(l.docTitle)}</span>
          ${l.docTitleTranslation ? `<em>${esc(l.docTitleTranslation)}</em>` : ""}
        </p>
        <button type="button" class="x1-begin" data-reveal>
          <span class="x1-begin-ring" aria-hidden="true">▶</span>
          <span class="x1-begin-lbl">Begin experience</span>
        </button>
      </div>
      <span class="x1-scroll" aria-hidden="true">Scroll to explore</span>
    </section>

    <section class="x1-gate">
      <div class="x1-gate-in" data-reveal>
        <b>This document does not exist.</b>
        It is a research-grounded prediction — a speculative-design exercise in what
        ${esc(l.name)} <i>might</i> write about artificial intelligence, drafted from
        real public statements (listed under <a href="#x1-07">The real record</a>) and
        the forms this tradition actually uses. No passage here is a real quote, and
        none of it is his voice.
      </div>
    </section>

    <nav class="x1-rail" aria-label="Chapters">${rail}</nav>

    ${body}

    <section class="x1-close">
      <div class="x1-close-in">
        <span class="x1-eyebrow" data-reveal>The document, imagined</span>
        <p class="x1-close-doc" data-reveal>${esc(l.docType)}</p>
        ${l.voiceNotes ? `<p class="x1-voice" data-reveal><b>Voice:</b> ${esc(l.voiceNotes)}</p>` : ""}
        <ul class="x1-sources" data-reveal>${sources}</ul>
        <div class="x1-close-actions" data-reveal>
          <button type="button" class="x1-restart">Restart experience</button>
          <a class="x1-all" href="#/">All sixteen voices</a>
        </div>
      </div>
    </section>
  </div>`;
}

/**
 * Backdrop videos are created only as a section approaches the viewport and are
 * paused the moment it leaves — four autoplaying loops at once is the difference
 * between a cinematic page and a hot laptop. Missing files simply never appear.
 */
export function mountExperienceV1(root: HTMLElement) {
  const holders = Array.from(root.querySelectorAll<HTMLElement>("[data-backdrop]"));

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const holder = e.target as HTMLElement;
        const bg = holder.querySelector<HTMLElement>(".x1-bg");
        if (!bg) continue;

        if (e.isIntersecting) {
          let video = bg.querySelector("video");
          if (!video) {
            video = document.createElement("video");
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.setAttribute("aria-hidden", "true");
            video.src = `/magnifica/media/loops/${holder.dataset.backdrop}.mp4`;
            video.addEventListener("loadeddata", () => holder.classList.add("has-bg"), { once: true });
            video.addEventListener("error", () => video?.remove(), { once: true });
            bg.appendChild(video);
          }
          video.play().catch(() => {});
        } else {
          bg.querySelector("video")?.pause();
        }
      }
    },
    { rootMargin: "40% 0px" }
  );
  holders.forEach((h) => io.observe(h));

  // Hero button and the closing restart both just move the page.
  const first = root.querySelector<HTMLElement>("[data-x1-sect]");
  root.querySelector(".x1-begin")?.addEventListener("click", () => {
    first?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  root.querySelector(".x1-restart")?.addEventListener("click", () => {
    root.querySelector(".x1-hero")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Rail: mark the section currently in view.
  const rail = root.querySelector(".x1-rail");
  if (rail) {
    const links = new Map<string, Element>();
    rail.querySelectorAll("[data-rail]").forEach((a) => links.set((a as HTMLElement).dataset.rail!, a));
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = (e.target as HTMLElement).dataset.x1Sect!;
          links.forEach((a, k) => a.classList.toggle("on", k === id));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    root.querySelectorAll("[data-x1-sect]").forEach((s) => spy.observe(s));
  }

  return () => io.disconnect();
}
