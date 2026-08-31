import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ContactForm } from "@/components/ContactForm";
import { InterferenceField } from "@/components/InterferenceField";
import { contactProjects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Contact. Futures Atlas",
  description:
    "Get in touch with the Futures Atlas, pitches, questions, collaborations.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  // A project's "Contact" link passes ?project=<title>; preselect it when valid.
  const { project } = await searchParams;
  const defaultProject =
    project && contactProjects.includes(project) ? project : "Futures Atlas";
  return (
    <section className="relative overflow-hidden py-[clamp(44px,7vw,96px)]">
      {/* Rain, as the page's ground. It is the subject of the page as much as
          the form is, so it runs at full strength and is not tinted or masked;
          the panels sit on it and let it through instead. */}
      <InterferenceField className="pointer-events-none absolute inset-0 hidden h-full w-full md:block" />
      <div className="relative">
        <Container>
        <div className="grid grid-cols-1 items-start gap-[clamp(28px,4vw,56px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <header className="max-w-2xl rounded-[3px] bg-surface/70 p-[clamp(18px,2.4vw,30px)] backdrop-blur-[2px] md:bg-surface/60">
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-accent-deep">
              Get in touch
            </span>
            <span className="h-px flex-1 bg-ink/15" />
          </div>
          <h1 className="text-[clamp(40px,6vw,88px)] font-extrabold leading-[0.94] tracking-[-0.028em] text-ink">
            Contact.
          </h1>
          <p className="mt-6 max-w-2xl text-[14px] leading-[1.7] text-ink-70">
            The Futures Atlas is a project by Frond Studio in partnership with
            the Centre for Quantum &amp; Society, to make the futures we might
            live in visible, tangible, and open to debate.
          </p>
          <p className="mt-4 max-w-2xl text-[14px] leading-[1.7] text-ink-70">
            Whether you&rsquo;d like to collaborate, commission work, or simply
            share a thought or question, we&rsquo;d be glad to hear from you.
          </p>
        </header>

        <div className="rounded-[3px] bg-surface/70 p-[clamp(18px,2.4vw,30px)] backdrop-blur-[2px] md:bg-surface/60 lg:mt-0">
          <ContactForm defaultProject={defaultProject} />
        </div>
        </div>
        </Container>
      </div>
    </section>
  );
}
