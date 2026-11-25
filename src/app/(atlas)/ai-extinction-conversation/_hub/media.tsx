import thumbsJson from "@/data/doom-score/thumbs.json";
import peopleJson from "@/data/doom-score/people.json";

type ThumbRec = { src: string; w: number; h: number; from?: string } | null;
type PersonRec = { src: string; credit: string; description?: string } | null;

const THUMBS = thumbsJson as Record<string, ThumbRec>;
const PEOPLE = peopleJson as Record<string, PersonRec>;

/** The source page's own preview image, fetched by scripts/doom-score/thumbs.mjs. */
export function thumbFor(url: string): ThumbRec {
  const rec = THUMBS[url];
  if (rec) return rec;
  // YouTube publishes a still for every video at a fixed address; no fetch needed
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  return yt ? { src: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`, w: 480, h: 360, from: "youtube" } : null;
}

/** Wikipedia's portrait of a speaker, with the page as credit. */
export function portraitFor(who: string): PersonRec {
  return PEOPLE[who] ?? PEOPLE[who.replace(/\s*\(.*\)$/, "")] ?? null;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * A thumbnail or, when the source gave none, a plate with the site's initial.
 * Plates are honest blanks, not invented pictures.
 */
export function Thumb({ url, alt = "", className = "", kind }: { url: string; alt?: string; className?: string; kind?: string }) {
  const t = thumbFor(url);
  if (t) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={`ds-thumb ${className}`} src={t.src} width={t.w} height={t.h} alt={alt} loading="lazy" decoding="async" />;
  }
  const h = hostOf(url);
  return (
    <span className={`ds-thumb ds-thumb--plate ${className}`} data-kind={kind} aria-hidden="true">
      <b>{(h[0] ?? "·").toUpperCase()}</b>
      <small>{h}</small>
    </span>
  );
}

/** A speaker's portrait when Wikipedia has one; nothing at all when it does not. No initials plates. */
export function Portrait({ who, size = 56, className = "" }: { who: string; size?: number; className?: string }) {
  const p = portraitFor(who);
  if (!p) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`ds-portrait ${className}`} src={p.src} width={size} height={size} alt={who} loading="lazy" decoding="async" style={{ width: size, height: size }} />;
}
