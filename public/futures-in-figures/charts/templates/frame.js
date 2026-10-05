import { setLoop } from "./site-art.js";
// Futures Atlas data visual series: shared frame + helpers.
//
// A piece is one HTML page that calls mountPiece({...}). The URL decides what
// is drawn:
//   ?slide=<id>&format=ig|x[&theme=dark]  one frame, for export (render.mjs)
//   (no params)                           gallery of every slide, for review
//   ?slide=<id>&format=ig&capture=1       paused, for video export: window.__seek(t)
// When a single frame has finished drawing, window.__ready is set to true.
//
// Animation: a slide's draw() may return { duration, seek(t) }. seek(t) must
// put the chart in exactly the state for time t seconds (no hidden state), so
// a frame can be rendered in any order. Without capture=1 it plays on a loop.
// A still export is always the final frame, seek(duration).

let MARK = "";
let VARIANT = null;
/** The Futures Atlas mark as a Path2D in its own viewBox (299.3..725.3), for canvas art. */
export let MARK_PATH = null;

export const SIZES = { ig: [1080, 1350], x: [1600, 900], card: [1500, 1000] }; // card: the 3:2 project thumbnail, landscape layout

function frameHtml(piece, slide, format, index, total, data) {
  const count = total > 1 && format === "ig" ? `<span class="count">${index + 1}/${total}</span>` : "";
  const body = slide.html
    ? `<div class="prose">${typeof slide.html === "function" ? slide.html(format, data) : slide.html}</div>`
    : `<div class="chart" role="img" aria-label="${esc(slide.alt ?? "")}"></div>`;
  return `
    <div class="mast">
      <span class="lock">${MARK}<span>Futures Atlas</span></span>
      <span><span class="series">${esc(piece.series)}</span>${count}</span>
    </div>
    <div class="head">
      ${slide.kicker ? `<p class="kicker">${esc(slide.kicker)}</p>` : ""}
      <h1 class="title"${slide.titleSize?.[format] ? ` style="font-size:${slide.titleSize[format]}px"` : ""}>${esc(pick(slide.title, format))}</h1>
      ${slide.sub ? `<p class="sub">${esc(pick(slide.sub, format))}</p>` : ""}
    </div>
    ${body}
    <div class="foot">
      <span class="src">${pick(slide.source ?? piece.source, format)}</span>
    </div>`;
}

const pick = (v, format) => (v && typeof v === "object" ? v[format] ?? v.ig : v);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function buildFrame(piece, slide, format, theme, data) {
  const el = document.createElement("div");
  const v = piece.variants?.[VARIANT];
  el.className = `frame f-${format}${theme === "dark" ? " dark" : ""}${v ? ` ${v.theme}` : piece.theme ? ` ${piece.theme}` : ""}`;
  el.dataset.slide = slide.id;
  el.dataset.format = format;
  const ofFormat = piece.slides.filter((s) => (s.formats ?? ["ig"]).includes(format));
  el.innerHTML = (slide.bg ? '<canvas class="bg"></canvas>' : "") + frameHtml(piece, slide, format, ofFormat.indexOf(slide), ofFormat.length, data);
  return el;
}

// A post's timeline, as one seamless loop:
//   build (the chart's own animation) -> HOLD (finished, time to read) ->
//   REWIND (the build played backwards, eased) -> back to frame 0.
// The chart's state at the end of REWIND is its state at t = 0, and every
// background is periodic in the same total (setLoop), so the loop has no seam.
export const HOLD = 4;
export const REWIND = 1.2;

function loopTime(build, t) {
  if (t <= build) return t;
  if (t <= build + HOLD) return build;
  const p = Math.min(1, (t - build - HOLD) / REWIND);
  return build * (1 - ease(p));
}

async function draw(piece, slide, format, el, data) {
  const chart = el.querySelector(".chart");
  if (!chart || !slide.draw) return null;
  // layout size, not on-screen size: the gallery scales frames with a transform
  const width = chart.clientWidth, height = chart.clientHeight;
  const anim = await slide.draw({ el: chart, width, height, format, data, d3: window.d3 });
  const cv = el.querySelector("canvas.bg");
  const bg = slide.bg === true ? piece.variants?.[VARIANT]?.bg : slide.bg;
  const build = anim?.duration ?? 0;
  const total = build ? build + HOLD + REWIND : 8;
  let paint = () => {};
  if (cv && bg) {
    // background art: drawn at 2x, re-drawn on every seek so it can move
    const [W, H] = SIZES[format];
    cv.width = W * 2; cv.height = H * 2;
    const ctx = cv.getContext("2d");
    ctx.scale(2, 2);
    paint = (t) => { setLoop(total); ctx.clearRect(0, 0, W, H); bg(ctx, W, H, t, format, slide.id); };
  }
  if (!anim && !(cv && bg)) return null;
  return {
    duration: total, // a full loop
    still: build, // the finished chart, for PNG exports
    seek: (t) => { const u = ((t % total) + total) % total; paint(u); anim?.seek(loopTime(build, u)); },
  };
}

function play(anim) {
  const t0 = performance.now();
  const tick = (now) => { anim.seek((now - t0) / 1000); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}

export const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));
/** 0..1 progress of t through [a, b], eased */
export const span = (t, a, b) => ease((t - a) / (b - a));

export async function mountPiece(piece) {
  MARK = (await (await fetch(new URL("../vendor/fa.svg", import.meta.url))).text()).replace(/<\?xml[^>]*>/, "").replace(/fill="[^"]*"/g, "");
  MARK_PATH = new Path2D(/ d="([^"]+)"/.exec(MARK)[1]);
  const q = new URLSearchParams(location.search);
  VARIANT = q.get("v") ?? piece.variant;
  await document.fonts.load('700 72px "Archivo"');
  await document.fonts.load('400 20px "Archivo"');
  const data = piece.load ? await piece.load() : {};
  const id = q.get("slide");

  if (id && q.get("format") === "web") return mountWeb(piece, piece.slides.find((sl) => sl.id === id), data);
  if (id) {
    const format = q.get("format") ?? "ig";
    const slide = piece.slides.find((s) => s.id === id);
    if (!slide) throw new Error(`no slide ${id}`);
    const el = buildFrame(piece, slide, format, q.get("theme"), data);
    document.body.style.background = "transparent";
    document.body.append(el);
    const anim = await draw(piece, slide, format, el, data);
    await document.fonts.ready;
    window.__duration = anim?.duration ?? 0;
    window.__seek = (t) => anim?.seek(t);
    if (anim) {
      if (q.get("capture")) anim.seek(anim.still + HOLD / 2); // mid-hold: the finished chart
      else play(anim);
    }
    window.__ready = true;
    return;
  }

  // gallery
  document.title = `${piece.title} (gallery)`;
  const wrap = document.createElement("div");
  wrap.className = "gallery";
  document.body.append(wrap);
  const theme = q.get("theme");
  for (const format of ["ig", "x"]) {
    for (const slide of piece.slides.filter((s) => (s.formats ?? ["ig"]).includes(format))) {
      const scale = format === "ig" ? 0.42 : 0.5;
      const [w, h] = SIZES[format];
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.innerHTML = `<a href="?slide=${slide.id}&format=${format}${theme ? `&theme=${theme}` : ""}">${format} / ${slide.id}</a>`;
      const box = document.createElement("div");
      box.style.cssText = `width:${w * scale}px;height:${h * scale}px;overflow:hidden`;
      const scaler = document.createElement("div");
      scaler.className = "scaler";
      scaler.style.transform = `scale(${scale})`;
      const el = buildFrame(piece, slide, format, theme, data);
      scaler.append(el);
      box.append(scaler);
      cell.append(box);
      wrap.append(cell);
      const anim = await draw(piece, slide, format, el, data);
      if (anim) { cell.firstChild.textContent += " (animated)"; play(anim); }
    }
  }
  window.__ready = true;
}

// ---------- chart helpers ----------

/** Write 10^n as "10" + raised exponent (no reliance on superscript glyphs). */
export function pow10(textSel, n, { size = 23 } = {}) {
  textSel.text(null);
  textSel.append("tspan").text("10");
  textSel.append("tspan").attr("dy", -size * 0.42).attr("font-size", size * 0.74).text(String(n));
}

/** A log10 y axis with one tick per power of ten (or every `step`th). */
export function logAxisLeft(g, y, { step = 1, width, size = 23 } = {}) {
  const [lo, hi] = y.domain().map(Math.log10);
  const ticks = [];
  for (let e = Math.ceil(lo); e <= Math.floor(hi); e += 1) if (e % step === 0) ticks.push(e);
  const t = g.attr("class", "axis").selectAll("g").data(ticks).join("g").attr("transform", (e) => `translate(0,${y(10 ** e)})`);
  t.append("line").attr("x1", 0).attr("x2", width);
  t.append("text").attr("x", -12).attr("dy", "0.34em").attr("text-anchor", "end").each(function (e) { pow10(window.d3.select(this), e, { size }); });
  return ticks;
}

export async function loadCsv(url, row) {
  return window.d3.csv(url, row);
}

// ── Web mode: the chart as it appears on futures-atlas.com ────────────────
// ?slide=<id>&format=web. No post chrome (the page has its own heading,
// source and caveats) and no background art: just the chart, drawn in the
// landscape layout at its design size and scaled to the iframe's width, on a
// transparent ground. It plays once when scrolled into view, then holds; a
// click replays it. The posts are cut from this, not the other way round.
const WEB = [1600, 820];

async function mountWeb(piece, slide, data) {
  const [W, H] = WEB;
  const v = piece.variants?.[VARIANT];
  const el = document.createElement("div");
  el.className = `frame f-x f-web ${v ? v.theme : piece.theme ?? ""}`;
  el.innerHTML = `<div class="chart" role="img" aria-label="${esc(slide.alt ?? "")}"></div>`;
  document.documentElement.classList.add("web");
  document.body.append(el);
  const fit = () => { el.style.transform = `scale(${window.innerWidth / W})`; };
  fit();
  window.addEventListener("resize", fit);
  const chart = el.querySelector(".chart");
  const anim = await slide.draw({ el: chart, width: W, height: H, format: "x", data, d3: window.d3 });
  await document.fonts.ready;
  if (!anim) { window.__ready = true; return; }
  window.parent?.postMessage({ fifChart: piece.slug }, "*");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  anim.seek(reduce ? anim.duration : 0);
  let raf = 0;
  const run = () => {
    cancelAnimationFrame(raf);
    const t0 = performance.now();
    const tick = (now) => {
      const t = (now - t0) / 1000;
      anim.seek(Math.min(t, anim.duration));
      if (t < anim.duration) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };
  if (!reduce) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); run(); } }, { threshold: 0.35 });
    io.observe(el);
  }
  window.__replay = run; // the host page's Replay button calls this
  window.__ready = true;
}
