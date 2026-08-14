/**
 * The immersive per-leader "experience" view, in two versions off one code
 * path. Structure, numbering, chapter rail, transport and read-along are
 * identical; the `Variant` decides only which media plays behind them — v1
 * moves everywhere, v2 moves in the hero and uses stills elsewhere at roughly
 * an eighth of the generation cost. They were briefly two modules and promptly
 * drifted, so a change to either is now a change to both.
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
import { mountParallax, readLayers, type ParLayer } from "./parallax";
import { portraitOf, type Portrait } from "./portraits";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * The two design versions differ in their media and nothing else — same
 * structure, numbering, rail, transport and read-along. v1 moves: every
 * backdrop is a video loop. v2 moves only in the hero and uses stills
 * elsewhere, which is a fraction of the generation cost and far lighter to
 * ship. Keeping one code path means a change to either is a change to both.
 */
export type Variant = "v1" | "v2" | "v3" | "v4";

interface ExperienceSpec {
  displayName: string;
  displayTitle: string;
  /** Hero loop under /magnifica/media/loops/, per version. */
  hero: Record<Variant, string>;
  /** v2: stills behind the excerpt slides, then behind the reading chapters. */
  stills: string[];
  chapterStills: string[];
  /** v1: video loops, cycled behind every section. */
  videos: string[];
}

export const EXPERIENCES: Record<string, ExperienceSpec> = {
  "dalai-lama": {
    displayName: "Tenzin Gyatso",
    displayTitle: "The Fourteenth Dalai Lama",
    // v4 is typographic and plays no backdrop; the key exists to keep the record complete.
    hero: { v1: "dalai-lama", v2: "dalai-lama-hero", v3: "dalai-lama-hero", v4: "" },
    stills: ["dl-monastery", "dl-lamps", "dl-night", "dl-plateau"],
    chapterStills: ["dl-library", "dl-block"],
    videos: ["dalai-lama-02", "dalai-lama-03", "dalai-lama-04"],
  },
};

export const hasExperience = (id: string) => id in EXPERIENCES;

/**
 * The parallax dial, in one place so the whole page can be tuned as a set.
 *
 * `par` is travel: ±120 × par px across the section's pass through the
 * viewport (see parallax.ts — the bound is the point). `scale` is a slow
 * push-in over the same pass, which is where the depth now comes from: a plate
 * that drifts 24px and zooms 16% reads deeper than one that slid 400px, and it
 * cannot stutter, because a dropped frame costs a fraction of a pixel.
 *
 * The print is the exception. It is a foreground object rather than a backdrop,
 * so it is allowed real travel — and it never scales: a photographic print
 * pushing in would read as a zoom on the photograph, which is exactly the
 * blurring of real and imagined this project refuses elsewhere.
 */
const PAR = {
  hero: { par: 0.12, scale: 0.14 },
  quote: { par: 0.1, scale: 0.16 },
  chapter: { par: 0.09, scale: 0.14 },
  print: 0.75,
} as const;

/**
 * Every addressable place on the page, in order. This is the single source of
 * the numbering: the slides, the chapter rail, the narration script and the
 * playhead nodes are all derived from it, so they cannot drift apart. The
 * disclaimer is a section like any other — it carries a name rather than a
 * number, because it sits before the document begins.
 */
export type Section =
  | { kind: "gate"; n: ""; label: "Disclaimer"; body: string }
  | { kind: "chapter"; n: string; label: string; body: string }
  | { kind: "list"; n: string; label: string; items: string[] }
  | { kind: "record"; n: string; label: string; items: { claim: string; url: string }[] }
  | { kind: "quote"; n: string; label: string; text: string; index: number };

/** Anchor id for a section; the disclaimer is named, the rest numbered. */
export const anchorOf = (s: Section) => (s.kind === "gate" ? "x-gate" : `x-${s.n}`);

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

/**
 * Exported so v4 renders from the SAME list as v1–v3. The numbering, the
 * anchors and the narration all come from here; a second copy would drift.
 */
export function sections(l: Leader): Section[] {
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

/**
 * A backdrop plate, plus the scrim that sits over it. In v1 the element only
 * declares which loop it wants; the video itself is created when the section
 * nears the viewport, so a page of them never decodes at once.
 *
 * The scrim is a **sibling, not a child**. It used to be `.x-bg::after`, which
 * meant every repaint of the moving layer also rasterised a section-sized
 * radial and linear gradient — roughly doubling the paint content of the one
 * element on the page that has to be cheap — and it made the vignette drift
 * against its own section. Out here it is a static layer the compositor can
 * ignore, and it lines up with the section edges. It has to precede the
 * content, which is `position: relative`, so the copy still paints on top.
 */
function plate(variant: Variant, media: string | undefined, dial: { par: number; scale: number }): string {
  const scrim = `<div class="x-scrim" aria-hidden="true"></div>`;
  const par = `data-par="${dial.par}" data-par-scale="${dial.scale}"`;
  if (!media) return `<div class="x-bg x-bg-plain" aria-hidden="true"></div>${scrim}`;
  if (variant === "v1") {
    return `<div class="x-bg" aria-hidden="true" ${par} data-backdrop="${esc(media)}"></div>${scrim}`;
  }
  return `<div class="x-bg" aria-hidden="true" ${par}>
            <img src="/magnifica/media/stills/${esc(media)}.jpg" alt="" loading="lazy" decoding="async" />
          </div>${scrim}`;
}

/**
 * Exported because the overview's banner shows Leo XIV the same way a voice
 * page shows its leader. Sharing the function rather than the markup keeps the
 * credit + licence caption attached to the print: it is required to be visible,
 * so it must not be something a second copy of this markup can forget.
 */
export function polaroid(p: Portrait, rate: number, extraClass = ""): string {
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

function renderSection(
  s: Section,
  spec: ExperienceSpec,
  ctr: { q: number; c: number },
  variant: Variant,
  idx: number,
): string {
  const id = anchorOf(s);
  const key = s.n || "gate";
  // v3 drops the shared transport: every panel carries its own control, so
  // playing a passage is a property of the passage rather than of a dock.
  const play =
    variant === "v3"
      ? `<button type="button" class="x-play" data-play="${idx}" aria-label="Listen to this section">
           <span class="x-play-ico" aria-hidden="true"></span><span class="x-play-lbl">Listen</span>
         </button>`
      : "";
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
      ${play}
    </section>`;
  }

  if (s.kind === "quote") {
    const pool = variant === "v1" ? spec.videos : spec.stills;
    const media = pool[ctr.q % Math.max(pool.length, 1)];
    ctr.q++;
    return `
    <section class="x-quote" id="${id}" data-x-sect="${key}">
      ${plate(variant, media, PAR.quote)}
      <div class="x-quote-in">
        ${num}
        <span class="x-eyebrow" data-reveal>Predicted excerpt ${s.index + 1}</span>
        <blockquote data-reveal>${esc(s.text)}</blockquote>
        <p class="x-attrib" data-reveal>Speculative — not a real quote</p>
        ${play}
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
        ${play}
      </div>
    </section>`;
  }

  const cPool = variant === "v1" ? spec.videos : spec.chapterStills;
  const cMedia = cPool[(ctr.c + 1) % Math.max(cPool.length, 1)];
  ctr.c++;

  if (s.kind === "list") {
    const items = s.items.map((t) => `<li data-reveal>${esc(t)}</li>`).join("");
    return `
    <section class="x-sect x-sect-bg" id="${id}" data-x-sect="${key}">
      ${plate(variant, cMedia, PAR.chapter)}
      <div class="x-sect-in">
        ${num}
        <h2 data-reveal>${esc(s.label)}</h2>
        <p class="x-lede" data-reveal>Read against <i>Magnifica humanitas</i>.</p>
        <ul class="x-points">${items}</ul>
        ${play}
      </div>
    </section>`;
  }

  return `
  <section class="x-sect x-sect-bg" id="${id}" data-x-sect="${key}">
    ${plate(variant, cMedia, PAR.chapter)}
    <div class="x-sect-in">
      ${num}
      <h2 data-reveal>${esc(s.label)}</h2>
      <p class="x-body" data-reveal>${esc(s.body)}</p>
      ${play}
    </div>
  </section>`;
}

export function experienceView(l: Leader, variant: Variant = "v2"): string {
  const spec = EXPERIENCES[l.id];
  const portrait = portraitOf(l.id);
  const secs = sections(l);
  const ctr = { q: 0, c: 0 };
  const body = secs.map((s, i) => renderSection(s, spec, ctr, variant, i)).join("");

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
    <section class="x-hero" id="x-home" data-hero-loop="${esc(spec.hero[variant])}" data-x-sect="home">
      <div class="x-bg x-bg-hero" aria-hidden="true" data-par="${PAR.hero.par}" data-par-scale="${PAR.hero.scale}"></div>
      <div class="x-scrim x-scrim-hero" aria-hidden="true"></div>
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
        ${portrait ? polaroid(portrait, PAR.print, "x-polaroid-hero") : ""}
      </div>
      <span class="x-scroll" aria-hidden="true">Scroll to explore</span>
    </section>

    ${variant === "v3" ? "" : `<nav class="x-rail" aria-label="Chapters">${rail}</nav>`}

    ${body}
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

  // v1 only: section backdrops are loops. They are created as their section
  // approaches and paused the moment it leaves — a page of simultaneously
  // decoding videos is the difference between cinematic and a hot laptop.
  const backdrops = Array.from(root.querySelectorAll<HTMLElement>("[data-backdrop]"));
  const bgIo = backdrops.length
    ? new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const holder = e.target as HTMLElement;
            if (!e.isIntersecting) {
              holder.querySelector("video")?.pause();
              continue;
            }
            let v = holder.querySelector("video");
            if (!v) {
              v = document.createElement("video");
              v.muted = true;
              v.loop = true;
              v.playsInline = true;
              v.setAttribute("aria-hidden", "true");
              v.src = `/magnifica/media/loops/${holder.dataset.backdrop}.mp4`;
              v.addEventListener(
                "loadeddata",
                () => holder.closest("section")?.classList.add("has-bg"),
                { once: true },
              );
              v.addEventListener("error", () => v?.remove(), { once: true });
              holder.appendChild(v);
            }
            if (!reduce) v.play().catch(() => {});
          }
        },
        { rootMargin: "40% 0px" },
      )
    : null;
  backdrops.forEach((h) => bgIo?.observe(h));

  /*
   * Parallax lives in parallax.ts, shared with the overview's hero so the two
   * cannot drift apart again. Each plate is driven by its own section's pass
   * through the viewport; the rates and push-ins come from PAR at the top of
   * this file.
   */
  let par: ReturnType<typeof mountParallax> | null = null;
  if (!reduce) {
    const layers: ParLayer[] = readLayers(root, (el) => el.closest("section"));
    par = mountParallax(layers);
    // Late-loading stills change section heights, which moves every plate below
    // them; re-measure when they land rather than leaving the page mis-registered.
    root.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", () => par?.measure(), { once: true });
    });
  }

  // The hero itself carries data-x-sect="home", so "first section" has to skip
  // it — otherwise Begin scrolls you to where you already are.
  const first = root.querySelector<HTMLElement>('[data-x-sect]:not([data-x-sect="home"])');
  root.querySelector(".x-begin")?.addEventListener("click", () => {
    first?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    par?.destroy();
    bgIo?.disconnect();
    spy.disconnect();
  };
}
