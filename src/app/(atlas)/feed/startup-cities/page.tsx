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
import { BandSection, Section } from "@/components/report/Section";
import {
  DROPPED,
  FINDINGS,
  MOSAIC,
  PRESS,
  VIDEOS,
  PUBLISHED,
  STRAND_NAME,
  TIER_MEANING,
  TIMELINE,
  countByTier,
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
  title: "Sovereign by Contract — Futures Atlas",
  description: `Charter cities, network states and the arbitration bill that follows when a host country changes its mind. ${FINDINGS.length} findings, every one scoped to the source and the year it covers.`,
};

export default function StartupCitiesPage() {
  const stats = [
    { n: String(FINDINGS.length), l: "Findings, each scoped" },
    { n: String(countByTier("documented")), l: "From primary or peer-reviewed sources" },
    { n: String(TIMELINE.length), l: "Dated events on the record" },
    { n: String(DROPPED.length), l: "Claims checked and dropped" },
  ];

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

            <h1 className="mt-6 max-w-[13ch] text-[clamp(44px,8vw,112px)] font-medium leading-[0.94] tracking-[-0.04em] text-paper">
              Sovereign by contract
            </h1>

            <p className="mt-8 max-w-[56ch] text-[clamp(16px,1.5vw,20px)] leading-[1.65] text-paper/75">
              A private city on a Honduran island is claiming $10.6&nbsp;billion
              from the country that hosted it, for changing its mind. The exit
              from the state turns out to be underwritten by the state system
              &mdash; and that is the model, not a hitch in it.
            </p>

            <dl className="mt-12 grid max-w-[52rem] grid-cols-2 gap-x-8 gap-y-8 min-[900px]:grid-cols-4">
              {stats.map((s) => (
                <div key={s.l}>
                  <dt className="font-mono text-[clamp(28px,3.6vw,46px)] font-bold leading-none tracking-[-0.03em] text-paper">
                    {s.n}
                  </dt>
                  <dd className="mt-2 font-mono text-[11px] uppercase leading-[1.5] tracking-[0.12em] text-paper/55">
                    {s.l}
                  </dd>
                </div>
              ))}
            </dl>
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

      <section className="mt-[clamp(48px,7vw,96px)] bg-band py-[clamp(52px,8vw,104px)]">
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
              tone="dark"
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
              tone="dark"
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
        <Section
          label="10 · Method"
          title="How to read the tiers, and what we threw away"
          lede={
            <p>
              Three tiers, spelled out rather than left to a colour. Then the
              rejects &mdash; including the comparison this story is most often
              reduced to.
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
            On this subject the temptation is not to overstate a number, it is
            to overstate a causal chain &mdash; to move from &ldquo;a system
            produced a list&rdquo; to &ldquo;a machine chose to kill&rdquo;.
            These are the claims that did not survive that test.
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
      </Container>
    </main>
  );
}
