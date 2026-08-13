"use client";

import { Row, Rows, Stage, T } from "./parts";

/* ------------------------------------------------------- 11. tapped channel */
/*
  The same run of readings twice. Clean above, listened to below. The errors are
  the whole mechanism: an eavesdropper cannot help leaving them.
*/
export function TappedChannel() {
  const marks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const tapped = [2, 5, 8];

  return (
    <Stage height={200} label="A quantum channel read cleanly, and the same channel with an eavesdropper leaving errors">
      {/* clean */}
      <T x={40} y={26}>Nobody listening</T>
      <line x1="40" y1="56" x2="520" y2="56" className="hair" />
      {marks.map((i) => (
        <rect
          key={i}
          x={44 + i * 48}
          y="48"
          width="16"
          height="16"
          className="rule"
          fill="none"
        />
      ))}
      <circle r="4" className="fill-accent">
        <animateMotion dur="4.2s" repeatCount="indefinite" path="M 40 56 L 520 56" />
      </circle>

      {/* tapped */}
      <T x={40} y={128}>Somebody listening</T>
      <line x1="40" y1="158" x2="520" y2="158" className="hair" />
      {marks.map((i) => {
        const bad = tapped.includes(i);
        return (
          <g key={i}>
            <rect
              x={44 + i * 48}
              y="150"
              width="16"
              height="16"
              className={bad ? "fill-accent" : "rule"}
              fill={bad ? undefined : "none"}
            />
            {bad && (
              <g className="anim-pulse" style={{ animationDelay: `${i * 300}ms` }}>
                <line
                  x1={44 + i * 48}
                  y1="182"
                  x2={60 + i * 48}
                  y2="182"
                  className="accent"
                  strokeWidth="2"
                />
              </g>
            )}
          </g>
        );
      })}
      <circle r="4" className="fill-accent">
        <animateMotion dur="4.2s" repeatCount="indefinite" path="M 40 158 L 520 158" />
      </circle>

      {/* the tap */}
      <line x1="280" y1="112" x2="280" y2="150" className="accent" strokeDasharray="3 4" />
      <T x={288} y={112} className="lbl--accent">A tap here</T>
      <T x={40} y={196} className="lbl--faint">Errors that give it away</T>
    </Stage>
  );
}

/* ---------------------------------------------------------- 12. three ranges */
export function ThreeRanges() {
  return (
    <Rows>
      <Row label="A laboratory bench" fill={0.015} value="32 cm, 1989" />
      <Row label="The quantum internet" fill={0.03} value="7 m, 2021" delay={120} />
      <Row label="Satellite to ground" fill={1} value="1,200 km, 2017" accent delay={240} />
    </Rows>
  );
}

/* ---------------------------------------------------- 13. teleportation steps */
/*
  Nothing crosses the middle. The state disappears at A and appears at B, and a
  perfectly ordinary signal has to be sent for it to work, drawn separately
  because that is the part the word hides.
*/
export function TeleportationSteps() {
  return (
    <Stage height={200} label="A state disappearing from one particle and appearing on another, with the ordinary signal drawn separately">
      <circle cx="90" cy="70" r="30" className="hair" fill="none" />
      <circle cx="470" cy="70" r="30" className="hair" fill="none" />
      <T x={90} y={122} anchor="middle">Particle A</T>
      <T x={470} y={122} anchor="middle">Particle B</T>

      {/* the state leaves A */}
      <circle cx="90" cy="70" r="11" className="fill-accent">
        <animate
          attributeName="opacity"
          values="1;1;0;0;1"
          keyTimes="0;0.3;0.42;0.9;1"
          dur="5s"
          repeatCount="indefinite"
        />
      </circle>
      {/* and appears on B, without crossing */}
      <circle cx="470" cy="70" r="11" className="fill-accent">
        <animate
          attributeName="opacity"
          values="0;0;1;1;0"
          keyTimes="0;0.42;0.54;0.9;1"
          dur="5s"
          repeatCount="indefinite"
        />
      </circle>

      <T x={280} y={64} anchor="middle" className="lbl--faint">Nothing crosses here</T>
      <line x1="140" y1="80" x2="420" y2="80" className="hair" strokeDasharray="2 8" />

      {/* the ordinary signal, drawn on its own line */}
      <line x1="90" y1="160" x2="470" y2="160" className="rule" />
      <circle r="5" className="fill-ink">
        <animateMotion dur="5s" repeatCount="indefinite" path="M 90 160 L 470 160" />
      </circle>
      <T x={90} y={186}>An ordinary signal, no faster than light</T>
    </Stage>
  );
}

/* ---------------------------------------------------- 14. link to a network */
export function LinkToNetwork() {
  const node = (x: number, y: number, label: string) => (
    <g>
      <circle cx={x} cy={y} r="18" className="rule" fill="none" />
      <T x={x} y={y + 40} anchor="middle">{label}</T>
    </g>
  );

  return (
    <Stage height={190} label="Two nodes make a link; a third in the middle makes a network">
      <T x={30} y={24}>A link</T>
      {node(70, 78, "Alice")}
      {node(200, 78, "Bob")}
      <line x1="88" y1="78" x2="182" y2="78" className="accent" strokeWidth="2" />

      <line x1="270" y1="40" x2="270" y2="150" className="hair" />

      <T x={320} y={24}>A network</T>
      {node(350, 78, "Alice")}
      {node(450, 78, "Bob")}
      {node(550, 78, "Charlie")}
      <line x1="368" y1="78" x2="432" y2="78" className="accent" strokeWidth="2" />
      <line x1="468" y1="78" x2="532" y2="78" className="accent" strokeWidth="2" />

      {/* the new connection the middle node creates */}
      <path
        d="M 350 100 Q 450 158 550 100"
        className="accent"
        strokeWidth="2"
        strokeDasharray="5 5"
        fill="none"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="80;0"
          dur="2.6s"
          repeatCount="indefinite"
        />
      </path>
      <T x={450} y={176} anchor="middle" className="lbl--accent">
        Joined, having never met
      </T>
    </Stage>
  );
}

/* ------------------------------------------------------- 15. fibre fall-off */
export function FibreFalloff() {
  return (
    <Stage height={190} label="Signal strength falling with distance in fibre, and the point where an ordinary repeater cannot be used">
      <line x1="60" y1="30" x2="60" y2="132" className="hair" />
      <line x1="60" y1="132" x2="520" y2="132" className="rule" />
      <T x={60} y={22}>Signal</T>
      <T x={520} y={158} anchor="end">Distance along the fibre</T>

      <path
        d="M 60 40 C 150 44 210 88 280 112 C 340 130 420 131 520 132"
        className="accent"
        strokeWidth="2"
        fill="none"
      />

      {/* where a repeater would sit */}
      <line x1="300" y1="40" x2="300" y2="132" className="hair" strokeDasharray="3 5" />
      <circle cx="300" cy="118" r="14" className="rule" fill="none" />
      <line x1="291" y1="109" x2="309" y2="127" className="rule" strokeWidth="2" />
      <T x={316} y={68}>An ordinary repeater</T>
      <T x={316} y={86} className="lbl--faint">would read it, and reading destroys it</T>

      <T x={60} y={158}>A few hundred kilometres</T>
    </Stage>
  );
}
