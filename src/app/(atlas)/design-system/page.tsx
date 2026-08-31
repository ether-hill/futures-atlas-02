import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { TokenValue } from "./TokenValue";

export const metadata: Metadata = {
  title: "Design system — Futures Atlas",
  description:
    "The tokens, type scale, components and motion behind every page and sub-app on the Atlas — rendered live from the same variables the site itself uses.",
};

/**
 * The public design system.
 *
 * Every swatch, ruler and specimen on this page is drawn with `var(--token)`
 * rather than a copied literal, so the page cannot drift from the system: if a
 * token changes in futures-atlas-core — or is overridden at runtime from the
 * /style-guide panel — this page changes with it. That also makes it a
 * diagnostic. A swatch that looks wrong here is a token that is wrong.
 *
 * /style-guide is the private control panel that writes those overrides. This
 * is the read-only account of what the system contains.
 */

const COLOUR: { name: string; token: string; note: string }[] = [
  { name: "Surface", token: "--bg", note: "page ground; flips with the theme" },
  { name: "Panel", token: "--panel", note: "raised card ground" },
  { name: "Haze", token: "--haze", note: "recessed field, inputs" },
  { name: "Band", token: "--band", note: "feature section — dark in BOTH themes" },
  { name: "Paper", token: "--paper", note: "always light; text and veils on dark" },
  { name: "Text", token: "--text", note: "primary text and borders" },
  { name: "Text body", token: "--text-body", note: "running copy" },
  { name: "Muted", token: "--muted", note: "mono labels, captions" },
  { name: "Faint", token: "--faint", note: "helper text, disabled" },
  { name: "Hairline", token: "--hairline", note: "the 1px rule everything is divided by" },
  { name: "Accent", token: "--accent", note: "the single accent" },
  { name: "Accent deep", token: "--accent-deep", note: "hover and small text on light" },
  { name: "Accent soft", token: "--accent-soft", note: "tinted fills" },
];

const TYPE: { name: string; token: string; cls: string; sample: string }[] = [
  { name: "Display XL", token: "--text-display-xl", cls: "fa-t-display-xl", sample: "Possible worlds" },
  { name: "Display L", token: "--text-display-l", cls: "fa-t-display-l", sample: "Possible worlds" },
  { name: "Display M", token: "--text-display-m", cls: "fa-t-display-m", sample: "Possible worlds" },
  { name: "Display S", token: "--text-display-s", cls: "fa-t-display-s", sample: "Possible worlds" },
  { name: "Title", token: "--text-title", cls: "fa-t-title", sample: "Section title" },
  { name: "Title S", token: "--text-title-s", cls: "fa-t-title-s", sample: "Card title" },
  { name: "Lead", token: "--text-lead", cls: "fa-t-lead", sample: "A standfirst, one size up from the body." },
  { name: "Body", token: "--text-body-size", cls: "fa-t-body", sample: "Running copy, set in the mono face across the whole site." },
  { name: "Label", token: "--text-label", cls: "fa-t-label", sample: "Mono label" },
  { name: "Stat", token: "--text-stat", cls: "fa-t-stat", sample: "245" },
];

const SPACE = ["--space-1", "--space-2", "--space-3", "--space-4", "--space-5", "--space-6", "--space-7"];
const FLUID = ["--space-card", "--space-card-l", "--space-gap-l", "--space-gap-xl", "--space-header", "--space-section"];
const RADII = ["--radius", "--radius-input", "--radius-menu", "--radius-full"];

const head = "font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep";
const note = "mt-2 max-w-[62ch] font-mono text-[12.5px] leading-[1.7] text-graphite";

function Section({
  id,
  label,
  title,
  children,
  lede,
}: {
  id: string;
  label: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-ink/[0.14] pt-[clamp(28px,4vw,52px)] mt-[clamp(40px,6vw,84px)]">
      <span className={head}>{label}</span>
      <h2 className="mt-3 text-[clamp(22px,2.8vw,36px)] font-extrabold leading-[1.05] tracking-[-0.022em] text-ink">
        {title}
      </h2>
      {lede && <p className={note}>{lede}</p>}
      <div className="mt-[clamp(20px,3vw,36px)]">{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="bg-surface py-[clamp(48px,8vw,110px)]">
      <Container>
        <div className="mb-3.5 flex flex-wrap items-baseline gap-4">
          <span className="h-px min-w-10 flex-1 bg-ink/[0.18]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-graphite">
            futures-atlas-core
          </span>
        </div>

        <h1 className="max-w-[18ch] text-[clamp(32px,4.6vw,68px)] font-extrabold leading-[0.98] tracking-[-0.022em] text-ink text-balance">
          Design system
        </h1>
        <p
          className="mt-[clamp(16px,2vw,24px)] max-w-[64ch]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-body-size)",
            lineHeight: "var(--lh-body)",
            color: "var(--text-body)",
          }}
        >
          One set of tokens drives every page here. The sub-apps bundled under the Atlas
          each vendor their own copy of the system, so a few are still on an older palette.
          Nothing on this page is a copied hex or a screenshot: each swatch, ruler and
          specimen is drawn with the live variable, so if a token moves this page moves
          with it. Which makes it a diagnostic as much as a reference — anything that
          looks wrong here <i>is</i> wrong.
        </p>

        <nav className="mt-[clamp(24px,3vw,40px)] flex flex-wrap gap-2.5">
          {[
            ["colour", "Colour"],
            ["type", "Type"],
            ["space", "Space & radius"],
            ["components", "Components"],
            ["motion", "Motion"],
            ["rules", "Rules"],
          ].map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-[2px] border border-ink/25 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/70 transition-colors hover:border-ink/60"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* ---------------------------------------------------- colour --- */}
        <Section
          id="colour"
          label="01 — Colour"
          title="Thirteen roles, one accent"
          lede="Roles, not names: a component asks for “panel” or “band”, never for a colour. Two of them are deliberately fixed — band is dark in both themes and paper is always light — because a surface that flips underneath its own text is how contrast bugs happen."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {COLOUR.map((c) => (
              <div
                key={c.token}
                className="overflow-hidden rounded-[3px]"
                style={{ border: "var(--border-hairline) solid var(--hairline)" }}
              >
                <div className="h-20 w-full" style={{ background: `var(${c.token})` }} />
                <div style={{ padding: "var(--space-4)" }}>
                  <p className="text-[13.5px] font-extrabold tracking-[-0.01em] text-ink">{c.name}</p>
                  <p className="mt-1 font-mono text-[11px] text-accent-deep">{c.token}</p>
                  <p className="mt-1.5 font-mono text-[11px] leading-[1.5] text-faint">{c.note}</p>
                  <TokenValue token={c.token} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ------------------------------------------------------ type --- */}
        <Section
          id="type"
          label="02 — Type"
          title="Three faces, ten steps"
          lede="Archivo for display, IBM Plex Mono for body, labels and data, Bodoni for the correspondence voice. Body copy set in mono is the unusual choice and the deliberate one — it reads as instrument rather than magazine. Every step is a clamp(), so the scale is fluid rather than stepped at breakpoints."
        >
          <div className="flex flex-col">
            {TYPE.map((t) => (
              <div
                key={t.token}
                className="grid gap-x-8 gap-y-2 border-b border-ink/[0.14] py-[clamp(14px,2vw,22px)] min-[860px]:grid-cols-[180px_1fr]"
              >
                <div>
                  <p className="text-[13px] font-extrabold text-ink">{t.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-accent-deep">{t.token}</p>
                  <TokenValue token={t.token} />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className={t.cls} style={{ color: "var(--text)" }}>
                    {t.sample}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["--font-heading", "Display · Archivo", "Aa Gg 24"],
              ["--font-mono", "Body & data · IBM Plex Mono", "Aa Gg 24"],
              ["--font-serif", "Voice · Bodoni Moda", "Aa Gg 24"],
            ].map(([token, label, sample]) => (
              <div
                key={token}
                className="rounded-[3px]"
                style={{ border: "var(--border-hairline) solid var(--hairline)", padding: "var(--space-5)" }}
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{label}</p>
                <p
                  className="mt-3 text-[34px] leading-none text-ink"
                  style={{ fontFamily: `var(${token})` }}
                >
                  {sample}
                </p>
                <p className="mt-3 font-mono text-[11px] text-accent-deep">{token}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* --------------------------------------------- space & radius --- */}
        <Section
          id="space"
          label="03 — Space & radius"
          title="A fixed ladder and a fluid one"
          lede="Fixed steps for the inside of components, fluid clamps for the gaps between them — so a card's padding stays put while the space around it breathes with the viewport. Radii are small on purpose: 2px almost everywhere, and the pill reserved for controls that are genuinely round."
        >
          <div className="grid gap-[clamp(24px,4vw,56px)] lg:grid-cols-2">
            <div>
              <p className={head}>Fixed steps</p>
              <div className="mt-4 flex flex-col gap-2.5">
                {SPACE.map((s) => (
                  <div key={s} className="flex items-center gap-4">
                    <span className="w-[86px] shrink-0 font-mono text-[11px] text-accent-deep">{s}</span>
                    <span className="h-3 rounded-[1px]" style={{ width: `var(${s})`, background: "var(--accent)" }} />
                    <TokenValue token={s} inline />
                  </div>
                ))}
              </div>

              <p className={`${head} mt-8`}>Radius</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {RADII.map((r) => (
                  <div key={r} className="text-center">
                    <div
                      className="h-16 w-16"
                      style={{
                        background: "var(--panel)",
                        border: "var(--border-hairline) solid var(--hairline)",
                        borderRadius: `var(${r})`,
                      }}
                    />
                    <p className="mt-2 font-mono text-[10px] text-accent-deep">{r.replace("--radius", "") || "base"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className={head}>Fluid gaps</p>
              <div className="mt-4 flex flex-col gap-2.5">
                {FLUID.map((s) => (
                  <div key={s} className="flex items-center gap-4">
                    <span className="w-[130px] shrink-0 font-mono text-[11px] text-accent-deep">{s}</span>
                    <span
                      className="h-3 max-w-full rounded-[1px]"
                      style={{ width: `var(${s})`, background: "color-mix(in srgb, var(--accent) 45%, transparent)" }}
                    />
                  </div>
                ))}
              </div>
              <p className={note}>
                These resolve against the viewport, so the bars above change length as you
                resize the window. That is the point of them.
              </p>
            </div>
          </div>
        </Section>

        {/* ------------------------------------------------ components --- */}
        <Section
          id="components"
          label="04 — Components"
          title="The kit"
          lede="Classes shipped by futures-atlas-core, available to the host and to every bundled sub-app. A component that needs a colour reaches for a role; a component that needs a size reaches for a step."
        >
          <div className="grid gap-[clamp(20px,3vw,32px)] lg:grid-cols-2">
            <Demo title="Buttons" code=".fa-btn · .fa-btn--primary · .fa-btn--ghost">
              <div className="flex flex-wrap items-center gap-3">
                <span className="fa-btn fa-btn--primary">Primary</span>
                <span className="fa-btn fa-btn--ghost">Ghost</span>
              </div>
            </Demo>

            <Demo title="Labels" code=".fa-label · .fa-eyebrow">
              <div className="flex flex-wrap items-center gap-5">
                <span className="fa-label">Mono label</span>
                <span className="fa-eyebrow">Eyebrow</span>
              </div>
            </Demo>

            <Demo title="Field" code=".fa-field">
              <input className="fa-field w-full" placeholder="Input field" readOnly />
            </Demo>

            <Demo title="Hatch plate" code=".fa-hatch">
              <div className="fa-hatch h-24 w-full rounded-[2px]" />
            </Demo>

            <Demo title="Card" code=".fa-card · .fa-card__title · .fa-card__meta">
              <div className="fa-card max-w-[320px]">
                <div className="fa-hatch aspect-[3/2]" />
                <div style={{ padding: "var(--space-card)" }}>
                  <span className="fa-card__meta">Category</span>
                  <h3 className="fa-card__title mt-2">Card title</h3>
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-body-size)",
                      lineHeight: "var(--lh-body)",
                      color: "var(--text-body)",
                    }}
                  >
                    The card used across projects, the feed and the glossary.
                  </p>
                </div>
              </div>
            </Demo>

            <Demo title="Voice" code=".fa-voice">
              <p className="fa-voice text-[19px]">
                The correspondence voice — the serif, used where a human is speaking.
              </p>
            </Demo>
          </div>
        </Section>

        {/* ---------------------------------------------------- motion --- */}
        <Section
          id="motion"
          label="05 — Motion"
          title="One reveal, one easing"
          lede="Content rises once as it enters the viewport and then stays put. There is a single easing token and a single duration token, and everything obeys prefers-reduced-motion — the reveal resolves to “visible”, parallax is skipped entirely rather than shortened."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["--ease", "Easing curve"],
              ["--reveal-dur", "Reveal duration"],
              ["--focus-ring", "Focus ring"],
            ].map(([token, label]) => (
              <div
                key={token}
                className="rounded-[3px]"
                style={{ border: "var(--border-hairline) solid var(--hairline)", padding: "var(--space-5)" }}
              >
                <p className="text-[13.5px] font-extrabold text-ink">{label}</p>
                <p className="mt-1 font-mono text-[11px] text-accent-deep">{token}</p>
                <TokenValue token={token} />
              </div>
            ))}
          </div>
        </Section>

        {/* ----------------------------------------------------- rules --- */}
        <Section
          id="rules"
          label="06 — Rules"
          title="How to use it"
          lede="Four constraints that keep the system a system."
        >
          <ol className="grid gap-[clamp(16px,2.4vw,28px)] sm:grid-cols-2">
            {[
              [
                "Never hardcode a colour",
                "No hex, no oklch() in a component. Reference a role. Re-skinning happens in core’s tokens, or live from the control panel — never by editing components.",
              ],
              [
                "Structure is not design",
                "Flex, grid, aspect and position are layout and belong in utilities. Sizes, spaces, colours and fonts are design and belong in tokens.",
              ],
              [
                "One accent",
                "There is a single accent and it means “this is the live thing here”. A second accent would be a second meaning, and the system has no room for one.",
              ],
              [
                "Attribution renders",
                "Where a licence requires visible credit — the portraits in Hypothetica Magnifica — the credit is part of the component, not a comment. Removing it is a licence breach, not a design tidy-up.",
              ],
            ].map(([t, d]) => (
              <li key={t} style={{ borderTop: "var(--border-emphasis) solid var(--text)", paddingTop: "var(--space-4)" }}>
                <p className="text-[14px] font-extrabold tracking-[-0.01em] text-ink">{t}</p>
                <p
                  className="mt-2"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-body-size)",
                    lineHeight: "var(--lh-body)",
                    color: "var(--text-body)",
                  }}
                >
                  {d}
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-[clamp(28px,4vw,44px)] font-mono text-[12.5px] leading-[1.8] text-graphite">
            The tokens live in{" "}
            <code className="rounded-[2px] bg-ink/[0.07] px-1.5 py-0.5">futures-atlas-core/src/tokens.css</code>, the
            kit in <code className="rounded-[2px] bg-ink/[0.07] px-1.5 py-0.5">kit.css</code>. Runtime overrides are
            written by the private control panel and injected server-side on every request.{" "}
            <Link href="/about#stack" className="text-ink underline decoration-ink/30 underline-offset-4 hover:text-accent">
              The full stack →
            </Link>
          </p>
        </Section>
      </Container>
    </div>
  );
}

function Demo({ title, code, children }: { title: string; code: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[3px]" style={{ border: "var(--border-hairline) solid var(--hairline)" }}>
      <div
        className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink/[0.12]"
        style={{ padding: "var(--space-4)" }}
      >
        <span className="text-[13px] font-extrabold text-ink">{title}</span>
        <code className="font-mono text-[10.5px] text-accent-deep">{code}</code>
      </div>
      <div style={{ padding: "var(--space-6)", background: "var(--panel)" }}>{children}</div>
    </div>
  );
}
