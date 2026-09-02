"use client";

import { useState, type ReactNode } from "react";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { AISLES, STOCK, type FutureProduct } from "@/data/shelflife";
import { Builder } from "./Builder";
import { Lightbox } from "./Lightbox";
import { Plate, ProductCard, Quickview } from "./Shelf";

/**
 * ShelfLife — the storefront. A mocked-up online store in the manner of
 * apple.com/store, stocked with products that do not exist yet: the hero
 * line, a rail of aisles, a rail of what is new, the "Create a product" call
 * (the loudest thing on the page — it opens the prompt configurator in a
 * lightbox), the promise tiles, and the full shelf. Every product card opens
 * the standard quickview. Nothing is for sale and nothing is stored.
 */

const eyebrow = "font-mono text-[11px] uppercase tracking-[0.18em] text-graphite";
const h2 = "text-[clamp(24px,3vw,40px)] font-extrabold leading-[1.05] tracking-[-0.025em] text-ink";
const rail =
  "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/** One line icon per aisle, drawn to a 24-grid. */
const AISLE_ICON: Record<string, ReactNode> = {
  health: <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />,
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  food: <path d="M6 3v8a3 3 0 0 0 3 3v7M9 3v6M12 3v6M18 3c-2 1-3 3-3 6v12M18 3v18" />,
  mobility: <path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 14l4-8h4l6 8M13 6l-2 8" />,
  work: <path d="M4 7h16v11H4zM9 7V5h6v2M4 12h16" />,
  care: <path d="M12 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM5 21a7 7 0 0 1 14 0" />,
  play: <path d="M4 8h16v10H4zM8 12v2M7 13h2M15 12h.01M17 14h.01" />,
};

/** One of seven across the full width on a laptop; a scrolling rail below that. */
function AisleTile({ id, label }: { id: string; label: string }) {
  return (
    <a
      href="#shelf"
      className="group flex w-[148px] shrink-0 snap-start flex-col items-center gap-4 rounded-[20px] px-3 py-6 text-center transition-colors hover:bg-panel lg:w-auto lg:flex-1 lg:shrink"
    >
      <span className="grid h-[clamp(88px,8.5vw,128px)] w-[clamp(88px,8.5vw,128px)] place-items-center rounded-full bg-panel text-ink transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 24 24" className="h-[46%] w-[46%]" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {AISLE_ICON[id]}
        </svg>
      </span>
      <span className="text-[14px] font-medium leading-tight text-ink">{label}</span>
    </a>
  );
}

/** "The latest" card: the label on the card's own ground at the top, the picture below —
 *  so the type never has to fight a pale photograph. */
function LatestCard({ product, onOpen }: { product: FutureProduct; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-[min(78vw,400px)] shrink-0 snap-start cursor-pointer flex-col overflow-hidden rounded-[22px] bg-panel text-left shadow-md shadow-ink/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/10"
    >
      <div className="p-6 pb-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-deep">
          New · ships {product.year}
        </div>
        <div className="mt-1.5 text-[20px] font-bold leading-tight tracking-[-0.015em] text-ink">
          {product.name}
        </div>
        <div className="mt-1 text-[14px] text-ink-70">{product.price}</div>
      </div>
      <Plate
        product={product}
        className="aspect-square w-full [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-[1.04]"
      />
    </button>
  );
}

function PromiseTile({ title, body, icon }: { title: string; body: string; icon: ReactNode }) {
  return (
    <div className="rounded-[22px] bg-panel p-7">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-surface text-ink">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icon}
        </svg>
      </span>
      <h3 className="mt-5 text-[19px] font-bold leading-snug tracking-[-0.01em] text-ink">{title}</h3>
      <p className="mt-2 text-[13.5px] leading-[1.7] text-ink-70">{body}</p>
    </div>
  );
}

function CreateButton({ onClick, big = false }: { onClick: () => void; big?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-full bg-accent font-semibold text-surface shadow-lg shadow-accent/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        big ? "px-8 py-4 text-[17px]" : "px-5 py-2.5 text-[14px]"
      }`}
    >
      <svg viewBox="0 0 24 24" width={big ? 20 : 16} height={big ? 20 : 16} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Create a product
    </button>
  );
}

export function Store() {
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<FutureProduct | null>(null);
  const latest = STOCK.slice(0, 6);
  const openCreate = () => setCreating(true);

  return (
    <>
      {/* store bar */}
      <div className="border-b border-ink/10 bg-surface">
        <Container className="flex h-14 items-center justify-between gap-4">
          <a href="#top" className="text-[19px] font-extrabold tracking-[-0.03em] text-ink">
            Shelf<span className="text-accent">Life</span>
          </a>
          <nav aria-label="Aisles" className="hidden gap-6 text-[13px] text-ink-70 lg:flex">
            {AISLES.map((a) => (
              <a key={a.id} href="#shelf" className="hover:text-ink">
                {a.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <CreateButton onClick={openCreate} />
            <span aria-label="Bag, empty" className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-panel">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 8h12l1 13H5zM9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
            </span>
          </div>
        </Container>
      </div>

      {/* hero */}
      <section id="top" className="pt-[clamp(40px,6vw,80px)] pb-[clamp(24px,4vw,48px)]">
        <Container>
          <Reveal>
            <h1 className="max-w-[24ch] text-[clamp(34px,5vw,56px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
              The best way to buy the products you&rsquo;ll love, whenever they arrive.
            </h1>
          </Reveal>
        </Container>
      </section>

      {/* aisles */}
      <section className="pb-[clamp(24px,4vw,48px)]">
        <Container>
          <div className={`${rail} -mx-2 px-2 lg:mx-0 lg:justify-between lg:overflow-visible lg:px-0`}>
            {AISLES.map((a) => (
              <AisleTile key={a.id} id={a.id} label={a.label} />
            ))}
          </div>
        </Container>
      </section>

      {/* the latest */}
      <section className="py-[clamp(32px,5vw,64px)]">
        <Container>
          <Reveal>
            <h2 className={h2}>
              The latest. <span className="text-ink-70">Take a look at what&rsquo;s new right now.</span>
            </h2>
          </Reveal>
          <div className={`${rail} mt-8`}>
            {latest.map((p) => (
              <LatestCard key={p.id} product={p} onOpen={() => setOpen(p)} />
            ))}
          </div>
        </Container>
      </section>

      {/* create a product — the loudest thing on the page */}
      <section id="create" className="py-[clamp(16px,3vw,32px)]">
        <Container>
          <Reveal>
            <div className="relative overflow-hidden rounded-[28px] bg-ink px-8 py-12 text-surface sm:px-12 sm:py-16 lg:px-16">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" aria-hidden="true" />
              <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-accent-soft/20 blur-3xl" aria-hidden="true" />
              <div className="relative grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center">
                <div>
                  <span className={`${eyebrow} text-surface/60`}>Can&rsquo;t find it? It doesn&rsquo;t exist yet.</span>
                  <h2 className="mt-3 text-[clamp(30px,4.2vw,56px)] font-extrabold leading-[1.02] tracking-[-0.03em]">
                    Create a product.
                  </h2>
                  <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.75] text-surface/75">
                    Pick the aisle, the year and what changed about the world. ShelfLife writes the two
                    prompts that turn a hunch into a listing and a product photograph. Run them in your
                    own tools; the keepers land on the shelf.
                  </p>
                </div>
                <div className="flex lg:justify-end">
                  <CreateButton onClick={openCreate} big />
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* the shelflife difference */}
      <section className="py-[clamp(32px,5vw,64px)]">
        <Container>
          <Reveal>
            <h2 className={h2}>
              The ShelfLife difference. <span className="text-ink-70">Even more reasons to shop ahead.</span>
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PromiseTile
              title="Ships when it ships."
              body="Every listing carries the year it becomes ordinary. Delivery estimates are honest to the decade."
              icon={<path d="M3 7h11v10H3zM14 10h4l3 3v4h-7zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />}
            />
            <PromiseTile
              title="Repair first."
              body="New materials are rationed where most of these products come from. Parts, manuals and a bench near you."
              icon={<path d="M14 6a4 4 0 0 0-5 5l-6 6 2 2 6-6a4 4 0 0 0 5-5l-2 2-2-2z" />}
            />
            <PromiseTile
              title="Trade in your present."
              body="Bring the version you have. Some of the future's best products are quiet upgrades of ordinary things."
              icon={<path d="M4 8h13l-3-3M20 16H7l3 3" />}
            />
            <PromiseTile
              title="Specialists who read ahead."
              body="Ask about a year, not a spec. The team keeps the reports the shelf is built from."
              icon={<path d="M4 5h16v11H8l-4 4zM8 9h8M8 12h5" />}
            />
          </div>
        </Container>
      </section>

      {/* the shelf */}
      <section id="shelf" className="border-t border-ink/10 py-[clamp(40px,6vw,80px)]">
        <Container>
          <Reveal>
            <h2 className={h2}>
              Every aisle. <span className="text-ink-70">In stock, eventually.</span>
            </h2>
            <p className="mt-4 max-w-[62ch] text-[13.5px] leading-[1.8] text-ink-70">
              A living inventory of merchandise that does not exist yet. Every product here began as
              a prompt from the configurator. Plates without a photograph are awaiting theirs.
            </p>
          </Reveal>
          <div className="mt-[clamp(26px,4vw,48px)] grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {STOCK.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i, 5) * 60} className="h-full">
                <ProductCard product={p} onOpen={() => setOpen(p)} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* quick links + the small print */}
      <section className="border-t border-ink/10 py-8">
        <Container className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {["Order status", "Shopping help", "Returns", "Your saves"].map((l) => (
              <span key={l} className="rounded-full border border-ink/20 px-4 py-2 text-[12.5px] text-ink-70">
                {l}
              </span>
            ))}
          </div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
            ShelfLife is a Futures Atlas mock-up. Nothing is for sale.
          </p>
        </Container>
      </section>

      {open && <Quickview product={open} onClose={() => setOpen(null)} />}
      {creating && (
        <Lightbox label="Create a product" onClose={() => setCreating(false)} size="wide">
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <span className={eyebrow}>Create a product</span>
            <h2 className="mt-2 text-[clamp(22px,2.6vw,34px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">
              Assemble a product that does not exist yet
            </h2>
            <p className="mt-3 max-w-[62ch] text-[13.5px] leading-[1.75] text-ink-70">
              Build the scenario, take away two prompts — one for your image tool, one for your
              chatbot — and run them in your own tools. Nothing is sent or stored here.
            </p>
            <div className="mt-8">
              <Builder />
            </div>
          </div>
        </Lightbox>
      )}
    </>
  );
}
