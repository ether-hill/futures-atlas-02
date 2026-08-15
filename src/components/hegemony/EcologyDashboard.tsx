"use client";

/**
 * The ecology module — who builds it, who runs them, what the record contains.
 *
 * One dashboard, three panels, and one rule across all of them: **every number
 * on this module is computed from the report itself.** Nothing is imported
 * from a market map. There are no valuations, no funding rounds, no headcounts
 * and no model rankings, because this report has measured none of those and
 * quoting them would be precisely the borrowed-number failure it exists to
 * correct. The nebula sizes a company by how often its name appears in the
 * evidence assembled here — a picture of the record, labelled as such.
 *
 * The one thing that does come from outside is who currently runs each lab,
 * and that arrives with a checked date on every card, because it moves: Google
 * DeepMind's chief executive title changed ten days before this shipped.
 */

import { useMemo, useState } from "react";
import { LogoMark } from "@/components/about/StackGrid";
import {
  LEADERS,
  ORGS,
  ORG_ROLE_LABEL,
  mentionsOf,
  orgById,
  type Org,
  type OrgRole,
} from "@/data/ecosystem";
import { FINDINGS, type FindingChart, type Strand } from "@/data/hegemony";
import { CardRail, RailItem } from "./CardRail";
import { FigureChart } from "./FigureChart";

/** Role decides the mark's treatment. Four states, one accent — not four hues. */
const ROLE_STYLE: Record<OrgRole, string> = {
  lab: "border-accent/70 text-accent-deep",
  dataset: "border-ink/40 text-ink/80",
  measurer: "border-dashed border-ink/45 text-ink/70",
  labour: "border-accent/40 text-ink/70",
};

/* ── panel one: the nebula ───────────────────────────────────────────────── */

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

function Nebula({
  ranked,
  active,
  onActive,
}: {
  ranked: { org: Org; n: number }[];
  active: string | null;
  onActive: (id: string | null) => void;
}) {
  const most = ranked[0]?.n || 1;

  return (
    <div className="relative aspect-[4/3] w-full min-[560px]:aspect-[16/10]">
      {ranked.map(({ org, n }, i) => {
        // Phyllotaxis, so the layout is deterministic — a random cloud would
        // differ between the server and the client render, and the biggest
        // name belongs in the middle anyway.
        const angle = i * GOLDEN;
        const radius = Math.sqrt(i / ranked.length) * 42;
        const size = 30 + (n / most) * 46;
        const on = active === org.id;

        return (
          <button
            key={org.id}
            type="button"
            onMouseEnter={() => onActive(org.id)}
            onMouseLeave={() => onActive(null)}
            onFocus={() => onActive(org.id)}
            onBlur={() => onActive(null)}
            onClick={() => onActive(on ? null : org.id)}
            aria-label={`${org.name} — named ${n} times in this report`}
            className={`absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border bg-surface transition-[transform,opacity,border-color] duration-300 hover:z-20 focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              ROLE_STYLE[org.role]
            } ${on ? "z-20 scale-110" : active ? "opacity-45" : ""}`}
            // Rounded to fixed strings, not left as raw floats: React serialises
            // a number and a string differently, and the server/client pair
            // disagreed on the last ten decimal places — a hydration mismatch
            // over a position no eye could resolve.
            style={{
              left: `${(50 + Math.cos(angle) * radius).toFixed(3)}%`,
              top: `${(50 + Math.sin(angle) * radius).toFixed(3)}%`,
              width: `${size.toFixed(1)}px`,
              height: `${size.toFixed(1)}px`,
            }}
          >
            {org.logo ? (
              <LogoMark slug={org.logo} name={org.name} colored={on} size="h-1/2 w-1/2" />
            ) : (
              <span className="font-mono text-[9px] font-bold uppercase leading-none tracking-[0.06em]">
                {org.name.slice(0, 2)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── panel three: the stat viewer ────────────────────────────────────────── */

const STRAND_NAME: Record<Strand, string> = {
  composition: "Composition",
  encoding: "Encoding",
  amplification: "Amplification",
  geopolitics: "Concentration",
  resistance: "Resistance",
};

function useStats(ranked: { org: Org; n: number }[]): { id: string; label: string; chart: FindingChart }[] {
  return useMemo(() => {
    const total = FINDINGS.length;
    const documented = FINDINGS.filter((f) => f.tier === "documented").length;

    const byStrand = (Object.keys(STRAND_NAME) as Strand[]).map((s) => ({
      label: STRAND_NAME[s],
      value: FINDINGS.filter((f) => f.strand === s).length,
      unit: "",
    }));

    return [
      {
        id: "weight",
        label: "Weight",
        chart: {
          kind: "waffle",
          max: total,
          cells: total,
          axis: `of ${total} findings carry a published methodology you can check`,
          bars: [{ label: "Documented", value: documented, unit: "" }],
        },
      },
      {
        id: "sections",
        label: "Sections",
        chart: {
          kind: "bars",
          max: Math.max(...byStrand.map((b) => b.value)),
          axis: "findings per section of this report",
          bars: byStrand,
        },
      },
      {
        id: "named",
        label: "Named most",
        chart: {
          kind: "bars",
          max: ranked[0]?.n || 1,
          axis: "times named in the findings and the timeline",
          bars: ranked.slice(0, 6).map(({ org, n }) => ({ label: org.name, value: n, unit: "" })),
        },
      },
    ];
  }, [ranked]);
}

/* ── the module ──────────────────────────────────────────────────────────── */

export function EcologyDashboard() {
  const ranked = useMemo(
    () =>
      ORGS.map((org) => ({ org, n: mentionsOf(org) }))
        .filter((r) => r.n > 0)
        .sort((a, b) => b.n - a.n),
    [],
  );

  const [active, setActive] = useState<string | null>(null);
  const stats = useStats(ranked);
  const [tab, setTab] = useState(stats[0].id);
  const current = stats.find((s) => s.id === tab) ?? stats[0];
  const shown = active ? ranked.find((r) => r.org.id === active) : null;

  return (
    <div className="mt-9 border border-ink/[0.14] bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-ink/[0.14] px-5 py-4 min-[680px]:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/55">
          The ecology, as this record has it
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/40">
          {ranked.length} organisations · {LEADERS.length} named leaders
        </p>
      </div>

      <div className="grid gap-px bg-ink/[0.14] min-[1000px]:grid-cols-[1.35fr_1fr]">
        {/* nebula */}
        <div className="bg-surface p-5 min-[680px]:p-6">
          <Nebula ranked={ranked} active={active} onActive={setActive} />

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
            {(Object.keys(ORG_ROLE_LABEL) as OrgRole[]).map((r) => (
              <span
                key={r}
                className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink/45"
              >
                <i aria-hidden className={`h-2.5 w-2.5 rounded-full border ${ROLE_STYLE[r]}`} />
                {ORG_ROLE_LABEL[r]}
              </span>
            ))}
          </div>

          {/* One readout rather than fifteen labels: the cloud stays legible and
              the detail arrives on demand, the same trade DisparityTreemap makes. */}
          <p className="mt-4 min-h-[5.4em] border-t border-ink/[0.14] pt-4 text-[13px] leading-[1.6] text-ink/70">
            {shown ? (
              <>
                <b className="font-medium text-ink">{shown.org.name}</b>
                <span className="text-ink/45">
                  {" — "}
                  {ORG_ROLE_LABEL[shown.org.role].toLowerCase()} · named {shown.n}{" "}
                  {shown.n === 1 ? "time" : "times"} here
                </span>
                <br />
                {shown.org.note}
              </>
            ) : (
              <span className="text-ink/50">
                Sized by how many times each name appears in this report&rsquo;s own findings and
                timeline — not by valuation, funding or headcount, none of which this report has
                measured. Hover a mark for what the record says about it.
              </span>
            )}
          </p>
        </div>

        {/* stat viewer */}
        <div className="bg-surface p-5 min-[680px]:p-6">
          <div className="flex flex-wrap gap-2">
            {stats.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setTab(s.id)}
                aria-pressed={tab === s.id}
                className={`rounded-[2px] border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors ${
                  tab === s.id
                    ? "border-accent bg-accent/10 text-accent-deep"
                    : "border-ink/20 text-ink/60 hover:border-ink/45 hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {/* keyed, so switching tabs re-runs the count-up rather than snapping */}
          <FigureChart key={current.id} chart={current.chart} />
        </div>
      </div>

      {/* leadership */}
      <div className="border-t border-ink/[0.14] px-5 pb-6 pt-1 min-[680px]:px-6">
        <CardRail label="Who runs the labs named here" count={LEADERS.length} noun="leaders">
          {LEADERS.map((l) => {
            const org = orgById(l.org);
            return (
              <RailItem key={l.id}>
                <article className="flex flex-col border border-ink/[0.14] bg-surface p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center border border-ink/20 text-ink/70">
                      {org?.logo ? (
                        <LogoMark slug={org.logo} name={org.name} colored={false} size="h-5 w-5" />
                      ) : (
                        <span className="font-mono text-[9px] font-bold uppercase">
                          {org?.name.slice(0, 2)}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 font-mono text-[10px] uppercase leading-[1.4] tracking-[0.12em] text-ink/50">
                      {org?.name}
                    </span>
                  </div>

                  <h3 className="mt-4 text-[17px] font-medium leading-[1.3] tracking-[-0.015em] text-ink">
                    {l.name}
                  </h3>
                  <p className="mt-1 text-[13px] leading-[1.5] text-accent-deep">{l.role}</p>
                  <p className="mt-3 text-[13.5px] leading-[1.65] text-ink/70">{l.note}</p>

                  {/* The date is not a footnote. A leadership claim without one
                      goes stale silently, which is the failure this whole
                      report is about. */}
                  <p className="mt-auto pt-5 font-mono text-[10px] uppercase leading-[1.6] tracking-[0.12em] text-ink/45">
                    Checked {l.asOf}
                    <br />
                    <a
                      href={l.source.url}
                      target="_blank"
                      rel="noopener"
                      className="text-accent-deep underline-offset-4 hover:underline"
                    >
                      {l.source.name} ↗
                    </a>
                  </p>
                </article>
              </RailItem>
            );
          })}
        </CardRail>
      </div>
    </div>
  );
}
