import Link from "next/link";
import { FINDINGS, TIMELINE, DROPPED, countByTier } from "@/data/hegemony";

/**
 * The feed's card for a deep-dive report of our own.
 *
 * Deliberately NOT a Post. Every entry in posts.ts is commentary on someone
 * else's work and always shows the canonical `url` — that contract is the
 * feed's whole promise, and squeezing our own reporting into it would make
 * the Atlas the source of a link it also wrote. So the report gets a distinct
 * card that says what it is, spans the grid, and carries its own tallies
 * counted from the data rather than typed in.
 */

export function ReportCard() {
  const stats = [
    { n: FINDINGS.length, l: "findings" },
    { n: countByTier("documented"), l: "peer-reviewed" },
    { n: TIMELINE.length, l: "dated events" },
    { n: DROPPED.length, l: "rejected" },
  ];

  return (
    <article className="col-span-full border border-accent/40 bg-surface">
      <Link href="/feed/ai-hegemony" className="group block p-6 min-[680px]:p-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="border border-accent/50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
            Investigation
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/45">
            Atlas original · long read
          </span>
        </div>

        <h2 className="mt-5 max-w-[16ch] text-[clamp(28px,4.2vw,52px)] font-medium leading-[1.02] tracking-[-0.035em] text-ink transition-colors group-hover:text-accent-deep">
          Whose common sense?
        </h2>

        <p className="mt-5 max-w-[62ch] text-[15px] leading-[1.7] text-ink/75">
          The open web is about 41% English. GPT-3&rsquo;s training mix was
          92.6%. That gap isn&rsquo;t the web &mdash; it&rsquo;s filtering. An
          investigation into how Western assumptions get into AI systems, what
          is actually documented, and what is being built in response.
        </p>

        <dl className="mt-7 flex flex-wrap gap-x-9 gap-y-4 border-t border-ink/[0.14] pt-5">
          {stats.map((s) => (
            <div key={s.l}>
              <dt className="font-mono text-[20px] font-bold leading-none tracking-tight text-accent-deep">
                {s.n}
              </dt>
              <dd className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/50">
                {s.l}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-accent-deep">
          Read the investigation →
        </p>
      </Link>
    </article>
  );
}
