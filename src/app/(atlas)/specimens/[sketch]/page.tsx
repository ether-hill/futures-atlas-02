import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { Lab } from "@/components/specimens/Lab";
import { sketchById } from "@/lib/specimens";
import type { Values } from "@/lib/specimens/types";

/**
 * One sketch on the bench. Draft: `visibility: "draft"` on the `specimens`
 * project is what closes this URL (the middleware gates everything under the
 * project's path).
 */
export async function generateMetadata({ params }: { params: Promise<{ sketch: string }> }): Promise<Metadata> {
  const s = sketchById((await params).sketch);
  return { title: s ? `${s.title}. Specimens. Futures Atlas` : "Specimens. Futures Atlas", robots: { index: false } };
}

export default async function SketchPage({
  params,
  searchParams,
}: {
  params: Promise<{ sketch: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sketch = sketchById((await params).sketch);
  if (!sketch) notFound();

  // Any ?key=value that names a param seeds the bench; everything else is ignored.
  const sp = await searchParams;
  const initial: Values = {};
  for (const p of sketch.params) {
    const raw = sp[p.key];
    const n = Number(Array.isArray(raw) ? raw[0] : raw);
    if (raw !== undefined && Number.isFinite(n)) initial[p.key] = n;
  }

  return (
    <section className="py-[clamp(32px,5vw,64px)]">
      <Container>
        <header className="mb-8 grid gap-6 min-[1000px]:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <p className="eyebrow mb-3">Specimens · {sketch.family}</p>
            <h1 className="text-[clamp(28px,3.6vw,48px)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink">
              {sketch.title}
            </h1>
          </div>
          <details className="self-end text-[13.5px] leading-[1.75] text-ink-70">
            <summary className="cursor-pointer font-mono text-[10.5px] uppercase tracking-[0.14em] text-graphite hover:text-ink">
              How it is made
            </summary>
            <div className="mt-3 flex flex-col gap-3">
              {sketch.method.map((m, i) => (
                <p key={i}>{m}</p>
              ))}
              <ul className="flex flex-col gap-1">
                {sketch.sources.map((s) => (
                  <li key={s.href}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">
                      {s.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </header>
        <Lab key={sketch.id} sketchId={sketch.id} initial={initial} />
      </Container>
    </section>
  );
}
