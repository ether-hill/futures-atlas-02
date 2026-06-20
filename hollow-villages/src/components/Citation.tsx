import Link from "next/link";
import { getResearch } from "@/data/research";

/**
 * Renders researchIds as citation chips, each deep-linking to its card on
 * /research#<id> — so a reader can trace any oracle claim to the precedent.
 */
export function Citations({ ids }: { ids: string[] }) {
  const entries = ids.map(getResearch).filter(Boolean);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((entry) => (
        <Link
          key={entry!.id}
          href={`/research#${entry!.id}`}
          className="group inline-flex max-w-full items-center gap-1.5 rounded-sm border border-ink/20 bg-surface px-2.5 py-1 text-xs text-graphite transition-colors hover:border-blueprint hover:text-ink"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blueprint" aria-hidden />
          <span className="truncate font-mono text-[0.72rem]">
            <span className="text-ink/90">{entry!.source}</span>
            {entry!.year ? <span className="text-graphite"> ·{entry!.year}</span> : null}
          </span>
        </Link>
      ))}
    </div>
  );
}
