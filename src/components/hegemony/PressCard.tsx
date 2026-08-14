import type { PressItem } from "@/data/hegemony";
import { CoverImage } from "./CoverImage";

/**
 * A piece of coverage, and the promise that we are not it.
 *
 * Same card as the video above it, minus the player — one design for both
 * sections, because they are the same kind of thing: somebody else's work,
 * shown with somebody else's picture, linked to somebody else's page.
 *
 * The whole card is the link and the label names the destination outright
 * ("Read at Rest of World"), rather than a bare "Read more". A reader should
 * never be able to mistake this page for the place the reporting happened.
 */
export function PressCard({ item }: { item: PressItem }) {
  return (
    <article className="group flex flex-col">
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex flex-col">
        <div className="relative aspect-video w-full overflow-hidden bg-paper/[0.06]">
          <CoverImage
            src={item.image}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>

        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-deep">
          {item.publisher} <span className="text-paper/35">·</span>{" "}
          <span className="text-paper/45">{item.published}</span>
        </p>
        <h3 className="mt-2 text-[17px] font-medium leading-[1.35] tracking-[-0.015em] text-paper group-hover:underline group-hover:decoration-accent-deep group-hover:underline-offset-4">
          {item.title}
        </h3>
        <p className="mt-2 text-[14px] leading-[1.65] text-paper/60">{item.blurb}</p>

        <span className="mt-auto self-start pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-paper/45 transition-colors group-hover:text-accent-deep">
          Read at {item.publisher} ↗
        </span>
      </a>
    </article>
  );
}
