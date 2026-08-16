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
} from "@/data/compute-cities";
import { LEADERS, ORGS } from "@/data/compute-cities-ecosystem";
import { formatPostDate } from "@/data/posts";

/**
 * Where Compute Gets Built.
 *
 * A static segment under /feed, built from the shared report components.
 *
 * The thing to know about this one: it was commissioned from a brief carrying
 * a dozen confident figures, and most of them are in the rejects rather than
 * the findings. That is not a failure of the brief — its instinct was right,
 * and the reason its numbers could not be sourced IS the report. Nobody
 * publishes compute by city, so every claim about concentration is a funding
 * figure standing in for one.
 *
 * The masthead wall is built from MOSAIC — the report's own broadcast stills
 * and publisher images, every one fetched and confirmed to resolve. That is
 * the standard for every report: the hero is made of the coverage the page
 * credits below it, never decorated with a stock photograph of a drone, which
 * would be exactly the borrowed authority the evidence contract refuses.
 */

export const metadata: Metadata = {
  title: "Where Compute Gets Built — Futures Atlas",
  description: `Where advanced computing can physically be done: what limits it, who funds it, and which places are trying to change that. ${FINDINGS.length} findings, each scoped to what it actually measures.`,
};

export default function WhereComputeGetsBuiltPage() {
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
              Where Compute Gets Built
            </h1>

            <p className="mt-8 max-w-[58ch] text-[clamp(16px,1.5vw,20px)] leading-[1.65] text-paper/75">
              Advanced computing needs somewhere to physically happen: chips,
              megawatts, fibre and a jurisdiction that will permit it. This is
              what is documented about where that exists, what is limiting it,
              and which places are trying to build their way in.
            </p>
          </div>
        </Container>
      </section>

      <Container>
        <div className="mt-[clamp(48px,7vw,96px)] space-y-[clamp(48px,7vw,96px)]">
          <Section
            label="01 · The constraint"
            title="The shortage moved from chips to electricity"
            lede={
              <p>
                Chips can be shipped. Grid capacity cannot, and the queue to
                connect to the American grid is now larger than the grid
                itself. This is the section with the firmest numbers in the
                report, and one of them is a forecast that gets quoted as a
                count.
              </p>
            }
          >
            <FindingCarousel findings={findingsIn("constraint")} label="Findings on the constraint" />
          </Section>

          <Section
            label="02 · Concentration"
            title="Everyone measures the money, because nobody measures the compute"
            lede={
              <p>
                Three quarters of global AI venture funding went to one
                country and most of that to one metro. That is a real
                measurement of capital &mdash; and it is not a measurement of
                compute, which is what the figures are usually asked to stand
                in for. The gap between those two things is the most important
                thing on this page.
              </p>
            }
          >
            <FindingCarousel findings={findingsIn("concentration")} label="Findings on concentration" />
          </Section>

          <Section
            label="03 · Quantum"
            title="Still spread out, because it is still public money"
            lede={
              <p>
                Quantum research sits in many places because national
                programmes put it there, on sums an order of magnitude below a
                single hyperscaler&rsquo;s annual capital expenditure. Whether
                that survives commercialisation is a prediction, and it is
                labelled as one here.
              </p>
            }
          >
            <FindingCarousel findings={findingsIn("quantum")} label="Findings on quantum" />
          </Section>

          <Section
            label="04 · The record"
            title="Forecasts first, measurements later"
            lede={
              <p>
                Announcements and policy on the left, findings and responses on
                the right. The shape here is that the widely-quoted numbers
                arrived before the counted ones, and are still quoted more
                often.
              </p>
            }
          >
            <FeedbackTimeline events={TIMELINE} />
          </Section>

          <Section
            label="05 · The new cities"
            title="Land, funding, governance — and no megawatts"
            lede={
              <p>
                Pr&oacute;spera, Praxis, Telosa and Itana are all pitched at
                least partly on being where advanced work can happen. Between
                them the public record holds land, money, company registrations
                and legal arrangements. It holds no power capacity and no
                compute, which on this report&rsquo;s own thesis is the figure
                that would matter.
              </p>
            }
          >
            <FindingCarousel findings={findingsIn("cities")} label="Findings on the new cities" />
          </Section>

          <Section
            label="06 · The ecology"
            title="The heaviest names here are the ones counting, not building"
            lede={
              <p>
                Weighted by how often each name appears in the evidence above.
                That the measurers outweigh the operators is not a quirk of the
                tally &mdash; it is what happens when the only public numbers
                about an industry come from outside it.
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
            label="07 · Chokepoints"
            title="Access is being set case by case"
            lede={
              <p>
                The framework that would have tiered the world&rsquo;s access
                to US chips was withdrawn in 2025. What replaced it is
                discretionary licensing, a law that asks the chip to report its
                own location, and an enforcement record showing the controls
                bind hard enough to be worth evading at nine figures.
              </p>
            }
          >
            <FindingCarousel findings={findingsIn("geopolitics")} label="Findings on chokepoints" />
          </Section>
        </div>
      </Container>

      <section className="mt-[clamp(48px,7vw,96px)] border-y border-ink/[0.14] bg-panel py-[clamp(52px,8vw,104px)]">
        <Container className="space-y-[clamp(52px,8vw,104px)]">
          <BandSection
            label="08 · Watch"
            title="Watching the constraint"
            lede={
              <p>
              The grid story, from the generation side, the academic side
                and the local-politics side &mdash; including the optimistic
                case, because a rail carrying only the alarm would be making
                the argument for you. Press play and the video loads here;
                nothing from YouTube reaches your browser until you do.
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
            title="The sources, mostly primary"
            lede={
              <p>
                The reporting and the primary documents this report is built on.
                Every card goes to the publisher&rsquo;s own page &mdash; this
                section is an index of other people&rsquo;s work, never a
                substitute for it. Most of these render typographically
                because Gartner, Berkeley Lab, the OECD and the Congressional
                Research Service publish no share image &mdash; which is its
                own small comment on who is producing the numbers here and who
                is producing the coverage.
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
