import { ENCYCLICAL, CHAPTERS, THEMES, QUOTES, SOURCES } from "./encyclical";
import { LEADERS, type Leader } from "./leaders";
import { SCENES, HOME_SCENE } from "./scenes";
import { mountDock, mountPanels, unmountDock, type Part } from "./listen";
import { experienceView, experienceParts, hasExperience, mountExperience, type Variant } from "./experience";
import { mountDrawer, unmountDrawer, markDrawerRoute, markPinned } from "./drawer";
import { portraitOf, monogram } from "./portraits";

/** Bare host for a source's footer, matching the feed's cards. */
const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

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

function homeView(): string {
  const chapters = CHAPTERS.map(
    (c, i) => `
    <div class="chapter${i === 0 ? " open" : ""}" data-ch>
      <button type="button">
        <span class="ch-l">${esc(c.label)}</span>
        <span class="ch-t">${esc(c.title)}</span>
        <span class="ch-r">${esc(c.range)}</span>
      </button>
      <p class="ch-body">${esc(c.summary)}</p>
    </div>`
  ).join("");

  const themes = THEMES.map(
    (t) => `<div class="theme" data-reveal><h4>${esc(t.title)}</h4><p>${esc(t.body)}</p></div>`
  ).join("");

  const quotes = QUOTES.map(
    (q) => `<blockquote class="q" data-reveal>\u201c${esc(q.text)}\u201d<footer>${esc(q.ref)}</footer></blockquote>`
  ).join("");

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


  const sources = SOURCES.map(
    (s) => `
    <a class="src-card${s.image ? "" : " no-img"}" href="${esc(s.url)}" target="_blank" rel="noopener">
      ${s.image ? `<span class="sc-plate"><img src="${esc(s.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" /></span>` : ""}
      <span class="sc-body">
        <span class="sc-meta">
          <span class="sc-kind">${esc(s.kind)}</span>
          <span class="sc-pub">${esc(s.publisher)}</span>
        </span>
        <span class="sc-label">${esc(s.label)}</span>
        <span class="sc-foot">${esc(hostOf(s.url))} \u2197</span>
      </span>
    </a>`
  ).join("");


  return `
  <main class="wrap home">

    <header class="banner" data-reveal>
      <div class="banner-art">
        <img src="/magnifica/media/stills/creation-hands.jpg"
             alt="A close detail of two hands reaching toward each other in the manner of Michelangelo's Creation of Adam; the hand on the right has seven fingers."
             fetchpriority="high" decoding="async" />
      </div>
      <div class="banner-in">
        <span class="banner-kick">Futures Atlas \u00b7 speculative design</span>
        <h1 class="banner-title">Hypothetica<i>Magnifica</i></h1>
        <p class="banner-lede">
          In May 2026, Pope Leo XIV published <i>Magnifica humanitas</i> \u2014 the first
          papal encyclical on artificial intelligence, and the first time one of the
          world\u2019s great traditions answered the question at full length.
        </p>
        <p class="banner-sub">
          So this project asks the obvious next question: what would the others say?
          Sixteen imagined documents, each extrapolated from that leader\u2019s own record
          on technology and the forms their tradition actually uses. One document here
          is real; the sixteen are predictions \u2014 rooted in research, not set in stone.
        </p>
        <a class="banner-cta" href="#x-voices">
          <span class="cta-ring" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                 stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>
          </span>
          <span class="cta-word">Let\u2019s explore</span>
        </a>
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

    <section class="doc-hero" id="x-doc" data-doc-loop="leo-xiv">
      <div class="doc-bg" aria-hidden="true" data-par="0.12"></div>
      <div class="doc-hero-grid">
        <div class="doc-hero-in">
          <span class="doc-eyebrow" data-reveal>The source document \u2014 real</span>
          <h2 class="doc-name" data-reveal><i>${esc(ENCYCLICAL.title)}</i></h2>
          <p class="doc-sub" data-reveal>${esc(ENCYCLICAL.translation)}</p>
          <p class="doc-strap" data-reveal>${esc(ENCYCLICAL.subtitle)}</p>
          <p class="doc-body" data-reveal>${esc(ENCYCLICAL.context)}</p>
          <div class="doc-facts" data-reveal>
            <span><b>${esc(ENCYCLICAL.author)}</b> \u00b7 ${esc(ENCYCLICAL.tradition)}</span>
            <span>Signed <b>${esc(ENCYCLICAL.signed)}</b></span>
            <span>Published <b>${esc(ENCYCLICAL.published)}</b></span>
          </div>
        </div>
        <figure class="doc-book" data-par="0.42">
          <img
            src="/magnifica/media/stills/magnifica-book.webp"
            alt="A bound edition of the encyclical Magnifica humanitas, standing upright"
            decoding="async"
          />
        </figure>
      </div>
    </section>

    <section class="sect doc">
      <h3 class="sub" data-reveal>What it says</h3>
      <div class="chapters" data-reveal>${chapters}</div>

      <h3 class="sub" data-reveal>Why it matters</h3>
      <div class="theme-grid">${themes}</div>

      <h3 class="sub" data-reveal>Key take-aways</h3>
      <div class="quote-strip">${quotes}</div>
    </section>

    <section class="sect research" id="x-method">
      <span class="lbl">Research, method &amp; sources</span>
      <h2 class="sect-title" data-reveal>How this was made</h2>
      <p class="lede-xl" data-reveal>
        Half of this project is fact and half is invention, and the whole thing only
        works if you can tell which is which. So the real encyclical is summarised
        from the published text and nothing else, every leader's page shows the
        sourced statements it was built from, and each predicted document says on
        its face that it does not exist.
      </p>
      <div class="method-cols">
        <div data-reveal>
          <h4>The real document</h4>
          <p>
            The digest of <i>Magnifica humanitas</i> is drawn from the published text and
            its coverage \u2014 the Vatican\u2019s own release, the full text, and the reporting
            and analysis listed below. Direct quotations are short, attributed excerpts.
          </p>
        </div>
        <div data-reveal>
          <h4>The sixteen predictions</h4>
          <p>
            For each leader we gathered their verified public statements on AI and
            technology, the concepts their tradition actually reaches for, and the
            written forms it actually uses \u2014 then drafted what an equivalent document
            might say, marked speculative throughout.
          </p>
        </div>
        <div data-reveal>
          <h4>Where the record is thin</h4>
          <p>
            Some leaders have said a great deal about AI; others almost nothing. Where
            the record is thin the prediction leans on the tradition\u2019s broader teaching
            and is correspondingly more cautious \u2014 and each page shows the sourced
            statements it was built from, so you can judge the reach for yourself.
          </p>
        </div>
        <div data-reveal>
          <h4>Portraits and likeness</h4>
          <p>
            No likeness here is generated. Every portrait is a real photograph under a
            free licence, credited on the card. This project documents leaders objecting
            to synthetic images of themselves; producing exactly that would answer the
            argument by proving it.
          </p>
        </div>
      </div>

      <h3 class="sub" data-reveal>What we read</h3>
      <p class="sect-lede" data-reveal>
        ${SOURCES.length} sources \u2014 the primary text, the reporting, the explainers, the
        criticism and the broadcast. Every link was fetched and checked.
      </p>
      <div class="src-masonry">${sources}</div>
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
  const hero = root.querySelector<HTMLElement>("[data-doc-loop]");
  if (!hero) return () => {};
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const bg = hero.querySelector<HTMLElement>(".doc-bg");

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
  const id = mV2?.[1] ?? mV1?.[1] ?? mV3?.[1];
  const leader = id ? LEADERS.find((l) => l.id === id) : undefined;
  const variant: Variant = mV1 ? "v1" : mV3 ? "v3" : "v2";
  const immersive = !!leader && hasExperience(leader.id);

  unmountDock();
  unmountX?.();
  unmountX = null;

  root.innerHTML = !leader
    ? homeView()
    : immersive
      ? experienceView(leader, variant)
      : leaderView(leader);

  if (leader && immersive) {
    root.insertAdjacentHTML(
      "beforeend",
      `<nav class="x-versions" aria-label="Design version">
         <a href="#/v1/${leader.id}"${variant === "v1" ? ' class="on"' : ""}>v1</a>
         <a href="#/l/${leader.id}"${variant === "v2" ? ' class="on"' : ""}>v2</a>
         <a href="#/v3/${leader.id}"${variant === "v3" ? ' class="on"' : ""}>v3</a>
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
    if (immersive) unmountX = mountExperience(root);
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
