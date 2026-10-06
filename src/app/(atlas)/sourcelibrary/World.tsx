"use client";

import { memo, useMemo, type CSSProperties, type RefObject } from "react";
import { SHELF_BOOKS, SHELF_CATEGORIES, type ShelfCategoryKey } from "@/data/library-shelf";
import { THREAD_STORY } from "@/data/ancestors-story";
import { GEOMETRY, H, LINKS, THREADS, W, threadIndex, type Box, type LayoutKey } from "./layouts";
import { CAT, CAT_COLOR, shortTitle, smallCover } from "./shared";

/**
 * Everything inside the camera: the fifty tiles and whatever the current
 * arrangement draws around them. Memoised on purpose: a drag moves the parent's
 * transform many times a second, and none of that is a reason to touch a tile.
 *
 * The tiles are the same fifty buttons in every arrangement. Changing
 * arrangement only changes each one's transform, so the browser carries them
 * across; nothing is unmounted and nothing is redrawn.
 */

const COUNT = Object.fromEntries(
  SHELF_CATEGORIES.map((c) => [c.key, SHELF_BOOKS.filter((b) => b.cat === c.key).length]),
) as Record<ShelfCategoryKey, number>;

/** How a cross reference is drawn between two boxes. */
function linkPath(layout: LayoutKey, A: Box, B: Box, same: boolean) {
  if (layout !== "circuit") return `M${A.x} ${A.y}L${B.x} ${B.y}`;
  if (same && Math.abs(A.y - B.y) < 80) {
    const top = Math.min(A.y - A.h / 2, B.y - B.h / 2) - 4;
    const lift = Math.min(64, 22 + Math.abs(A.x - B.x) * 0.12);
    return `M${A.x} ${A.y - A.h / 2 - 4}Q${(A.x + B.x) / 2} ${top - lift * 2} ${B.x} ${B.y - B.h / 2 - 4}`;
  }
  const my = (A.y + B.y) / 2;
  return `M${A.x} ${A.y}C${A.x} ${my} ${B.x} ${my} ${B.x} ${B.y}`;
}

export interface WorldProps {
  layout: LayoutKey;
  /** how many threads the opening has put on their wires; 5 is all of them */
  sorted: number;
  selected: string | null;
  linked: Set<string>;
  dim: Set<string> | null;
  /** indices into LINKS that are lit */
  hot: Set<number>;
  onPick: (id: string) => void;
  onThread: (key: ShelfCategoryKey) => void;
  dragged: RefObject<boolean>;
}

export const World = memo(function World({
  layout,
  sorted,
  selected,
  linked,
  dim,
  hot,
  onPick,
  onThread,
  dragged,
}: WorldProps) {
  const opening = layout === "circuit" && sorted < THREADS.length;

  const boxes = useMemo(() => {
    if (!opening) return GEOMETRY[layout].boxes;
    const mixed: Record<string, Box> = {};
    for (const b of SHELF_BOOKS) {
      mixed[b.id] = threadIndex(b.cat) < sorted ? GEOMETRY.circuit.boxes[b.id]! : GEOMETRY.cloud[b.id]!;
    }
    return mixed;
  }, [layout, sorted, opening]);

  const cx = GEOMETRY.circuit.extras;
  const linksOn = !opening && (layout === "circuit" || layout === "constellation");
  const paths = useMemo(
    () =>
      layout === "circuit" || layout === "constellation"
        ? LINKS.map((l) => linkPath(layout, GEOMETRY[layout].boxes[l.a]!, GEOMETRY[layout].boxes[l.b]!, l.same))
        : [],
    [layout],
  );

  return (
    <>
      {/* ------------------------------------------------ circuit, under the tiles */}
      <svg className={`anc-deco ${layout === "circuit" ? "is-on" : ""}`} width={W} height={H} aria-hidden>
        {cx.ticks.map((t) => (
          <g key={t.year}>
            <line x1={t.x} x2={t.x} y1={58} y2={H - 44} style={{ stroke: "var(--c-ink)", opacity: t.year % 100 ? 0.05 : 0.1 }} />
            <text
              x={t.x}
              y={46}
              textAnchor="middle"
              className="font-condensed"
              style={{ fontSize: 18, fill: "var(--c-graphite)", letterSpacing: "0.06em" }}
            >
              {t.year}
            </text>
          </g>
        ))}

        {cx.wires.map((w, i) => {
          const drawn = sorted > i;
          const d = `M${w.x0} ${w.y}H${w.x1}`;
          return (
            <g key={w.key}>
              <path
                d={d}
                pathLength={1}
                className={`anc-wire ${drawn ? "is-drawn" : ""}`}
                style={{ stroke: CAT_COLOR[w.key], strokeWidth: 2.5, fill: "none" }}
              />
              <path
                d={d}
                pathLength={1}
                className={`anc-pulse ${drawn && !opening ? "is-drawn" : ""}`}
                style={{ stroke: "var(--c-ink)", strokeWidth: 7, strokeLinecap: "round", fill: "none", "--d": `${-i * 1.7}s` } as CSSProperties}
              />
            </g>
          );
        })}

        {/* stem from each book to the year it really belongs at */}
        {SHELF_BOOKS.map((b) => {
          const a = cx.anchors[b.id]!;
          const box = GEOMETRY.circuit.boxes[b.id]!;
          const on = sorted > threadIndex(b.cat);
          return (
            <g key={b.id} className="anc-fade" style={{ opacity: on ? 1 : 0 }}>
              {(box.x !== a.x || box.y !== a.y) && (
                <line x1={a.x} y1={a.y} x2={box.x} y2={box.y} style={{ stroke: CAT_COLOR[b.cat], strokeWidth: 1.25 }} />
              )}
              <circle cx={a.x} cy={a.y} r={3.5} style={{ fill: CAT_COLOR[b.cat] }} />
            </g>
          );
        })}

        {/* the year each subject got the name we use for it */}
        {cx.named.map((n, i) => {
          const end = n.x > W / 2;
          const story = THREAD_STORY[n.key];
          return (
            <g key={n.key} className="anc-fade" style={{ opacity: sorted > i ? 1 : 0 }}>
              <rect
                x={n.x - 6.5}
                y={n.y - 6.5}
                width={13}
                height={13}
                transform={`rotate(45 ${n.x} ${n.y})`}
                style={{ fill: "var(--c-surface)", stroke: "var(--c-ink)", strokeWidth: 2 }}
              />
              <text
                x={n.x + (end ? 4 : -4)}
                y={n.y - 36}
                textAnchor={end ? "end" : "start"}
                style={{ fontSize: 18, fill: "var(--c-ink)", paintOrder: "stroke", stroke: "var(--c-surface)", strokeWidth: 6 }}
              >
                <tspan className="font-condensed" style={{ fontWeight: 600, letterSpacing: "0.04em" }}>
                  {n.year}
                </tspan>
                <tspan dx={7} style={{ fontWeight: 700 }}>
                  {story.named.word}
                </tspan>
              </text>
              <line x1={n.x} y1={n.y - 30} x2={n.x} y2={n.y - 10} style={{ stroke: "var(--c-ink)", strokeWidth: 1 }} />
            </g>
          );
        })}
      </svg>

      {/* --------------------------------------------------------- cross references */}
      <svg className={`anc-deco ${linksOn ? "is-on" : ""}`} width={W} height={H} aria-hidden>
        {paths.map((d, i) => {
          const l = LINKS[i]!;
          const lit = hot.has(i);
          return (
            <path
              key={`${l.a}-${l.b}`}
              d={d}
              className={`anc-link ${lit ? "is-hot" : ""}`}
              style={{
                fill: "none",
                stroke: lit ? "var(--c-accent)" : l.same ? CAT_COLOR[l.cat] : "var(--c-ink)",
                strokeWidth: lit ? 2.75 : 1.4,
                strokeDasharray: lit ? undefined : l.same ? undefined : "2 5",
                opacity: lit ? 1 : hot.size ? 0.12 : l.same ? 0.5 : 0.55,
              }}
            />
          );
        })}
      </svg>

      {/* --------------------------------------------------------------------- when */}
      <svg className={`anc-deco ${layout === "when" ? "is-on" : ""}`} width={W} height={H} aria-hidden>
        <line
          x1={GEOMETRY.when.extras.bins[0]!.x - 10}
          x2={W - GEOMETRY.when.extras.bins[0]!.x + 10}
          y1={GEOMETRY.when.extras.base}
          y2={GEOMETRY.when.extras.base}
          style={{ stroke: "var(--c-ink)", strokeWidth: 2 }}
        />
        {GEOMETRY.when.extras.bins.map((b) => (
          <g key={b.from}>
            <line x1={b.x} x2={b.x} y1={GEOMETRY.when.extras.base} y2={GEOMETRY.when.extras.base + 8} style={{ stroke: "var(--c-ink)" }} />
            <text
              x={b.x}
              y={GEOMETRY.when.extras.base + 34}
              textAnchor="middle"
              className="font-condensed"
              style={{ fontSize: 19, fill: "var(--c-graphite)", letterSpacing: "0.05em" }}
            >
              {b.from}
            </text>
            {b.count > 0 && (
              <text
                x={b.x + b.w / 2}
                y={b.top - 12}
                textAnchor="middle"
                className="font-condensed"
                style={{ fontSize: 22, fontWeight: 600, fill: "var(--c-ink)" }}
              >
                {b.count}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* ---------------------------------------------------------------- languages */}
      <svg className={`anc-deco ${layout === "languages" ? "is-on" : ""}`} width={W} height={H} aria-hidden>
        {GEOMETRY.languages.extras.rows.map((r) => (
          <g key={r.name}>
            <text x={60} y={r.y + 2} style={{ fontSize: 24, fontWeight: 800, fill: "var(--c-ink)" }}>
              {r.name}
            </text>
            <text x={60} y={r.y + 26} className="font-condensed" style={{ fontSize: 18, fill: "var(--c-graphite)", letterSpacing: "0.05em" }}>
              {r.count} {r.count === 1 ? "work" : "works"}
            </text>
            <line x1={r.x1 + 6} x2={W - 60} y1={r.y} y2={r.y} style={{ stroke: "var(--c-ink)", opacity: 0.1 }} />
          </g>
        ))}
      </svg>

      {/* -------------------------------------------------------------------- pages */}
      <svg className={`anc-deco ${layout === "pages" ? "is-on" : ""}`} width={W} height={H} aria-hidden>
        <defs>
          {THREADS.map((k) => (
            <pattern key={k} id={`anc-leaves-${k}`} width={4} height={8} patternUnits="userSpaceOnUse">
              <line x1={0.5} x2={0.5} y1={0} y2={8} style={{ stroke: CAT_COLOR[k], strokeWidth: 1 }} />
            </pattern>
          ))}
        </defs>
        {GEOMETRY.pages.extras.shelves.map((y) => (
          <line key={y} x1={60} x2={W - 60} y1={y + 5} y2={y + 5} style={{ stroke: "var(--c-ink)", strokeWidth: 2 }} />
        ))}
        {GEOMETRY.pages.extras.slabs.map((s) => (
          <g key={s.id}>
            <rect x={s.x} y={s.y} width={s.w} height={s.h} fill={`url(#anc-leaves-${s.cat})`} />
            <rect x={s.x} y={s.y} width={s.w} height={s.h} style={{ fill: "none", stroke: CAT_COLOR[s.cat], strokeWidth: 1 }} />
            <text
              x={s.x - 2}
              y={s.y + s.h + 26}
              textAnchor="middle"
              className="font-condensed"
              style={{ fontSize: 17, fill: "var(--c-graphite)", letterSpacing: "0.04em" }}
            >
              {s.pages > 0 ? s.pages : ""}
            </text>
          </g>
        ))}
      </svg>

      {/* -------------------------------------------------------------------- tiles */}
      {SHELF_BOOKS.map((b, i) => {
        const box = boxes[b.id]!;
        const ti = threadIndex(b.cat);
        const inCloud = opening && ti >= sorted;
        const cls = [
          "anc-tile",
          inCloud ? "is-cloud" : "",
          selected === b.id ? "is-selected" : "",
          linked.has(b.id) ? "is-linked" : "",
          dim?.has(b.id) && selected !== b.id ? "is-dim" : "",
        ].join(" ");
        return (
          <button
            key={b.id}
            type="button"
            className={cls}
            aria-label={`${b.title}, ${b.author}${b.year ? `, ${b.year}` : ""}`}
            onClick={() => {
              if (!dragged.current) onPick(b.id);
            }}
            style={
              {
                width: box.w,
                height: box.h,
                transform: `translate(${box.x - box.w / 2}px, ${box.y - box.h / 2}px) rotate(${box.r}deg)`,
                transitionDelay: `${opening ? (i % 13) * 34 : (i % 10) * 20}ms`,
                "--t": CAT_COLOR[b.cat],
                "--d": `${-((i * 977) % 5200)}ms`,
              } as CSSProperties
            }
          >
            <span className="anc-tile-in">
              {/* eslint-disable-next-line @next/next/no-img-element -- the library's image host, not ours to optimise */}
              <img src={smallCover(b)} alt="" draggable={false} decoding="async" />
            </span>
            <span className="anc-tip rounded-[2px] bg-ink px-2 py-1 text-[12px] font-semibold text-surface">
              {shortTitle(b.title, 40)}
              {b.year ? ` · ${b.year}` : ""}
            </span>
          </button>
        );
      })}

      {/* ------------------------------------------- circuit: a name on every wire */}
      {THREADS.map((key, i) => {
        const y = GEOMETRY.circuit.extras.wires[i]!.y;
        const on = layout === "circuit" && sorted > i;
        return (
          <button
            key={key}
            type="button"
            className="anc-fade group absolute text-left"
            style={{ left: 22, top: y - 30, width: 214, opacity: on ? 1 : 0, pointerEvents: on ? "auto" : "none" }}
            onClick={() => {
              if (!dragged.current) onThread(key);
            }}
          >
            <span className="flex items-start gap-2.5 text-[21px] font-extrabold leading-[1.08] text-ink group-hover:text-accent">
              <i className="mt-[5px] block h-[13px] w-[13px] shrink-0" style={{ background: CAT_COLOR[key] }} />
              {CAT[key].name}
            </span>
            <span className="mt-1 block pl-[23px] font-condensed text-[17px] tracking-[0.05em] text-graphite">
              {COUNT[key]} works
            </span>
          </button>
        );
      })}

      {/* ------------------------------ constellation: thread names, over the tiles */}
      <svg className={`anc-deco ${layout === "constellation" ? "is-on" : ""}`} width={W} height={H} aria-hidden>
        {GEOMETRY.constellation.extras.labels.map((l) => (
          <g key={l.key}>
            <rect x={l.x - 7} y={l.y - 40} width={14} height={14} style={{ fill: CAT_COLOR[l.key] }} />
            <text
              x={l.x}
              y={l.y}
              textAnchor="middle"
              style={{ fontSize: 23, fontWeight: 800, fill: "var(--c-ink)", paintOrder: "stroke", stroke: "var(--c-surface)", strokeWidth: 6 }}
            >
              {CAT[l.key].name}
            </text>
          </g>
        ))}
      </svg>
    </>
  );
});
