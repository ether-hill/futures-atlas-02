import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Builder } from "./Builder";
import { Shelf } from "./Shelf";

export const metadata: Metadata = {
  title: "Future Stock. Futures Atlas",
  description:
    "A guided prompt generator for products that might exist on the Amazons of the future — and the shelf where the keepers accumulate.",
};

/**
 * Future Stock — draft project (gated by projects.ts visibility).
 *
 * v1 is a prompt generator, not a product generator: the visitor builds a
 * scenario, copies the two prompts into their own image tool and chatbot, and
 * the best results come back to the shelf below as a living inventory.
 * See src/data/future-stock.ts for the assembly and the stock itself.
 */

const eyebrow = "font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep";

export default function FutureStockPage() {
  return (
    <>
      {/* hero */}
      <section className="pt-[clamp(56px,9vw,120px)] pb-[clamp(36px,6vw,72px)]">
        <Container>
          <Reveal>
            <span className={eyebrow}>Speculative commerce</span>
            <h1 className="mt-4 max-w-[16ch] text-[clamp(38px,6vw,76px)] font-extrabold leading-[0.98] tracking-[-0.025em] text-ink">
              Future Stock
            </h1>
            <p className="mt-6 max-w-[62ch] text-[clamp(14.5px,1.5vw,17px)] leading-[1.8] text-ink-70">
              The Amazons of the future will sell things that sound impossible right up
              until they are ordinary. Build the scenario below and take away two prompts —
              one for your image tool, one for your chatbot — that turn a hunch into a
              product listing from a changed world. The keepers land on the shelf.
            </p>
            <ol className="mt-7 flex flex-wrap gap-x-8 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
              <li>1 — build the prompts here</li>
              <li>2 — run them in your own tools</li>
              <li>3 — the ones that make you go hmmm join the shelf</li>
            </ol>
          </Reveal>
        </Container>
      </section>

      {/* the builder */}
      <section className="border-t border-ink/15 py-[clamp(40px,6vw,80px)]">
        <Container>
          <Reveal>
            <span className={eyebrow}>The generator</span>
            <h2 className="mt-3 text-[clamp(24px,3vw,38px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
              Assemble a product that does not exist yet
            </h2>
          </Reveal>
          <div className="mt-[clamp(24px,4vw,44px)]">
            <Builder />
          </div>
        </Container>
      </section>

      {/* the shelf */}
      <section className="border-t border-ink/15 py-[clamp(40px,6vw,80px)]">
        <Container>
          <Reveal>
            <span className={eyebrow}>The shelf</span>
            <h2 className="mt-3 text-[clamp(24px,3vw,38px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
              In stock, eventually
            </h2>
            <p className="mt-4 max-w-[62ch] text-[13.5px] leading-[1.8] text-ink-70">
              A living inventory of merchandise that does not exist yet. Every product here
              began as a prompt from the generator above.
            </p>
          </Reveal>
          <div className="mt-[clamp(26px,4vw,48px)]">
            <Shelf />
          </div>
        </Container>
      </section>
    </>
  );
}
