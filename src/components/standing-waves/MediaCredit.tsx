import type { MediaItem } from "@/data/standing-waves/types";

/** Credit + licence, shown wherever a media item is. Removing it is a licence breach, not a tidy-up. */
export function MediaCredit({ item, className = "" }: { item: MediaItem; className?: string }) {
  return (
    <p className={`font-mono text-[10.5px] leading-[1.6] tracking-[0.04em] text-graphite ${className}`}>
      {item.credit}
      {" · "}
      {item.licenseUrl ? (
        <a href={item.licenseUrl} rel="noopener license" className="underline underline-offset-2 hover:text-ink">
          {item.license}
        </a>
      ) : (
        item.license
      )}
      {item.sourceUrl && (
        <>
          {" · "}
          <a href={item.sourceUrl} rel="noopener" className="underline underline-offset-2 hover:text-ink">source</a>
        </>
      )}
    </p>
  );
}
