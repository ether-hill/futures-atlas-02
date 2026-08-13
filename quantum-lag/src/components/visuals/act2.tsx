"use client";

import { N, Row, Rows, Stage, T } from "./parts";

/* ------------------------------------------------------ 6. resistance drop */
/*
  The whole story of the 1911 reading is the shape of this line: a gentle
  decline, and then nothing at all.
*/
export function ResistanceDrop() {
  return (
    <Stage height={180} label="Electrical resistance falling to zero at 4.2 kelvin">
      <line x1="70" y1="30" x2="70" y2="132" className="hair" />
      <line x1="70" y1="132" x2="520" y2="132" className="rule" />
      <T x={70} y={22}>Resistance</T>
      <T x={520} y={156} anchor="end">Warmer</T>

      {/* gentle decline, then the cliff */}
      <path
        d="M 520 62 C 400 66 260 76 190 92 L 172 116"
        className="rule"
        strokeWidth="2"
        fill="none"
      />
      <path d="M 172 116 L 172 132 L 70 132" className="accent" strokeWidth="2.5" fill="none" />

      <line x1="172" y1="30" x2="172" y2="132" className="hair" strokeDasharray="3 5" />
      <N x={182} y={48} size={22} accent>4.2 K</N>
      <T x={182} y={66} className="lbl--accent">It stops entirely</T>

      <circle cx="172" cy="132" r="4.5" className="fill-accent anim-pulse" />
    </Stage>
  );
}

/* ---------------------------------------------------- 6b. temperature scale */
export function TemperatureScale() {
  return (
    <Rows>
      <Row label="A warm room" fill={1} value="293 K" />
      <Row label="Deep space" fill={0.16} value="2.7 K" delay={120} />
      <Row
        label="A quantum processor"
        fill={0.04}
        value="0.01 K"
        accent
        delay={240}
      />
    </Rows>
  );
}

/* -------------------------------------------------------- 7. logical qubit */
/*
  A block of physical qubits, some failing at any moment, adding up to one you
  can rely on. The failures are the animation; the single square is the point.
*/
export function LogicalQubit() {
  const cells = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const i = r * 5 + c;
      // A few cells fail, on their own rhythms, so it never looks choreographed.
      const fails = [2, 6, 9, 13, 18, 21].includes(i);
      cells.push(
        <rect
          key={i}
          x={40 + c * 30}
          y={36 + r * 30}
          width="20"
          height="20"
          className={fails ? "fill-accent anim-pulse" : "hair"}
          fill={fails ? undefined : "none"}
          style={fails ? { animationDelay: `${(i % 5) * 620}ms` } : undefined}
        />,
      );
    }
  }

  return (
    <Stage height={210} label="A grid of physical qubits, some failing, combining into one logical qubit">
      {cells}
      <T x={40} y={26}>Physical qubits</T>
      <T x={40} y={202} className="lbl--accent">Blue ones have failed</T>

      <line x1="215" y1="110" x2="330" y2="110" className="hair" />
      <polygon points="336,110 326,105 326,115" className="fill-ink" />

      <rect x="356" y="72" width="76" height="76" className="fill-ink" />
      <T x={356} y={26}>What you can use</T>
      <N x={394} y={182} size={30} anchor="middle">1</N>
      <T x={394} y={202} anchor="middle">Logical qubit</T>
    </Stage>
  );
}

/* ----------------------------------------------------- 8. machines compared */
export function MachinesCompared() {
  return (
    <Stage height={200} label="The 1998 machine and a current one, drawn at the same scale">
      {/* 1998: a test tube in a magnet */}
      <T x={40} y={26}>1998</T>
      <rect x="40" y="40" width="120" height="120" className="hair" fill="none" />
      <rect x="92" y="66" width="16" height="68" className="rule" fill="none" />
      <circle cx="100" cy="120" r="4" className="fill-accent" />
      <circle cx="100" cy="106" r="4" className="fill-accent" />
      <N x={40} y={186} size={24}>2</N>
      <T x={62} y={186}>qubits</T>

      {/* now: a room */}
      <T x={240} y={26}>Now</T>
      <rect x="240" y="40" width="280" height="120" className="hair" fill="none" />
      <rect x="330" y="56" width="100" height="88" className="rule" fill="none" />
      <line x1="380" y1="56" x2="380" y2="144" className="hair" />
      {[68, 84, 100, 116].map((y) => (
        <line key={y} x1="342" y1={y} x2="418" y2={y} className="hair" />
      ))}
      <N x={240} y={186} size={24}>~1,000</N>
      <T x={330} y={186}>physical qubits, a room of refrigeration</T>
    </Stage>
  );
}

/* -------------------------------------------------------- 9. roadmap gap */
export function RoadmapGap() {
  const x = (year: number) => 50 + ((year - 2026) / 18) * 470;
  return (
    <Stage height={168} label="A manufacturer roadmap against surveyed expert estimates, with the gap between">
      <line x1="50" y1="98" x2="520" y2="98" className="rule" />
      {[2026, 2030, 2035, 2040, 2044].map((y) => (
        <g key={y}>
          <line x1={x(y)} y1="98" x2={x(y)} y2="106" className="hair" />
          <text x={x(y)} y={124} textAnchor="middle" className="num" style={{ fontSize: 15 }}>
            {y}
          </text>
        </g>
      ))}

      {/* the gap between the two */}
      <rect
        x={x(2029)}
        y="86"
        width={x(2038) - x(2029)}
        height="24"
        className="fill-accent"
        opacity="0.12"
      />
      <T x={(x(2029) + x(2038)) / 2} y={152} anchor="middle" className="lbl--faint">
        Ten years of disagreement
      </T>

      {/* manufacturer */}
      <line x1={x(2029)} y1="60" x2={x(2029)} y2="98" className="rule" strokeWidth="2" />
      <circle cx={x(2029)} cy="60" r="5" className="fill-ink" />
      <T x={x(2029)} y={46} anchor="middle">The maker says</T>

      {/* specialists */}
      <line x1={x(2036)} y1="98" x2={x(2039)} y2="98" className="accent" strokeWidth="6" />
      <line x1={x(2037.5)} y1="98" x2={x(2037.5)} y2="70" className="accent" strokeWidth="2" />
      <circle cx={x(2037.5)} cy="70" r="5" className="fill-accent" />
      <T x={x(2037.5)} y={56} anchor="middle" className="lbl--accent">
        The specialists say
      </T>
    </Stage>
  );
}

/* ---------------------------------------------------- 10. factoring at scale */
export function FactoringScale() {
  return (
    <Rows>
      <Row label="15" fill={0.02} value="7 qubits, done in 2001" />
      <Row
        label="RSA-2048"
        fill={1}
        value="Under a million qubits, not built"
        accent
        delay={160}
      />
    </Rows>
  );
}
