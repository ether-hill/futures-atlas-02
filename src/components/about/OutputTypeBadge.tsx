import type { OutputType } from "@/content/about";

/**
 * The READ / COPY / RUN badge — built here for the About page and exported
 * for reuse on project cards site-wide later (brief §4.4).
 */
export function OutputTypeBadge({ type, active = true }: { type: OutputType; active?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-[2px] border px-2.5 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] transition-colors ${
        active ? "border-accent-deep/50 text-accent-deep" : "border-ink/20 text-ink/40"
      }`}
    >
      {type}
    </span>
  );
}
