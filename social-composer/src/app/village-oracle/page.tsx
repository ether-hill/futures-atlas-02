import { StudioApp } from "../studio-app";
import { villagesSource } from "@/lib/composer/villages-source";

// Second pre-stocked composer — Village Oracle screens (home, 2050 vision, consultation
// sections, consult-again in 16:9 + 3:2, plus clean text-free 2050 renders). Fields empty
// by default. Served at /social-composer/village-oracle.
export default function Page() {
  return (
    <div className="px-7 pb-[110px] pt-11 max-[680px]:px-4">
      <header className="mb-7">
        <h1
          className="m-0 text-[clamp(42px,7.5vw,96px)] font-extrabold leading-[0.96] tracking-[-0.025em] text-ink"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Village Oracle · Composer
        </h1>
        <p className="mt-[22px] m-0 max-w-[640px] text-[16px] leading-[1.55] text-ink/70">
          Pre-stocked with Village Oracle screens — the home, the 2050 vision, consultation
          sections and consult-again (desktop 16:9 and 3:2), plus clean text-free 2050 renders.
          Headline and subtext load empty; write your own copy per post, or upload / transmutate more.
        </p>
      </header>

      <section className="rounded-xl border border-ink/12">
        <StudioApp source={villagesSource()} />
      </section>
    </div>
  );
}
