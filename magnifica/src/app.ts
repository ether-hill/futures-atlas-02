import { ENCYCLICAL, CHAPTERS } from "./encyclical";
import { LEADERS, type Leader } from "./leaders";
import { SCENES, HOME_SCENE } from "./scenes";
import { mountDock, mountPanels, unmountDock, type Part } from "./listen";
import { experienceView, experienceParts, hasExperience, mountExperience, type Variant } from "./experience";
import { experience4View, mountExperience4 } from "./experience4";
import { mountDrawer, unmountDrawer, markDrawerRoute, markPinned } from "./drawer";
import { portraitOf, monogram } from "./portraits";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The homepage Reveal standard: IntersectionObserver adds .is-in once.
let observer: IntersectionObserver | null = null;
function observeReveals(root: HTMLElement) {
  observer?.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          observer?.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  root.querySelectorAll("[data-reveal]").forEach((el) => observer?.observe(el));
}

const SPEC_BANNER = `
  <div class="spec-banner" data-reveal>
    <b>This document does not exist.</b> It is a research-grounded prediction — a
    speculative-design exercise in what this leader <i>might</i> write, drafted from
    their real public statements (listed under “Grounded in” below) and the forms
    their tradition actually uses. No excerpt here is a real quote.
  </div>`;

/**
 * The method, as five stages. Kept here rather than in the markup so the flow
 * line is a list of content and not a wall of nested spans — and so the wording
 * has one home if it needs to change.
 */
const FLOW: { title: string; body: string }[] = [
  {
    title: "Source the record",
    body:
      "Collect what the leader has actually said about technology, science and the human person \u2014 addresses, encyclicals, rulings, sermons, interviews, institutional statements. Only material that can be cited and linked; anything unsourceable is left out rather than paraphrased.",
  },
  {
    title: "Read the tradition",
    body:
      "Establish the concepts that tradition reaches for when it argues about being human, and the written forms it actually uses. An encyclical, a directive from a seat of authority, a dharma talk and a pastoral letter are different instruments, and they carry an argument differently.",
  },
  {
    title: "Find the seams",
    body:
      "Read that record against Magnifica humanitas. Where would this leader stand with Leo, where would they break from him, and what would they raise that he never mentions? The disagreements are the useful part; agreement is cheap.",
  },
  {
    title: "Draft in form",
    body:
      "Write the document as that tradition would write it \u2014 its structure, register, length and way of reasoning \u2014 rather than summarising the leader's views in our voice. Where the record is thin the draft leans on the tradition's broader teaching and stays correspondingly cautious.",
  },
  {
    title: "Mark it, and show the workings",
    body:
      "Every predicted document says on its face that it does not exist, every excerpt is labelled as not a quote, and each page lists the sourced statements it was extrapolated from. The reader should never have to guess which half they are reading.",
  },
];

function homeView(): string {
  // The voice cards carry the leader's real, licensed portrait. The credit line
  // is rendered, not hidden: CC BY-SA requires visible attribution.
  const voices = LEADERS.map((l, i) => {
    const p = portraitOf(l.id);
    const plate = p
      ? `<img src="/magnifica/media/portraits/${esc(p.file)}" alt="${esc(p.alt)}" loading="${i < 8 ? "eager" : "lazy"}" decoding="async" />`
      : `<span class="v-mono" aria-hidden="true">${esc(monogram(l.name))}</span>`;
    return `
    <a class="voice" href="#/l/${esc(l.id)}" data-reveal>
      <span class="v-plate${p ? "" : " is-mono"}">
        ${plate}
        <span class="v-trad">${esc(l.tradition)}</span>
      </span>
      <span class="v-body">
        <span class="v-name">${esc(l.name)}</span>
        <span class="v-office">${esc(l.office)}</span>
        <span class="v-doc"><i>${esc(l.docTitle)}</i></span>
        <span class="v-type">${esc(l.docType)} \u00b7 predicted</span>
      </span>
      ${p ? `<span class="v-credit">${esc(p.credit)} \u00b7 ${esc(p.licence)}</span>` : ""}
    </a>`;
  }).join("");


  // The encyclical's author, shown on the banner as a print over the loop —
  // the same object a voice page floats over its own scene. Absent portrait,
  // absent print: the banner simply carries the loop.
  const leo = portraitOf("leo-xiv");

  return `
  <main class="wrap home">

    <header class="banner" data-reveal data-doc-loop="divine-touch">
      <div class="banner-art" data-par="0.12">
        <img src="/magnifica/media/stills/creation-hands.jpg"
             alt="A close detail of two hands reaching toward each other in the manner of Michelangelo's Creation of Adam; the hand on the right has seven fingers."
             fetchpriority="high" decoding="async" />
      </div>
      <div class="banner-grid">
      <div class="banner-in">
        <span class="banner-kick">Futures Atlas \u00b7 speculative design</span>
        <h1 class="banner-title">Hypothetica<i>Magnifica</i></h1>
        <p class="banner-lede">
          In May 2026, Pope Leo XIV published <i>Magnifica humanitas</i> \u2014 the first
          papal encyclical on artificial intelligence. This project asks: what would
          other thought leaders say? We used AI to help imagine sixteen documents
          extrapolated from each leader\u2019s record on technology. One is real; the rest
          are predictions rooted in research.
        </p>
        <a class="banner-cta" href="#x-voices">
          <span class="cta-ring" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                 stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>
          </span>
          <span class="cta-word">Let\u2019s explore</span>
        </a>
      </div>
      ${leo ? `
      <figure class="x-polaroid x-polaroid-hero banner-print" data-par="0.18">
        <video src="/magnifica/media/loops/pope-leo.mp4"
               autoplay muted loop playsinline preload="metadata"
               aria-label="${esc(leo.alt)}"></video>
      </figure>` : ""}
      </div>
    </header>

    <section class="sect" id="x-voices">
      <span class="lbl">The voices \u2014 imagined</span>
      <h2 class="sect-title" data-reveal>What would the others teach us?</h2>
      <p class="sect-lede" data-reveal>
        ${LEADERS.length} traditions, ${LEADERS.length} imagined answers. Picture each leader setting down
        what their tradition knows about being human \u2014 about work, truth, power,
        patience and the soul \u2014 and turning it on the machines. Where would they
        stand with Leo? Where would they break from him? Each document is a
        prediction built from that leader\u2019s real record rather than a quotation
        from it. Choose a voice.
      </p>
      <div class="voices">${voices}</div>
    </section>

    <section class="sect flow" id="x-method">
      <span class="lbl">Method</span>
      <h2 class="sect-title" data-reveal>How the ${LEADERS.length} were predicted</h2>
      <p class="sect-lede" data-reveal>
        Half of this project is fact and half is invention, and it only works if you
        can tell which is which. Five stages, in order \u2014 the first three are
        research, the fourth is the writing, and the fifth is what keeps the two
        halves apart.
      </p>

      <ol class="flow-line">
        ${FLOW.map((f, n) => `
        <li class="flow-step" data-reveal>
          <span class="flow-num">${String(n + 1).padStart(2, "0")}</span>
          <h3 class="flow-h">${esc(f.title)}</h3>
          <p class="flow-p">${esc(f.body)}</p>
        </li>`).join("")}
      </ol>
    </section>
  </main>`;
}

function leaderView(l: Leader): string {
  const excerpts = l.excerpts
    .map(
      (e, i) => `
      <blockquote class="ex" data-reveal>${esc(e)}
        <footer>Predicted excerpt ${i + 1} · not a real quote</footer>
      </blockquote>`
    )
    .join("");

  const conv = l.convergence.map((c) => `<li>${esc(c)}</li>`).join("");
  const div = l.divergence.map((d) => `<li>${esc(d)}</li>`).join("");
  const grounding = l.grounding
    .map(
      (g) => `<li>${esc(g.claim)}${g.url ? ` — <a href="${esc(g.url)}" target="_blank" rel="noopener">source</a>` : ""}</li>`
    )
    .join("");

  return `
  <main class="wrap">
    <a class="back" href="#/">&larr; All voices</a>
    <header class="mast" data-hero="${esc(l.id)}">
      <span class="ld-trad">${esc(l.tradition)} · speculative document</span>
      <h1 data-reveal>${esc(l.docTitle)}</h1>
      ${l.docTitleTranslation ? `<p class="mast-tr" data-reveal>${esc(l.docTitleTranslation)}</p>` : ""}
      <p class="mast-by" data-reveal>${esc(l.name)} <span>· ${esc(l.office)}</span></p>
      <span class="doc-type" data-reveal>${esc(l.docType)}</span>
    </header>
    ${SPEC_BANNER}

    <p class="summary" data-reveal>${esc(l.summary)}</p>

    <section class="sect">
      <span class="lbl">Predicted excerpts</span>
      <div class="excerpts">${excerpts}</div>
      ${l.voiceNotes ? `<p class="voice" data-reveal>Voice: ${esc(l.voiceNotes)}</p>` : ""}
    </section>

    <section class="sect">
      <span class="lbl">Read against Magnifica humanitas</span>
      <div class="vs">
        <div class="panel" data-reveal><h4>Where they would agree</h4><ul>${conv}</ul></div>
        <div class="panel" data-reveal><h4>Where they would differ</h4><ul>${div}</ul></div>
      </div>
    </section>

    <section class="sect grounding">
      <span class="lbl">Grounded in — real, sourced</span>
      <p class="sect-lede" data-reveal>${esc(l.bio)}</p>
      <ul data-reveal>${grounding}</ul>
    </section>
  </main>`;
}

/**
 * The overview's own loop + parallax. The voice pages get this from
 * mountExperience; the overview is not an experience view, so it carries a
 * small version of the same idea: one video plate behind the source-document
 * hero, and a rAF-throttled scroll pass moving [data-par] layers within it.
 *
 * Skipped entirely under prefers-reduced-motion — parallax is a vestibular
 * trigger, not a taste — and the still plate simply stays put.
 */
function mountDocHero(root: HTMLElement): () => void {
  // Two of these now — the banner and the source-document hero — so every
  // [data-doc-loop] gets its own loop and its own parallax pass. Querying a
  // single one meant the first found took the video and the other went dark.
  const heroes = Array.from(root.querySelectorAll<HTMLElement>("[data-doc-loop]"));
  const stops = heroes.map(mountLoopHero);
  return () => stops.forEach((stop) => stop());
}

function mountLoopHero(hero: HTMLElement): () => void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // The still inside .banner-art is the poster: it is already on screen at
  // full priority, so the video fades in over it and there is never a gap.
  const bg = hero.querySelector<HTMLElement>(".doc-bg, .banner-art");

  if (bg) {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("aria-hidden", "true");
    video.src = `/magnifica/media/loops/${hero.dataset.docLoop}.mp4`;
    video.addEventListener("loadeddata", () => {
      hero.classList.add("has-bg");
      bg.appendChild(video);
      video.play().catch(() => {});
    }, { once: true });
    video.addEventListener("error", () => video.remove(), { once: true });
  }

  if (reduce) return () => {};

  const layers = Array.from(hero.querySelectorAll<HTMLElement>("[data-par]")).map((el) => ({
    el,
    rate: parseFloat(el.dataset.par || "0"),
  }));
  if (layers.length === 0) return () => {};

  // Geometry once, not per frame: getBoundingClientRect() inside the frame
  // forces a synchronous reflow, which is what made this motion clunky.
  let top = 0;
  let height = 0;
  const measure = () => {
    const r = hero.getBoundingClientRect();
    top = r.top + window.scrollY;
    height = r.height;
  };
  measure();

  let running = false;
  let lastY = -1;
  let idle = 0;

  const frame = () => {
    const y = window.scrollY;
    if (y !== lastY) {
      lastY = y;
      idle = 0;
      const vh = window.innerHeight;
      const offset = top + height / 2 - y - vh / 2;
      for (const l of layers) {
        l.el.style.transform = `translate3d(0, ${(offset * -l.rate).toFixed(2)}px, 0)`;
      }
    } else if (++idle > 4) {
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  };

  const kick = () => {
    if (running) return;
    running = true;
    idle = 0;
    requestAnimationFrame(frame);
  };
  const onResize = () => {
    measure();
    kick();
  };

  kick();
  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  return () => {
    window.removeEventListener("scroll", kick);
    window.removeEventListener("resize", onResize);
    running = false;
  };
}

/** Try the scene's hero loop; if the bundle carries no video, do nothing. */
function mountHero(root: HTMLElement) {
  const mast = root.querySelector<HTMLElement>("[data-hero]");
  if (!mast) return;
  const id = mast.dataset.hero!;
  const video = document.createElement("video");
  video.className = "hero-video";
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.setAttribute("aria-hidden", "true");
  video.src = `/magnifica/media/loops/${id}.mp4`;
  video.addEventListener("loadeddata", () => {
    mast.classList.add("has-hero");
    mast.prepend(video);
    video.play().catch(() => {});
  });
  video.addEventListener("error", () => video.remove());
}

function homeParts(): Part[] {
  return [
    {
      label: "Introduction",
      text: `Magnifica. In May 2026, Pope Leo the Fourteenth published Magnifica humanitas — the first papal encyclical on artificial intelligence. This experience explores the real document, then asks what the equivalent might sound like from the world's other great faiths. ${ENCYCLICAL.context}`,
    },
    ...CHAPTERS.map((c) => ({ label: c.label, text: `${c.label}. ${c.title}. ${c.summary}` })),
  ];
}

function leaderParts(l: Leader): Part[] {
  return [
    {
      label: "A note before we begin",
      text: `A note before we begin. The document you are about to hear does not exist. It is a research-grounded prediction of what ${l.name} might write about artificial intelligence, drafted from their real public statements. No passage is a real quote, and this is not their voice.`,
    },
    {
      label: "The document",
      text: `${l.docTitleTranslation || l.docTitle}. Imagined as ${l.docType}, by ${l.name}, ${l.office}. ${l.summary}`,
    },
    ...l.excerpts.map((e, i) => ({ label: `Predicted excerpt ${i + 1}`, text: e })),
  ];
}

/** Torn down on every route change, so observers don't accumulate. */
let unmountX: (() => void) | null = null;

/**
 * Routes. `#/l/<id>` is the current experience; `#/v1/<id>` keeps the previous
 * one alive at its own URL so the two can be compared side by side rather than
 * from memory. Leaders with no experience entry fall back to the reading view
 * on either route.
 */
function render(root: HTMLElement) {
  const mV2 = location.hash.match(/^#\/l\/([\w-]+)/);
  const mV1 = location.hash.match(/^#\/v1\/([\w-]+)/);
  const mV3 = location.hash.match(/^#\/v3\/([\w-]+)/);
  const mV4 = location.hash.match(/^#\/v4\/([\w-]+)/);
  const id = mV2?.[1] ?? mV1?.[1] ?? mV3?.[1] ?? mV4?.[1];
  const leader = id ? LEADERS.find((l) => l.id === id) : undefined;
  const variant: Variant = mV1 ? "v1" : mV3 ? "v3" : mV4 ? "v4" : "v2";
  const immersive = !!leader && hasExperience(leader.id);

  unmountDock();
  unmountX?.();
  unmountX = null;

  root.innerHTML = !leader
    ? homeView()
    : immersive
      ? variant === "v4"
        ? experience4View(leader)
        : experienceView(leader, variant)
      : leaderView(leader);

  if (leader && immersive) {
    root.insertAdjacentHTML(
      "beforeend",
      `<nav class="x-versions" aria-label="Design version">
         <a href="#/v1/${leader.id}"${variant === "v1" ? ' class="on"' : ""}>v1</a>
         <a href="#/l/${leader.id}"${variant === "v2" ? ' class="on"' : ""}>v2</a>
         <a href="#/v3/${leader.id}"${variant === "v3" ? ' class="on"' : ""}>v3</a>
         <a href="#/v4/${leader.id}"${variant === "v4" ? ' class="on"' : ""}>v4</a>
       </nav>`,
    );
  }

  // The slide-out index belongs to the voices, not to the overview that lists
  // them. Navigation, not page content: kept across voice-to-voice moves.
  if (leader) mountDrawer();
  else unmountDrawer();

  window.scrollTo(0, 0);
  markPinned(root.querySelector<HTMLElement>(".x-versions"));

  root.querySelectorAll("[data-ch] > button").forEach((btn) => {
    btn.addEventListener("click", () => btn.parentElement?.classList.toggle("open"));
  });

  if (leader) {
    if (immersive) unmountX = variant === "v4" ? mountExperience4(root) : mountExperience(root);
    else mountHero(root);
    // The v2 script is section-aware: its parts carry the anchors the player
    // scrolls to and the elements the read-along follows. v1 predates that.
    const scene = SCENES[leader.id] ?? HOME_SCENE;
    const script = immersive ? experienceParts(leader) : leaderParts(leader);
    // v3 has no dock: each panel drives itself.
    if (variant === "v3" && immersive) mountPanels(root, script, scene);
    else mountDock(root, script, scene);
  } else {
    unmountX = mountDocHero(root);
    // The overview is a contents page, not a reading: no transport here.
    void homeParts;
  }

  observeReveals(root);
}

export function boot(root: HTMLElement) {
  /*
   * In-page section links must not touch location.hash. This is a hash-routed
   * app, so an href of "#x-03" reads as an unknown route and falls through to
   * the home view — which is what made the chapter rail appear to reload the
   * page. Route links (#/…) are left alone; section links are scrolled here.
   * Bound once on the container, since render() replaces its contents.
   */
  root.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest?.("a[href^='#x']") as HTMLAnchorElement | null;
    if (!a) return;
    const target = document.getElementById(a.getAttribute("href")!.slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  render(root);
  window.addEventListener("hashchange", () => {
    render(root);
    markDrawerRoute();
  });
}
