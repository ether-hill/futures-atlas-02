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
} from "@/data/startup-cities";
import { LEADERS, ORGS } from "@/data/startup-cities-ecosystem";
import { formatPostDate } from "@/data/posts";

/**
 * Sovereign by Contract — the startup-cities report.
 *
 * A static segment under /feed, built from the shared report components. The
 * masthead wall is the report's own coverage — broadcast stills and publisher
 * images, each fetched and confirmed to resolve. Notably NOT the projects' own
 * renders: a promotional image of a city that does not exist yet is precisely
 * the borrowed authority the evidence contract refuses.
 */

export const metadata: Metadata = {
  title: "Start-up Cities — Futures Atlas",
  description: `Charter cities, network states and the arbitration bill that follows when a host country changes its mind. ${FINDINGS.length} findings, every one scoped to the source and the year it covers.`,
};

export default function StartupCitiesPage() {
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
              Start-up Cities
            </h1>

            <p className="mt-8 max-w-[58ch] text-[clamp(16px,1.5vw,20px)] leading-[1.65] text-paper/75">
              Privately governed cities and network states: the projects under way, who funds them, the legal arrangements they depend on, and the arbitration claim Próspera has brought against Honduras.
            </p>
          </div>
        </Container>
      </section>

      <Container>
        <div className="mt-[clamp(48px,7vw,96px)] space-y-[clamp(48px,7vw,96px)]">
          <Section
            label="01 · The idea"
            title="Exit, not voice — and recognition is written into the definition"
            lede={
              <p>
                This is not a property play with a philosophy bolted on. The
                philosophy came first, it is published, and it names its own
                goal: crowdfunded territory and eventual diplomatic recognition.
                Every project here is measured against a target its own
                literature sets.
              </p>
            }
          >
            <FindingCarousel findings={findingsIn("idea")} label="Findings on the idea" />
          </Section>

          <Section
            label="02 · The projects"
            title="One island, one Space Force base, one county"
            lede={
              <p>
                Three projects at three very different stages, and a running
                problem for anyone reporting on them: almost every number
                belongs to the people being measured. There is no census of
                Próspera and no audit of Praxis, so each figure here is tiered
                as reported and its scope line says whose number it is.
              </p>
            }
          >
            <FindingCarousel findings={findingsIn("projects")} label="Findings on the projects" />
          </Section>

          <Section
            label="03 · The money"
            title="A short cap table, placing the same bet repeatedly"
            lede={
              <p>
                Not a broad movement of many funders. A small, overlapping
                network &mdash; and, in the Honduran case, a US government that
                reports on the investment to Congress.
              </p>
            }
          >
            <FindingCarousel findings={findingsIn("money")} label="Findings on the money" />
          </Section>

          <Section
            label="04 · The bill"
            title="A country repealed the law, and the invoice arrived anyway"
            lede={
              <p>
                The load-bearing section. Honduras created these zones, repealed
                them unanimously, had its Supreme Court void the founding
                decrees and withdrew from the arbitration forum &mdash; and the
                claim is still live, because sovereignty granted by contract is
                expensive to take back.
              </p>
            }
          >
            <FindingCarousel findings={findingsIn("bill")} label="Findings on the arbitration" />
          </Section>

          <Section
            label="05 · The record"
            title="Built, repealed, litigated, funded again"
            lede={
              <p>
                Projects and financings on the left, the legal and political
                responses on the right. The shape is the argument: every state
                response so far has been answered with a larger claim or a
                larger round.
              </p>
            }
          >
            <FeedbackTimeline events={TIMELINE} />
          </Section>

          <Section
            label="06 · The ecology"
            title="Cities, funds, courts and countries on one map"
            lede={
              <p>
                Weighted by how often each name appears in the evidence above,
                not by size or capital. States and tribunals sit on the same map
                as the companies deliberately: a private city and the country it
                sits inside belong together, or the map is just a pitch deck.
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
            label="07 · Argentina"
            title="The first national government to say yes"
            lede={
              <p>
                Everything above happens in the gaps a state leaves. Argentina
                is the case where the state itself takes the position &mdash;
                thirty-year stability locks written as national law, and a draft
                bill for companies with no human owners at all.
              </p>
            }
          >
            <FindingCarousel findings={findingsIn("argentina")} label="Findings on Argentina" />
          </Section>
        </div>
      </Container>

      <section className="mt-[clamp(48px,7vw,96px)] border-y border-ink/[0.14] bg-panel py-[clamp(52px,8vw,104px)]">
        <Container className="space-y-[clamp(52px,8vw,104px)]">
          <BandSection
            label="08 · Watch"
            title="Both sides of it, on the record"
            lede={
              <p>
              Bloomberg and AJ+ are hostile, ReasonTV is the movement&rsquo;s
                own magazine, and two are enthusiast tours of the place itself.
                A coverage rail carrying only the critics would be making the
                report&rsquo;s case for it. Press play and the video loads here;
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
            title="Where this came from"
            lede={
              <p>
                The reporting and the primary documents this report is built on.
                Every card goes to the publisher&rsquo;s own page &mdash; this
                section is an index of other people&rsquo;s work, never a
                substitute for it. Two of them are primary documents &mdash; the
                case file and the State Department report &mdash; and reading
                those is the fastest route past everybody&rsquo;s summary of
                them. Each publisher&rsquo;s own share image was fetched and
                confirmed to resolve; the ones that render typographically are
                the ones whose image could not be reached, because a guessed URL
                is a broken image and a false claim at once.
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
          note={"The risk here is turning a claimed valuation into a debt, or a founder's marketing into a measurement. These did not survive that check."}
        />
      </Container>
    </main>
  );
}
