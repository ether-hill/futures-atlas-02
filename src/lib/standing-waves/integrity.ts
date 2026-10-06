import { SOURCES } from "@/data/standing-waves/sources";
import { EVENTS } from "@/data/standing-waves/timeline";
import { PEOPLE } from "@/data/standing-waves/people";
import { MEDIA } from "@/data/standing-waves/media";
import { ARTICLES } from "@/data/standing-waves/articles";
import { citedIds, linkedEventIds } from "./cite";

/**
 * The build check. Returns every problem, not just the first, so one failed
 * build shows the whole list.
 *
 * Called from the project layout, which renders during `next build`'s page
 * data collection, so a dangling id fails the build rather than shipping a
 * page with a hole in it. `scripts/check-standing-waves` is not needed: the
 * layout IS the check, and it cannot be skipped by forgetting to run it.
 */
export function integrityProblems(): string[] {
  const out: string[] = [];
  const sourceIds = new Set(SOURCES.map((s) => s.id));
  const personIds = new Set(PEOPLE.map((p) => p.id));
  const mediaIds = new Set(MEDIA.map((m) => m.id));
  const eventIds = new Set(EVENTS.map((e) => e.id));
  const articleSlugs = new Set(ARTICLES.map((a) => a.slug));

  const dupes = (kind: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) out.push(`${kind} id "${id}" is used twice`);
      seen.add(id);
    }
  };
  dupes("source", SOURCES.map((s) => s.id));
  dupes("event", EVENTS.map((e) => e.id));
  dupes("person", PEOPLE.map((p) => p.id));
  dupes("media", MEDIA.map((m) => m.id));
  dupes("article", ARTICLES.map((a) => a.slug));

  for (const s of SOURCES) {
    if (!s.citation.trim()) out.push(`source "${s.id}" has no citation`);
    if (!/^https?:\/\//.test(s.url)) out.push(`source "${s.id}" has no usable url`);
    if (!s.verified && !s.todo) out.push(`source "${s.id}" is unverified and says nothing about why (add a todo)`);
  }

  for (const e of EVENTS) {
    if (e.sourceIds.length === 0) out.push(`event "${e.id}" has no sources`);
    for (const id of e.sourceIds) if (!sourceIds.has(id)) out.push(`event "${e.id}" cites missing source "${id}"`);
    for (const id of e.people) if (!personIds.has(id)) out.push(`event "${e.id}" names missing person "${id}"`);
    if (e.mediaId && !mediaIds.has(e.mediaId)) out.push(`event "${e.id}" shows missing media "${e.mediaId}"`);
    if (e.relatedArticle && !articleSlugs.has(e.relatedArticle))
      out.push(`event "${e.id}" links missing article "${e.relatedArticle}"`);
    if (!e.finding.trim()) out.push(`event "${e.id}" has no finding`);
  }

  for (const p of PEOPLE) {
    if (p.sourceIds.length === 0) out.push(`person "${p.id}" has no sources`);
    for (const id of p.sourceIds) if (!sourceIds.has(id)) out.push(`person "${p.id}" cites missing source "${id}"`);
    if (p.portraitMediaId && !mediaIds.has(p.portraitMediaId))
      out.push(`person "${p.id}" has missing portrait "${p.portraitMediaId}"`);
    const words = p.summary.trim().split(/\s+/).length;
    if (words < 60 || words > 170) out.push(`person "${p.id}" summary is ${words} words (aim 80–150)`);
  }

  for (const m of MEDIA) {
    if (!m.alt.trim()) out.push(`media "${m.id}" has no alt text`);
    if (!m.license.trim()) out.push(`media "${m.id}" has no licence`);
    if (!m.credit.trim()) out.push(`media "${m.id}" has no credit`);
    if (m.kind !== "generated" && (!m.width || !m.height)) out.push(`media "${m.id}" has no dimensions`);
  }

  for (const a of ARTICLES) {
    if (a.state === "published") {
      if (!a.body?.trim()) out.push(`article "${a.slug}" is published with no body`);
      if (!a.box) out.push(`article "${a.slug}" is published without its established/contested/not-supported box`);
    }
    for (const id of citedIds(a.body ?? "")) if (!sourceIds.has(id)) out.push(`article "${a.slug}" cites missing source "${id}"`);
    for (const id of linkedEventIds(a.body ?? "")) if (!eventIds.has(id)) out.push(`article "${a.slug}" links missing event "${id}"`);
    for (const id of a.relatedEvents ?? []) if (!eventIds.has(id)) out.push(`article "${a.slug}" relates missing event "${id}"`);
  }

  // The bibliography is generated from SOURCES, so an uncited entry would be a
  // source listed for nothing. Cut it or cite it.
  const cited = new Set<string>([
    ...EVENTS.flatMap((e) => e.sourceIds),
    ...PEOPLE.flatMap((p) => p.sourceIds),
    ...ARTICLES.flatMap((a) => citedIds(a.body ?? "")),
  ]);
  for (const s of SOURCES) if (!cited.has(s.id)) out.push(`source "${s.id}" is never cited`);

  return out;
}

let checked = false;

/** Throws once, with the full list, if anything is wrong. Cheap after that. */
export function assertIntegrity(): void {
  if (checked) return;
  const problems = integrityProblems();
  if (problems.length) {
    throw new Error(`Standing Waves data failed its integrity check:\n  - ${problems.join("\n  - ")}`);
  }
  checked = true;
}
