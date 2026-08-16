import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { CardRail, RailItem } from "@/components/report/CardRail";
import { EcologyDashboard } from "@/components/report/EcologyDashboard";
import { FeedbackTimeline } from "@/components/report/FeedbackTimeline";
import { FindingCarousel } from "@/components/report/FindingCarousel";
import { HeroMosaic } from "@/components/report/HeroMosaic";
import { PressCard } from "@/components/report/PressCard";
import { VideoCard } from "@/components/report/VideoCard";
import { Method } from "@/components/report/Method";
import { BandSection, Section } from "@/components/report/Section";
import {
  DROPPED,
  FINDINGS,
  MOSAIC,
  PRESS,
  VIDEOS,
  PUBLISHED,
  STRAND_NAME,
  TIMELINE,
  findingsIn,
} from "@/data/killchain";
import { LEADERS, ORGS } from "@/data/killchain-ecosystem";
import { formatPostDate } from "@/data/posts";

/**
 * The AI Kill Chain report.
 *
 * A static segment under /feed, like ai-hegemony, and built from the same
 * components — the report template is now shared, so what differs here is the
 * data and the argument, not the machinery.
 *
 * The masthead wall is built from MOSAIC — the report's own broadcast stills
 * and publisher images, every one fetched and confirmed to resolve. That is
 * the standard for every report: the hero is made of the coverage the page
 * credits below it, never decorated with a stock photograph of a drone, which
 * would be exactly the borrowed authority the evidence contract refuses.
 */

export const metadata: Metadata = {
  title: "AI in the Military — Futures Atlas",
  description: `Where machine learning actually sits in military targeting, what is documented, and what is not. ${FINDINGS.length} findings, every one scoped to the system, the source and the year it covers.`,
};

export default function AiKillChainPage() {
  return (
    <main className="pb-[clamp(60px,9vw,120px)]">
      {/* ── masthead ───────────────────────────────────────────────────────
          Typographic and dark in both themes. The one number that does the
          work sits at the top at display size, because the whole report is an
          argument about what twenty seconds of review can contain. */}
      <section className="relative isolate flex min-h-[clamp(560px,80vh,880px)] items-end overflow-hidden bg-band">
        <HeroMosaic tiles={MOSAIC} />
        <Container className="relative z-10 pb-[clamp(48px,8vw,96px)] pt-[clamp(32px,9vh,104px)]">
          <div className="max-w-[46rem]">
            <Link
              href="/feed"
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-paper/60 underline-offset-4 hover:text-paper hover:underline"
            >
              ← The feed
            </Link>

            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
              Report · Published {formatPostDate(PUBLISHED)}
            </p>

            <h1 className="mt-6 max-w-[14ch] text-[clamp(44px,8vw,112px)] font-medium leading-[0.94] tracking-[-0.04em] text-paper">
              AI in the Military
            </h1>

            <p className="mt-8 max-w-[58ch] text-[clamp(16px,1.5vw,20px)] leading-[1.65] text-paper/75">
              Where machine learning sits in military targeting: the systems in use, what is documented about human review, the model developers supplying them, and the current state of international law.
            </p>
          </div>
        </Container>
      </section>

      <Container>
        <div className="mt-[clamp(48px,7vw,96px)] space-y-[clamp(48px,7vw,96px)]">
          <Section
            label="01 · The chain"
            title="The autonomy is upstream of the weapon"
            lede={
              <p>
                Almost nothing in this report is a robot that decides to kill.
                It is software that decides what to look at, what to call a
                target and what to put in front of a person — and then a person
                who has seconds, a queue, and a system that is right most of the
                time.
              </p>
            }
          >
            <FindingCarousel findings={findingsIn("chain")} label="Findings on the targeting chain" />
          </Section>

          <Section
            label="02 · In use"
            title="What has actually been documented"
            lede={
              <p>
                Two live wars, and one detailed public account. Everything here
                is scoped to what a source established &mdash; what a system
                output, who reviewed it, and for how long. Where the record
                stops, the finding stops, which is why there is no claim on this
                page that a machine chose to kill anyone.
              </p>
            }
          >
            <FindingCarousel findings={findingsIn("deployed")} label="Findings on documented use" />
          </Section>

          <Section
            label="03 · The loop"
            title="The human in the loop was studied before there was a loop"
            lede={
              <p>
                &ldquo;A human is in the loop&rdquo; is quoted as though it
                settles the question. The measured question is what that human
                does with the output, and human-factors research has an
                uncomfortable answer that predates every system on this page by
                twenty-five years.
              </p>
            }
          >
            <FindingCarousel findings={findingsIn("loop")} label="Findings on human oversight" />
          </Section>

          <Section
            label="04 · The record"
            title="Policy after deployment, every time"
            lede={
              <p>
                Releases and procurement on the left, findings and responses on
                the right. The shape is the argument: the systems ship, the
                research and the votes arrive afterwards, and the gap between a
                capability and the rule covering it is measured in years.
              </p>
            }
          >
            <FeedbackTimeline events={TIMELINE} />
          </Section>

          <Section
            label="05 · The vendors"
            title="The policies that moved, and the ones that did not"
            lede={
              <p>
                Three of the largest model developers changed what they permit
                between January and November 2024. None of them announced a new
                capability to do it &mdash; the models were already able. What
                changed was the sentence in the policy.
              </p>
            }
          >
            <FindingCarousel findings={findingsIn("vendors")} label="Findings on the vendors" />
          </Section>

          <Section
            label="06 · The ecology"
            title="Who builds it, who buys it, who counts it"
            lede={
              <p>
                Drawn from this report&rsquo;s own record rather than from a
                defence-market map: an organisation&rsquo;s weight here is how
                often its name appears in the evidence above. A vendor
                appearing is not an accusation &mdash; what each is documented
                as having done is on its card, and nothing here connects any
                company to any strike, because no public source does.
              </p>
            }
          >
            <EcologyDashboard
              orgs={ORGS}
              leaders={LEADERS}
              findings={FINDINGS}
              timeline={TIMELINE}
              sections={STRAND_NAME}
            />
          </Section>

          <Section
            label="07 · The law"
            title="Two votes, no treaty, and an exemption"
            lede={
              <p>
                The legal record is the clearest thing in this report and the
                least reassuring. States agree overwhelmingly that this needs
                addressing, the agreement is non-binding, the bloc voting
                against it doubled in a year, and Europe&rsquo;s AI law removes
                military uses from its scope in a single sub-clause.
              </p>
            }
          >
            <FindingCarousel findings={findingsIn("law")} label="Findings on law and policy" />
          </Section>
        </div>
      </Container>

      <section className="mt-[clamp(48px,7vw,96px)] border-y border-ink/[0.14] bg-panel py-[clamp(52px,8vw,104px)]">
        <Container className="space-y-[clamp(52px,8vw,104px)]">
          <BandSection
            label="08 · Watch"
            title="The record is one week in April 2024"
            lede={
              <p>
              Broadcast attention to AI in targeting is almost entirely
                attention to a single investigation. There is no comparable
                television record of Maven, of Replicator or of the UN votes
                &mdash; which is itself worth noticing. Press play and the video
                loads here; nothing from YouTube reaches your browser until you
                do.
              </p>
            }
          >
            <CardRail
              label="Broadcast coverage"
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
            title="Where this came from"
            lede={
              <p>
                The reporting and the primary documents this report is built on.
                Every card goes to the publisher&rsquo;s own page &mdash; this
                section is an index of other people&rsquo;s work, never a
                substitute for it. Each publisher&rsquo;s own share image was
                fetched and confirmed to resolve; the ones that render
                typographically are the ones whose image could not be reached,
                because a guessed URL is a broken image and a false claim at
                once.
              </p>
            }
          >
            <CardRail
              label="Sources and coverage"
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
        <Method
          label="10 · Method"
          findings={FINDINGS}
          dropped={DROPPED}
          note={"The risk on this subject is overstating a causal chain rather than a number — moving from “a system produced a list” to “a machine chose to kill”. These did not survive that check."}
        />
      </Container>
    </main>
  );
}
