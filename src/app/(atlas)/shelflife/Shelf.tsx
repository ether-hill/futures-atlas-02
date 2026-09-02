"use client";

import { useState } from "react";
import { Reveal } from "@/components/Reveal";
import { STOCK, type FutureProduct, type ProductReview } from "@/data/shelflife";
import { Lightbox } from "./Lightbox";

/**
 * The shelf and its product quickview. Every card opens the same lightbox —
 * the standard listing template: tagline, price + delivery, specifications,
 * reviews, Q&A. Sections render only when the product's `listing` carries
 * them, so a hatch-plate placeholder opens to just its name and price.
 */

const label = "font-mono text-[11px] uppercase tracking-[0.18em] text-graphite";

function Stars({ n }: { n: ProductReview["stars"] }) {
  return (
    <span aria-label={`${n} out of 5 stars`} className="tracking-[0.1em] text-ink">
      {"★".repeat(n)}
      <span className="text-ink/30">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export function Plate({ product, className = "" }: { product: FutureProduct; className?: string }) {
  return (
    <div className={`overflow-hidden ${product.image ? "" : "fa-hatch"} ${className}`}>
      {product.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-end p-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-graphite">
            Awaiting photography
          </span>
        </div>
      )}
    </div>
  );
}

export function Quickview({ product, onClose }: { product: FutureProduct; onClose: () => void }) {
  const l = product.listing;
  return (
    <Lightbox label={`${product.name} — quick view`} onClose={onClose} size="full">
      {/* photo left, copy right, half and half; the photo sits in its own margin */}
      <div className="grid md:grid-cols-2">
        <div className="p-5 sm:p-7 md:sticky md:top-0 md:self-start">
          <Plate product={product} className="aspect-square w-full rounded-[14px]" />
        </div>

        <div className="px-6 py-7 sm:px-8 md:py-10 md:pr-12">
          <div className={label}>
            {product.aisle} · ships {product.year}
          </div>
          <h3 className="mt-2.5 text-[clamp(20px,2.4vw,28px)] font-extrabold leading-[1.08] tracking-[-0.02em] text-ink">
            {product.name}
          </h3>
          <p className="mt-3 text-[14px] leading-[1.75] text-ink-70">{product.line}</p>

          <div className="mt-5 border-y border-ink/15 py-4">
            <div className="text-[22px] font-bold text-ink">{product.price}</div>
            {l?.delivery && (
              <p className="mt-1.5 text-[12.5px] leading-[1.7] text-ink-70">{l.delivery}</p>
            )}
          </div>

          {l?.specs && l.specs.length > 0 && (
            <section className="mt-6">
              <div className={label}>Specifications</div>
              <dl className="mt-3 grid gap-2.5">
                {l.specs.map((s) => (
                  <div key={s.label} className="text-[13px] leading-[1.7]">
                    <dt className="inline font-bold text-ink">{s.label}: </dt>
                    <dd className="inline text-ink-70">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {l?.reviews && l.reviews.length > 0 && (
            <section className="mt-7">
              <div className={label}>Customer reviews</div>
              <div className="mt-3 grid gap-5">
                {l.reviews.map((r) => (
                  <article key={r.title}>
                    <div className="flex items-baseline gap-2.5 text-[13px]">
                      <Stars n={r.stars} />
                      <span className="font-bold text-ink">{r.title}</span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-[1.75] text-ink-70">{r.body}</p>
                    {r.author && (
                      <div className="mt-1.5 font-mono text-[11px] text-faint">— {r.author}</div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {l?.qa && l.qa.length > 0 && (
            <section className="mt-7">
              <div className={label}>Questions &amp; answers</div>
              <div className="mt-3 grid gap-4">
                {l.qa.map((x) => (
                  <div key={x.q} className="text-[13px] leading-[1.75]">
                    <div className="font-bold text-ink">Q: {x.q}</div>
                    <div className="mt-1 text-ink-70">A: {x.a}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </Lightbox>
  );
}

/** Apple-store-style tile: a rounded panel, product on top, centred retail
 *  type below, the whole tile the quickview trigger. */
export function ProductCard({ product, onOpen }: { product: FutureProduct; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[20px] bg-panel text-center shadow-md shadow-ink/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/10 focus-visible:-translate-y-1 focus-visible:shadow-xl"
    >
      <Plate
        product={product}
        className="aspect-square w-full [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-[1.04]"
      />
      <div className="flex grow flex-col items-center px-6 pb-7 pt-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-deep">
          {product.aisle}
        </div>
        <h3 className="mt-2 text-[17px] font-bold leading-snug tracking-[-0.01em] text-ink">
          {product.name}
        </h3>
        <p className="mt-1.5 max-w-[30ch] text-[12.5px] leading-[1.65] text-ink-70">
          {product.line}
        </p>
        <div className="mt-auto pt-4">
          <div className="text-[14px] font-medium text-ink">{product.price}</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            Ships {product.year}
          </div>
        </div>
      </div>
    </button>
  );
}

export function Shelf() {
  const [open, setOpen] = useState<FutureProduct | null>(null);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {STOCK.map((p, i) => (
          <Reveal key={p.id} delay={Math.min(i, 5) * 60} className="h-full">
            <ProductCard product={p} onOpen={() => setOpen(p)} />
          </Reveal>
        ))}
      </div>
      {open && <Quickview product={open} onClose={() => setOpen(null)} />}
    </>
  );
}
