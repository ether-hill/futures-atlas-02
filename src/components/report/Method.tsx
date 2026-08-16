import { TIER_MEANING, countTier, type Dropped, type Finding, type Tier } from "@/data/report-types";
import { Section } from "./Section";

/**
 * The method section, shared by every report.
 *
 * It was the same markup three times, differing only in one sentence — so a
 * change to the wording meant three edits and, predictably, three slightly
 * different versions of it.
 *
 * The copy is deliberately flat. This is the section where a reader checks
 * whether to trust the rest, and a reader doing that does not want to be
 * argued at: it says what a tier means, how many findings hold it, and what
 * was thrown out. The claim that "we looked and it did not hold up" is a
 * finding is true, and it is better demonstrated by publishing the list than
 * by asserting it in a preamble.
 *
 * ── Why the rejects are collapsed ───────────────────────────────────────────
 *
 * They run to twenty-seven entries on the hegemony report. Open, they are a
 * wall at the foot of the page that pushes the sources out of reach; closed,
 * they are one line stating exactly how many there are. The count is in the
 * summary, so nothing is hidden — you can see the size of the list without
 * opening it, which is the number that actually matters.
 *
 * `<details>` rather than a JS disclosure: it opens without hydration, it is
 * keyboard-operable and announced correctly for free, and find-in-page opens
 * it to reach the text inside.
 */
export function Method({
  label,
  findings,
  dropped,
  note,
}: {
  /** The section number, e.g. "10 · Method". */
  label: string;
  findings: Finding[];
  dropped: Dropped[];
  /** One plain sentence on what this report's rejects have in common. */
  note: string;
}) {
  return (
    <Section
      label={label}
      title="How to read this"
      lede={
        <p>
          Every finding carries a tier and a scope line. The tier says how much
          weight the claim holds. The scope says what it covers &mdash; the
          dataset, the model, the year, the sample. Both are on every card.
        </p>
      }
    >
      <div className="mt-8 grid gap-4 min-[720px]:grid-cols-3">
        {(["documented", "reported", "emergent"] as const).map((t: Tier) => (
          <div key={t} className="border border-ink/[0.14] bg-surface p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-deep">{t}</p>
            <p className="mt-1 font-mono text-[22px] font-bold leading-none text-ink">
              {countTier(findings, t)}
            </p>
            <p className="mt-3 text-[13px] leading-[1.65] text-ink/70">{TIER_MEANING[t]}</p>
          </div>
        ))}
      </div>

      <details className="group mt-[clamp(36px,5vw,56px)] border-t border-ink/[0.14]">
        <summary className="flex cursor-pointer list-none items-baseline gap-3 py-5 text-ink [&::-webkit-details-marker]:hidden">
          <span
            aria-hidden
            className="font-mono text-[15px] leading-none text-accent-deep transition-transform group-open:rotate-45"
          >
            +
          </span>
          <span className="text-[17px] font-medium tracking-[-0.015em]">
            Checked and not used
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/45">
            {dropped.length} claims
          </span>
        </summary>

        <p className="max-w-[68ch] pb-5 text-[14px] leading-[1.7] text-ink/70">{note}</p>

        <ol className="mb-6 grid gap-px border border-ink/[0.14] bg-ink/[0.14]">
          {dropped.map((d) => (
            <li key={d.claim} className="bg-surface p-5 min-[680px]:p-6">
              <p className="text-[15px] font-medium leading-[1.4] text-ink">{d.claim}</p>
              <p className="mt-2 max-w-[80ch] text-[13.5px] leading-[1.7] text-ink/70">{d.reason}</p>
            </li>
          ))}
        </ol>
      </details>
    </Section>
  );
}
