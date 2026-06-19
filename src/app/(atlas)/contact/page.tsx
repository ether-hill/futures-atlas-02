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
          <p className="mt-6 max-w-2xl font-mono text-[14px] leading-[1.7] text-ink-70">
            The Futures Atlas is a project by Frond Studio in partnership with
            the Centre for Quantum &amp; Society, to make the futures we might
            live in visible, tangible, and open to debate.
          </p>
          <p className="mt-4 max-w-2xl font-mono text-[14px] leading-[1.7] text-ink-70">
            Whether you&rsquo;d like to collaborate, commission work, or simply
            share a thought or question, we&rsquo;d be glad to hear from you.
          </p>
        </header>

        <div className="mt-12 max-w-2xl">
          <ContactForm defaultProject="Futures Atlas" />
        </div>
      </Container>
    </section>
  );
}
