#!/usr/bin/env node
/**
 * capture-project-shots.mjs — screengrab every Atlas project for the Social Composer.
 *
 * The composer opens as a library of ready-made frames. Two projects (The Odds,
 * Village Oracle) had hand-captured screens; every other project had to be pulled
 * in with "transmutate", which scrapes the DOM — and these projects are canvas,
 * WebGL and interactive pages with almost no DOM to scrape, so their libraries came
 * out as black text cards. This walks the real pages instead and captures them.
 *
 * For each project in src/data/projects.ts that has a `path`:
 *   • desktop 16:9, desktop 3:2 and mobile 9:16 of the entry screen
 *   • two scrolled desktop views when the page is taller than ~1.6 screens
 *   • the same for a few known sub-pages (EXTRA below)
 *
 * Output → social-composer/public/shots/<id>/*.jpg (committed; the deploy copies
 * the composer bundle into public/social-composer) plus the generated manifest at
 * social-composer/src/lib/composer/atlas-shots.ts.
 *
 * Real Chrome via Playwright, not raw headless: headless Chromium can't decode the
 * H.264 clips some projects play, and WebGL needs a real GL stack.
 *
 *   npm run dev                      # in one terminal (or BASE=<url>)
 *   node scripts/capture-project-shots.mjs            # everything
 *   node scripts/capture-project-shots.mjs theodds magnifica   # just these
 *
 * Draft projects are closed to the public, so the script signs in as an editor
 * with the first password in EDITOR_USERS (.env.local) and captures with that
 * cookie. Without it, drafts would screengrab the sign-in form.
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { projects } from "../src/data/projects.ts";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/user/Documents/atf-2026-app/node_modules/playwright");
const sharp = require("sharp");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "social-composer/public/shots");
const MANIFEST = path.join(ROOT, "social-composer/src/lib/composer/atlas-shots.ts");
const BASE = process.env.BASE || "http://localhost:3000";
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith("-"));

/** Sub-pages worth their own frames, keyed by project id. */
const EXTRA = {
  "odds-of-surviving-ai": [
    ["/theodds/dario-amodei", "Dario Amodei"],
    ["/theodds/elon-musk", "Elon Musk"],
    ["/theodds/max-tegmark", "Max Tegmark"],
    ["/theodds/stats", "Stats"],
  ],
  "hollow-villages": [["/village-oracle/oracle", "Oracle"], ["/village-oracle/research", "Research"]],
  "underground-intelligence": [["/underground-intelligence/story", "Story"], ["/underground-intelligence/dashboard", "Dashboard"]],
  "swipe-the-future": [["/swipe-the-future/stats", "Stats"]],
  "quantum-lag": [["/quantum-lag/study", "Study"]],
};

/** The three shapes the composer exports in, captured at their own aspect. */
const VIEWS = [
  { key: "d169", label: "16:9", w: 1600, h: 900, mobile: false, out: 1920 },
  { key: "d32", label: "3:2", w: 1620, h: 1080, mobile: false, out: 1920 },
  { key: "m916", label: "mobile", w: 390, h: 844, mobile: true, out: 1080 },
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** First password in EDITOR_USERS ("laura:pw,mike:pw"), so drafts open. */
function editorPassword() {
  try {
    const env = readFileSync(path.join(ROOT, ".env.local"), "utf8");
    const line = env.split("\n").find((l) => l.startsWith("EDITOR_USERS="));
    if (!line) return null;
    return line.slice("EDITOR_USERS=".length).replace(/^["']|["']$/g, "").split(",")[0].split(":")[1] || null;
  } catch { return null; }
}

async function signIn(context) {
  const pw = editorPassword();
  if (!pw) { console.warn("! no EDITOR_USERS in .env.local — draft projects will capture their sign-in page"); return; }
  const res = await context.request.post(`${BASE}/api/admin/login`, {
    form: { password: pw, next: "/" },
    maxRedirects: 0,
  });
  const ok = res.status() === 303 || res.status() === 302;
  console.log(ok ? "✓ signed in as editor" : `! editor sign-in returned ${res.status()}`);
}

/** Let the page settle: fonts, hero animations, canvas first paint. */
async function settle(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(2600);
}

/** Hide the shared nav so a screengrab isn't three-quarters chrome. */
async function hideChrome(page) {
  await page.addStyleTag({
    content: `.fa-shell, .fa-foot, .fa-share, [data-fa-nav], .fa-shell__bar { display: none !important; }
              body { padding-top: 0 !important; }`,
  }).catch(() => {});
}

async function shoot(page, view, dest) {
  const buf = await page.screenshot({ type: "png" });
  await sharp(buf).resize({ width: view.out, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(dest);
}

async function capturePage(context, url, view, dir, prefix, label, shots) {
  const page = await context.newPage();
  try {
    const res = await page.goto(url, { waitUntil: "commit", timeout: 45000 });
    if (res && res.status() >= 400) { console.warn(`   ✕ ${url} → ${res.status()}`); return; }
    await settle(page);
    await hideChrome(page);
    const file = `${prefix}-${view.key}.jpg`;
    await shoot(page, view, path.join(dir, file));
    shots.push({ file, label: `${label} · ${view.label}` });

    // Long page? Take it further down, desktop 16:9 only — the mobile and 3:2
    // frames of the same scroll position would just be the same picture again.
    if (view.key !== "d169") return;
    const tall = await page.evaluate(() => document.documentElement.scrollHeight / window.innerHeight);
    if (tall < 1.6) return;
    for (const [i, frac] of [0.45, 0.8].entries()) {
      if (frac > 0.5 && tall < 2.4) continue;
      await page.evaluate((f) => window.scrollTo({ top: document.documentElement.scrollHeight * f, behavior: "instant" }), frac);
      await page.waitForTimeout(1400);
      const f2 = `${prefix}-scroll${i + 1}-${view.key}.jpg`;
      await shoot(page, view, path.join(dir, f2));
      shots.push({ file: f2, label: `${label} · scroll ${i + 1} · ${view.label}` });
    }
  } catch (e) {
    console.warn(`   ✕ ${url} (${view.key}): ${e.message.split("\n")[0]}`);
  } finally {
    await page.close();
  }
}

const list = projects.filter((p) => p.path && (!ONLY.length || ONLY.includes(p.id)));
if (!list.length) { console.error("no matching projects"); process.exit(1); }

const browser = await chromium.launch({ channel: "chrome", headless: true });
const manifest = [];

for (const p of list) {
  console.log(`→ ${p.id} (${p.path})`);
  const dir = path.join(OUT, p.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const shots = [];
  const pages = [[p.path, "Home"], ...(EXTRA[p.id] ?? [])];

  for (const view of VIEWS) {
    const context = await browser.newContext(
      view.mobile
        ? { viewport: { width: view.w, height: view.h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
        : { viewport: { width: view.w, height: view.h }, deviceScaleFactor: 2 },
    );
    await signIn(context);
    for (const [sub, label] of pages) {
      await capturePage(context, BASE + sub, view, dir, slug(label), label, shots);
    }
    await context.close();
  }

  if (!shots.length) { console.warn(`   ! nothing captured for ${p.id}`); rmSync(dir, { recursive: true, force: true }); }
  // The card art already in the repo rides along — extra real imagery, no capture.
  const cards = [];
  for (const n of [p.image, `/projects/${p.id}.jpg`, `/projects/${p.id}-2.jpg`, `/projects/${p.id}-3.jpg`]) {
    if (n && !cards.includes(n) && existsSync(path.join(ROOT, "public", n.replace(/^\//, "")))) cards.push(n);
  }
  manifest.push({ id: p.id, title: p.title, tagline: p.tagline, field: p.field, path: p.path, cards, shots });
  console.log(`   ${shots.length} shots, ${cards.length} card images`);
}

await browser.close();

const header = `/**
 * atlas-shots.ts — GENERATED by scripts/capture-project-shots.mjs. Do not edit.
 *
 * One entry per Atlas project: its identity, the card art already in the repo,
 * and the screengrabs captured under social-composer/public/shots/<id>/.
 * atlas-source.ts turns an entry into a stocked ComposerSource.
 *
 * Re-run the script whenever a project's look changes.
 */

export type AtlasShot = { file: string; label: string };
export type AtlasProject = {
  id: string; title: string; tagline: string; field: string; path: string;
  cards: string[]; shots: AtlasShot[];
};

export const ATLAS_PROJECTS: AtlasProject[] = `;
writeFileSync(MANIFEST, header + JSON.stringify(manifest, null, 2) + ";\n");
console.log(`✓ manifest → ${path.relative(ROOT, MANIFEST)} (${manifest.length} projects)`);
