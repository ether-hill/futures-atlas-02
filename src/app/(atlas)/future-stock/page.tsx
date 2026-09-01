import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { STOCK, type FutureProduct } from "@/data/future-stock";
import { Builder } from "./Builder";

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

function ProductCard({ product }: { product: FutureProduct }) {
  return (
    <div className="group">
      <div className={`aspect-square overflow-hidden ${product.image ? "" : "fa-hatch"}`}>
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-end p-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-graphite">
              Awaiting photography
            </span>
          </div>
        )}
      </div>
      <div className="mt-3.5 flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-bold leading-snug text-ink">{product.name}</h3>
        <span className="shrink-0 font-mono text-[13px] text-ink">{product.price}</span>
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-graphite">
        {product.aisle} · ships {product.year}
      </div>
      <p className="mt-2 text-[13px] leading-[1.7] text-ink-70">{product.line}</p>
    </div>
  );
}

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
          <div className="mt-[clamp(26px,4vw,48px)] grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {STOCK.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i, 5) * 60}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
