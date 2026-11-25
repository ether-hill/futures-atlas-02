import type { Mention } from "@/data/doom-score/types";

/**
 * One rule for every quote on the hub. A row read in its own source is shown
 * in quotation marks; a fragment of fewer than six words gets ellipses so it
 * is not mistaken for a whole sentence. A row that came from a secondary list
 * is never dressed as a quotation: it is marked "As reported", and a row that
 * carries only the number says so.
 */

export type QuoteKind = "verbatim" | "fragment" | "reported" | "number";

const NUMBER_ONLY = /^[\d.,–\-<>≥≤%+~\s]+$/;

export function quoteKind(m: Mention): QuoteKind {
  if (m.verified) return m.quote.split(/\s+/).length < 6 ? "fragment" : "verbatim";
  return NUMBER_ONLY.test(m.quote) ? "number" : "reported";
}

const clip = (s: string, max?: number) => (max && s.length > max ? `${s.slice(0, max - 2)}…` : s);

/** Plain text, for places that cannot take markup (aria labels, canvas, CSV). */
export function quoteText(m: Mention, max?: number): string {
  switch (quoteKind(m)) {
    case "verbatim":
      return `“${clip(m.quote, max)}”`;
    case "fragment":
      return `“…${m.quote}…”`;
    case "number":
      return "Number only; no quote on record.";
    default:
      return `As reported: ${clip(m.quote, max)}`;
  }
}

export function QuoteText({ m, max, className }: { m: Mention; max?: number; className?: string }) {
  const kind = quoteKind(m);
  if (kind === "verbatim" || kind === "fragment") return <span className={className}>{quoteText(m, max)}</span>;
  return (
    <span className={`${className ?? ""} ds-q-reported`.trim()}>
      <span className="ds-q-tag">{kind === "number" ? "Number only" : "As reported"}</span> {kind === "number" ? "No quote on record; the figure is taken from the source." : clip(m.quote, max)}
    </span>
  );
}
