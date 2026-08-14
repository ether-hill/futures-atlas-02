import Link from "next/link";
import { MosaicWall } from "@/components/hegemony/MosaicWall";
import { PUBLISHED } from "@/data/hegemony";
import { formatPostDate } from "@/data/posts";

/**
 * The feed's card for a deep-dive report of our own.
 *
 * Deliberately NOT a Post. Every entry in posts.ts is commentary on someone
 * else's work and always shows the canonical `url` — that contract is the
 * feed's whole promise, and squeezing our own reporting into it would make
 * the Atlas the source of a link it also wrote. So the report gets a distinct
 * card that says what it is and spans the grid.
 *
 * It also carries the report's own masthead wall, from the same MosaicWall the
 * hero mounts — so the card in the feed is a small piece of the page it opens,
 * and the two cannot drift apart. That forces the card dark in both themes
 * (the surrounding cards flip): a scrim over photographs only works one way
 * round, and this is the one card on the feed that is a whole report.
 */

export function ReportCard() {
  return (
    <article className="relative isolate col-span-full overflow-hidden border border-accent/40 bg-band">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Four rows is plenty behind a card this short, and the wall is the
            same one the report's hero uses. */}
        <MosaicWall perColumn={4} eagerRows={0} />
        <div className="absolute inset-0 bg-[rgba(0,0,0,0.34)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.78)_60%,rgba(0,0,0,0.62)_100%)] min-[900px]:bg-[radial-gradient(96%_130%_at_-8%_45%,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.9)_34%,rgba(0,0,0,0.66)_56%,rgba(0,0,0,0.2)_80%,rgba(0,0,0,0)_94%)]" />
      </div>

      <Link href="/feed/ai-hegemony" className="group relative block p-6 min-[680px]:p-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="border border-accent/60 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
            Report
          </span>
          {/* The date, in place of the old "Atlas original · long read" —
              same position, and it actually tells you something. */}
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/50">
            Published {formatPostDate(PUBLISHED)}
          </span>
        </div>

        <h2 className="mt-5 max-w-[16ch] text-[clamp(28px,4.2vw,52px)] font-medium leading-[1.02] tracking-[-0.035em] text-paper transition-colors group-hover:text-accent-deep">
          Whose common sense?
        </h2>

        <p className="mt-5 max-w-[54ch] text-[15px] leading-[1.7] text-paper/75">
          The open web is about 41% English. GPT-3&rsquo;s training mix was
          92.6%. That gap isn&rsquo;t the web &mdash; it&rsquo;s filtering. A
          report on how Western assumptions get into AI systems, what is
          actually documented, and what is being built in response.
        </p>

        <p className="mt-7 font-mono text-[11px] uppercase tracking-[0.16em] text-accent-deep">
          Read the report →
        </p>
      </Link>
    </article>
  );
}
