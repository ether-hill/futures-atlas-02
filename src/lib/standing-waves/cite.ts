import { renderMarkdown } from "@/lib/markdown";
import { SW_BASE } from "@/data/standing-waves/meta";

/**
 * Article markdown → HTML with numbered citations.
 *
 * `[@id]` (or `[@a; @b]`) becomes a superscript number linking to the
 * reference list under the article, numbered in order of first use.
 * `[[event:id|label]]` becomes a link to that event on the timeline.
 * Bodies are authored in this repo, so the HTML is trusted (same rule as
 * src/lib/markdown.ts).
 */

const CITE = /\[(@[a-z0-9-]+(?:\s*;\s*@[a-z0-9-]+)*)\]/g;
const EVENT = /\[\[event:([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g;

export function citedIds(md: string): string[] {
  const ids: string[] = [];
  for (const m of md.matchAll(CITE)) {
    for (const part of m[1]!.split(";")) {
      const id = part.trim().slice(1);
      if (!ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

export function linkedEventIds(md: string): string[] {
  return [...md.matchAll(EVENT)].map((m) => m[1]!);
}

export function renderArticle(md: string): { html: string; order: string[] } {
  const order = citedIds(md);
  const anchored = new Set<number>(); // the back-link target is the FIRST use only, ids must be unique
  const withCites = md.replace(CITE, (_all, group: string) => {
    const nums = group.split(";").map((p) => order.indexOf(p.trim().slice(1)) + 1);
    const links = nums
      .map((n) => {
        const id = anchored.has(n) ? "" : ` id="cite-${n}"`;
        anchored.add(n);
        return `<a href="#ref-${n}"${id} aria-label="Source ${n}">${n}</a>`;
      })
      .join(", ");
    return `<sup class="sw-cite">[${links}]</sup>`;
  });
  const withEvents = withCites.replace(
    EVENT,
    (_all, id: string, label?: string) => `[${label ?? "on the timeline"}](${SW_BASE}/timeline#${id})`,
  );
  return { html: renderMarkdown(withEvents), order };
}
