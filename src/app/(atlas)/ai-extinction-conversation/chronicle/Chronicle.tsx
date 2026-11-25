"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import type { Mention, VolumePoint } from "@/data/doom-score/types";
import type { ChronicleSection, ChronicleEntry } from "@/data/doom-score/chronicle-types";
import { CHRONICLE_KIND_LABEL } from "@/data/doom-score/chronicle-types";
import { portraitFor, thumbFor } from "../_hub/media";
import grabsJson from "@/data/doom-score/grabs.json";

const GRABS = grabsJson as Record<string, { src: string; url: string; kind: string; taken: string }>;
import { coloursFrom, useTokens } from "../dashboard/lib";
import { QuoteText, quoteKind } from "../_hub/quote";

/**
 * The Chronicle page: a vertical, sectioned timeline with a sticky contents
 * rail. No boxes: entries sit on the page down one rail, separated by air.
 * Turning points get a picture across the top and a larger title; beats are a
 * line. Quotes carry the speaker's portrait when Wikipedia has one and nothing
 * when it does not. Links are a plain list, outlet first.
 */

type Props = {
  sections: ChronicleSection[];
  mentions: Mention[];
  talk: VolumePoint[];
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fmtDate = (d: string) => (d.length === 4 ? d : d.length === 7 ? `${MONTHS[+d.slice(5) - 1]} ${d.slice(0, 4)}` : `${+d.slice(8, 10)} ${MONTHS[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`);
const num = (m: Mention) => m.p ?? (m.pLow != null && m.pHigh != null ? (m.pLow + m.pHigh) / 2 : (m.pLow ?? m.pHigh ?? null));
const fmtP = (m: Mention) => (m.p != null ? `${m.p}%` : m.pLow != null && m.pHigh != null ? `${m.pLow}–${m.pHigh}%` : m.pLow != null ? `≥ ${m.pLow}%` : m.pHigh != null ? `≤ ${m.pHigh}%` : "");
const shortWho = (w: string) => w.replace(/\s*\(.*\)$/, "");

/** True once the element has scrolled into view; the chapter charts draw themselves then. */
function useInView<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((x) => x.isIntersecting)) setSeen(true);
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen] as const;
}

const MONTH_LETTER = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const LABEL_OVERRIDE: Record<string, string> = {
  "Global Catastrophic Risk Conference participants": "Oxford 2008 poll",
  "AI researchers surveyed by AI Impacts": "AI Impacts survey",
  "738 AI researchers surveyed by AI Impacts": "AI Impacts survey",
  "2,778 AI researchers surveyed by AI Impacts": "AI Impacts survey",
  "44 AI safety researchers": "Safety researchers' survey",
  "Superforecasters, Existential Risk Persuasion Tournament": "Superforecasters",
  "Domain experts, Existential Risk Persuasion Tournament": "Domain experts",
  "Metaculus community": "Metaculus",
  "Kevin Roose (New York Times), quoting Tim Tyler and others": "Roose",
};
const labelFor = (m: Mention) => {
  const w = shortWho(m.who);
  if (LABEL_OVERRIDE[w]) return LABEL_OVERRIDE[w];
  if (LABEL_OVERRIDE[m.who]) return LABEL_OVERRIDE[m.who];
  const parts = w.split(/\s+/);
  const person = parts.length <= 3 && /^[A-Z]\S*$/.test(parts[0]) && !/survey|participants|Institute|community|researchers|signatories/i.test(w);
  return person ? parts[parts.length - 1] : w.length > 26 ? `${w.slice(0, 24)}…` : w;
};

/**
 * Two small charts under each chapter heading, each with its own title and a
 * labelled axis. First: every number given in the chapter, as a dot on a
 * 0 to 100 per cent line, with the speaker's name and number written beside
 * it. Second: how much was said about extinction from AI, a bar a month,
 * with the busiest month labelled.
 */
function SectionChart({ section, talk, mentions, C }: { section: ChronicleSection; talk: VolumePoint[]; mentions: Mention[]; C: ReturnType<typeof coloursFrom> }) {
  const [figRef, seen] = useInView<HTMLElement>();
  const months = talk.filter((t) => t.month >= section.from && t.month <= section.to);
  const rows = mentions
    .filter((m) => m.scope === "ai" && num(m) != null && m.date.slice(0, 7) >= section.from && m.date.slice(0, 7) <= section.to)
    .map((m) => ({ m, p: num(m)!, label: `${labelFor(m)} ${fmtP(m)}` }))
    .sort((a, b) => a.p - b.p);
  const W = 680;
  const total = months.reduce((a, m) => a + m.count, 0);
  if (!months.length && !rows.length) return null;

  // the strip: dots on one line, labels stacked in rows so none collide
  const SP = { l: 16, r: 16 };
  const sx = (p: number) => SP.l + (p / 100) * (W - SP.l - SP.r);
  const ROW = 15, CH = 5.9;
  const rowEnds: number[] = [];
  const placed = rows.map((r) => {
    const w = r.label.length * CH + 6;
    const x0 = Math.min(Math.max(sx(r.p) - w / 2, 0), W - w);
    let row = rowEnds.findIndex((e) => e + 6 <= x0);
    if (row < 0) {
      row = rowEnds.length;
      rowEnds.push(x0 + w);
    } else rowEnds[row] = x0 + w;
    return { ...r, row, x0, w };
  });
  const nRows = Math.max(1, rowEnds.length);
  const axisY = 14 + nRows * ROW + 10;
  const SH = axisY + 26;

  // the bars: a month each, the busiest labelled
  const BP = { l: 4, r: 4, t: 22, b: 18 }, BH = 110;
  const span = months.length || 1;
  const max = Math.max(1, ...months.map((m) => m.count));
  const bx = (i: number) => BP.l + (i / span) * (W - BP.l - BP.r);
  const bw = Math.max(0.8, (W - BP.l - BP.r) / span - 1);
  const by = (c: number) => BP.t + (1 - c / max) * (BH - BP.t - BP.b);
  const peakI = months.reduce((bi, m, i) => (m.count > months[bi].count ? i : bi), 0);
  const peak = months[peakI];
  const years = [...new Set(months.map((m) => m.month.slice(0, 4)))];
  const oneYear = years.length === 1;
  const fmtMonth = (ym: string) => `${MONTHS[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;

  return (
    <figure className={`ch-chart ${seen ? "is-in" : ""}`} ref={figRef}>
      {rows.length ? (
        <div className="ch-chart-block">
          <p className="ch-chart-title">
            {rows.length === 1 ? "The one number given" : `The ${rows.length} numbers given`} in {section.span}: the chance that AI ends humanity, from 0 to 100 per cent
          </p>
          <svg viewBox={`0 0 ${W} ${SH}`} role="img" aria-label={`${rows.length} numbers given, ${section.span}`}>
            <line x1={sx(0)} x2={sx(100)} y1={axisY} y2={axisY} stroke={C.text} strokeOpacity={0.3} />
            {[0, 25, 50, 75, 100].map((p) => (
              <g key={p}>
                <line x1={sx(p)} x2={sx(p)} y1={axisY} y2={axisY + 5} stroke={C.text} strokeOpacity={0.3} />
                <text x={sx(p)} y={axisY + 18} textAnchor={p === 0 ? "start" : p === 100 ? "end" : "middle"} fontFamily={C.font} fontSize={10.5} fill={C.muted}>
                  {p}%
                </text>
              </g>
            ))}
            {placed.map((r) => {
              const ly = axisY - 10 - r.row * ROW;
              return (
                <g key={r.m.id} className="ch-chart-dot" style={{ "--i": placed.indexOf(r) } as React.CSSProperties}>
                  <line x1={sx(r.p)} x2={sx(r.p)} y1={ly + 3} y2={axisY - 5} stroke={C.text} strokeOpacity={0.18} />
                  <circle cx={sx(r.p)} cy={axisY} r={4} fill={r.m.verified ? C.accent : C.bg} stroke={C.accent} strokeWidth={1.4} />
                  <text x={r.x0 + 3} y={ly} fontFamily={C.font} fontSize={10.5} fill={C.text}>
                    {r.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="ch-chart-note">Name and number beside each dot. A filled dot means the quote was read in its own source; a hollow dot means it comes from a secondary list and is not yet checked.</p>
        </div>
      ) : null}
      {months.length ? (
        <div className="ch-chart-block">
          <p className="ch-chart-title">How much was said about extinction from AI in {section.span}, a bar a month</p>
          <svg viewBox={`0 0 ${W} ${BH}`} role="img" aria-label={`Talk a month, ${section.span}`}>
            {months.map((m, i) => (
              <rect key={m.month} className="ch-chart-bar" style={{ "--i": i, transformOrigin: `${bx(i) + bw / 2}px ${by(0)}px` } as React.CSSProperties} x={bx(i) + 0.5} y={by(m.count)} width={bw} height={Math.max(0, by(0) - by(m.count))} fill={C.accent} fillOpacity={i === peakI ? 0.95 : 0.6} />
            ))}
            <line x1={BP.l} x2={W - BP.r} y1={by(0)} y2={by(0)} stroke={C.text} strokeOpacity={0.3} />
            {peak && peak.count > 0 ? (
              <text x={Math.min(Math.max(bx(peakI) + bw / 2, 60), W - 60)} y={by(peak.count) - 6} textAnchor="middle" fontFamily={C.font} fontSize={10.5} fontWeight={700} fill={C.text}>
                {peak.count.toLocaleString("en-GB")} in {fmtMonth(peak.month)}
              </text>
            ) : null}
            {oneYear
              ? months.map((m, i) => (
                  <text key={m.month} x={bx(i) + bw / 2} y={BH - 5} textAnchor="middle" fontFamily={C.font} fontSize={10} fill={C.muted}>
                    {MONTH_LETTER[+m.month.slice(5, 7) - 1]}
                  </text>
                ))
              : years.map((y) => {
                  const i = months.findIndex((m) => m.month.startsWith(y));
                  const every = years.length > 12 ? 5 : years.length > 6 ? 2 : 1;
                  return +y % every ? null : (
                    <text key={y} x={bx(i) + 1} y={BH - 5} fontFamily={C.font} fontSize={10} fill={C.muted}>
                      {y}
                    </text>
                  );
                })}
          </svg>
          <p className="ch-chart-note">
            {total.toLocaleString("en-GB")} forum posts, papers, news articles, prediction-market questions and TV mentions found by this project&rsquo;s searches
            {oneYear ? ", January to December" : `, ${years[0]} to ${years[years.length - 1]}`}.
          </p>
        </div>
      ) : null}
    </figure>
  );
}

function Quote({ m }: { m: Mention }) {
  const p = portraitFor(m.who);
  return (
    <blockquote className={`ch-quote ${p ? "has-face" : ""}`}>
      {p ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="ch-face" src={p.src} width={64} height={64} alt="" loading="lazy" />
      ) : null}
      <div>
        <p className={`ch-quote-text ${quoteKind(m) === "verbatim" || quoteKind(m) === "fragment" ? "" : "ch-quote-text--reported"}`}>
          <QuoteText m={m} />
        </p>
        <p className="ch-quote-who">
          <b>{shortWho(m.who)}</b>
          {fmtP(m) ? <span className="ch-quote-p"> {fmtP(m)}</span> : null}
          {m.role ? <span className="ch-quote-role"> · {m.role}</span> : null}
          {!m.verified ? <span className="ch-quote-unv"> · not read in the primary source</span> : null}
        </p>
        <a className="ch-quote-src" href={m.source.url} target="_blank" rel="noreferrer">
          {m.source.title}
        </a>
      </div>
    </blockquote>
  );
}

const ytId = (url: string) => {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
};
const ytStart = (url: string) => {
  const m = url.match(/[?&]t=(\d+)/);
  return m ? +m[1] : 0;
};

/**
 * A YouTube recording inside an entry. Nothing loads from Google until the
 * reader presses play: until then it is YouTube's own still for the video
 * with the title and channel under it. Playing uses the no-cookie domain.
 */
function YouTube({ url, title, outlet }: { url: string; title: string; outlet: string }) {
  const [on, setOn] = useState(false);
  const id = ytId(url);
  if (!id) return null;
  const start = ytStart(url);
  return (
    <figure className="ch-video">
      {on ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0${start ? `&start=${start}` : ""}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" className="ch-video-still" onClick={() => setOn(true)} aria-label={`Play: ${title}`}>
          {/* the 1280px still where YouTube has one, the 480px one where it does not; a missing maxres comes back as a 120px grey placeholder, so swap on that */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
            alt=""
            width={1280}
            height={720}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth <= 120 && !img.src.includes("hqdefault")) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
            }}
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.src.includes("hqdefault")) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
            }}
          />
          <span className="ch-video-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path d="M7 4.5v15l13-7.5z" fill="currentColor" />
            </svg>
          </span>
        </button>
      )}
      <figcaption>
        <b>{outlet}</b> {title}
        {start ? <span> · from {Math.floor(start / 60)}:{String(start % 60).padStart(2, "0")}</span> : null}
        <a href={url} target="_blank" rel="noreferrer">
          Open on YouTube
        </a>
      </figcaption>
    </figure>
  );
}

function Entry({ e, mentions, byId }: { e: ChronicleEntry; mentions: Mention[]; byId: Map<string, ChronicleEntry> }) {
  const related = (e.related ?? []).map((id) => byId.get(id)).filter(Boolean) as ChronicleEntry[];
  const rows = (e.ledger ?? []).map((id) => mentions.find((m) => m.id === id)).filter(Boolean) as Mention[];
  // a picture only on turning points, and only a real one: wide, at least 560px, never a Wikipedia portrait, never upscaled
  const picRec =
    e.weight === 3
      ? (e.links
          .filter((l) => !/wikipedia\.org/.test(l.url))
          .map((l) => thumbFor(l.url))
          .find((t) => t && t.w >= 560 && t.w / t.h >= 1.25) ?? null)
      : null;
  const video = e.links.find((l) => l.media === "video" && ytId(l.url)) ?? null;
  const links = e.links.filter((l) => l !== video).slice(0, 4);
  return (
    <li className={`ch-entry ch-entry--w${e.weight}`} id={e.id}>
      <time dateTime={e.date}>{fmtDate(e.date)}</time>
      <article>
        <p className="ch-kind">
          <span data-kind={e.kind}>{CHRONICLE_KIND_LABEL[e.kind]}</span>
        </p>
        {e.weight === 1 ? (
          <p className="ch-line">
            <b>{e.title}.</b> {e.summary}
          </p>
        ) : (
          <>
            <h3>{e.title}</h3>
            <p className="ch-summary">{e.summary}</p>
          </>
        )}
        {e.detail?.length ? (
          <ul className="ch-detail">
            {e.detail.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        ) : null}
        {/* pictures sit under the title and the account, never above them */}
        {picRec && !video ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="ch-hero" src={picRec.src} width={picRec.w} height={picRec.h} alt="" loading="lazy" />
        ) : !picRec && !video && e.weight >= 2 && GRABS[e.id] ? (
          // the thing itself: a screenshot of the page, paper or post, credited and dated
          <figure className="ch-grab">
            <a href={GRABS[e.id].url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GRABS[e.id].src} alt={`Screenshot of the source: ${e.title}`} loading="lazy" />
            </a>
            <figcaption>
              Screenshot of {new URL(GRABS[e.id].url).hostname.replace(/^www\./, "")}, taken {new Date(GRABS[e.id].taken).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </figcaption>
          </figure>
        ) : null}
        {video ? <YouTube url={video.url} title={video.title} outlet={video.outlet} /> : null}
        {rows.map((m) => (
          <Quote key={m.id} m={m} />
        ))}
        {(["before", "after"] as const).map((dir) => {
          const list = related.filter((r) => (dir === "before" ? r.date < e.date : r.date >= e.date)).sort((x, y) => (x.date < y.date ? -1 : 1));
          return list.length ? (
            <p key={dir} className="ch-related">
              <span className="ch-related-label">{dir === "before" ? "Earlier" : "Later"}</span>
              {list.map((r) => (
                <a key={r.id} href={`#${r.id}`}>
                  {r.title} <small>{fmtDate(r.date)}</small>
                </a>
              ))}
            </p>
          ) : null;
        })}
        <p className="ch-links">
          {links.map((l, i) => (
            <span key={l.url}>
              <a href={l.url} target="_blank" rel="noreferrer" className={l.media ? `ch-media-link ch-media-link--${l.media}` : undefined}>
                {l.media ? <i aria-hidden="true">{l.media === "video" ? "▶" : "♪"}</i> : null}
                <b>{l.media === "video" ? "Watch · " : l.media === "audio" ? "Listen · " : ""}{l.outlet}</b>
                {e.weight > 1 || l.media ? <span className="ch-link-title"> {l.title}</span> : null}
              </a>
              {i < links.length - 1 ? <span className="ch-sep"> · </span> : null}
            </span>
          ))}
        </p>
      </article>
    </li>
  );
}

export function Chronicle({ sections, mentions, talk }: Props) {
  const tok = useTokens();
  const C = useMemo(() => coloursFrom(tok), [tok]);
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const refs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => {
        const vis = es.filter((x) => x.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    Object.values(refs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [sections]);
  const byId = useMemo(() => new Map(sections.flatMap((s) => s.entries).map((e) => [e.id, e])), [sections]);
  const totals = { entries: sections.reduce((a, s) => a + s.entries.length, 0), links: sections.reduce((a, s) => a + s.entries.reduce((b, e) => b + e.links.length, 0), 0) };

  return (
    <div className="ch">
      <nav className="ch-toc" aria-label="Contents">
        <p className="ch-toc-head">
          Contents <small>{totals.entries} entries · {totals.links} sources</small>
        </p>
        <ol>
          {sections.map((s) => (
            <li key={s.id} className={active === s.id ? "is-on" : ""}>
              <a href={`#${s.id}`}>
                <b>{s.title}</b>
                <small>{s.span}</small>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="ch-main">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="ch-section" ref={(el) => void (refs.current[s.id] = el)}>
            <header className="ch-section-head">
              <p className="ch-section-span">{s.span}</p>
              <h2>{s.title}</h2>
              <p className="ch-section-intro">{s.intro}</p>
            </header>
            <SectionChart section={s} talk={talk} mentions={mentions} C={C} />
            <ol className="ch-entries">
              {s.entries
                .slice()
                .sort((a, b) => (a.date < b.date ? -1 : 1))
                .map((e) => (
                  <Entry key={e.id} e={e} mentions={mentions} byId={byId} />
                ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
