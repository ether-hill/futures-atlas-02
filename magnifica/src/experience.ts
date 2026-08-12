/**
 * The immersive per-leader "experience" view — v2, layered.
 *
 * v1 baked everything into one video plate per section. v2 separates the
 * layers, which buys three things: the subject is no longer wherever the model
 * happened to put it (so type can sit in clear space), depth comes from real
 * parallax rather than implication, and only the hero needs a video — every
 * other backdrop is a still, which is roughly an eighth of the generation cost
 * and a great deal lighter to ship across sixteen leaders.
 *
 * The portrait is a REAL photograph under a real licence, presented as a print
 * rather than matted into the scene. That is deliberate on two counts: a busy
 * studio background mattes badly, and a photographic object laid over an
 * imagined landscape puts the seam between the real and the speculative in
 * plain sight — which is the argument this whole project is making.
 *
 * Everything rendered here still comes from the Leader record; no prose is
 * invented and no biography is asserted. See the v1 notes that survive below:
 * the honesty gate precedes every excerpt, excerpts are captioned, and "The
 * real record" is built from `grounding` rather than from a life story.
 */
import type { Leader } from "./leaders";
import type { Part } from "./listen";
import { portraitOf, type Portrait } from "./portraits";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface ExperienceSpec {
  displayName: string;
  displayTitle: string;
  /** Hero video loop id under /magnifica/media/loops/ — the only moving plate. */
  hero: string;
  /** Still ids under /magnifica/media/stills/, cycled behind the excerpt slides. */
  stills: string[];
  /** Stills used behind the reading chapters; may be empty. */
  chapterStills: string[];
}

export const EXPERIENCES: Record<string, ExperienceSpec> = {
  "dalai-lama": {
    displayName: "Tenzin Gyatso",
    displayTitle: "The Fourteenth Dalai Lama",
    hero: "dalai-lama-hero",
    stills: ["dl-monastery", "dl-lamps", "dl-night", "dl-plateau"],
    chapterStills: ["dl-library", "dl-block"],
  },
};

export const hasExperience = (id: string) => id in EXPERIENCES;

/**
 * Every addressable place on the page, in order. This is the single source of
 * the numbering: the slides, the chapter rail, the narration script and the
 * playhead nodes are all derived from it, so they cannot drift apart. The
 * disclaimer is a section like any other — it carries a name rather than a
 * number, because it sits before the document begins.
 */
type Section =
  | { kind: "gate"; n: ""; label: "Disclaimer"; body: string }
  | { kind: "chapter"; n: string; label: string; body: string }
  | { kind: "list"; n: string; label: string; items: string[] }
  | { kind: "record"; n: string; label: string; items: { claim: string; url: string }[] }
  | { kind: "quote"; n: string; label: string; text: string; index: number };

/** Anchor id for a section; the disclaimer is named, the rest numbered. */
const anchorOf = (s: Section) => (s.kind === "gate" ? "x-gate" : `x-${s.n}`);

/**
 * The disclaimer, worded once and used for both the page and the narration so
 * the read-along can map word for word. Deliberately plain text: an inline
 * link here would put unspoken words into the middle of the passage.
 */
const gateText = (l: Leader) =>
  `This document does not exist. It is a research-grounded prediction — a speculative-design ` +
  `exercise in what ${l.name} might write about artificial intelligence, drafted from real public ` +
  `statements and the forms this tradition actually uses. No passage here is a real quote, and ` +
  `none of it is his voice. The photograph is real and credited; the landscapes are generated.`;

function sections(l: Leader): Section[] {
  const out: Section[] = [];
  let n = 0;
  const num = () => String(++n).padStart(2, "0");
  const excerpt = (i: number) =>
    ({ kind: "quote", n: num(), label: `Excerpt ${i + 1}`, text: l.excerpts[i], index: i }) as const;

  out.push({ kind: "gate", n: "", label: "Disclaimer", body: gateText(l) });
  out.push({ kind: "chapter", n: num(), label: "The premise", body: l.summary });
  if (l.excerpts[0]) out.push(excerpt(0));
  out.push({ kind: "list", n: num(), label: "Where he would agree", items: l.convergence });
  if (l.excerpts[1]) out.push(excerpt(1));
  out.push({ kind: "list", n: num(), label: "Where he would differ", items: l.divergence });
  if (l.excerpts[2]) out.push(excerpt(2));
  out.push({ kind: "record", n: num(), label: "The real record", items: l.grounding });
  if (l.excerpts[3]) out.push(excerpt(3));

  return out;
}

const yearOf = (claim: string) => claim.match(/\b(19|20)\d{2}\b/)?.[0] ?? "";

/** How a section reads aloud, and which element the marker follows. */
function partOf(s: Section): Part {
  const anchor = anchorOf(s);
  const label = s.n ? `${s.n} · ${s.label}` : s.label;

  switch (s.kind) {
    case "gate":
      return { label, text: s.body, anchor, highlight: ".x-gate-in" };
    case "chapter":
      return { label, text: s.body, anchor, highlight: ".x-body" };
    case "quote":
      return { label, text: s.text, anchor, highlight: "blockquote" };
    case "list":
      // Spoken text is exactly the items, in order, so the marker can run
      // straight across the list. Anything prefixed here would desynchronise it.
      return { label, text: s.items.join(" "), anchor, highlight: ".x-points" };
    case "record":
      // The year chips and the Source links carry data-nospeak, so they are
      // skipped by the wrapper and the claims map one-to-one.
      return { label, text: s.items.map((i) => i.claim).join(" "), anchor, highlight: ".x-timeline" };
  }
}

/**
 * The narration script, built from the same `sections()` call that renders the
 * page, so the numbering, the anchors and the playhead cannot drift apart.
 */
export const experienceParts = (l: Leader): Part[] => sections(l).map(partOf);

/** A still plate. `rate` is its parallax speed relative to scroll. */
const stillLayer = (still: string | undefined, rate = 0.18) =>
  still
    ? `<div class="x-bg" aria-hidden="true" data-par="${rate}">
         <img src="/magnifica/media/stills/${esc(still)}.jpg" alt="" loading="lazy" decoding="async" />
       </div>`
    : `<div class="x-bg x-bg-plain" aria-hidden="true"></div>`;

function polaroid(p: Portrait, rate: number, extraClass = ""): string {
  return `
  <figure class="x-polaroid ${extraClass}" data-par="${rate}">
    <img src="/magnifica/media/portraits/${esc(p.file)}" alt="${esc(p.alt)}" />
    <figcaption>
      <span class="x-pol-name">Photograph</span>
      <span class="x-pol-credit">
        <a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener">${esc(p.credit)}</a>
        · <a href="${esc(p.licenceUrl)}" target="_blank" rel="noopener">${esc(p.licence)}</a>
      </span>
    </figcaption>
  </figure>`;
}

function renderSection(s: Section, spec: ExperienceSpec, ctr: { q: number; c: number }): string {
  const id = anchorOf(s);
  const key = s.n || "gate";
  // Number only — the section's name is the heading, and repeating "Chapter"
  // above every one of them added a word and no information.
  const num = s.n ? `<span class="x-num" data-reveal>${s.n}</span>` : "";

  if (s.kind === "gate") {
    return `
    <section class="x-gate" id="${id}" data-x-sect="${key}">
      <div class="x-gate-head" data-reveal>
        <span class="x-num x-num-word">Disclaimer</span>
      </div>
      <div class="x-gate-in" data-reveal>${esc(s.body)}</div>
    </section>`;
  }

  if (s.kind === "quote") {
    const still = spec.stills[ctr.q % Math.max(spec.stills.length, 1)];
    ctr.q++;
    return `
    <section class="x-quote" id="${id}" data-x-sect="${key}">
      ${stillLayer(still, 0.22)}
      <div class="x-quote-in">
        ${num}
        <span class="x-eyebrow" data-reveal>Predicted excerpt ${s.index + 1}</span>
        <blockquote data-reveal>${esc(s.text)}</blockquote>
        <p class="x-attrib" data-reveal>Speculative — not a real quote</p>
      </div>
    </section>`;
  }

  if (s.kind === "record") {
    const items = s.items
      .map((g) => {
        const y = yearOf(g.claim);
        // data-nospeak: the year chip repeats a number already inside the claim,
        // and "Source" is a control, not prose. Both are skipped by the
        // read-along wrapper so the claims map one-to-one onto the narration.
        return `
        <li data-reveal>
          <span class="x-year" data-nospeak>${y || "—"}</span>
          <span class="x-claim">${esc(g.claim)}${
            g.url
              ? ` <a href="${esc(g.url)}" target="_blank" rel="noopener" data-nospeak>Source</a>`
              : ""
          }</span>
        </li>`;
      })
      .join("");
    return `
    <section class="x-sect x-record" id="${id}" data-x-sect="${key}">
      <div class="x-sect-in">
        ${num}
        <h2 data-reveal>${esc(s.label)}</h2>
        <p class="x-lede" data-reveal data-nospeak>
          Everything on this page except the following is speculative. These are
          real, sourced statements — the record the prediction was built from.
        </p>
        <ol class="x-timeline">${items}</ol>
      </div>
    </section>`;
  }

  const still = spec.chapterStills[ctr.c % Math.max(spec.chapterStills.length, 1)];
  ctr.c++;

  if (s.kind === "list") {
    const items = s.items.map((t) => `<li data-reveal>${esc(t)}</li>`).join("");
    return `
    <section class="x-sect x-sect-bg" id="${id}" data-x-sect="${key}">
      ${stillLayer(still, 0.14)}
      <div class="x-sect-in">
        ${num}
        <h2 data-reveal>${esc(s.label)}</h2>
        <p class="x-lede" data-reveal>Read against <i>Magnifica humanitas</i>.</p>
        <ul class="x-points">${items}</ul>
      </div>
    </section>`;
  }

  return `
  <section class="x-sect x-sect-bg" id="${id}" data-x-sect="${key}">
    ${stillLayer(still, 0.14)}
    <div class="x-sect-in">
      ${num}
      <h2 data-reveal>${esc(s.label)}</h2>
      <p class="x-body" data-reveal>${esc(s.body)}</p>
    </div>
  </section>`;
}

export function experienceView(l: Leader): string {
  const spec = EXPERIENCES[l.id];
  const portrait = portraitOf(l.id);
  const secs = sections(l);
  const ctr = { q: 0, c: 0 };
  const body = secs.map((s) => renderSection(s, spec, ctr)).join("");

  // Home first, so the rail can always take you back to the hero.
  const rail =
    `<a href="#x-home" data-rail="home"><i></i><b>—</b><span>Home</span></a>` +
    secs
      .map(
        (s) =>
          `<a href="#${anchorOf(s)}" data-rail="${s.n || "gate"}">
             <i></i><b>${s.n || "•"}</b><span>${esc(s.label)}</span>
           </a>`
      )
      .join("");

  return `
  <div class="x">
    <section class="x-hero" id="x-home" data-hero-loop="${esc(spec.hero)}" data-x-sect="home">
      <div class="x-bg x-bg-hero" aria-hidden="true" data-par="0.12"></div>
      <div class="x-hero-grid">
        <div class="x-hero-in">
          <span class="x-eyebrow" data-reveal>${esc(l.tradition)}</span>
          <h1 data-reveal>${esc(spec.displayName)}</h1>
          <p class="x-hero-title" data-reveal>${esc(spec.displayTitle)}</p>
          <p class="x-hero-doc" data-reveal>
            <span lang="bo">${esc(l.docTitle)}</span>
            ${l.docTitleTranslation ? `<em>${esc(l.docTitleTranslation)}</em>` : ""}
          </p>
          <button type="button" class="x-begin" data-reveal>
            <span class="x-begin-ring" aria-hidden="true">▶</span>
            <span class="x-begin-lbl">Begin experience</span>
          </button>
        </div>
        ${portrait ? polaroid(portrait, 0.42, "x-polaroid-hero") : ""}
      </div>
      <span class="x-scroll" aria-hidden="true">Scroll to explore</span>
    </section>

    <nav class="x-rail" aria-label="Chapters">${rail}</nav>

    ${body}

    <section class="x-close" data-x-sect="end">
      <div class="x-close-in">
        <div class="x-close-actions" data-reveal>
          <button type="button" class="x-restart">Restart experience</button>
          <a class="x-all" href="#/">All sixteen voices</a>
        </div>
      </div>
    </section>
  </div>`;
}

/**
 * Parallax + the hero loop. One rAF-throttled scroll pass drives every layer;
 * animating transform (never top/background-position) keeps it on the
 * compositor. Motion is skipped entirely under prefers-reduced-motion, which
 * matters — parallax is a genuine vestibular trigger, not just a preference.
 */
export function mountExperience(root: HTMLElement) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The hero is the only moving plate; everything else is a still.
  const hero = root.querySelector<HTMLElement>("[data-hero-loop]");
  if (hero && !reduce) {
    const bg = hero.querySelector<HTMLElement>(".x-bg");
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("aria-hidden", "true");
    video.src = `/magnifica/media/loops/${hero.dataset.heroLoop}.mp4`;
    video.addEventListener("loadeddata", () => {
      hero.classList.add("has-bg");
      video.play().catch(() => {});
    }, { once: true });
    video.addEventListener("error", () => video.remove(), { once: true });
    bg?.appendChild(video);
  }

  /*
   * Parallax. Two things make the naive version feel cheap, and both are
   * avoided here:
   *
   *  1. Reading getBoundingClientRect() per layer per frame forces a
   *     synchronous reflow inside the frame budget. Section geometry is
   *     measured once instead (and on resize), and each frame reads a single
   *     scrollY.
   *  2. Driving transforms straight from the scroll event ties movement to
   *     event cadence, which is coarser than the compositor during momentum
   *     scrolling — so layers step rather than glide. Here a rAF loop eases
   *     the current value toward the target every frame, which both smooths
   *     the input and adds a little weight to the heavier plates.
   *
   * The loop idles itself when everything has settled, so a still page costs
   * nothing.
   */
  interface Layer {
    el: HTMLElement;
    rate: number;
    top: number;
    height: number;
    current: number;
    target: number;
  }

  const layers: Layer[] = Array.from(root.querySelectorAll<HTMLElement>("[data-par]"))
    .map((el) => {
      const section = el.closest("section") as HTMLElement | null;
      return section
        ? { el, rate: parseFloat(el.dataset.par || "0"), top: 0, height: 0, current: 0, target: 0 }
        : null;
    })
    .filter((l): l is Layer => l !== null);

  const sectionsOf = new WeakMap<HTMLElement, HTMLElement>();
  for (const l of layers) sectionsOf.set(l.el, l.el.closest("section") as HTMLElement);

  const measure = () => {
    const y = window.scrollY;
    for (const l of layers) {
      const s = sectionsOf.get(l.el)!;
      const r = s.getBoundingClientRect();
      l.top = r.top + y;
      l.height = r.height;
    }
  };

  let running = false;
  const EASE = 0.12;      // per-frame approach to target
  const SETTLED = 0.05;   // px below which we stop drawing

  const frame = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    let moving = false;

    for (const l of layers) {
      // 0 when the section's centre sits at the viewport centre
      l.target = (l.top + l.height / 2 - y - vh / 2) * -l.rate;
      const delta = l.target - l.current;
      if (Math.abs(delta) < SETTLED) {
        l.current = l.target;
      } else {
        l.current += delta * EASE;
        moving = true;
      }
      // only paint what is anywhere near the viewport
      if (l.top - y < vh * 1.5 && l.top + l.height - y > -vh * 0.5) {
        l.el.style.transform = `translate3d(0, ${l.current.toFixed(2)}px, 0)`;
      }
    }

    if (moving) {
      requestAnimationFrame(frame);
    } else {
      running = false;
    }
  };

  const kick = () => {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  };

  const onResize = () => {
    measure();
    kick();
  };

  if (!reduce) {
    measure();
    // settle to the correct position immediately rather than easing in from 0
    for (const l of layers) {
      l.current = (l.top + l.height / 2 - window.scrollY - window.innerHeight / 2) * -l.rate;
    }
    kick();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    // late-loading stills change section heights; re-measure when they land
    root.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", onResize, { once: true });
    });
  }

  const first = root.querySelector<HTMLElement>("[data-x-sect]");
  root.querySelector(".x-begin")?.addEventListener("click", () => {
    first?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  root.querySelector(".x-restart")?.addEventListener("click", () => {
    root.querySelector(".x-hero")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const rail = root.querySelector(".x-rail");
  const spy = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const id = (e.target as HTMLElement).dataset.xSect!;
        rail?.querySelectorAll("[data-rail]").forEach((a) =>
          a.classList.toggle("on", (a as HTMLElement).dataset.rail === id)
        );
      }
    },
    { rootMargin: "-45% 0px -45% 0px" }
  );
  root.querySelectorAll("[data-x-sect]").forEach((s) => spy.observe(s));

  return () => {
    window.removeEventListener("scroll", kick);
    window.removeEventListener("resize", onResize);
    running = false;
    spy.disconnect();
  };
}
