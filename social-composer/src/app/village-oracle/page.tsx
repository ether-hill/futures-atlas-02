import { ComposerPage } from "../composer-page";

// Kept as a deep link: the composer now carries every project's library behind one
// picker, and this route just opens it on Village Oracle. Its screens (home, the
// 2050 vision, consultation sections, consult-again, plus the text-free renders)
// are still there — they ride along with the captured ones in atlas-source.
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
          The composer opened on Village Oracle — the home, the 2050 vision, consultation
          sections and consult-again in desktop 16:9 and 3:2 and on mobile, plus the clean
          text-free 2050 renders. Headline and subtext load empty; write your own copy per post,
          or upload / transmutate more. Any asset can be deleted for good.
        </p>
      </header>

      <ComposerPage initialProject="hollow-villages" />
    </div>
  );
}
