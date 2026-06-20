/**
 * GET /api/transmutate?u=<encoded-url>
 *
 * Fetches a web page server-side (avoiding CORS) and extracts the reusable
 * social-media elements from it: the headline + description, key images,
 * pull-quotes (blockquotes), section overviews (substantial paragraphs), and
 * outbound references. Returns structured JSON the client maps into library
 * frames. Purely extractive — it pulls what the page already contains.
 */

import { NextResponse } from "next/server";
import { parse, type HTMLElement } from "node-html-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const clean = (s: string | undefined | null) => (s ?? "").replace(/\s+/g, " ").trim();
const sameHost = (a: string, b: string) => a.replace(/^www\./, "") === b.replace(/^www\./, "");
// junk image heuristics: icons, sprites, tracking pixels, data URIs, svgs
const JUNK = /(^data:)|sprite|icon|favicon|logo|avatar|emoji|pixel|spacer|1x1|badge|button|\.svg(\?|$)/i;

// Extract a YouTube video id from any of its URL forms.
const YT_ID = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|v\/|watch\?(?:[^"'&\s]*&)*v=)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

// Pick the highest-resolution candidate from a srcset (descriptors are often
// UNORDERED and include tiny LQIP placeholders, so never just take the last one).
function bestFromSrcset(srcset: string): string {
  let best = "", bestW = -1;
  for (const part of srcset.split(",")) {
    const seg = part.trim().split(/\s+/);
    const u = seg[0];
    if (!u) continue;
    const d = seg[1] || "1x";
    const w = d.endsWith("w") ? parseInt(d, 10) : d.endsWith("x") ? parseFloat(d) * 1000 : 1;
    if (w > bestW) { bestW = w; best = u; }
  }
  return best;
}

// YouTube maxresdefault when it actually exists (its "unavailable" placeholder is
// a tiny image), else the always-present hqdefault.
async function bestYouTubePoster(id: string): Promise<string> {
  const max = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  try {
    const r = await fetch(max, { signal: AbortSignal.timeout(6000) });
    if (r.ok) { const b = await r.arrayBuffer(); if (b.byteLength > 8000) return max; }
  } catch { /* */ }
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export async function GET(request: Request) {
  const u = new URL(request.url).searchParams.get("u");
  if (!u) return NextResponse.json({ error: "Missing url." }, { status: 400 });

  let target: URL;
  try { target = new URL(u); } catch { return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 }); }
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return NextResponse.json({ error: "Only http(s) URLs are supported." }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(target.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403)
        return NextResponse.json({ error: "That page is private — it needs a login or is behind access protection (e.g. a Vercel preview URL), so it can't be imported. Try the public URL." }, { status: 502 });
      return NextResponse.json({ error: `The page returned ${res.status}.` }, { status: 502 });
    }
    const ct = res.headers.get("content-type") ?? "";
    if (!/text\/html|xml/.test(ct)) return NextResponse.json({ error: "That URL isn't an HTML page." }, { status: 415 });
    html = (await res.text()).slice(0, 4_000_000);
  } catch {
    return NextResponse.json({ error: "Couldn't reach that page (it may block bots or be offline)." }, { status: 502 });
  }

  const root = parse(html, { blockTextElements: { script: false, style: false, noscript: false } });
  const abs = (src: string | undefined) => { if (!src) return ""; try { return new URL(src.trim(), target).toString(); } catch { return ""; } };
  // Unwrap image-proxy URLs (Next.js /_next/image, etc.) to the full-resolution original.
  const deproxy = (u: string): string => {
    try {
      const url = new URL(u, target);
      if (url.pathname.endsWith("/_next/image") || url.pathname.endsWith("/_vercel/image")) {
        const orig = url.searchParams.get("url");
        if (orig) return abs(orig);
      }
    } catch { /* */ }
    return u;
  };
  const meta = (key: string) =>
    clean(root.querySelector(`meta[property="${key}"]`)?.getAttribute("content")) ||
    clean(root.querySelector(`meta[name="${key}"]`)?.getAttribute("content"));

  const title = meta("og:title") || meta("twitter:title") || clean(root.querySelector("title")?.text) || clean(root.querySelector("h1")?.text) || target.hostname;
  const description = meta("og:description") || meta("description") || meta("twitter:description");
  const siteName = meta("og:site_name") || target.hostname.replace(/^www\./, "");

  // If the URL itself is a YouTube video, import ONLY that video — nothing else.
  const ytSelf = target.toString().match(YT_ID);
  if (ytSelf) {
    const poster = await bestYouTubePoster(ytSelf[1]);
    return NextResponse.json({
      url: target.toString(), title, description, siteName,
      images: [], videos: [{ src: "", poster, title: title || "" }],
      quotes: [], headings: [], paragraphs: [], references: [],
    });
  }

  // ---- per-media labelling ----
  // Each media element is tagged with the nearest descriptive text so frames
  // describe their own content instead of all repeating the page title. We climb
  // a few ancestors and take the first heading/caption found in the smallest
  // enclosing card; failing that, the alt text or a humanised link slug.
  const HEADING_SEL = "h1,h2,h3,h4,h5,h6,figcaption,[class*='title'],[class*='caption'],[class*='heading'],[class*='name']";
  const humanize = (s: string) =>
    clean(decodeURIComponent(s).replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ")).replace(/\b\w/g, (c) => c.toUpperCase());
  const labelFor = (el: HTMLElement): string => {
    let node: HTMLElement | null = el;
    for (let i = 0; i < 6 && node; i++) {
      node = node.parentNode as HTMLElement | null;
      if (!node || typeof node.querySelector !== "function") break;
      const head = node.querySelector(HEADING_SEL);
      if (head) { const t = clean(head.text); if (t.length >= 4 && t.length <= 180) return t; }
      if (node.tagName === "A") {
        const al = clean(node.getAttribute("aria-label") || node.getAttribute("title") || "");
        if (al.length >= 4 && al.length <= 180) return al;
      }
    }
    const a = el.closest?.("a[href]");
    const seg = (a?.getAttribute("href") || "").split(/[?#]/)[0].replace(/\/+$/, "").split("/").pop() || "";
    if (seg.length > 2 && !/^https?:/.test(seg)) return humanize(seg);
    return "";
  };

  // ---- images ----
  const seenImg = new Set<string>();
  const images: { src: string; alt: string; title: string }[] = [];
  const pushImg = (raw: string | undefined, alt = "", title = "") => {
    const a = abs(raw);
    if (!a || JUNK.test(a) || seenImg.has(a)) return;
    seenImg.add(a);
    images.push({ src: a, alt: clean(alt), title: clean(title) });
  };
  for (const mm of root.querySelectorAll('meta[property="og:image"], meta[property="og:image:url"], meta[property="og:image:secure_url"], meta[name="twitter:image"], meta[name="twitter:image:src"], meta[property="twitter:image"]')) {
    pushImg(mm.getAttribute("content") || "");
  }
  pushImg(clean(root.querySelector('link[rel="image_src"]')?.getAttribute("href")));
  // Gather every srcset-like attribute on an element (covers lazy-load themes that
  // stash the real hi-res set in data-srcset / data-nectar-img-srcset / etc.).
  const allSrcset = (el: HTMLElement): string =>
    Object.entries(el.attributes).filter(([k, v]) => /srcset$/i.test(k) && v).map(([, v]) => v).join(", ");
  for (const s of root.querySelectorAll("picture source")) {
    const ss = allSrcset(s);
    if (ss) pushImg(deproxy(bestFromSrcset(ss)), "", labelFor(s));
  }
  for (const img of root.querySelectorAll("img")) {
    const w = parseInt(img.getAttribute("width") || "0", 10);
    const h = parseInt(img.getAttribute("height") || "0", 10);
    if ((w && w < 120) || (h && h < 120)) continue;
    // Prefer the real (often lazy-loaded, hi-res) source over a blurry LQIP placeholder.
    let src = img.getAttribute("data-nectar-img-src") || img.getAttribute("data-src") || img.getAttribute("data-lazy-src") || img.getAttribute("data-original") || img.getAttribute("src") || "";
    const srcset = allSrcset(img);
    if (srcset) src = bestFromSrcset(srcset); // highest-res candidate, not the last
    pushImg(deproxy(src), img.getAttribute("alt") || "", labelFor(img));
  }

  // ---- videos (direct-playable files + their poster images) ----
  const VIDEO_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i;
  const seenVid = new Set<string>();
  const videos: { src: string; poster: string; title: string }[] = [];
  const pushVid = (raw: string | undefined, poster: string | undefined, title = "") => {
    const a = abs(raw);
    if (!a || !VIDEO_EXT.test(a) || seenVid.has(a)) return; // only direct media plays in <video>; embeds are skipped
    seenVid.add(a);
    const p = abs(poster);
    const okPoster = p && !JUNK.test(p) ? p : "";
    if (okPoster) pushImg(okPoster, "video poster", title); // also scrub the poster as a standalone image
    videos.push({ src: a, poster: okPoster, title: clean(title) });
  };
  pushVid(meta("og:video:secure_url") || meta("og:video:url") || meta("og:video"), meta("og:image"));
  pushVid(meta("twitter:player:stream"), meta("twitter:image"));
  for (const v of root.querySelectorAll("video")) {
    // poster: explicit attr → inline background-image → Webflow background-video data-poster-url
    let poster = v.getAttribute("poster") || "";
    if (!poster) { const m = (v.getAttribute("style") || "").match(/background-image:\s*url\((['"]?)([^'")]+)\1\)/i); if (m) poster = m[2]; }
    if (!poster) { const bg = v.closest?.(".w-background-video, [data-poster-url]"); if (bg) poster = bg.getAttribute("data-poster-url") || ""; }
    let src = v.getAttribute("src") || v.getAttribute("data-src") || "";
    if (!src) {
      const sources = v.querySelectorAll("source");
      const mp4 = sources.find((s) => /mp4/i.test((s.getAttribute("type") || "") + " " + (s.getAttribute("src") || "")));
      const pick = mp4 ?? sources.find((s) => VIDEO_EXT.test(s.getAttribute("src") || ""));
      src = pick?.getAttribute("src") || "";
    }
    pushVid(src, poster, labelFor(v));
    if (videos.length >= 40) break;
  }

  // ---- YouTube embeds / links ----
  // A YouTube player can't be composited onto the export canvas, so we import the
  // video's poster thumbnail as a video frame (src left blank → renders the poster).
  const seenYt = new Set<string>();
  const pushYouTube = (rawUrl: string | undefined, el?: HTMLElement) => {
    if (!rawUrl || seenYt.size >= 12) return;
    const m = (rawUrl || "").match(YT_ID);
    const id = m?.[1];
    if (!id || seenYt.has(id)) return;
    seenYt.add(id);
    videos.push({ src: "", poster: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, title: el ? labelFor(el) : "" });
  };
  for (const f of root.querySelectorAll("iframe")) pushYouTube(f.getAttribute("src") || f.getAttribute("data-src") || "", f);
  for (const ly of root.querySelectorAll("lite-youtube, [data-youtube-id], [data-video-id], [data-ytid]")) {
    const id = ly.getAttribute("videoid") || ly.getAttribute("data-youtube-id") || ly.getAttribute("data-video-id") || ly.getAttribute("data-ytid") || "";
    if (/^[A-Za-z0-9_-]{11}$/.test(id)) pushYouTube(`https://youtu.be/${id}`, ly);
  }
  for (const a of root.querySelectorAll('a[href*="youtu"]')) pushYouTube(a.getAttribute("href") || "", a);
  pushYouTube(meta("og:video:url") || meta("og:video") || "");

  // ---- quotes ----
  const quotes: string[] = [];
  for (const b of root.querySelectorAll("blockquote, q, [class*='pullquote'], [class*='pull-quote']")) {
    const t = clean(b.text);
    if (t.length >= 25 && t.length <= 400 && !quotes.includes(t)) quotes.push(t);
    if (quotes.length >= 8) break;
  }

  // ---- headings (section + item titles) ----
  const headings: string[] = [];
  for (const hh of root.querySelectorAll("h1, h2, h3, h4")) {
    const t = clean(hh.text);
    if (t.length >= 8 && t.length <= 180 && !headings.includes(t)) headings.push(t);
    if (headings.length >= 24) break;
  }

  // ---- paragraphs (prefer article/main body) ----
  const scope: HTMLElement = root.querySelector("article") || root.querySelector("main") || root;
  const paragraphs: string[] = [];
  for (const p of scope.querySelectorAll("p")) {
    const t = clean(p.text);
    if (t.length >= 90 && !paragraphs.includes(t)) paragraphs.push(t);
    if (paragraphs.length >= 20) break;
  }

  // ---- references (outbound links with meaningful anchors) ----
  const seenRef = new Set<string>();
  const references: { href: string; text: string }[] = [];
  for (const a of root.querySelectorAll("a[href]")) {
    const href = abs(a.getAttribute("href"));
    const text = clean(a.text);
    if (!href || text.length < 12 || text.length > 120) continue;
    let hu: URL; try { hu = new URL(href); } catch { continue; }
    if (hu.protocol !== "https:" && hu.protocol !== "http:") continue;
    if (sameHost(hu.hostname, target.hostname)) continue;
    if (seenRef.has(href)) continue;
    seenRef.add(href);
    references.push({ href, text });
    if (references.length >= 12) break;
  }

  // ---- deep content (client-rendered apps) ----
  // Next.js RSC / SPAs ship their real content inside <script> JSON (self.__next_f,
  // __NEXT_DATA__, application/json) rather than as DOM nodes — so a DOM scrape comes
  // back almost empty. When that happens, recover media URLs + prose text from those
  // embedded payloads.
  if (images.length + videos.length + paragraphs.length + headings.length < 4) {
    let flight = "";
    for (const m of html.matchAll(/self\.__next_f\.push\((\[[\s\S]*?\])\)/g)) {
      try { const arr = JSON.parse(m[1]); if (typeof arr[1] === "string") flight += arr[1] + "\n"; } catch { /* */ }
    }
    for (const m of html.matchAll(/<script[^>]*type="application\/(?:json|ld\+json)"[^>]*>([\s\S]*?)<\/script>/gi)) flight += m[1] + "\n";
    const ndm = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
    if (ndm) flight += ndm[1] + "\n";
    if (!flight) flight = html;

    for (const m of flight.matchAll(/https?:\/\/[^\s"'\\<>()]+\.(?:jpg|jpeg|png|webp|avif|gif)(?:\?[^\s"'\\<>()]*)?/gi)) pushImg(m[0]);
    for (const m of flight.matchAll(/https?:\/\/[^\s"'\\<>()]+\.(?:mp4|webm|m4v|mov)(?:\?[^\s"'\\<>()]*)?/gi)) pushVid(m[0], "");

    // Prose strings: JSON string literals that read like sentences/labels, not code.
    const known = new Set([...headings, ...paragraphs, title, description].map((s) => s.toLowerCase()));
    for (const m of flight.matchAll(/"((?:[^"\\]|\\.){16,800})"/g)) {
      let t: string;
      try { t = clean(JSON.parse('"' + m[1] + '"')); } catch { continue; }
      if (t.length < 16 || t.length > 600) continue;
      if (/["[\]<>{};=_]|https?:\/\/|=>|[/\\]/.test(t)) continue; // drop markup / code / classnames / paths
      if (/(could not be found|enter the password|this site is private|sign in|skip to |^\d{3}\b)/i.test(t)) continue; // boilerplate
      const toks = t.split(/\s+/);
      if (toks.length < 3) continue;
      if (toks.filter((w) => /\d|--|[a-z]-[a-z]/.test(w)).length / toks.length > 0.3) continue; // mostly CSS/identifiers
      if ((t.match(/[A-Za-z]/g) || []).length / t.length < 0.6) continue;
      const lk = t.toLowerCase();
      if (known.has(lk)) continue;
      known.add(lk);
      if (t.length >= 80) { if (paragraphs.length < 16) paragraphs.push(t); }
      else if (headings.length < 20) headings.push(t);
      if (paragraphs.length >= 16 && headings.length >= 20) break;
    }
  }

  return NextResponse.json({
    url: target.toString(), title, description, siteName,
    images: images.slice(0, 40), videos: videos.slice(0, 40), quotes, headings, paragraphs: paragraphs.slice(0, 20), references,
  });
}
