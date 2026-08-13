"use client";

import { N, Row, Rows, Stage, T } from "./parts";

/* ------------------------------------------------------- 1. energy levels */
/*
  Two levels, one gap, one frequency. The dot sits on the lower level, jumps to
  the upper one, and falls back, which is the whole of what a caesium clock
  counts.
*/
export function EnergyLevels() {
  return (
    <Stage height={190} label="Two energy levels separated by a fixed gap, bridged by a single frequency">
      <line x1="40" y1="40" x2="330" y2="40" className="rule" />
      <line x1="40" y1="150" x2="330" y2="150" className="rule" />
      <T x={40} y={28}>Higher level</T>
      <T x={40} y={172}>Lower level</T>

      {/* the gap */}
      <line
        x1="200"
        y1="46"
        x2="200"
        y2="144"
        className="accent"
        strokeWidth="2"
        strokeDasharray="4 5"
      />
      <polygon points="200,40 196,50 204,50" className="fill-accent" />
      <polygon points="200,150 196,140 204,140" className="fill-accent" />

      {/* the atom, jumping and falling back */}
      <circle cx="110" cy="150" r="6" className="fill-accent">
        <animate
          attributeName="cy"
          values="150;150;40;40;150"
          keyTimes="0;0.32;0.42;0.78;0.9"
          dur="4.4s"
          repeatCount="indefinite"
        />
      </circle>

      <T x={360} y={80} className="lbl--accent">One frequency, always</T>
      <N x={360} y={116} size={27}>9,192,631,770</N>
      <T x={360} y={140}>Vibrations per second</T>
    </Stage>
  );
}

/* --------------------------------------------------------- 2. spin states */
/*
  Two states, nothing between them. The middle panel is deliberately empty.
*/
export function SpinTwoStates() {
  const cell = (x: number, up: boolean, value: string) => (
    <g>
      <circle cx={x} cy="82" r="34" className="hair" fill="none" />
      <line
        x1={x}
        y1={up ? 108 : 56}
        x2={x}
        y2={up ? 56 : 108}
        className="accent"
        strokeWidth="2.5"
      />
      <polygon
        points={
          up ? `${x},50 ${x - 6},62 ${x + 6},62` : `${x},114 ${x - 6},102 ${x + 6},102`
        }
        className="fill-accent"
      />
      <T x={x} y={142} anchor="middle">
        {up ? "Spin up" : "Spin down"}
      </T>
      <text
        x={x}
        y={172}
        textAnchor="middle"
        className="num"
        style={{ fontSize: 26 }}
      >
        {value}
      </text>
    </g>
  );

  return (
    <Stage height={190} label="Spin up and spin down as the only two states, standing for 0 and 1">
      {cell(90, true, "0")}
      {cell(470, false, "1")}
      <line x1="150" y1="82" x2="410" y2="82" className="hair" strokeDasharray="3 6" />
      <T x={280} y={74} anchor="middle" className="lbl--faint">
        Nothing in between
      </T>
    </Stage>
  );
}

/* ---------------------------------------------------------- 3. gravity dip */
/*
  The reading dips where the ground is hollow. The sensor crosses it.
*/
export function GravityDip() {
  // A flat trace with one smooth dip centred over the void.
  const trace =
    "M 30 56 L 190 56 C 230 56 230 92 260 92 C 290 92 290 56 330 56 L 530 56";
  return (
    <Stage height={210} label="A gravity reading dipping as a sensor crosses a buried tunnel">
      <T x={30} y={26}>Gravity reading</T>
      <path d={trace} className="accent" strokeWidth="2" fill="none" />

      {/* the sensor, tracking along the trace */}
      <rect
        x="-7"
        y="-7"
        width="14"
        height="14"
        className="fill-bg rule"
        strokeWidth="1.5"
      >
        <animateMotion dur="6s" repeatCount="indefinite" path={trace} />
      </rect>

      {/* the road */}
      <line x1="30" y1="128" x2="530" y2="128" className="rule" strokeWidth="2" />
      <T x={30} y={120}>Road</T>

      {/* ground hatch, with the void left clear */}
      <defs>
        <pattern id="ql-ground" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0,8 l8,-8" stroke="currentColor" strokeWidth="1" opacity="0.16" />
        </pattern>
        <mask id="ql-void">
          <rect x="30" y="128" width="500" height="60" fill="white" />
          <rect x="222" y="146" width="76" height="26" fill="black" />
        </mask>
      </defs>
      <g style={{ color: "var(--text)" }}>
        <rect
          x="30"
          y="128"
          width="500"
          height="60"
          fill="url(#ql-ground)"
          mask="url(#ql-void)"
        />
      </g>
      <rect x="222" y="146" width="76" height="26" className="hair" fill="none" />
      <T x={260} y={186} anchor="middle">Tunnel, one metre down</T>
    </Stage>
  );
}

/* ----------------------------------------------------------- 4. three tiers */
export function ThreeTiers() {
  return (
    <Rows>
      <Row label="Sensing, randomness" fill={1} value="On sale now" />
      <Row label="Communication" fill={0.5} value="Sold, limited" delay={120} />
      <Row
        label="Computing"
        fill={0.12}
        value="Not for sale"
        accent
        delay={240}
      />
    </Rows>
  );
}

/* ------------------------------------------------- 5. demonstration to service */
/*
  Everything here is the card's own numbers: the 2024 trials, and the 2032 to
  2045 window. The gap between them is the point.
*/
export function DemoToService() {
  const x = (year: number) => 40 + ((year - 2020) / 30) * 480;
  return (
    <Stage height={150} label="Trial flights in 2024, against the window for routine service">
      <line x1="40" y1="92" x2="520" y2="92" className="rule" />
      {[2020, 2030, 2040, 2050].map((y) => (
        <g key={y}>
          <line x1={x(y)} y1="92" x2={x(y)} y2="100" className="hair" />
          <text x={x(y)} y={118} textAnchor="middle" className="num" style={{ fontSize: 15 }}>
            {y}
          </text>
        </g>
      ))}

      {/* trials */}
      <line x1={x(2024)} y1="66" x2={x(2024)} y2="92" className="rule" strokeWidth="2" />
      <circle cx={x(2024)} cy="66" r="5" className="fill-ink" />
      <T x={x(2024)} y={52} anchor="middle">Trial flights</T>

      {/* the window */}
      <rect
        x={x(2032)}
        y="80"
        width={x(2045) - x(2032)}
        height="24"
        className="fill-accent"
        opacity="0.16"
      />
      <line x1={x(2032)} y1="80" x2={x(2032)} y2="104" className="accent" strokeWidth="2" />
      <line x1={x(2045)} y1="80" x2={x(2045)} y2="104" className="accent" strokeWidth="2" />
      <T x={(x(2032) + x(2045)) / 2} y={52} anchor="middle" className="lbl--accent">
        In service
      </T>

      {/* the gap */}
      <line
        x1={x(2024)}
        y1="136"
        x2={x(2032)}
        y2="136"
        className="hair"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <T x={(x(2024) + x(2032)) / 2} y={132} anchor="middle" className="lbl--faint">
        Eight years, at best
      </T>
    </Stage>
  );
}
