import type { Finding } from "@/data/hegemony";
import { TIER_LABEL } from "@/data/hegemony";
import { Reveal } from "@/components/Reveal";

/**
 * One finding, at full size, as an editorial row rather than a card.
 *
 * v1's grid was the honest way to show fifty-seven things — but at eight, a
 * grid of identical bordered boxes is what makes a page read as a wall of
 * sameness. So the eight that survive the edit get the whole measure: the
 * figure set large in its own column, the claim at reading size, and the SCOPE
 * inline instead of behind a disclosure.
 *
 * The scope line is the one thing that must not become optional. On v1 it sits
 * behind a click because fifty-seven of them inline is a wall nobody reads;
 * here there are eight, so there is no excuse for hiding it, and it is
 * rendered ABOVE the source — it is the correction this report exists to make.
 *
 * Rows alternate which side the figure sits on. Not decoration: with eight
 * full-width rows in a column, a fixed side turns into a stripe down the page
 * and the eye stops reading them as separate things.
 */
export function HeadlineFinding({ finding, index }: { finding: Finding; index: number }) {
  const flip = index % 2 === 1;
  const { source } = finding;

  return (
    <Reveal
      as="article"
      // Flipping has to reverse the TEMPLATE as well as the order, or the
      // narrow 22rem column stays on the left and the prose lands in it while
      // the figure floats alone in the wide one.
      className={`grid items-start gap-x-10 gap-y-6 border-t border-ink/[0.14] pt-8 ${
        flip
          ? "min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] min-[900px]:[&>*:first-child]:order-2"
          : "min-[900px]:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]"
      }`}
    >
      <div>
        {/* Most of these figures are phrases, not numbers — "US 59 · China 35 ·
            Europe 2", "$1.32–$2 per hour". Set at display size they broke
            across three lines with the arrow stranded mid-air, so the scale is
            pitched at a stat LINE rather than a stat, and balanced so the
            breaks fall between clauses. */}
        {finding.figure && (
          <p className="text-balance font-mono text-[clamp(22px,2.8vw,34px)] font-bold leading-[1.15] tracking-[-0.03em] text-accent-deep">
            {finding.figure}
          </p>
        )}
        <p
          className={`font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45 ${
            finding.figure ? "mt-4" : ""
          }`}
        >
          {TIER_LABEL[finding.tier]}
        </p>
      </div>

      <div>
        <h3 className="max-w-[36ch] text-[clamp(20px,2.4vw,28px)] font-medium leading-[1.25] tracking-[-0.02em] text-ink">
          {finding.claim}
        </h3>
        <p className="mt-4 max-w-[66ch] text-[15px] leading-[1.75] text-ink/75">{finding.detail}</p>

        <p className="mt-5 max-w-[66ch] border-l-2 border-accent/50 pl-4 text-[13.5px] leading-[1.7] text-ink/65">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-deep">
            Scope
          </span>
          <br />
          {finding.scope}
        </p>

        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-ink/50 underline-offset-4 transition-colors hover:text-accent-deep hover:underline"
        >
          {source.name}, {source.published} ↗
        </a>
      </div>
    </Reveal>
  );
}
