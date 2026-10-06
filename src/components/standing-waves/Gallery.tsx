"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Lane, MediaItem, MediaKind } from "@/data/standing-waves/types";
import { LANE_LABEL, LANE_ORDER } from "@/data/standing-waves/meta";
import { MediaCredit } from "./MediaCredit";

export interface GalleryEntry {
  item: MediaItem;
  /** Server-rendered plate (an SVG for generated figures), reused in the lightbox. */
  plate: ReactNode;
  caption?: string;
}

const KIND_LABEL: Record<MediaKind, string> = {
  generated: "Computed here",
  "public-domain": "Public domain",
  cc: "Creative Commons",
  own: "Our own rig",
  permissioned: "With permission",
};

/**
 * Masonry by CSS columns (no layout JS), filtered by lane, kind and tag, with
 * a native <dialog> lightbox: Escape closes it, focus returns to the tile, and
 * ← / → step through what the filters are showing.
 */
export function Gallery({ entries }: { entries: GalleryEntry[] }) {
  const [lane, setLane] = useState<Lane | null>(null);
  const [kind, setKind] = useState<MediaKind | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const kinds = useMemo(() => [...new Set(entries.map((e) => e.item.kind))], [entries]);
  const tags = useMemo(() => [...new Set(entries.flatMap((e) => e.item.tags))].sort(), [entries]);
  const shown = useMemo(
    () =>
      entries.filter(
        (e) => (!lane || e.item.lane === lane) && (!kind || e.item.kind === kind) && (!tag || e.item.tags.includes(tag)),
      ),
    [entries, lane, kind, tag],
  );

  const open = (i: number, from: HTMLElement) => {
    lastFocus.current = from;
    setOpenIdx(i);
  };
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (openIdx !== null && !d.open) d.showModal();
    if (openIdx === null && d.open) d.close();
  }, [openIdx]);

  const step = (dir: 1 | -1) => setOpenIdx((i) => (i === null ? i : (i + dir + shown.length) % shown.length));
  const current = openIdx !== null ? shown[openIdx] : undefined;

  const Chip = ({ on, label, onClick, laneId }: { on: boolean; label: string; onClick: () => void; laneId?: Lane }) => (
    <button type="button" className="sw-chip" aria-pressed={on} onClick={onClick} data-lane={laneId}>
      {laneId && <span className="sw-dot" aria-hidden="true" />}
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-col gap-4">
        <fieldset>
          <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">Lane</legend>
          <div className="flex flex-wrap gap-2">
            {LANE_ORDER.filter((l) => entries.some((e) => e.item.lane === l)).map((l) => (
              <Chip key={l} laneId={l} on={lane === l} label={LANE_LABEL[l]} onClick={() => setLane(lane === l ? null : l)} />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">Kind</legend>
          <div className="flex flex-wrap gap-2">
            {kinds.map((k) => (
              <Chip key={k} on={kind === k} label={KIND_LABEL[k]} onClick={() => setKind(kind === k ? null : k)} />
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">Tag</legend>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Chip key={t} on={tag === t} label={t} onClick={() => setTag(tag === t ? null : t)} />
            ))}
          </div>
        </fieldset>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite" aria-live="polite">
          {shown.length} of {entries.length}
        </p>
      </div>

      <ul className="sw-masonry mt-8">
        {shown.map((e, i) => (
          <li key={e.item.id}>
            <figure className="fa-card">
              <button
                type="button"
                className="sw-focus block w-full text-left"
                onClick={(ev) => open(i, ev.currentTarget)}
                aria-label={`Open ${e.item.title}`}
              >
                {e.plate}
              </button>
              <figcaption className="flex flex-col gap-2" style={{ padding: "var(--space-card)" }}>
                <span className="fa-card__meta">{KIND_LABEL[e.item.kind]}</span>
                <span className="text-[15px] font-semibold leading-snug text-ink">{e.item.title}</span>
                {e.caption && <span className="text-[13px] leading-[1.6] text-ink-70">{e.caption}</span>}
                <MediaCredit item={e.item} />
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="sw-lightbox"
        aria-label={current?.item.title ?? "Image"}
        onClose={() => {
          setOpenIdx(null);
          lastFocus.current?.focus();
        }}
        onKeyDown={(ev) => {
          if (ev.key === "ArrowRight") step(1);
          if (ev.key === "ArrowLeft") step(-1);
        }}
        onClick={(ev) => {
          if (ev.target === ev.currentTarget) dialogRef.current?.close(); // backdrop
        }}
      >
        {current && (
          <div className="grid max-h-[calc(100dvh-32px)] overflow-auto md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="flex items-center justify-center bg-panel p-3">
              <div className="w-full max-w-[min(70dvh,100%)]">{current.plate}</div>
            </div>
            <div className="flex flex-col gap-3 p-5">
              <span className="fa-card__meta">{KIND_LABEL[current.item.kind]}</span>
              <h2 className="text-[20px] font-bold leading-snug text-ink">{current.item.title}</h2>
              {current.caption && <p className="text-[14px] leading-[1.65] text-ink-70">{current.caption}</p>}
              <p className="text-[13px] leading-[1.6] text-ink-70">{current.item.alt}</p>
              <MediaCredit item={current.item} />
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <button type="button" className="sw-chip" onClick={() => step(-1)} aria-label="Previous image">←</button>
                <button type="button" className="sw-chip" onClick={() => step(1)} aria-label="Next image">→</button>
                <button type="button" className="sw-chip ml-auto" onClick={() => dialogRef.current?.close()} autoFocus>
                  Close
                </button>
              </div>
              <p className="font-mono text-[10.5px] text-graphite">{(openIdx ?? 0) + 1} of {shown.length} · ← → to step, Esc to close</p>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
