import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { CardRail, RailItem } from "@/components/report/CardRail";
import { BandSection, Section } from "@/components/report/Section";
import { FindingCarousel } from "@/components/report/FindingCarousel";
import { DisparityTreemap } from "@/components/hegemony/DisparityTreemap";
import { EcologyDashboard } from "@/components/report/EcologyDashboard";
import { FeedbackTimeline } from "@/components/report/FeedbackTimeline";
import { HeroMosaic } from "@/components/report/HeroMosaic";
import { PressCard } from "@/components/report/PressCard";
import { VersionSwitch } from "@/components/hegemony/VersionSwitch";
import { VideoCard } from "@/components/report/VideoCard";
import {
  DROPPED,
  FINDINGS,
  MOSAIC,
  findingsIn,
  PRESS,
  PUBLISHED,
  TIER_MEANING,
  TIMELINE,
  VIDEOS,
  countByTier,
} from "@/data/hegemony";
import { LEADERS, ORGS } from "@/data/ecosystem";
import { formatPostDate } from "@/data/posts";

/**
 * The AI Hegemony report.
 *
 * A static segment under /feed, so it takes precedence over [slug] and the
 * feed stays the index while the report is a real page. It is not a post:
 * post bodies are markdown, and this needs measured charts, a two-strand
 * timeline and click-to-cite on every claim.
 */

export const metadata: Metadata = {
  title: "AI Hegemony — Futures Atlas",
  // Counted, not typed: this description said "57 findings" for exactly as
  // long as it took to add three more.
  description: `How Western assumptions get into AI systems, what is actually documented, and what is being built in response. ${FINDINGS.length} findings, every one scoped to the dataset, model and year it covers.`,
};

export default function AiHegemonyPage() {
  return (
    <main className="pb-[clamp(60px,9vw,120px)]">
      <VersionSwitch current="v1" />

      {/* ── masthead ───────────────────────────────────────────────────────
          The title sits on a wall built from the coverage itself — see
          HeroMosaic. Dark in both themes (bg-band), because a scrim over
          photographs only works one way round. */}
      <section className="relative isolate flex min-h-[clamp(620px,88vh,960px)] items-start overflow-hidden bg-band">
        <HeroMosaic tiles={MOSAIC} />
        {/* One narrow column in the left third, sitting in the scrim's pool —
            the wall is the picture, so the type stays out of its way rather
            than spanning it. Top-weighted, not centred: the mosaic wants to
            carry the bottom half of the frame on its own. */}
        <Container className="relative pb-[clamp(48px,8vw,96px)] pt-[clamp(32px,9vh,104px)]">
          <div className="max-w-[34rem]">
            <Link
              href="/feed"
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-paper/60 underline-offset-4 hover:text-paper hover:underline"
            >
              ← The feed
            </Link>
            {/* The date, not a section label. Every figure below is a
                measurement of a moment, so when this went out is part of the
                claim rather than furniture. */}
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
              Published {formatPostDate(PUBLISHED)}
            </p>
            <h1 className="mt-4 max-w-[13ch] text-[clamp(36px,5.2vw,64px)] font-medium leading-[1.0] tracking-[-0.035em] text-paper">
              AI Hegemony
            </h1>

            <p className="mt-6 max-w-[46ch] text-[clamp(15px,1.6vw,18px)] leading-[1.6] tracking-[-0.005em] text-paper/90">
              How the geographic and linguistic composition of AI training data was produced, what filtering did to it, and what is documented about the effects. Every finding is scoped to the dataset, model and year it covers.
            </p>
          </div>
        </Container>
      </section>

      <Container className="pt-[clamp(36px,5vw,64px)]">
        <div className="max-w-[68ch] space-y-4 text-[15px] leading-[1.75] text-ink/75">
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
            {/* A rail, not a grid: eighteen cards is a wall, and the charts on
                them want to be met four at a time. Nothing is held back — the
                header counts the whole strand. */}
            <FindingCarousel findings={findingsIn("composition")} label="Findings on data composition" />
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
            <FindingCarousel findings={findingsIn("encoding")} label="Findings on encoding" />
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
            <FindingCarousel findings={findingsIn("amplification")} label="Findings on amplification" />
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
            <FindingCarousel findings={findingsIn("geopolitics")} label="Findings on concentration" />
          </Section>

          <Section
            label="06 · The ecology"
            title="Who builds it, and who is named for it"
            lede={
              <p>
                The industry layer behind the corpus, drawn from this
                report&rsquo;s own record rather than from a market map. There
                are no valuations here and no funding rounds: a company&rsquo;s
                weight is how often its name appears in the evidence above.
                Leadership is a dated snapshot, because it moves &mdash; the
                title at Google DeepMind changed ten days before this shipped.
              </p>
            }
          >
            <EcologyDashboard
              orgs={ORGS}
              leaders={LEADERS}
              findings={FINDINGS}
              timeline={TIMELINE}
              sections={{
                composition: "Composition",
                encoding: "Encoding",
                amplification: "Amplification",
                geopolitics: "Concentration",
                resistance: "Resistance",
              }}
            />
          </Section>

          <Section
            label="07 · Resistance"
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
            <FindingCarousel findings={findingsIn("resistance")} label="Findings on resistance" />
          </Section>
        </div>
      </Container>

      {/* ── coverage ───────────────────────────────────────────────────────
          Two sections on one dark band, tying back to the masthead they
          supply the pictures for. They sit AFTER the findings and BEFORE the
          method on purpose: this is who else has looked, not what we measured,
          and putting a documentary before the evidence would let it stand in
          for the evidence. Nothing here is tiered, for the same reason. */}
      <section className="mt-[clamp(48px,7vw,96px)] border-y border-ink/[0.14] bg-panel py-[clamp(52px,8vw,104px)]">
        <Container className="space-y-[clamp(52px,8vw,104px)]">
          <BandSection
            label="08 · Watch"
            title="The corpus, the labour, the answer"
            lede={
              <p>
                Nine broadcasts on the same subject, from a Nairobi
                documentary to an investor&rsquo;s pitch for sovereign models.
                Press play and the video loads here; nothing from YouTube
                reaches your browser until you do.
              </p>
            }
          >
            <CardRail
              label="Broadcasts on this subject"
              count={VIDEOS.length}
              noun="broadcasts"
            >
              {VIDEOS.map((v) => (
                <RailItem key={v.id} width="three">
                  <VideoCard video={v} />
                </RailItem>
              ))}
            </CardRail>
          </BandSection>

          <BandSection
            label="09 · In the press"
            title="Selected coverage"
            lede={
              <p>
                Reporting we read while building this report, and did not use
                as evidence for any claim above. Every card shows the
                publisher&rsquo;s own picture and goes to the publisher&rsquo;s
                own page &mdash; this section is an index of other
                people&rsquo;s work, never a substitute for it.
              </p>
            }
          >
            <CardRail
              label="Selected press coverage"
              count={PRESS.length}
              noun="articles"
            >
              {PRESS.map((item) => (
                <RailItem key={item.id} width="three">
                  <PressCard item={item} />
                </RailItem>
              ))}
            </CardRail>
          </BandSection>
        </Container>
      </section>

      <Container className="pt-[clamp(48px,7vw,96px)]">
        <div>
          {/* ── methodology ───────────────────────────────────────────── */}
          <Section
            label="10 · Method"
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
