import type { Storyboard } from "./types";

/**
 * The film, as one self-contained HTML document.
 *
 * This is the ONLY description of what a clip looks like. The editor previews
 * it in an iframe and the renderer screenshots it, so a preview is not an
 * approximation of the output — it is the output, stopped.
 *
 * THE TIMELINE IS THE POINT. Every animation is created paused and bound to a
 * single master clock that the renderer steps frame by frame. Nothing depends
 * on wall-clock time, so a slow frame cannot drop, a slow image cannot smear,
 * and two renders of the same storyboard are identical files. That is also why
 * the page waits for every image to decode before it reports ready.
 */

const ASPECTS = {
  "16:9": { w: 1920, h: 1080 },
  "9:16": { w: 1080, h: 1920 },
  "1:1": { w: 1080, h: 1080 },
} as const;

export function sceneSize(board: Storyboard) {
  return ASPECTS[board.aspect] ?? ASPECTS["16:9"];
}

export function sceneDurationMs(board: Storyboard): number {
  return board.shots.reduce((n, s) => n + s.durationMs, 0);
}

const FADE = 520;

/** Where the camera starts and ends for each move, as CSS transforms. */
const MOVES: Record<string, [string, string]> = {
  hold: ["scale(1.04)", "scale(1.06)"],
  "push-in": ["scale(1.02)", "scale(1.16)"],
  "pull-out": ["scale(1.18)", "scale(1.03)"],
  "pan-left": ["scale(1.14) translateX(3.2%)", "scale(1.14) translateX(-3.2%)"],
  "pan-right": ["scale(1.14) translateX(-3.2%)", "scale(1.14) translateX(3.2%)"],
  "tilt-down": ["scale(1.14) translateY(-3.6%)", "scale(1.14) translateY(3.6%)"],
};

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildSceneHtml(board: Storyboard): string {
  const { w, h } = sceneSize(board);
  const total = sceneDurationMs(board);

  let cursor = 0;
  const layers = board.shots.map((shot) => {
    const start = cursor;
    cursor += shot.durationMs;
    const [from, to] = MOVES[shot.motion] ?? MOVES["push-in"];
    const hasImage = Boolean(shot.asset.src);

    const caption = shot.caption
      ? `<figcaption class="cap">
           <div class="rule"></div>
           <p class="q">&ldquo;${escape(shot.caption.text)}&rdquo;</p>
           <p class="src">${escape(shot.caption.attribution)}</p>
         </figcaption>`
      : "";

    const card = shot.titleCard
      ? `<div class="card"><p>${escape(shot.titleCard)}</p></div>`
      : "";

    const plate = hasImage
      ? `<div class="bed" style="background-image:url('${escape(shot.asset.src)}')"></div>
         <div class="plate"><img src="${escape(shot.asset.src)}" alt=""></div>`
      : `<div class="blank"></div>`;

    return {
      start,
      duration: shot.durationMs,
      from,
      to,
      html: `<figure class="shot" data-start="${start}" data-dur="${shot.durationMs}"
                     data-from="${escape(from)}" data-to="${escape(to)}">
               ${plate}<div class="scrim"></div>${card}${caption}
             </figure>`,
    };
  });

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escape(board.title)}</title>
<style>
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#0d0c0a;overflow:hidden}
  #stage{position:relative;width:${w}px;height:${h}px;overflow:hidden;background:#0d0c0a;
         font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif}
  .shot{position:absolute;inset:0;margin:0;opacity:0;will-change:opacity}
  /* A blurred, enlarged copy of the leaf fills the frame behind the sharp one,
     so a portrait page can sit whole on a landscape screen without either
     cropping the text or floating on a flat slab. */
  .bed{position:absolute;inset:-8%;background-size:cover;background-position:center;
       filter:blur(48px) saturate(.6) brightness(.42);transform:scale(1.1)}
  /* The leaf sits in the upper two thirds so the caption band is never over
     the body of the page. A quotation laid across printed text is unreadable
     at any scrim strength, and darkening the page enough to fix it wastes the
     only picture we have. */
  .plate{position:absolute;inset:0;display:grid;place-items:start center;
         padding-top:${Math.round(h * 0.035)}px;will-change:transform}
  .plate img{max-width:${board.aspect === "9:16" ? "92%" : "58%"};max-height:70%;
             box-shadow:0 3.2rem 7rem rgba(0,0,0,.62);filter:contrast(1.04) saturate(.92)}
  .blank{position:absolute;inset:0;background:
         radial-gradient(120% 90% at 50% 30%, #24211b 0%, #100f0c 72%)}
  .scrim{position:absolute;inset:0;pointer-events:none;
         background:linear-gradient(180deg,rgba(13,12,10,.50) 0%,rgba(13,12,10,0) 22%,
                    rgba(13,12,10,.08) 46%,rgba(13,12,10,.72) 66%,rgba(13,12,10,.97) 80%,
                    rgba(13,12,10,1) 100%)}
  .cap{position:absolute;left:8%;right:8%;bottom:6.5%;margin:0;color:#f4efe4;max-width:82%}
  .cap .rule{width:${Math.round(w * 0.033)}px;height:2px;background:#d2705c;margin-bottom:${Math.round(h * 0.022)}px}
  .cap .q{margin:0;font-size:${Math.round(h * 0.044)}px;line-height:1.3;text-wrap:balance;
          text-shadow:0 2px 18px rgba(0,0,0,.65)}
  .cap .src{margin:${Math.round(h * 0.018)}px 0 0;font-size:${Math.round(h * 0.0165)}px;
            letter-spacing:.07em;color:#c3b9a9;
            font-family:ui-sans-serif,"Helvetica Neue",Helvetica,Arial,sans-serif}
  .card{position:absolute;inset:0;display:grid;place-items:center;padding:0 12%}
  .card p{margin:0;text-align:center;color:#f4efe4;font-size:${Math.round(h * 0.062)}px;
          line-height:1.18;text-wrap:balance;text-shadow:0 2px 24px rgba(0,0,0,.7)}
</style></head>
<body><div id="stage">${layers.map((l) => l.html).join("")}</div>
<script>
(function () {
  var FADE = ${FADE};
  var TOTAL = ${total};
  var anims = [];

  function build() {
    var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
    shots.forEach(function (el) {
      var start = +el.dataset.start, dur = +el.dataset.dur;
      var inMs = Math.min(FADE, dur / 2), outMs = Math.min(FADE, dur / 2);
      var span = dur + inMs;
      // Opacity: up over inMs, hold, down over outMs. Offsets are fractions of
      // the whole span, so the shot owns its own crossfade at both edges.
      anims.push(el.animate(
        [{ opacity: 0, offset: 0 },
         { opacity: 1, offset: inMs / span },
         { opacity: 1, offset: Math.max(inMs / span, (span - outMs) / span) },
         { opacity: 0, offset: 1 }],
        { duration: span, delay: Math.max(0, start - inMs), fill: 'both', easing: 'linear' }));

      var plate = el.querySelector('.plate') || el.querySelector('.blank');
      if (plate) {
        anims.push(plate.animate(
          [{ transform: el.dataset.from }, { transform: el.dataset.to }],
          { duration: dur + inMs * 2, delay: Math.max(0, start - inMs),
            fill: 'both', easing: 'cubic-bezier(.33,0,.25,1)' }));
      }
      var cap = el.querySelector('.cap') || el.querySelector('.card');
      if (cap) {
        anims.push(cap.animate(
          [{ opacity: 0, transform: 'translateY(' + Math.round(${h} * 0.024) + 'px)' },
           { opacity: 1, transform: 'none' }],
          { duration: 900, delay: start + 260, fill: 'both',
            easing: 'cubic-bezier(.2,.7,.3,1)' }));
      }
    });
    anims.forEach(function (a) { a.pause(); });
  }

  window.__duration = TOTAL;
  window.__seek = function (t) {
    for (var i = 0; i < anims.length; i++) anims[i].currentTime = t;
  };

  // Ready means every image has DECODED, not merely loaded: a frame captured
  // while a scan is still decoding is a frame of nothing.
  //
  // No crossorigin attribute on the images. The scans are served without
  // Access-Control-Allow-Origin, so requesting CORS makes the browser discard
  // a perfectly good response and every leaf renders empty. Nothing here reads
  // pixels back, so anonymous mode buys nothing and costs the picture.
  window.__ready = (async function () {
    var imgs = Array.prototype.slice.call(document.images);
    var failed = [];
    await Promise.all(imgs.map(function (img) {
      return img.decode().catch(function () { failed.push(img.src); return null; });
    }));
    // A leaf that will not decode must be loud: a silent failure renders a
    // caption over an empty frame, which reads as a claim about nothing.
    window.__failedImages = failed;
    if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
    build();
    window.__seek(0);
    return true;
  })();
})();
</script></body></html>`;
}
