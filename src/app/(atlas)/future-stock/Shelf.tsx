"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/Reveal";
import { STOCK, type FutureProduct, type ProductReview } from "@/data/future-stock";

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

function Plate({ product, className = "" }: { product: FutureProduct; className?: string }) {
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

function Quickview({ product, onClose }: { product: FutureProduct; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const l = product.listing;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} — quick view`}
    >
      {/* veil */}
      <button
        type="button"
        aria-label="Close quick view"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-ink/60"
      />
      {/* panel */}
      <div className="relative grid max-h-[88vh] w-full max-w-4xl overflow-y-auto border border-ink/25 bg-surface md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-0 top-0 z-10 cursor-pointer border-b border-l border-ink/20 bg-surface px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink hover:bg-ink hover:text-surface"
        >
          Close ✕
        </button>

        <Plate product={product} className="aspect-square md:sticky md:top-0" />

        <div className="px-6 py-7 sm:px-8">
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
                  <article key={r.author}>
                    <div className="flex items-baseline gap-2.5 text-[13px]">
                      <Stars n={r.stars} />
                      <span className="font-bold text-ink">{r.title}</span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-[1.75] text-ink-70">{r.body}</p>
                    <div className="mt-1.5 font-mono text-[11px] text-faint">— {r.author}</div>
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
    </div>
  );
}

function ProductCard({ product, onOpen }: { product: FutureProduct; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="group cursor-pointer text-left">
      <div className="relative">
        <Plate
          product={product}
          className="aspect-square [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-[1.03]"
        />
        <span className="absolute bottom-0 right-0 border-l border-t border-ink/20 bg-surface px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Quick view
        </span>
      </div>
      <div className="mt-3.5 flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-bold leading-snug text-ink group-hover:underline">
          {product.name}
        </h3>
        <span className="shrink-0 font-mono text-[13px] text-ink">{product.price}</span>
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-graphite">
        {product.aisle} · ships {product.year}
      </div>
      <p className="mt-2 text-[13px] leading-[1.7] text-ink-70">{product.line}</p>
    </button>
  );
}

export function Shelf() {
  const [open, setOpen] = useState<FutureProduct | null>(null);
  return (
    <>
      <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {STOCK.map((p, i) => (
          <Reveal key={p.id} delay={Math.min(i, 5) * 60}>
            <ProductCard product={p} onOpen={() => setOpen(p)} />
          </Reveal>
        ))}
      </div>
      {open && <Quickview product={open} onClose={() => setOpen(null)} />}
    </>
  );
}
