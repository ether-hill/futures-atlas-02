/**
 * v4 — the reading, sideways.
 *
 * v1–v3 are the same idea at three media budgets: dark, cinematic, vertical,
 * a landscape behind every passage. v4 is the argument with the pictures taken
 * away. Paper ground, one statement per screen, and the track runs HORIZONTALLY
 * — so the document is paged through rather than scrolled past, and the reader
 * meets exactly one thing at a time.
 *
 * Content comes from `sections()` in experience.ts — the same list v1–v3 render
 * and the same list the narration is built from. Nothing here is authored: a
 * second copy of the content would drift from the script and desynchronise the
 * read-along, which is the bug this project has already paid for once.
 *
 * THE HONESTY FRAME, and why this version needed care.
 * The reference this was designed against (claude.com/hard-questions) is a
 * recording of real people saying real things; its whole force is "this is what
 * they shared". Every passage here is the opposite — predicted text attributed
 * to a living man who has objected to synthetic versions of himself. Borrowing
 * that grammar unaltered would make the design assert something false. So the
 * hinge is inverted: the opening statement is "This is what he has not said",
 * the gate is the second panel and cannot be paged past unseen, and every
 * excerpt keeps its "not a real quote" caption at full size rather than in
 * small print. The portrait is the one real thing and says so.
 */
import type { Leader } from "./leaders";
import { EXPERIENCES, sections, anchorOf, type Section } from "./experience";
import { portraitOf } from "./portraits";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const yearOf = (claim: string) => claim.match(/\b(19|20)\d{2}\b/)?.[0] ?? "";

/** One panel = one screen. `id` matches the narration anchor so the existing
 *  dock can drive the track by scrolling to it — no second sync mechanism. */
function panel(inner: string, id = "", cls = ""): string {
  return `<section class="p4 ${cls}"${id ? ` id="${esc(id)}"` : ""}>
    <div class="p4-in">${inner}</div>
  </section>`;
}

function sectionPanel(s: Section): string {
  const id = anchorOf(s);
  const num = s.n ? `<span class="p4-num">${esc(s.n)}</span>` : "";
  const head = `<p class="p4-label">${num}<span>${esc(s.label)}</span></p>`;

  switch (s.kind) {
    case "gate":
      return panel(
        `<p class="p4-label"><span>Before you read</span></p>
         <p class="p4-gate x-gate-in">${esc(s.body)}</p>`,
        id,
        "p4--gate",
      );

    case "chapter":
      return panel(`${head}<p class="p4-body x-body">${esc(s.body)}</p>`, id, "p4--chapter");

    case "quote":
      // The caption is the same size as a heading on purpose. Shrinking it is
      // how a disclaimer becomes decoration.
      return panel(
        `${head}
         <blockquote class="p4-quote">${esc(s.text)}</blockquote>
         <p class="p4-notquote" data-nospeak>Not a real quote — predicted text</p>`,
        id,
        "p4--quote",
      );

    case "list":
      return panel(
        `${head}
         <ul class="p4-points x-points">
           ${s.items.map((i) => `<li>${esc(i)}</li>`).join("")}
         </ul>`,
        id,
        "p4--list",
      );

    case "record":
      // The one section built from sourced fact. It gets the opposite treatment
      // to the excerpts: links out, on the record, no caveat needed.
      return panel(
        `${head}
         <p class="p4-real" data-nospeak>Real, sourced statements — the ground the prediction stands on</p>
         <ol class="p4-timeline x-timeline">
           ${s.items
             .map((i) => {
               const y = yearOf(i.claim);
               return `<li>
                 ${y ? `<span class="p4-year" data-nospeak>${esc(y)}</span>` : ""}
                 <span class="p4-claim">${esc(i.claim)}</span>
                 <a class="p4-src" data-nospeak href="${esc(i.url)}" target="_blank" rel="noopener">Source ↗</a>
               </li>`;
             })
             .join("")}
         </ol>`,
        id,
        "p4--record",
      );
  }
}

export function experience4View(l: Leader): string {
  const spec = EXPERIENCES[l.id];
  const name = spec?.displayName ?? l.name;
  const title = spec?.displayTitle ?? l.tradition;
  const secs = sections(l);
  const gate = secs.find((s) => s.kind === "gate");
  const rest = secs.filter((s) => s.kind !== "gate");
  const portrait = portraitOf(l.id);

  const opening = panel(
    `<p class="p4-kick">Hypothetica Magnifica · ${esc(l.tradition)}</p>
     <h1 class="p4-hero">This is what he has&nbsp;not said.</h1>
     <p class="p4-stand">
       In May 2026 Pope Leo XIV published the first papal encyclical on artificial
       intelligence. This is the answer ${esc(name)} has not written — a prediction
       built from his real record, not a quotation from it.
     </p>`,
    "x-open",
    "p4--open",
  );

  const listen = panel(
    `<p class="p4-invite">
       <button type="button" class="p4-listen" data-p4-listen>
         <span class="p4-dot" aria-hidden="true"></span>Listen
       </button>
       to the reading, or page through it yourself.
     </p>
     <p class="p4-note" data-nospeak>
       Read by a stock synthetic narrator. It is not ${esc(name)}’s voice, and no
       attempt is made to imitate it.
     </p>`,
    "x-listen",
    "p4--listen",
  );

  const who = panel(
    `<h2 class="p4-name">${esc(name)}</h2>
     <p class="p4-who">${esc(title)}.</p>
     ${
       portrait
         ? `<figure class="p4-print">
              <img src="/magnifica/media/portraits/${esc(portrait.file)}" alt="${esc(portrait.alt)}" />
              <figcaption>
                <span class="p4-print-lbl">The one real thing on this page</span>
                <span class="p4-print-credit">
                  <a href="${esc(portrait.sourceUrl)}" target="_blank" rel="noopener">${esc(portrait.credit)}</a>
                  · <a href="${esc(portrait.licenceUrl)}" target="_blank" rel="noopener">${esc(portrait.licence)}</a>
                </span>
              </figcaption>
            </figure>`
         : ""
     }`,
    "x-who",
    "p4--who",
  );

  const close = panel(
    `<h2 class="p4-hero p4-hero--end">Keep asking.</h2>
     <p class="p4-stand">
       Fifteen other traditions have not answered either. The overview holds the
       real encyclical, the method, and everything we read to build this.
     </p>
     <p class="p4-outlinks">
       <a href="#/">The project overview</a>
       <a href="#/l/${esc(l.id)}">Read this as v2</a>
     </p>`,
    "x-end",
    "p4--end",
  );

  const panels = [opening, gate ? sectionPanel(gate) : "", who, listen, ...rest.map(sectionPanel), close];

  return `
  <main class="x4" data-leader="${esc(l.id)}">
    <div class="x4-track" tabindex="0" aria-label="${esc(name)} — page through with the arrow keys">
      ${panels.join("")}
    </div>
    <div class="x4-hud" aria-hidden="true">
      <div class="x4-bar"><span class="x4-bar-fill"></span></div>
      <span class="x4-count"><b>01</b> / ${String(panels.filter(Boolean).length).padStart(2, "0")}</span>
    </div>
    <button type="button" class="x4-nudge" data-p4-next aria-label="Next panel">
      <span>Scroll</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </button>
  </main>`;
}

/**
 * Wheel → sideways, plus keys, plus a progress readout.
 *
 * The track is a real horizontally-scrolling element with scroll snapping, so
 * trackpads, touch, and a screen reader's own focus movement all work without
 * help. The only thing added is mapping a VERTICAL wheel onto it, because a
 * mouse wheel has no horizontal axis and the page would otherwise be unusable
 * with one. deltaX is left alone so a trackpad's real sideways swipe is not
 * doubled.
 */
export function mountExperience4(root: HTMLElement): () => void {
  const track = root.querySelector<HTMLElement>(".x4-track");
  if (!track) return () => {};
  const fill = root.querySelector<HTMLElement>(".x4-bar-fill");
  const count = root.querySelector<HTMLElement>(".x4-count b");
  const panels = Array.from(track.querySelectorAll<HTMLElement>(".p4"));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onWheel = (e: WheelEvent) => {
    // A trackpad swiping sideways already scrolls the track; only translate the
    // vertical axis, and only when it is the dominant one.
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    track.scrollLeft += e.deltaY;
  };

  const go = (dir: 1 | -1) => {
    const w = track.clientWidth;
    const i = Math.round(track.scrollLeft / w) + dir;
    const to = Math.max(0, Math.min(panels.length - 1, i)) * w;
    track.scrollTo({ left: to, behavior: reduce ? "auto" : "smooth" });
  };

  /*
   * Bound to the window, not the track. The track carries tabindex so it CAN
   * take focus, but nothing focuses it on arrival — so a reader pressing the
   * arrow keys on a fresh page got nothing at all (measured: three presses,
   * scrollLeft still 0). Typing in a field still wins, and modifier combos are
   * left alone so browser shortcuts keep working.
   */
  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
    else if (e.key === "Home") { e.preventDefault(); track.scrollTo({ left: 0, behavior: "smooth" }); }
    else if (e.key === "End") { e.preventDefault(); track.scrollTo({ left: track.scrollWidth, behavior: "smooth" }); }
  };

  let queued = false;
  const paint = () => {
    queued = false;
    const max = track.scrollWidth - track.clientWidth;
    const p = max > 0 ? track.scrollLeft / max : 0;
    if (fill) fill.style.transform = `scaleX(${p.toFixed(4)})`;
    if (count) {
      const i = Math.round(track.scrollLeft / track.clientWidth) + 1;
      count.textContent = String(Math.min(panels.length, Math.max(1, i))).padStart(2, "0");
    }
    root.classList.toggle("is-started", track.scrollLeft > 40);
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(paint);
  };

  const nudge = root.querySelector<HTMLElement>("[data-p4-next]");
  const onNudge = () => go(1);

  // The Listen pill hands off to the existing transport rather than starting a
  // second player: one narration, one set of ElevenLabs calls, one cache.
  const listen = root.querySelector<HTMLElement>("[data-p4-listen]");
  const onListen = () => {
    const play = document.querySelector<HTMLElement>(".mg-play, [data-play-all]");
    if (play) play.click();
  };

  track.addEventListener("wheel", onWheel, { passive: false });
  track.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", onScroll, { passive: true });
  nudge?.addEventListener("click", onNudge);
  listen?.addEventListener("click", onListen);
  paint();

  return () => {
    track.removeEventListener("wheel", onWheel);
    track.removeEventListener("scroll", onScroll);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onScroll);
    nudge?.removeEventListener("click", onNudge);
    listen?.removeEventListener("click", onListen);
  };
}
