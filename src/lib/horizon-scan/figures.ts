/**
 * A figure from the paper itself, for the ten at the top.
 *
 * arXiv renders most recent submissions to HTML at arxiv.org/html/<id>, and that
 * page carries the paper's own figures as ordinary images alongside it. Take the
 * first one and hot-link it — never copy it into the repo — which is the same
 * rule the feed already follows for a publisher's own artwork: it stays the
 * publisher's image, served by them, and it disappears if they pull it.
 *
 * Only the top ten, and only where an arXiv copy exists — either the record is
 * an arXiv posting or it is a journal paper whose arXiv twin OpenAlex listed
 * (about one in twelve).
 *
 * The other routes were measured and do not work for this page. Europe PMC has
 * a proper figures endpoint but zero coverage here: it deposits months late and
 * this window is weighted to the newest work. Publisher og:image is a generic
 * journal logo where it exists at all, which is the one thing the feed's own
 * rules forbid. Rendering page one of the OA PDF would work — 466 of 998
 * journal records carry a fetchable one — but sharp's libvips has no PDF
 * support, so it needs a rasteriser this function does not have.
 *
 * When a paper has no figure the entry has no picture, and cards below the ten
 * have no plate at all.
 *
 * Ten extra requests a day, unmetered, on a hard deadline. If arXiv is slow the
 * run gives up on pictures rather than on papers.
 */
import type { ScannedPaper } from "./types";

/**
 * The rendered thumbnail's dimensions, and they are small on purpose.
 *
 * It rides inline in the payload as a data URI, and a server-rendered page
 * serialises its props twice — once as HTML, once as the flight payload — so
 * every kilobyte here costs two on the wire. Shipping whole A4 pages at 460px
 * put 570KB on the page for six pictures.
 *
 * So crop to the 3:2 band the card actually shows, from the top of the page,
 * before encoding. Same visible result, forty per cent fewer pixels, and what
 * survives is the masthead and title rather than a shrunken whole page.
 */
const THUMB_W = 520;
const THUMB_H = Math.round((THUMB_W * 2) / 3);
const PAGE_QUALITY = 68;
/** Cap on how much PDF to pull before giving up. Some are 30MB of figures. */
const MAX_PDF_BYTES = 12_000_000;

const CONTACT = process.env.OPENALEX_CONTACT_EMAIL || "hello@frond.studio";

const PER_REQUEST_MS = 15_000;
/** The whole pass. A cold run has to stay inside the page's maxDuration. */
/**
 * The whole picture pass. Journal PDFs are 1-3MB apiece and ten of them at four
 * at a time is most of half a minute; at 20s the later workers were being cut
 * off mid-fetch and the board came back with one picture instead of six. The
 * cold run happens once a day and still has to land inside maxDuration.
 */
const BUDGET_MS = 32_000;
const CONCURRENCY = 5;

/** arXiv ids look like 2608.31173v1; the HTML lives under that exact string. */
function arxivId(url: string): string | null {
  return url.match(/arxiv\.org\/abs\/([^/?#]+)/i)?.[1] ?? null;
}

/**
 * The paper's images are the ones served from under its own id. Everything else
 * on that page is arXiv's chrome: the logo, the funder badges, a base64 sliver
 * used as a spacer.
 */
function firstFigure(html: string, id: string): { url: string; caption?: string } | null {
  const src = html.match(new RegExp(`src="(${id}/[^"]+\\.(?:png|jpe?g|gif|webp))"`, "i"))?.[1];
  if (!src) return null;
  // The caption nearest the top of the document, if the page has any at all.
  const caption = html
    .match(/<figcaption[^>]*>([\s\S]{0,400}?)<\/figcaption>/i)?.[1]
    ?.replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return {
    url: `https://arxiv.org/html/${src}`,
    caption: caption && caption.length <= 220 ? caption : undefined,
  };
}

async function fetchFigure(paper: ScannedPaper): Promise<{ url: string; caption?: string } | null> {
  // Either the record IS an arXiv posting, or it is a journal paper whose
  // arXiv twin OpenAlex knows about.
  const id = arxivId(paper.id) ?? arxivId(paper.arxivUrl ?? "");
  if (!id) return null;
  try {
    const res = await fetch(`https://arxiv.org/html/${id}`, {
      headers: { "User-Agent": `futures-atlas horizon-scan (${CONTACT})` },
      signal: AbortSignal.timeout(PER_REQUEST_MS),
    });
    if (!res.ok) return null;
    return firstFigure(await res.text(), id);
  } catch {
    return null;
  }
}

/**
 * The fallback: page one of the open-access PDF, rendered.
 *
 * Not a figure, a title page — which is what myxo's research list uses and it
 * reads well at card size: you can see at a glance that it is a paper, whose
 * journal it is, and roughly what shape the abstract takes. Only reached when
 * there is no arXiv figure to hot-link, because a real figure is better and
 * costs nothing to serve.
 *
 * The result rides inline as a data URI. It cannot be hot-linked (it is ours,
 * not the publisher's) and putting it behind a route would mean storing it,
 * which means KV — absent in development, which is where this gets looked at.
 * At 460px it is about 35KB, so ten of them is the same order as the page's own
 * text and it is cached with the run for a day.
 */
function dbg(paper: ScannedPaper, why: string): null {
  if (process.env.NODE_ENV !== "production")
    console.error(`[scan] no picture: ${why} — ${paper.title.slice(0, 44)}`);
  return null;
}

async function renderFirstPage(paper: ScannedPaper): Promise<string | null> {
  if (!paper.pdfUrl) return dbg(paper, "no open pdf listed");
  try {
    /*
     * Publisher-shaped headers, not because we are pretending to be a browser
     * but because several of them (Springer, Nature) answer a bare fetch with a
     * bot-check HTML page and a plain 200, which reads as a corrupt PDF. Others
     * (Elsevier, Taylor & Francis) answer 403 whatever you send, and those
     * simply have no picture. Every one of these files is open access; nothing
     * here gets past a paywall and nothing tries to.
     */
    const res = await fetch(paper.pdfUrl, {
      headers: {
        "User-Agent": `Mozilla/5.0 futures-atlas horizon-scan (${CONTACT})`,
        Accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(PER_REQUEST_MS),
    });
    if (!res.ok) return dbg(paper, `pdf HTTP ${res.status}`);
    const type = res.headers.get("content-type") ?? "";
    if (!/pdf/i.test(type)) return dbg(paper, `pdf served as ${type.slice(0, 40)}`); // a block page
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength === 0) return dbg(paper, "pdf empty");
    if (bytes.byteLength > MAX_PDF_BYTES) return dbg(paper, `pdf ${Math.round(bytes.byteLength / 1e6)}MB, too big`);

    // Imported here, not at module scope: mupdf is 15MB of wasm and only the
    // once-a-day cold run ever touches it.
    // Namespace imports, not `.default`: mupdf's ESM build has no default
    // export and destructuring one gives `TypeError: _ is not a function`
    // from deep inside the wasm glue, which reads like a render failure and
    // is not one.
    const [mupdf, sharpMod] = await Promise.all([import("mupdf"), import("sharp")]);
    const sharp = sharpMod.default ?? sharpMod;
    const doc = mupdf.Document.openDocument(Buffer.from(bytes), "application/pdf");
    const pix = doc
      .loadPage(0)
      .toPixmap(mupdf.Matrix.scale(1.1, 1.1), mupdf.ColorSpace.DeviceRGB, false, true);
    const jpeg = await sharp(Buffer.from(pix.asPNG()))
      .resize({ width: THUMB_W, height: THUMB_H, fit: "cover", position: "top" })
      .jpeg({ quality: PAGE_QUALITY, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (e) {
    if (process.env.NODE_ENV !== "production")
      console.error(`[scan] page render failed: ${(e as Error)?.name}: ${(e as Error)?.message?.slice(0, 160)}`);
    return null;
  }
}

/** Fills `figure` in place on the papers given. Never throws; a paper without a
 *  picture is a paper without a picture. */
export async function attachFigures(papers: ScannedPaper[]): Promise<void> {
  const deadline = Date.now() + BUDGET_MS;
  let next = 0;

  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= papers.length || Date.now() > deadline) return;
      const paper = papers[i];
      // A real figure from the paper first; its title page only as a fallback.
      const figure = await fetchFigure(paper);
      if (figure) {
        paper.figure = figure;
        continue;
      }
      const page = await renderFirstPage(paper);
      if (page) paper.figure = { url: page, kind: "page" };
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, papers.length) }, worker));
}
