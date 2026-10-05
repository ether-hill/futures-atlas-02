import type { Metadata } from "next";
import { Container } from "@/components/Container";

const TITLE = "Futures in Figures. Futures Atlas";
const DESC =
  "Short, shareable charts about quantum computing and AI. Each one answers one question with real data, and shows how sure the numbers are.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, images: ["/projects/futures-in-figures.jpg"] },
  twitter: { title: TITLE, description: DESC },
};

/**
 * Futures in Figures: a series of social charts. The charts themselves are
 * built in /dataviz (data, processing scripts, method notes, render tools);
 * this page only shows the finished posts. Media in public/futures-in-figures/
 * is exported from there with `node video.mjs <slug> hook --variant field`,
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
    question: "When could quantum computers break encryption?",
    answer:
      "The Global Risk Institute asked 26 quantum experts how likely it is that a quantum computer could break RSA-2048, a common kind of encryption, within 5, 10, 15, 20 and 30 years. Only 1 thought it likely within 5 years. By 2040, most do.",
    keepInMind: "These are expert opinions, not a forecast. The experts were invited, not picked at random.",
    source: {
      label: "Quantum Threat Timeline Report 2025, Global Risk Institute",
      href: "https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2025b/",
    },
  },
  {
    slug: "qubits-vs-quality",
    question: "Which quantum computers make the fewest errors?",
    answer:
      "Launches usually lead with the number of qubits, but a qubit is only useful if its operations work. These are the published error rates for nine machines. Trapped-ion machines come out lowest, and several of the biggest machines published no error rate at all.",
    keepInMind: "Labs test in different ways, so treat close numbers as a tie. Two figures are company claims, not peer-reviewed.",
    source: { label: "10 peer-reviewed papers and 5 company documents", href: "#method" },
  },
  {
    slug: "training-compute",
    question: "AI's computing power has grown 4x a year",
    answer:
      "Training the biggest AI models took about four times more computing power each year between 2018 and 2024. The newest figures are the least certain, because labs often don't publish them.",
    keepInMind: "Computing power isn't the same as how capable a model is. Each glowing streak shows the range of an estimate.",
    source: { label: "Epoch AI, Data on Notable AI Models", href: "https://epoch.ai/data/notable-ai-models" },
  },
];

export default function FuturesInFiguresPage() {
  return (
    <>
      <section className="pt-[var(--space-header)] pb-[var(--space-section)]">
        <Container>
          <p className="text-[13px] font-medium text-accent-deep">Visuals</p>
          <h1 className="fa-t-display-l mt-4 max-w-[14ch]">Futures in Figures</h1>
          <p className="fa-t-lead mt-7 max-w-[56ch]">
            Short charts about quantum computing and AI, made to be shared. Each one answers one question with real data.
          </p>
          <p className="fa-t-body mt-5 max-w-[60ch]">
            Every number comes from the original source: a peer-reviewed paper, official statistics or a research
            group that publishes its method. Where a figure is a company&apos;s own claim, we say so. And where the
            source gives a range or says how sure it is, the chart shows that too, not just the headline.
          </p>
        </Container>
      </section>

      <section className="pb-[var(--space-section)]">
        <Container>
          <ol className="grid gap-[var(--space-gap-l)]">
            {FIGURES.map((f, i) => (
              <li
                key={f.slug}
                className="grid items-start gap-8 border-t border-hairline pt-10 min-[900px]:grid-cols-[minmax(0,420px)_1fr] min-[900px]:gap-14"
              >
                <video
                  className="block w-full border border-hairline"
                  src={`/futures-in-figures/${f.slug}-instagram.mp4`}
                  poster={`/futures-in-figures/${f.slug}.jpg`}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={f.question}
                />
                <div className="max-w-[58ch]">
                  <p className="text-[13px] font-medium text-muted">{String(i + 1).padStart(2, "0")}</p>
                  <h2 className="fa-t-display-s mt-3">{f.question}</h2>
                  <p className="fa-t-body mt-5">{f.answer}</p>
                  <p className="fa-t-body mt-4 text-muted">
                    <span className="font-medium text-[var(--text)]">Keep in mind: </span>
                    {f.keepInMind}
                  </p>
                  <p className="fa-t-body mt-4 text-muted">
                    Source:{" "}
                    <a className="underline underline-offset-2 hover:text-[var(--text)]" href={f.source.href}>
                      {f.source.label}
                    </a>
                  </p>
                  <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
                    <a className="text-accent-deep underline underline-offset-4" href={`/futures-in-figures/${f.slug}-instagram.mp4`} download>
                      Instagram video
                    </a>
                    <a className="text-accent-deep underline underline-offset-4" href={`/futures-in-figures/${f.slug}-x.mp4`} download>
                      X video
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
        <Container>
          <h2 className="fa-t-display-s">How these are made</h2>
          <ul className="fa-t-body mt-6 grid max-w-[64ch] gap-3">
            <li>We start from the original data file or report, saved as we found it, and record where each number is in it.</li>
            <li>A script turns that into the chart&apos;s data, so no number is typed in by hand.</li>
            <li>Each chart has a method note: the question, the sources, what we changed and what the chart doesn&apos;t show.</li>
            <li>The qubit chart draws on 10 papers in Nature, Physical Review Letters and Physical Review X, plus spec sheets and announcements from Google, IBM and Atom Computing with Microsoft.</li>
          </ul>
        </Container>
      </section>
    </>
  );
}
