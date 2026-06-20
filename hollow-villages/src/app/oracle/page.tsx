import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { LettersConsole } from "@/components/LettersConsole";

export const metadata: Metadata = {
  title: "Consult the Oracle — The Hollow Villages",
  description:
    "Begin a consultation. The oracle opens a real letter at random, reads the place against every case it knows, and shows you that village in 2050.",
};

export default function OraclePage() {
  return (
    <>
      <section className="pb-[clamp(28px,4vw,48px)] pt-[clamp(44px,6vw,84px)]">
        <Container>
          <div className="mb-4 flex flex-wrap items-baseline gap-4">
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-accent-deep">
              Consult the oracle
            </span>
            <span className="h-px min-w-10 flex-1 bg-ink/20" />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
              One letter · one forecast
            </span>
          </div>
          <div className="flex flex-wrap items-end gap-[clamp(20px,5vw,80px)]">
            <h1 className="flex-[2_1_340px] text-[clamp(38px,6vw,88px)] font-extrabold leading-[0.94] tracking-[-0.028em] text-ink text-balance">
              Ask the oracle about a real village.
            </h1>
            <p className="flex-[1_1_300px] font-mono text-[14px] leading-[1.7] text-ink-70">
              Begin a consultation and the oracle draws a real letter from the
              record at random. It reads the place against every case it knows —
              and shows you that village today versus 2050, with the plan applied.
            </p>
          </div>
        </Container>
      </section>

      <section className="pb-[clamp(24px,4vw,48px)]">
        <Container>
          <LettersConsole />
        </Container>
      </section>

      {/* Write your own */}
      <section className="pb-[clamp(60px,8vw,110px)] pt-[clamp(40px,6vw,80px)]">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-7 border border-ink bg-band p-[clamp(28px,5vw,56px)] text-paper">
            <div className="flex-[1_1_380px]">
              <h2 className="mb-3.5 text-[clamp(26px,3.6vw,50px)] font-extrabold leading-none tracking-[-0.02em] text-paper text-balance">
                Your village isn&rsquo;t in the record.
              </h2>
              <p className="max-w-[52ch] font-mono text-[13.5px] leading-[1.7] text-paper/80">
                Tell the oracle where you are, who&rsquo;s leaving, and what
                stands empty. It will read your place against every case it knows
                — and forecast the return.
              </p>
            </div>
            <div className="flex flex-[1_1_320px] flex-col gap-3">
              <textarea
                rows={3}
                placeholder="My village is in… The young are leaving because… What stands empty is…"
                className="w-full resize-y rounded-[3px] border border-paper/30 bg-paper/[0.06] px-4 py-3.5 font-mono text-[13px] leading-[1.6] text-paper placeholder:text-paper/50 focus:border-accent"
              />
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2.5 rounded-[2px] bg-accent px-[22px] py-3.5 font-mono text-[12.5px] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-surface hover:text-ink"
              >
                Send to the oracle <span className="text-[14px]">→</span>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
