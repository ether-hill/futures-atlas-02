// The spine: a Config is everything needed to reproduce a visual. It round-trips
// through the URL hash (base64 JSON) so the dashboard, preview-in-tab, and the
// embeddable iframe all play the exact same thing.

import type { Config } from "./piece";

const b64encode = (s: string): string => btoa(unescape(encodeURIComponent(s))).replace(/=+$/, "");
const b64decode = (s: string): string => decodeURIComponent(escape(atob(s)));

export function encodeConfig(c: Config): string {
  return b64encode(JSON.stringify(c));
}

export function decodeConfig(str: string): Config | null {
  try {
    const c = JSON.parse(b64decode(str)) as Config;
    if (!c.pieceId || !c.size) return null;
    return c;
  } catch {
    return null;
  }
}

export function readHashConfig(): Config | null {
  const h = location.hash.replace(/^#/, "");
  return h ? decodeConfig(h) : null;
}

let writeTimer = 0;
export function writeHashConfig(c: Config): void {
  clearTimeout(writeTimer);
  writeTimer = window.setTimeout(() => {
    history.replaceState(null, "", `#${encodeConfig(c)}`);
  }, 120);
}

/** Absolute URL of the embeddable player carrying this config. */
export function embedUrl(c: Config): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${location.origin}${base}embed.html#${encodeConfig(c)}`;
}

/** Ready-to-paste <iframe> snippet that reproduces this exact visual. */
export function buildEmbedSnippet(c: Config): string {
  const { w, h } = c.size;
  return (
    `<iframe src="${embedUrl(c)}" width="${w}" height="${h}" ` +
    `style="border:0;max-width:100%" loading="lazy" title="Prism — ${c.pieceId}"></iframe>`
  );
}
