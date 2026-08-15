/**
 * The furniture every Atlas report shares: a numbered section, and the same
 * thing on a dark band.
 *
 * `BandSection` is a near-copy rather than a `dark` prop on `Section`: the two
 * live on opposite grounds and every colour in them differs, so one component
 * with a branch in every className is harder to read than two that each say
 * what they are. If a third ground ever appears, that is the moment to merge.
 */

const Head = ({
  label,
  title,
  lede,
  tone,
}: {
  label: string;
  title: string;
  lede: React.ReactNode;
  tone: { title: string; lede: string; width: string };
}) => (
  <>
    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">{label}</p>
    <h2
      className={`mt-4 ${tone.width} text-[clamp(28px,4vw,46px)] font-medium leading-[1.05] tracking-[-0.03em] ${tone.title}`}
    >
      {title}
    </h2>
    <div className={`mt-5 max-w-[68ch] text-[15px] leading-[1.75] ${tone.lede}`}>{lede}</div>
  </>
);

export const Section = ({
  label,
  title,
  lede,
  children,
}: {
  label: string;
  title: string;
  lede: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="border-t border-ink/[0.14] pt-[clamp(36px,5vw,64px)]">
    <Head
      label={label}
      title={title}
      lede={lede}
      tone={{ title: "text-ink", lede: "text-ink/75", width: "max-w-[20ch]" }}
    />
    {children}
  </section>
);

export const BandSection = ({
  label,
  title,
  lede,
  children,
}: {
  label: string;
  title: string;
  lede: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section>
    <Head
      label={label}
      title={title}
      lede={lede}
      tone={{ title: "text-paper", lede: "text-paper/65", width: "max-w-[24ch]" }}
    />
    {children}
  </section>
);
