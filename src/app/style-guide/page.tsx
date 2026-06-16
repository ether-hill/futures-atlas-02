import type { Metadata } from "next";
import { StyleGuide } from "futures-atlas-core";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Style guide — Futures Atlas",
  robots: { index: false, follow: false },
};

export default function StyleGuidePage() {
  return (
    <section className="py-[clamp(28px,4vw,48px)]">
      <Container>
        <div className="mb-8 flex flex-wrap items-baseline gap-4">
          <h1 className="text-[clamp(28px,4vw,52px)] font-extrabold tracking-[-0.02em] text-ink">
            Style guide
          </h1>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
            Edit a token · it saves live for everyone
          </span>
        </div>
        <StyleGuide />
      </Container>
    </section>
  );
}
