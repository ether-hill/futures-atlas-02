#!/usr/bin/env node
/**
 * Build THE footer, once, from the same data the pages use.
 *
 * There used to be two: a React component for the host pages and a second one
 * atlas-nav.js typed out as a string for the sub-app bundles. They drifted,
 * because two implementations of one thing always do — different columns,
 * different links, and for a while different colours.
 *
 * Now there is one. One generator, two outputs, same string in both:
 *
 *   • public/atlas-footer.html — fetched at runtime by atlas-nav.js and
 *     appended on the static sub-app pages, which cannot run React.
 *   • src/generated/atlas-footer.ts — imported by <Footer>, so the host
 *     renders it server-side.
 *
 * The host gets a MODULE rather than reading the html file off disk. A
 * serverless function's filesystem is not public/ — Next traces the files a
 * route needs, and it cannot trace a readFileSync built from process.cwd(), so
 * the read would compile fine, work all through local dev, and then return
 * nothing in production. The failure mode is a silently missing footer on every
 * page of the site, which is precisely the class of bug that is impossible to
 * notice from a preview. Importing it makes the footer part of the bundle and
 * the question moot.
 *
 * Run from the build BEFORE next build, and from predev before next dev (see
 * package.json). Both outputs are git-ignored: they are build artifacts, and
 * committing a generated file that two people regenerate is how you get merge
 * conflicts in something nobody hand-edits.
 *
 * Node strips the TypeScript types on import, so projects.ts, posts.ts and
 * glossary.ts are read directly rather than duplicated.
 */

import { mkdir, writeFile } from "node:fs/promises";

const { liveProjects } = await import("../src/data/projects.ts");
const { livePosts, formatPostDate } = await import("../src/data/posts.ts");
const { GLOSSARY } = await import("../src/data/glossary.ts");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const IS_PRODUCTION = process.env.VERCEL_ENV === "production";
const INTERNAL_ONLY = !IS_PRODUCTION;

/**
 * The feed is staging-only too (STAGING_ONLY in src/middleware.ts), so on
 * production neither its column nor its Sections link is in the markup. The
 * footer's job here is the same as with the internal column: never link to a
 * page that is not there.
 */
const FEED_HERE = !IS_PRODUCTION;

const SECTIONS = [
  ["/", "Home"],
  ["/feed", "Feed", "feed"],
  ["/projects", "Projects"],
  ["/developers", "Developers"],
  ["/about", "About"],
  ["/contact", "Contact"],
].filter(([, , only]) => only !== "feed" || FEED_HERE);

/**
 * The internal column: the working pages, listed only where they exist.
 *
 * These are tools, not parts of the site — the design reference, the mark's
 * motion bench, the social mock-ups, the draft overview. On production the
 * middleware answers all of them with a 404, so linking to them there would be
 * advertising a set of dead ends. The column is emitted for preview builds and
 * for local dev, and simply is not in the markup on production.
 *
 * VERCEL_ENV is set by the platform: "production", "preview", or absent when
 * running locally.
 */

const INTERNAL = [
  ["/plan", "Plan"],
  ["/design-system", "Design system"],
  ["/style-guide", "Style guide"],
  ["/logo-animator", "Logo animator"],
  ["/mocks/instagram", "Instagram preview"],
  ["/mocks/gallery", "Browse mock · gallery"],
  ["/mocks/observatory", "Browse mock · observatory"],
  ["/mocks/signal", "Browse mock · signal"],
  ["/home-lab", "Home lab"],
  ["/editor", "Drafts overview"],
];

const projects = liveProjects.filter((p) => p.path || p.url).slice(0, 12);
const recent = FEED_HERE ? livePosts.slice(0, 6) : [];

/* The copyright year. The "last updated" stamp that used to sit beside it is
   gone with the rest of that line, so the month table went with it. */
const now = new Date();

const link = (href, label, cls = "fa-foot__link") =>
  `<a class="${cls}" href="${esc(href)}">${esc(label)}</a>`;

const html = `<div class="fa-foot__inner">
<div class="fa-foot__grid fa-foot__grid--${3 + (FEED_HERE ? 1 : 0) + (INTERNAL_ONLY ? 1 : 0)}">
<div class="fa-foot__col">
<a class="fa-foot__home" href="/" aria-label="Futures Atlas home"><span class="fa-foot__mark" aria-hidden="true"><img src="/fa.svg" alt="" width="22" height="22"></span><span class="fa-foot__word">Futures Atlas</span></a>
<p class="fa-foot__body">Building frameworks for foresight. Speculative-design projects, open-source tools, apps and prototypes exploring compute: quantum systems, AI, and the power structures driving them.</p>
<p class="fa-foot__body"><a class="fa-foot__a" href="https://github.com/ether-hill" target="_blank" rel="noopener">GitHub &#8599;</a> &middot; <a class="fa-foot__a" href="/about">License</a> &middot; <a class="fa-foot__a" href="/contact">Contact</a></p>
</div>
<div class="fa-foot__col">
<p class="fa-foot__h">Sections</p>
<nav class="fa-foot__list">${SECTIONS.map(([h, l]) => link(h, l)).join("")}</nav>
</div>
<div class="fa-foot__col">
<p class="fa-foot__h">Projects</p>
<nav class="fa-foot__list">${projects
  .map((p) =>
    p.path
      ? link(p.path, p.title)
      : `<a class="fa-foot__link" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)} &#8599;</a>`
  )
  .join("")}</nav>
<p class="fa-foot__meta">${link("/projects", "All projects →", "fa-foot__a")}</p>
</div>
${FEED_HERE ? `<div class="fa-foot__col">
<p class="fa-foot__h">Recent from the feed</p>
<nav class="fa-foot__list">${recent
  .map(
    (p) =>
      `<a class="fa-foot__post" href="/feed/${esc(p.slug)}"><span class="fa-foot__date">${esc(
        formatPostDate(p.posted)
      )} &middot; ${esc(p.topics[0])}</span><span class="fa-foot__ptitle">${esc(p.title)}</span></a>`
  )
  .join("")}</nav>
<p class="fa-foot__meta">${link("/feed", "The whole feed →", "fa-foot__a")}</p>
</div>` : ""}${INTERNAL_ONLY ? `
<div class="fa-foot__col fa-foot__internal">
<p class="fa-foot__h">Internal &middot; staging only</p>
<nav class="fa-foot__list">${INTERNAL.map(([h, l]) => link(h, l)).join("")}</nav>
<p class="fa-foot__meta">Not built on production.</p>
<!-- Sign out. It has to be a POST (it clears an httpOnly cookie) so it is a
     one-button form rather than a link, and it works with no JavaScript. This
     is the desktop way off a session now that the bar has no account button;
     the mobile sheet still carries its own. -->
<form class="fa-foot__signout" method="POST" action="/api/admin/logout"><button type="submit" class="fa-foot__a">Sign out</button></form>
</div>` : ""}
</div>
<div class="fa-foot__split">
<div class="fa-foot__col">
<p class="fa-foot__h">Use the work</p>
<p class="fa-foot__body">Open where it counts. Fork a project, adapt it, wire it into your own work. Attribution appreciated, permission not required. Research is free to cite and every source is linked. Project code is MIT, the research is CC BY 4.0.</p>
<p class="fa-foot__body"><a class="fa-foot__a" href="/developers">How it&rsquo;s built, and where every project&rsquo;s source lives &rarr;</a></p>
</div>
<div class="fa-foot__col">
<p class="fa-foot__h">Get in touch</p>
<p class="fa-foot__body">Used something from the Atlas in a workshop, a project or a classroom? We&rsquo;d like to hear how it went. Collaboration inquiries welcome.</p>
<p class="fa-foot__body"><a class="fa-foot__a" href="/contact">Contact form &rarr;</a></p>
</div>
</div>
<div class="fa-foot__row">
<span class="fa-foot__tag">&copy; ${now.getUTCFullYear()} Futures Atlas</span>
</div>
</div>`;

await writeFile(new URL("../public/atlas-footer.html", import.meta.url), html + "\n");

// The same string, as a module the host can import. Generated rather than
// hand-kept so there is still only one place the footer is written.
await mkdir(new URL("../src/generated/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../src/generated/atlas-footer.ts", import.meta.url),
  `// GENERATED by scripts/gen-footer.mjs — do not edit.\n` +
    `// Run \`npm run gen:footer\` (or any build / npm run dev) to regenerate.\n` +
    `export const FOOTER_HTML = ${JSON.stringify(html)};\n`
);

console.log(
  `→ one footer: ${SECTIONS.length} sections, ${projects.length} projects, ${recent.length} posts, ${GLOSSARY.length} glossary terms`
);
