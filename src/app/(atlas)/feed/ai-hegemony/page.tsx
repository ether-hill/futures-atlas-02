import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { FindingCard } from "@/components/hegemony/FindingCard";
import { DisparityTreemap } from "@/components/hegemony/DisparityTreemap";
import { FeedbackTimeline } from "@/components/hegemony/FeedbackTimeline";
import {
  DROPPED,
  FINDINGS,
  TIER_MEANING,
  TIMELINE,
  countByTier,
  findingsIn,
} from "@/data/hegemony";

/**
 * The AI Hegemony investigation.
 *
 * A static segment under /feed, so it takes precedence over [slug] and the
 * feed stays the index while the report is a real page. It is not a post:
 * post bodies are markdown, and this needs measured charts, a two-strand
 * timeline and click-to-cite on every claim.
 */

export const metadata: Metadata = {
  title: "Whose Common Sense? — Futures Atlas",
  description:
    "How Western assumptions get into AI systems, what is actually documented, and what is being built in response. 57 findings, every one scoped to the dataset, model and year it covers.",
};

const Section = ({
  label,
  title,
  lede,
  children,
}: {
  label: string;
  title: string;
  lede: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="border-t border-ink/[0.14] pt-[clamp(36px,5vw,64px)]">
    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">{label}</p>
    <h2 className="mt-4 max-w-[20ch] text-[clamp(28px,4vw,46px)] font-medium leading-[1.05] tracking-[-0.03em] text-ink">
      {title}
    </h2>
    <div className="mt-5 max-w-[68ch] text-[15px] leading-[1.75] text-ink/75">{lede}</div>
    {children}
  </section>
);

const Grid = ({ strand }: { strand: Parameters<typeof findingsIn>[0] }) => (
  <div className="mt-9 grid gap-4 min-[720px]:grid-cols-2 xl:grid-cols-3">
    {findingsIn(strand).map((f) => (
      <FindingCard key={f.id} finding={f} />
    ))}
  </div>
);

export default function AiHegemonyPage() {
  return (
    <main className="pb-[clamp(60px,9vw,120px)] pt-[clamp(28px,4vw,56px)]">
      <Container>
        {/* ── masthead ─────────────────────────────────────────────────── */}
        <header className="max-w-[46ch]">
          <Link
            href="/feed"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/55 underline-offset-4 hover:text-accent-deep hover:underline"
          >
            ← The feed
          </Link>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
            Investigation
          </p>
          <h1 className="mt-4 text-[clamp(40px,7.5vw,86px)] font-medium leading-[0.95] tracking-[-0.04em] text-ink">
            Whose common sense?
          </h1>
        </header>

        <p className="mt-8 max-w-[62ch] text-[clamp(17px,2.1vw,21px)] leading-[1.55] tracking-[-0.01em] text-ink">
          AI systems don&rsquo;t simply inherit a view of the world. They
          compress one, and then hand it back as though it were neutral. The
          question this report asks is narrower and answerable:{" "}
          <span className="text-accent-deep">
            which parts of that are documented, and which parts are just
            repeated?
          </span>
        </p>

        <div className="mt-6 max-w-[68ch] space-y-4 text-[15px] leading-[1.75] text-ink/75">
          <p>
            Every claim below carries the dataset, model and year it actually
            covers. That sounds like pedantry until you notice how much of the
            public conversation runs on figures stated far wider than their
            evidence &mdash; including, as it turned out, three of the figures
            this report was commissioned to illustrate.
          </p>
          <p>
            So the corrections are published too. Twenty-seven claims were
            checked and rejected, and they are listed at the foot of the page
            with reasons. A report auditing other people&rsquo;s sourcing owes
            the reader its own.
          </p>
        </div>

        {/* the tally, from the data rather than typed by hand */}
        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-y border-ink/[0.14] py-6 min-[720px]:grid-cols-4">
          {[
            { n: FINDINGS.length, l: "findings" },
            { n: countByTier("documented"), l: "peer-reviewed or primary" },
            { n: TIMELINE.length, l: "dated events" },
            { n: DROPPED.length, l: "claims rejected" },
          ].map((s) => (
            <div key={s.l}>
              <dt className="font-mono text-[28px] font-bold leading-none tracking-tight text-accent-deep">
                {s.n}
              </dt>
              <dd className="mt-2 font-mono text-[11px] uppercase leading-[1.5] tracking-[0.12em] text-ink/55">
                {s.l}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-[clamp(48px,7vw,96px)] space-y-[clamp(48px,7vw,96px)]">
          <Section
            label="01 · The disparity"
            title="The skew was manufactured, not inherited"
            lede={
              <p>
                The most-quoted number in this field is that half of AI&rsquo;s
                training data is American. Nobody has evidenced that. What was
                measured is narrower &mdash; and what it points at is more
                damning than the myth.
              </p>
            }
          >
            <DisparityTreemap />
            <Grid strand="composition" />
          </Section>

          <Section
            label="02 · Encoding"
            title="Fluent in the language, not in its categories"
            lede={
              <p>
                Ask a model to define a concept from outside the Anglophone
                world and it will do it well. Use that concept inside a real
                situation and watch what happens to it. This section includes
                the paper that undermines its own method, because leaving it
                out would be the exact move the report is criticising.
              </p>
            }
          >
            <Grid strand="encoding" />
          </Section>

          <Section
            label="03 · Amplification"
            title="Bias only matters at scale if people defer to it"
            lede={
              <p>
                The oldest evidence here is from 1997, before machine learning.
                The newest is a statutory inquiry into a thousand wrongful
                convictions. The mechanism connecting them is the same:
                machine output treated as more reliable than the evidence in
                front of the person reading it.
              </p>
            }
          >
            <Grid strand="amplification" />
          </Section>

          <Section
            label="04 · The feedback loop"
            title="Weeks to ship, months to answer"
            lede={
              <p>
                Releases on the left, findings and responses on the right. The
                shape is the argument &mdash; and the honest surprise is how
                often labs have documented their own bias and shipped anyway,
                which is a harder story than silence.
              </p>
            }
          >
            <FeedbackTimeline events={TIMELINE} />
          </Section>

          <Section
            label="05 · Concentration"
            title="Who builds it, and who is paid to clean it"
            lede={
              <p>
                Model production, compute and capital sit in two countries. The
                labour that makes the output presentable sits somewhere else
                entirely.
              </p>
            }
          >
            <Grid strand="geopolitics" />
          </Section>

          <Section
            label="06 · Resistance"
            title="Sovereign in the data, American in the licence"
            lede={
              <p>
                The constructive half &mdash; and the place a report like this
                is most tempted to flatter its subject. It doesn&rsquo;t. Real
                regulation now exists with real numbers in it, and real models
                have shipped. Most of the models described as sovereign are
                also legally governed by someone else&rsquo;s terms.
              </p>
            }
          >
            <Grid strand="resistance" />
          </Section>

          {/* ── methodology ───────────────────────────────────────────── */}
          <Section
            label="07 · Method"
            title="How to read the tiers, and what we threw away"
            lede={
              <p>
                Three tiers, spelled out rather than left to a colour. Then the
                rejects.
              </p>
            }
          >
            <div className="mt-8 grid gap-4 min-[720px]:grid-cols-3">
              {(["documented", "reported", "emergent"] as const).map((t) => (
                <div key={t} className="border border-ink/[0.14] bg-surface p-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent-deep">
                    {t}
                  </p>
                  <p className="mt-1 font-mono text-[22px] font-bold leading-none text-ink">
                    {countByTier(t)}
                  </p>
                  <p className="mt-3 text-[13px] leading-[1.65] text-ink/70">{TIER_MEANING[t]}</p>
                </div>
              ))}
            </div>

            <h3 className="mt-[clamp(36px,5vw,56px)] text-[22px] font-medium tracking-[-0.02em] text-ink">
              Checked, and not used
            </h3>
            <p className="mt-3 max-w-[68ch] text-[15px] leading-[1.75] text-ink/75">
              Every one of these is in circulation, and several were in the
              brief for this report. &ldquo;We looked and it didn&rsquo;t hold
              up&rdquo; is a finding.
            </p>
            <ol className="mt-7 grid gap-px border border-ink/[0.14] bg-ink/[0.14]">
              {DROPPED.map((d) => (
                <li key={d.claim} className="bg-surface p-5 min-[680px]:p-6">
                  <p className="text-[15px] font-medium leading-[1.4] text-ink">{d.claim}</p>
                  <p className="mt-2 max-w-[80ch] text-[13.5px] leading-[1.7] text-ink/70">
                    {d.reason}
                  </p>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </Container>
    </main>
  );
}
