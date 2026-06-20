import type { Metadata } from "next";
import { Container } from "@/components/Container";

export const metadata: Metadata = {
  title: "Hi Mike — Futures Atlas",
};

export default function HiMikePage() {
  return (
    <section className="flex min-h-[70svh] items-center py-[clamp(44px,7vw,96px)]">
      <Container>
        <h1 className="text-[clamp(48px,10vw,140px)] font-extrabold leading-[0.92] tracking-[-0.03em] text-ink text-balance">
          Hi Mike
        </h1>
      </Container>
    </section>
  );
}
