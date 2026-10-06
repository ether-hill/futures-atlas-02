import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { SW_BASE, SW_TITLE } from "@/data/standing-waves/meta";
import { ARTICLES } from "@/data/standing-waves/articles";

export const metadata: Metadata = {
  title: `Read. ${SW_TITLE}. Futures Atlas`,
  description: "Six short articles on cymatics, wave physics and the walking-droplet experiments, each cited line by line.",
  robots: { index: false },
};

export default function ReadIndex() {
  return (
    <section className="py-[clamp(36px,5vw,72px)]">
      <Container>
        <div className="max-w-[62ch]">
          <p className="eyebrow mb-4">Read</p>
          <h1 className="text-[clamp(28px,4vw,52px)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink">Articles</h1>
          <p className="mt-5 text-[15px] leading-[1.8] text-ink-70">
            Each one opens with three lines: what is established, what is contested, and what is not supported. The
            rest is the explanation, with a numbered source on every claim.
          </p>
        </div>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((a, i) => (
            <li key={a.slug} className="flex">
              <Link href={`${SW_BASE}/read/${a.slug}`} className="fa-card fa-card--link sw-focus w-full">
                <div className="fa-card__body">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="fa-card__meta">{String(i + 1).padStart(2, "0")}</span>
                    {a.state === "coming" && (
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-graphite">Coming</span>
                    )}
                  </div>
                  <h2 className="fa-card__title">{a.title}</h2>
                  <p className="mt-3 text-[14px] leading-[1.7] text-ink-70">{a.standfirst}</p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
