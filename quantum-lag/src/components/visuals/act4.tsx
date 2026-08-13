"use client";

import { N, Row, Rows, Stage, T } from "./parts";

/* --------------------------------------------------- 16. supremacy collapse */
/*
  Three published figures for the same calculation. The bars are on a log scale,
  because otherwise the last two are invisible next to the first.
*/
export function SupremacyCollapse() {
  return (
    <Rows>
      <Row label="Claimed in 2019" fill={1} value="10,000 years" />
      <Row label="Recomputed 2022" fill={0.42} value="A few days" delay={140} />
      <Row label="Recomputed 2024" fill={0.24} value="Hours" accent delay={280} />
    </Rows>
  );
}

/* --------------------------------------------------------- 17. deadline axis */
export function DeadlineAxis() {
  const x = (year: number) => 50 + ((year - 2024) / 24) * 470;
  const mark = (year: number, label: string) => (
    <g key={year}>
      <g>
        <rect x={x(year) - 5} y="72" width="4" height="34" className="fill-accent" />
        <rect x={x(year) + 1} y="72" width="4" height="34" className="fill-accent" />
      </g>
      <T x={x(year)} y={64} anchor="middle" className="lbl--accent">
        {label}
      </T>
    </g>
  );

  return (
    <Stage height={196} label="Binding migration deadlines against the expert range for a code-breaking machine">
      <line x1="50" y1="90" x2="520" y2="90" className="rule" />
      {[2024, 2030, 2036, 2042, 2048].map((y) => (
        <g key={y}>
          <line x1={x(y)} y1="90" x2={x(y)} y2="98" className="hair" />
          <text x={x(y)} y={116} textAnchor="middle" className="num" style={{ fontSize: 15 }}>
            {y}
          </text>
        </g>
      ))}

      {mark(2030, "Sensitive systems")}
      {mark(2035, "Complete")}

      {/* the machine the deadlines anticipate */}
      <rect
        x={x(2035)}
        y="140"
        width={x(2045) - x(2035)}
        height="18"
        className="fill-accent"
        opacity="0.16"
      />
      <line x1={x(2035)} y1="140" x2={x(2035)} y2="158" className="hair" strokeWidth="2" />
      <line x1={x(2045)} y1="140" x2={x(2045)} y2="158" className="hair" strokeWidth="2" />
      <T x={x(2035)} y={180}>Where experts put the machine</T>

      <T x={50} y={38}>The law is fixed</T>
      <T x={50} y={158} anchor="start" className="lbl--faint">
        The science is not
      </T>
    </Stage>
  );
}

/* ------------------------------------------------------ 18. qubit threshold */
export function QubitThreshold() {
  return (
    <Rows>
      <Row label="Needs a licence above" fill={0.02} value="34 qubits" accent />
      <Row label="Machines that exist" fill={0.14} value="~1,000 qubits" delay={140} />
      <Row
        label="Breaking encryption"
        fill={1}
        value="Under a million"
        delay={280}
      />
    </Rows>
  );
}

/* --------------------------------------------------------- 19. expert spread */
/*
  Not a date. A rising chance, with the deadlines that were set against it.
*/
export function ExpertSpread() {
  const x = (year: number) => 56 + ((year - 2028) / 22) * 460;
  const y = (p: number) => 150 - p * 104;

  return (
    <Stage height={228} label="The surveyed chance of a code-breaking machine rising over time, with policy deadlines overlaid">
      <line x1="56" y1="34" x2="56" y2="150" className="hair" />
      <line x1="56" y1="150" x2="520" y2="150" className="rule" />
      <T x={56} y={26}>Chance, as surveyed</T>

      {/* the band */}
      <path
        d={`M ${x(2028)} ${y(0.05)} C ${x(2033)} ${y(0.2)} ${x(2036)} ${y(0.45)} ${x(2040)} ${y(0.62)} C ${x(2044)} ${y(0.76)} ${x(2047)} ${y(0.82)} ${x(2050)} ${y(0.86)} L ${x(2050)} 150 L ${x(2028)} 150 Z`}
        className="fill-accent"
        opacity="0.14"
      />
      <path
        d={`M ${x(2028)} ${y(0.05)} C ${x(2033)} ${y(0.2)} ${x(2036)} ${y(0.45)} ${x(2040)} ${y(0.62)} C ${x(2044)} ${y(0.76)} ${x(2047)} ${y(0.82)} ${x(2050)} ${y(0.86)}`}
        className="accent"
        strokeWidth="2"
        fill="none"
      />

      {/* the two figures the survey actually reports */}
      <circle cx={x(2035)} cy={y(0.33)} r="5" className="fill-accent" />
      <N x={x(2035) - 12} y={y(0.33) - 18} size={17} anchor="end" accent>1 in 3</N>
      <T x={x(2035) - 12} y={y(0.33) - 4} anchor="end">by 2035</T>

      <circle cx={x(2045)} cy={y(0.8)} r="5" className="fill-accent" />
      <N x={x(2045) - 12} y={y(0.8) - 18} size={17} anchor="end" accent>4 in 5</N>
      <T x={x(2045) - 12} y={y(0.8) - 4} anchor="end">by 2045</T>

      {[2030, 2040, 2050].map((yr) => (
        <text key={yr} x={x(yr)} y={172} textAnchor="middle" className="num" style={{ fontSize: 15 }}>
          {yr}
        </text>
      ))}

      {/* the deadlines, over the top */}
      {[2030, 2035].map((yr) => (
        <g key={yr}>
          <line x1={x(yr)} y1="34" x2={x(yr)} y2="150" className="hair" strokeDasharray="3 5" />
        </g>
      ))}
      <T x={x(2030)} y={202} anchor="middle" className="lbl--faint">
        Deadlines set anyway
      </T>
    </Stage>
  );
}

/* ---------------------------------------------------- 20. requirement falling */
/*
  Two things on one figure: the estimate collapsing, and the hardware barely
  moving underneath it. The second is why the first matters.
*/
export function RequirementFalling() {
  return (
    <Stage height={244} label="The estimated qubit requirement falling a thousandfold while the machines built stayed almost flat">
      <T x={40} y={24}>Qubits needed to break RSA-2048</T>

      {[
        { year: 2012, w: 460, label: "1 billion" },
        { year: 2019, w: 190, label: "20 million" },
        { year: 2025, w: 74, label: "Under 1 million" },
      ].map((d, i) => (
        <g key={d.year}>
          <rect
            x="40"
            y={50 + i * 46}
            width={d.w}
            height="20"
            className="fill-accent"
            opacity={0.85 - i * 0.18}
            style={{
              transformOrigin: "40px 0",
              animation: `ql-fig-grow 800ms var(--ease-enter) ${i * 160}ms both`,
            }}
          />
          <text
            x={d.w + 52}
            y={65 + i * 46}
            className="num"
            style={{ fontSize: 16 }}
          >
            {d.label}
          </text>
          <text x="40" y={42 + i * 46} className="num" style={{ fontSize: 13, fill: "var(--muted)" }}>
            {d.year}
          </text>
        </g>
      ))}

      {/* what was actually built, on the same axis */}
      <line x1="40" y1="206" x2="520" y2="206" className="hair" />
      <rect x="40" y="200" width="6" height="12" className="fill-ink" />
      <rect x="516" y="200" width="8" height="12" className="fill-ink" />
      <T x={40} y={230}>Largest machine built: a handful, then about a thousand</T>
    </Stage>
  );
}
