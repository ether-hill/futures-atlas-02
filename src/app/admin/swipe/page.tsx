import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { listSectors, readJson, RECHECK_KEY, sectorsConfigured } from "@/lib/swipe-sectors";
import type { Finding } from "@/app/api/swipe/recheck/route";
import { SectorActions } from "./SectorActions";
import { RecheckButton } from "./RecheckButton";

export const metadata: Metadata = {
  title: "Swipe the Future desk",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Report = { ranAt: string; lastRunChecked: number; lastRunSkipped: number; findings: Finding[] };

/**
 * The editor's desk for Swipe the Future: the decks visitors asked for and the
 * weekly freshness report. Both are review queues, nothing on this page runs
 * automatically against the live deck.
 */
export default async function SwipeAdminPage() {
  if (!sectorsConfigured()) {
    return (
      <Shell>
        <p className="font-mono text-[13px] text-graphite">
          No Redis store is configured, so there is nothing to review. Set REDIS_URL (or the KV
          REST pair) on this project.
        </p>
      </Shell>
    );
  }

  const [sectors, report] = await Promise.all([listSectors(), readJson<Report>(RECHECK_KEY)]);
  const pending = sectors.filter((s) => !s.approved);
  const live = sectors.filter((s) => s.approved);
  const flagged = (report?.findings ?? []).filter((f) => f.status !== "holds");

  return (
    <Shell>
      <Section
        title={`Waiting on you (${pending.length})`}
        note="Visitors typed these sectors and Claude drafted them with web search. They are already playable, flagged AI-drafted on the card. Read the claims, follow the sources, then approve to drop the badge, or delete."
      >
        {pending.length ? pending.map((s) => (
          <Deck key={s.id} sector={s} />
        )) : <Empty>Nothing waiting.</Empty>}
      </Section>

      <Section title={`Approved (${live.length})`} note="Signed off. These sit alongside the hand-written decks with no badge.">
        {live.length ? live.map((s) => <Deck key={s.id} sector={s} />) : <Empty>None yet.</Empty>}
      </Section>

      <Section
        title={`Freshness · ${flagged.length} need a look`}
        note={
          report?.ranAt
            ? `Last run ${new Date(report.ranAt).toLocaleString("en-GB")}: ${report.lastRunChecked} claims re-checked${report.lastRunSkipped ? `, ${report.lastRunSkipped} never checked yet` : ""}. The cron runs Mondays and never edits a live card.`
            : "The weekly re-check hasn't run yet. It re-reads each claim against current sources and reports back here; it never edits a live card."
        }
      >
        <RecheckButton />
        {flagged.length ? (
          <div className="mt-6 divide-y divide-line/60 border-t border-line/60">
            {flagged.map((f) => (
              <div key={f.id} className="flex gap-4 py-4">
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] ${f.status === "wrong" ? "bg-[#d8694e]/15 text-[#d8694e]" : "bg-[#d8b13c]/15 text-[#a8840f]"}`}>
                  {f.status}
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] leading-snug text-ink">{f.claim}</p>
                  <p className="mt-1 font-mono text-[11px] text-graphite">
                    {f.sector} · {f.id}
                    {f.suggestedVerdict ? ` · suggests “${f.suggestedVerdict}”` : ""}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-graphite">{f.note}</p>
                </div>
              </div>
            ))}
          </div>
        ) : report?.ranAt ? <Empty>Everything checked is still holding up.</Empty> : null}
      </Section>
    </Shell>
  );
}

function Deck({ sector }: { sector: Awaited<ReturnType<typeof listSectors>>[number] }) {
  // Drafted against v1's four-step scale, so it cannot be scored by a game that
  // asks whether a thing has already happened. It is hidden from players; this
  // says so, rather than leaving an editor wondering why nobody sees it.
  const preV2 = !sector.cards.every((c) => c.verdict === "already" || c.verdict === "notyet");
  return (
    <article className="mb-5 rounded-2xl border border-line/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[19px] font-semibold tracking-[-0.015em] text-ink">{sector.name}</h3>
          {preV2 && (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-accent-deep">
              Old verdict scale · not served to players · rebuild or delete
            </p>
          )}
          <p className="mt-1 font-mono text-[11px] text-graphite">
            {sector.blurb} · asked for as “{sector.requestedAs ?? sector.id}” · {sector.cards.length} claims ·
            drafted {new Date(sector.createdAt).toLocaleDateString("en-GB")}
          </p>
        </div>
        <SectorActions slug={sector.id} approved={sector.approved} />
      </div>
      <ol className="mt-4 space-y-3 border-t border-line/60 pt-4">
        {sector.cards.map((c) => (
          <li key={c.id} className="text-[13.5px] leading-relaxed">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite">{c.verdict}</span>
            <p className="text-ink">{c.claim}</p>
            <p className="text-graphite">{c.note}</p>
            {c.source.url && (
              <a className="font-mono text-[11px] underline" href={c.source.url} target="_blank" rel="noopener noreferrer">
                {c.source.label} ↗
              </a>
            )}
          </li>
        ))}
      </ol>
    </article>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[70vh] bg-surface py-[clamp(40px,6vw,90px)]">
      <Container>
        <p className="eyebrow mb-4">Editor</p>
        <h1 className="mb-3 max-w-[20ch] text-[clamp(30px,4.4vw,60px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-ink text-balance">
          Swipe the Future desk
        </h1>
        <p className="mb-[clamp(30px,5vw,56px)] max-w-[62ch] text-[13px] leading-[1.7] text-graphite">
          Two review queues. Nothing here changes the public deck on its own.
        </p>
        {children}
      </Container>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">{title}</h2>
      <p className="mb-6 mt-2 max-w-[70ch] text-[13.5px] leading-relaxed text-graphite">{note}</p>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="font-mono text-[12px] text-graphite">{children}</p>
);
