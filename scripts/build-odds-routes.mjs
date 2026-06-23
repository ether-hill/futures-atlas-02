#!/usr/bin/env node
/**
 * build-odds-routes.mjs — generate the per-player HTML entry files for "The Odds"
 * so social crawlers get route-specific OpenGraph/Twitter metadata (crawlers don't
 * run JS, so a single index.html can't preview each /theodds/{slug} differently).
 *
 * The piece is ONE static bundle (public/odds-of-surviving-ai/index.html). The body
 * is identical across routes — only the <head> route-meta block differs. We read
 * index.html, swap the block marked `OD:ROUTE-META:START … OD:ROUTE-META:END`, and
 * write public/odds-of-surviving-ai/p/{slug}.html for each player. next.config.ts
 * rewrites /theodds/{slug} → that file.
 *
 * The bundle is committed (no Vercel build step runs for it), so the generated
 * p/*.html files are committed too. Re-run this whenever the landing head changes:
 *   node scripts/build-odds-routes.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(__dirname, '..', 'public', 'odds-of-surviving-ai');
const DOMAIN = 'https://futures-atlas-02.vercel.app';

const ROUTES = [
  {
    slug: 'dario-amodei',
    title: "The Odds — Dario Amodei's 25%",
    ogTitle: 'Dario Amodei gives it a 25% chance of going really, really badly.',
    desc: "Roll the die on the Anthropic CEO's odds for humanity. Real, sourced, not a prediction.",
    image: '/og/dario-amodei.png',
  },
  {
    slug: 'elon-musk',
    title: "The Odds — Elon Musk's 1-in-5",
    ogTitle: 'Elon Musk puts annihilation at up to 1 in 5.',
    desc: "Spin the wheel on the xAI founder's odds for humanity. Real, sourced, not a prediction.",
    image: '/og/elon-musk.png',
  },
  {
    slug: 'max-tegmark',
    title: 'The Odds — Max Tegmark’s twelve futures',
    ogTitle: 'Max Tegmark maps twelve possible futures. Some without us.',
    desc: "Draw a card from the MIT physicist's twelve AI futures. Real, sourced, not a prediction.",
    image: '/og/max-tegmark.png',
  },
];

const META_RE = /<!-- OD:ROUTE-META:START[\s\S]*?OD:ROUTE-META:END -->/;

const src = readFileSync(join(BUNDLE, 'index.html'), 'utf8');
if (!META_RE.test(src)) {
  console.error('✗ Could not find the OD:ROUTE-META block in index.html — aborting.');
  process.exit(1);
}

const block = (r) => `<!-- OD:ROUTE-META:START (generated for /theodds/${r.slug} by scripts/build-odds-routes.mjs — do not hand-edit) -->
<title>${r.title}</title>
<meta name="description" content="${r.desc}" />
<meta property="og:title" content="${r.ogTitle}" />
<meta property="og:description" content="${r.desc}" />
<meta property="og:url" content="${DOMAIN}/theodds/${r.slug}" />
<meta property="og:image" content="${DOMAIN}${r.image}" />
<meta name="twitter:image" content="${DOMAIN}${r.image}" />
<!-- OD:ROUTE-META:END -->`;

mkdirSync(join(BUNDLE, 'p'), { recursive: true });
for (const r of ROUTES) {
  const out = src.replace(META_RE, block(r));
  writeFileSync(join(BUNDLE, 'p', `${r.slug}.html`), out);
  console.log(`✓ p/${r.slug}.html`);
}
console.log(`Done — ${ROUTES.length} route files written to public/odds-of-surviving-ai/p/`);
