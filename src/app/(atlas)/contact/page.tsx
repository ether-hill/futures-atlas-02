import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/Reveal";
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
    // .fa-contact pins the dark surface tokens in both themes (globals.css): the
    // rain is a body of water and only reads as one on a dark ground. The form
    // opts back out via .fa-contact-card and follows the theme.
    //
    // No data-fa-hero: the bar keeps its normal plate here. Clear, it put the
    // page's busiest passage of water directly behind the nav links.
    <section className="fa-contact relative overflow-hidden py-[clamp(56px,8vw,112px)]">
      {/* Rain into still water, very slowly, as the page's ground. Decorative,
          and quiet: the mask feathers all four edges (globals.css) so it reads
          as a field the page fades into rather than a rectangle of video. */}
      <InterferenceField className="fa-contact-field pointer-events-none absolute inset-0 hidden h-full w-full md:block" />
      <div className="relative">
        <Container>
          {/*
            One block, centred, holding both columns.

            Stretched across the full container the two halves drift apart until
            the form is a panel stuck to the right edge with a band of busy
            water between them and a column of nothing underneath the text.
            Capping the pair and centring it on the page keeps them reading as
            one thing, and items-center stops the short column from leaving a
            void below itself.
          */}
          <div className="mx-auto grid max-w-[70rem] items-center gap-x-[clamp(32px,4vw,64px)] gap-y-[clamp(36px,5vw,56px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,31rem)]">
            {/* Staggered rather than all at once: the eyebrow and rule draw,
                the name lands, then the invitation, then the form. Each step is
                short — the whole sequence is under half a second. */}
            <header>
              <Reveal>
                <p className="eyebrow mb-5">Get in touch</p>
              </Reveal>
              <Reveal delay={90}>
                <h1 className="text-[clamp(40px,5.4vw,76px)] font-extrabold leading-[0.94] tracking-[-0.028em] text-ink">
                  Contact
                </h1>
              </Reveal>
              <Reveal delay={200}>
                <p className="mt-7 max-w-[42ch] text-[14px] leading-[1.75] text-ink-70">
                  Whether you&rsquo;d like to collaborate, commission work, or
                  simply share a thought or question, we&rsquo;d be glad to hear
                  from you.
                </p>
              </Reveal>
            </header>

            <Reveal delay={310} className="fa-contact-card">
              <ContactForm defaultProject={defaultProject} />
            </Reveal>
          </div>
        </Container>
      </div>
    </section>
  );
}
