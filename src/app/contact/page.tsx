import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact — Futures Atlas",
  description:
    "Get in touch with the Futures Atlas — pitches, questions, collaborations.",
};

export default function ContactPage() {
  return (
    <section className="py-[clamp(44px,7vw,96px)]">
      <Container>
        <header className="max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-accent-deep">
              Get in touch
            </span>
            <span className="h-px flex-1 bg-ink/15" />
          </div>
          <h1 className="text-[clamp(40px,6vw,88px)] font-extrabold leading-[0.94] tracking-[-0.028em] text-ink">
            Contact.
          </h1>
          <p className="mt-6 max-w-xl font-mono text-[14px] leading-[1.7] text-ink-70">
            Pitching a future, proposing a collaboration, or just curious — write
            to us. Placeholder details below.
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          <ContactForm />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-5 border border-ink bg-band p-[clamp(24px,3vw,36px)] text-paper">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent">
                Direct lines
              </p>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-paper/55">
                  General
                </p>
                <a href="mailto:hello@futuresatlas.org" className="mt-1 inline-block font-mono text-[13.5px] text-paper hover:text-accent">
                  hello@futuresatlas.org
                </a>
              </div>
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-paper/55">
                  Pitches & press
                </p>
                <a href="mailto:studio@futuresatlas.org" className="mt-1 inline-block font-mono text-[13.5px] text-paper hover:text-accent">
                  studio@futuresatlas.org
                </a>
              </div>
            </div>

            <div className="border border-ink bg-accent-soft p-[clamp(20px,3vw,28px)]">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent-deep">
                Response time
              </p>
              <p className="mt-2 font-mono text-[13px] leading-[1.7] text-ink-70">
                We reply when we can — placeholder. Considered proposals get a
                considered answer.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
