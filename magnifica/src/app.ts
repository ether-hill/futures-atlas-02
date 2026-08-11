import { ENCYCLICAL, CHAPTERS, THEMES, QUOTES, RECEPTION, SOURCES } from "./encyclical";
import { LEADERS, type Leader } from "./leaders";
import { SCENES, HOME_SCENE } from "./scenes";
import { mountDock, unmountDock, type Part } from "./listen";

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
    (q) => `<blockquote class="q" data-reveal>“${esc(q.text)}”<footer>${esc(q.ref)}</footer></blockquote>`
  ).join("");

  const leaders = LEADERS.map(
    (l) => `
    <a class="leader" href="#/l/${l.id}" data-reveal>
      <span class="ld-trad">${esc(l.tradition)}</span>
      <span class="ld-name">${esc(l.name)}</span>
      <span class="ld-office">${esc(l.office)}</span>
      <span class="ld-doc">${esc(l.docTitle)}</span>
    </a>`
  ).join("");

  const reception = RECEPTION.map((r) => `<p>${esc(r)}</p>`).join("");
  const sources = SOURCES.map(
    (s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`
  ).join("");

  return `
  <main class="wrap">
    <header class="head">
      <h1 class="title" data-reveal>Magnifica</h1>
      <p class="intro" data-reveal>
        In May 2026, Pope Leo XIV published <i>Magnifica humanitas</i> — the first
        papal encyclical on artificial intelligence. One tradition has now spoken
        at full length. What would the equivalent document look like from the
        world's other great faiths? Explore the real encyclical below, then choose
        a leader and read a carefully grounded prediction of their answer.
      </p>
      <span class="spec-note" data-reveal><i></i>1 real document · ${LEADERS.length} research-grounded predictions</span>
    </header>

    <section class="sect" id="encyclical">
      <span class="lbl">The source document — real</span>
      <h2 class="sect-title" data-reveal><i>${esc(ENCYCLICAL.title)}</i> (${esc(ENCYCLICAL.translation)})</h2>
      <p class="sect-lede" data-reveal>${esc(ENCYCLICAL.subtitle)}. ${esc(ENCYCLICAL.context)}</p>
      <div class="doc-facts" data-reveal>
        <span><b>${esc(ENCYCLICAL.author)}</b> · ${esc(ENCYCLICAL.tradition)}</span>
        <span>Signed <b>${esc(ENCYCLICAL.signed)}</b></span>
        <span>Published <b>${esc(ENCYCLICAL.published)}</b></span>
        <span><b>245</b> paragraphs · <b>7</b> parts</span>
      </div>
      <div class="chapters" data-reveal>${chapters}</div>
    </section>

    <section class="sect">
      <span class="lbl">What it argues</span>
      <div class="theme-grid">${themes}</div>
      <div class="quote-strip">${quotes}</div>
    </section>

    <section class="sect" id="voices">
      <span class="lbl">The voices — speculative</span>
      <h2 class="sect-title" data-reveal>Sixteen other answers</h2>
      <p class="sect-lede" data-reveal>
        Each leader below is real, and everything attributed to them as fact is
        sourced. The <i>documents</i> are not real: they are predictive fiction —
        titles, arguments and excerpts extrapolated from each leader's actual
        record on technology, in the forms their tradition uses. Choose a voice.
      </p>
      <div class="leaders">${leaders}</div>
    </section>

    <section class="sect about">
      <span class="lbl">Method &amp; sources</span>
      <p data-reveal>
        The encyclical digest is factual, drawn from the published text and its
        coverage. The fifteen equivalents were produced by researching each
        leader's verified public statements on AI and technology, their
        tradition's relevant concepts, and their characteristic written forms —
        then drafting what an equivalent document might say, marked speculative
        throughout. Where a leader has said little about AI, the prediction leans
        on their tradition's broader teaching and is correspondingly more cautious.
      </p>
      <div data-reveal>${reception}</div>
      <ul class="src-list" data-reveal>${sources}</ul>
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

function render(root: HTMLElement) {
  const m = location.hash.match(/^#\/l\/([\w-]+)/);
  const leader = m ? LEADERS.find((l) => l.id === m[1]) : undefined;
  unmountDock();
  root.innerHTML = leader ? leaderView(leader) : homeView();
  window.scrollTo(0, 0);

  root.querySelectorAll("[data-ch] > button").forEach((btn) => {
    btn.addEventListener("click", () => btn.parentElement?.classList.toggle("open"));
  });

  if (leader) {
    mountHero(root);
    mountDock(root, leaderParts(leader), SCENES[leader.id] ?? HOME_SCENE);
  } else {
    mountDock(root, homeParts(), HOME_SCENE);
  }

  observeReveals(root);
}

export function boot(root: HTMLElement) {
  render(root);
  window.addEventListener("hashchange", () => render(root));
}
