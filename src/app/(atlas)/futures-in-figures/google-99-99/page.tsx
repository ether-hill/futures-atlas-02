import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { SlideFilm } from "@/components/SlideFilm";
import { FiguresReferences } from "@/components/FiguresReferences";

const TITLE = "Google's 99.99%: what it means. Futures Atlas";
const DESC =
  "Google says its quantum computer hit 99.99% accuracy. Three slides on what was measured, how Google got there, and how far it still is from breaking internet security.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, images: ["/futures-in-figures/google-99-99/slide-1.jpg"] },
  twitter: { title: TITLE, description: DESC },
};

/**
 * A Futures in Figures piece told as a short story, from the carousel posted
 * on 16 October 2026. The chart is dataviz/output/willow-magic-state (synced
 * to public/futures-in-figures/charts/ like the others); the slide films here
 * are its Instagram slides, exported with `node video.mjs willow-magic-state`
 * and re-encoded for the web. Every number is read from that piece's
 * clean.csv; its method note says where each one comes from.
 */
const BASE = "/futures-in-figures/google-99-99";

const STEPS = [
  {
    heading: "What Google said",
    text: "On 15 October 2026 Google said its Willow quantum computer made one key building block, called a magic state, with 99.99% accuracy. A quantum computer needs these to run most useful programs. 99.99% means at most 1 mistake in 10,000.",
  },
  {
    heading: "How it got there",
    text: "Google checked every attempt and kept only the ones that passed. Only 8 in every 100 made it through; the other 92 were thrown away. That cut the mistakes 40 times.",
  },
  {
    heading: "How far there is to go",
    text: "To break the codes that keep online banking and messages private, a quantum computer would need building blocks with 1,000 times fewer mistakes: 1 in 10 million. That number comes from Google's own plan for how it could be done.",
  },
];

const linkCls = "text-accent-deep underline underline-offset-4";

export default function Google9999Page() {
  return (
    <>
      <section className="pt-[var(--space-header)] pb-[var(--space-section)]">
        <Container className="max-w-[1240px]">
          <p className="text-[14px]">
            <Link className={linkCls} href="/futures-in-figures">
              Futures in Figures
            </Link>
          </p>
          <h1 className="fa-t-display-l mt-6 max-w-[20ch]">Google says its quantum computer hit 99.99% accuracy. What does that mean?</h1>
          <p className="fa-t-lead mt-7 max-w-[56ch]">
            It&apos;s a real step forward, but the number is about one building block, not the whole machine. Three slides, in plain words.
          </p>
          <p className="mt-5 text-[14px] text-muted">16 October 2026</p>
        </Container>
      </section>

      <section className="pb-[var(--space-section)]">
        <Container className="max-w-[1240px]">
          <ol className="grid gap-[var(--space-gap-l)]">
            {STEPS.map((s, i) => (
              <li key={s.heading} className="border-t border-hairline pt-10">
                <div className="grid items-start gap-8 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[900px]:gap-14">
                  <div className="min-[900px]:sticky min-[900px]:top-28">
                    <p className="text-[13px] font-medium text-muted">{i + 1} of {STEPS.length}</p>
                    <h2 className="fa-t-display-s mt-3">{s.heading}</h2>
                    <p className="fa-t-body mt-5 max-w-[52ch]">{s.text}</p>
                  </div>
                  <div className="max-w-[520px]">
                    <SlideFilm src={`${BASE}/slide-${i + 1}.mp4`} poster={`${BASE}/slide-${i + 1}.jpg`} label={`Slide ${i + 1}: ${s.heading}`} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-t border-hairline py-[var(--space-section)]">
        <Container className="max-w-[1240px]">
          <div className="grid gap-8 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[900px]:gap-14">
            <div>
              <h2 className="fa-t-display-s">Keep in mind</h2>
              <ul className="fa-t-body mt-6 grid max-w-[60ch] gap-3 text-muted">
                <li>The 99.99% is for this one building block, not for everything the chip does. Its basic operations on two qubits still go wrong about 3 times in 1,000.</li>
                <li>It has only been shown at a small scale so far. Google says it still has to work inside a real, larger calculation.</li>
                <li>The 1 in 10 million comes from one Google researcher&apos;s plan, which hasn&apos;t been peer-reviewed. Other designs would need different numbers.</li>
                <li>The result was first posted as a preprint in December 2025. What&apos;s new is the peer-reviewed version in <i>Science</i>.</li>
              </ul>
            </div>
            <div>
              <h2 className="fa-t-display-s">Share it</h2>
              <ul className="mt-6 grid gap-3 text-[15px]">
                {STEPS.map((s, i) => (
                  <li key={s.heading}>
                    Slide {i + 1}:{" "}
                    <a className={linkCls} href={`${BASE}/slide-${i + 1}.mp4`} download>
                      video
                    </a>{" "}
                    ·{" "}
                    <a className={linkCls} href={`${BASE}/slide-${i + 1}.jpg`} download>
                      image
                    </a>
                  </li>
                ))}
                <li>
                  Landscape, for X:{" "}
                  <a className={linkCls} href="/futures-in-figures/willow-magic-state-landscape.mp4" download>
                    video
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <FiguresReferences slug="willow-magic-state" />
        </Container>
      </section>
    </>
  );
}
