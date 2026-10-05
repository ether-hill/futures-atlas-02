import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { FiguresChart } from "@/components/FiguresChart";

const TITLE = "Futures in Figures. Futures Atlas";
const DESC =
  "Short, shareable charts about quantum computing and AI. Each one answers one question with real data, and says how sure the numbers are.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, images: ["/projects/futures-in-figures.jpg"] },
  twitter: { title: TITLE, description: DESC },
};

/**
 * Futures in Figures. The charts are built in /dataviz (data, processing
 * scripts, method notes, render tools). This page shows each chart live and
 * full width (FiguresChart, synced by scripts/sync-futures-in-figures.mjs);
 * the social posts are cut from the same charts and offered as downloads. Media in public/futures-in-figures/
 * is exported from there with `node video.mjs <slug> hook --variant field`
 * (a seamless loop: build, 4s hold to read, rewind) and renamed portrait /
 * landscape,
 * never edited by hand. Every claim below is also on that piece's method note.
 */

type Figure = {
  slug: string;
  question: string;
  answer: string;
  keepInMind: string;
  source: { label: string; href: string };
};

const FIGURES: Figure[] = [
  {
    slug: "q-day",
    question: "When could quantum computers break RSA encryption?",
    answer:
      "A Global Risk Institute survey asked 26 quantum experts how likely it is that a quantum computer could break RSA-2048, a common kind of encryption, within 5, 10, 15, 20 and 30 years. Only 1 put the odds at 70% or more within 5 years. Within 15 years, around 2040, 15 of the 26 did.",
    keepInMind: "These are expert opinions, not measurements: 26 invited experts, not a random sample. The survey's publisher, evolutionQ, sells quantum-safe security products.",
    source: {
      label: "Quantum Threat Timeline Report 2025, Global Risk Institute",
      href: "https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2025b/",
    },
  },
  {
    slug: "qubits-vs-quality",
    question: "Which quantum computers make the fewest errors?",
    answer:
      "Launches usually lead with the number of qubits, but a qubit is only useful if its operations work. These are the published error rates for nine machines. Trapped-ion machines come out lowest. Several of the biggest machines came without an average two-qubit error rate in the documents we used, and one, Caltech's 6,100-atom array, ran no two-qubit operations at all.",
    keepInMind: "Labs test in different ways, so treat close numbers as a tie. Google's 2019 chip and USTC's use a stricter test; on the same basis as the rest they'd read about 20% lower. Two figures are company claims, not peer-reviewed.",
    source: { label: "10 peer-reviewed papers and 5 company documents", href: "#method" },
  },
  {
    slug: "training-compute",
    question: "Training compute for the biggest AI models grew 4x a year",
    answer:
      "Training the biggest AI models took about four times more computing power each year between 2018 and May 2024 (Epoch AI's 90% range: 3.6x to 4.9x). The newest figures are the least certain, because labs often don't publish them.",
    keepInMind: "Computing power isn't the same as how capable a model is. Each glowing streak shows the 90% range of an estimate.",
    source: { label: "Epoch AI, Data on Notable AI Models", href: "https://epoch.ai/data/notable-ai-models" },
  },
];

export default function FuturesInFiguresPage() {
  return (
    <>
      <section className="pt-[var(--space-header)] pb-[var(--space-section)]">
        <Container className="max-w-[1240px]">
          <p className="text-[13px] font-medium text-accent-deep">Visuals</p>
          <h1 className="fa-t-display-l mt-4 max-w-[14ch]">Futures in Figures</h1>
          <p className="fa-t-lead mt-7 max-w-[56ch]">
            Charts about quantum computing and AI. Each one answers one question with real data, and comes as a post you can share.
          </p>
          <p className="fa-t-body mt-5 max-w-[60ch]">
            Every number comes from the original source: a peer-reviewed paper, official statistics, a research
            group that publishes its method, or, for claims about a company&apos;s own hardware, that company&apos;s
            documents. Where a figure is a company&apos;s own claim, we say so. And where the
            source gives a range or says how sure it is, the chart shows that too, not just the headline.
          </p>
        </Container>
      </section>

      <section className="pb-[var(--space-section)]">
        <Container className="max-w-[1240px]">
          <ol className="grid gap-[var(--space-gap-l)]">
            {FIGURES.map((f, i) => (
              <li key={f.slug} className="border-t border-hairline pt-10">
                <div className="grid gap-5 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[900px]:gap-14">
                  <div>
                    <p className="text-[13px] font-medium text-muted">{String(i + 1).padStart(2, "0")}</p>
                    <h2 className="fa-t-display-s mt-3">{f.question}</h2>
                  </div>
                  <p className="fa-t-body max-w-[58ch] min-[900px]:pt-8">{f.answer}</p>
                </div>
                <div className="mt-8">
                  <FiguresChart slug={f.slug} label={f.question} />
                </div>
                <div className="mt-6 grid gap-4 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] min-[900px]:gap-14">
                  <div className="fa-t-body text-muted">
                    <p>
                      <span className="font-medium text-[var(--text)]">Keep in mind: </span>
                      {f.keepInMind}
                    </p>
                    <p className="mt-3">
                      Source:{" "}
                      <a className="underline underline-offset-2 hover:text-[var(--text)]" href={f.source.href}>
                        {f.source.label}
                      </a>
                    </p>
                  </div>
                  <p className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[14px]">
                    <span className="text-muted">Social posts:</span>
                    <a className="text-accent-deep underline underline-offset-4" href={`/futures-in-figures/${f.slug}-portrait.mp4`} download>
                      Portrait video
                    </a>
                    <a className="text-accent-deep underline underline-offset-4" href={`/futures-in-figures/${f.slug}-landscape.mp4`} download>
                      Landscape video
                    </a>
                    <a className="text-accent-deep underline underline-offset-4" href={`/futures-in-figures/${f.slug}.jpg`} download>
                      Still image
                    </a>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section id="method" className="border-t border-hairline py-[var(--space-section)]">
        <Container className="max-w-[1240px]">
          <h2 className="fa-t-display-s">How these are made</h2>
          <ul className="fa-t-body mt-6 grid max-w-[64ch] gap-3">
            <li>We start from the original data file or report, saved as we found it, and record where each number is in it.</li>
            <li>Where a number has to be copied out of a PDF, it&apos;s copied once into a transcription file with its page and a quote. A script does everything after that, so no number on a chart is typed in by hand.</li>
            <li>Each chart has a method note: the question, the sources, what we changed and what the chart doesn&apos;t show.</li>
            <li>The qubit chart draws on 10 papers in Nature, Physical Review Letters and Physical Review X, plus spec sheets and announcements from Google, IBM and Atom Computing with Microsoft.</li>
          </ul>
        </Container>
      </section>
    </>
  );
}
