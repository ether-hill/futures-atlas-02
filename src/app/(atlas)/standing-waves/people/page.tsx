import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { SW_BASE, SW_TITLE } from "@/data/standing-waves/meta";
import { PEOPLE } from "@/data/standing-waves/people";

export const metadata: Metadata = {
  title: `People. ${SW_TITLE}. Futures Atlas`,
  description: "The people behind cymatics, wave physics, quantum mechanics and the walking-droplet experiments.",
  robots: { index: false },
};

export default function PeopleIndex() {
  return (
    <section className="py-[clamp(36px,5vw,72px)]">
      <Container>
        <div className="max-w-[62ch]">
          <p className="eyebrow mb-4">People</p>
          <h1 className="text-[clamp(28px,4vw,52px)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink">Who did the work</h1>
          <p className="mt-5 text-[15px] leading-[1.8] text-ink-70">
            Factual profiles: what each person did, and the sources for it. Where someone&apos;s claims are disputed, the
            profile says so, with sources on both sides.
          </p>
        </div>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PEOPLE.map((p) => (
            <li key={p.id} className="flex">
              <Link href={`${SW_BASE}/people/${p.id}`} className="fa-card fa-card--link sw-focus w-full">
                <div className="fa-card__body">
                  <span className="fa-card__meta">{p.years}</span>
                  <h2 className="fa-card__title mt-2">{p.name}</h2>
                  <p className="mt-3 text-[14px] leading-[1.7] text-ink-70">{p.role}</p>
                  {p.contested && (
                    <span className="sw-badge mt-4 self-start" data-status="contested">Claims contested</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
