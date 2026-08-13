/**
 * The room the gigawatts are in.
 *
 * A cold aisle in one-point perspective: two rows of cabinets, cable trays
 * overhead, a raised floor, containment glass halfway down. It is drawn rather
 * than photographed, which is the only honest option here. A photograph of a
 * real data centre would be a picture of a building that exists, captioned with
 * a number about a future that does not.
 *
 * It is also not decoration. The lit half of the room is the counterfactual and
 * the dark half is what the intervention took away, counting from the far end,
 * because the far racks are the ones that were going to be built. A reader who
 * never looks at the chart can still see the size of the claim.
 *
 * Everything is deterministic. No Math.random anywhere, or the server render and
 * the browser render would disagree about which rack has which cables.
 */

const W = 1200;
const H = 520;
const VP = { x: 600, y: 262 };

/* The aisle at the near end, measured from the centre line. Wide enough that the
   near cabinets reach the edge of the frame: you are standing in the aisle, not
   looking at a model of one from across the room. */
const AISLE = 548;
const CEIL = 244;
const FLOOR = 246;

/** How many cabinets deep the room runs, per side. */
const N = 9;
/* Even spacing in the room becomes this in the picture: the reciprocal is what
   makes a corridor look like a corridor rather than a wedge. */
const scaleAt = (i: number) => 1 / (1 + i * 0.285);

const S = Array.from({ length: N + 1 }, (_, i) => scaleAt(i));

/** A point on the aisle wall: lateral offset in units of AISLE, height 0 at the
    ceiling and 1 at the floor, at depth index d (fractional allowed). */
function wall(side: number, u: number, s: number) {
  return {
    x: VP.x + side * AISLE * s,
    y: VP.y - CEIL * s + u * (CEIL + FLOOR) * s,
  };
}
const ceilPt = (lat: number, s: number) => ({ x: VP.x + lat * s, y: VP.y - CEIL * s });
const floorPt = (lat: number, s: number) => ({ x: VP.x + lat * s, y: VP.y + FLOOR * s });
const P = (p: { x: number; y: number }) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;

/* A fixed shuffle, so cabinet 4 always looks like cabinet 4. */
const PATTERN = [0.62, 0.44, 0.71, 0.38, 0.55, 0.67, 0.41, 0.58, 0.48];

export default function Room({
  lit,
  caption,
}: {
  /** Share of the room still drawing power, 0 to 1. */
  lit: number;
  caption: React.ReactNode;
}) {
  /* Cabinets go dark from the back of the room forward. */
  const onCount = Math.max(1, Math.round(Math.min(1, Math.max(0, lit)) * N));

  const bays = Array.from({ length: N }, (_, i) => i);
  const gridLats = [-1, -0.66, -0.33, 0, 0.33, 0.66, 1].map((k) => k * AISLE);

  return (
    <figure className="room">
      <svg
        className="room-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="A data centre aisle, drawn. The lit cabinets are the power still drawn under this intervention."
      >
        <defs>
          {/* Light spilling off the ceiling fittings. Subtle: at full strength
              it washed the whole drawing out to a grey smear. */}
          <linearGradient id="room-air" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--room-haze)" stopOpacity="0.2" />
            <stop offset="42%" stopColor="var(--room-haze)" stopOpacity="0.04" />
            <stop offset="100%" stopColor="var(--room-haze)" stopOpacity="0" />
          </linearGradient>
          {/* The far end of a long room is never as sharp as the near end. */}
          <radialGradient id="room-depth" cx="50%" cy="50%" r="46%">
            <stop offset="0%" stopColor="var(--room-far)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--room-far)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x={0} y={0} width={W} height={H} fill="var(--room-ground)" />

        {/* ---------------------------------------------------------- floor */}
        <polygon
          points={`${P(floorPt(-AISLE, 1))} ${P(floorPt(AISLE, 1))} ${P(
            floorPt(AISLE, S[N])
          )} ${P(floorPt(-AISLE, S[N]))}`}
          fill="var(--room-floor)"
        />
        {gridLats.map((lat) => (
          <line
            key={`fl${lat}`}
            x1={floorPt(lat, 1).x}
            y1={floorPt(lat, 1).y}
            x2={floorPt(lat, S[N]).x}
            y2={floorPt(lat, S[N]).y}
            className="room-tile"
          />
        ))}
        {S.map((s, i) => (
          <line
            key={`ft${i}`}
            x1={floorPt(-AISLE, s).x}
            y1={floorPt(-AISLE, s).y}
            x2={floorPt(AISLE, s).x}
            y2={floorPt(AISLE, s).y}
            className="room-tile"
          />
        ))}

        {/* -------------------------------------------------------- ceiling */}
        <polygon
          points={`${P(ceilPt(-AISLE, 1))} ${P(ceilPt(AISLE, 1))} ${P(ceilPt(AISLE, S[N]))} ${P(
            ceilPt(-AISLE, S[N])
          )}`}
          fill="var(--room-ceil)"
        />
        {/* the trays, and the bundles running in them */}
        {[-0.72, -0.34, 0.34, 0.72].map((k) => (
          <line
            key={`tray${k}`}
            x1={ceilPt(k * AISLE, 1).x}
            y1={ceilPt(k * AISLE, 1).y}
            x2={ceilPt(k * AISLE, S[N]).x}
            y2={ceilPt(k * AISLE, S[N]).y}
            className="room-tray"
          />
        ))}
        {[-0.64, -0.57, -0.47, 0.47, 0.57, 0.64].map((k) => (
          <line
            key={`bundle${k}`}
            x1={ceilPt(k * AISLE, 1).x}
            y1={ceilPt(k * AISLE, 1).y}
            x2={ceilPt(k * AISLE, S[N]).x}
            y2={ceilPt(k * AISLE, S[N]).y}
            className="room-bundle"
          />
        ))}
        {S.slice(0, N).map((s, i) => (
          <line
            key={`rung${i}`}
            x1={ceilPt(-AISLE, s).x}
            y1={ceilPt(-AISLE, s).y}
            x2={ceilPt(AISLE, s).x}
            y2={ceilPt(AISLE, s).y}
            className="room-rung"
          />
        ))}

        {/* --------------------------------------------------------- lights */}
        {bays.map((i) => {
          const a = S[i];
          const b = S[i + 1];
          return (
            <g key={`lamp${i}`}>
              {([-0.16, 0.16] as const).map((k) => (
                <polygon
                  key={k}
                  points={`${P(ceilPt((k - 0.035) * AISLE, a))} ${P(
                    ceilPt((k + 0.035) * AISLE, a)
                  )} ${P(ceilPt((k + 0.035) * AISLE, b))} ${P(ceilPt((k - 0.035) * AISLE, b))}`}
                  className={i < onCount ? "room-lamp" : "room-lamp off"}
                />
              ))}
            </g>
          );
        })}

        {/* --------------------------------------------------------- cabinets */}
        {([-1, 1] as const).map((side) =>
          bays.map((i) => {
            const a = S[i];
            const b = S[i + 1];
            const on = i < onCount;
            const seed = PATTERN[(i + (side === -1 ? 0 : 4)) % PATTERN.length];
            const face = `${P(wall(side, 0, a))} ${P(wall(side, 0, b))} ${P(
              wall(side, 1, b)
            )} ${P(wall(side, 1, a))}`;
            /* Cable bundles fill the middle of the cabinet, the way they do in
               a room that has been patched by a person rather than a diagram. */
            const bands = [0.2, 0.29, 0.38, 0.47, 0.56, 0.65].map((u, k) => {
              const h = 0.045 + (k % 2) * 0.012;
              const shift = (seed - 0.5) * 0.05;
              const top = u + shift;
              return `${P(wall(side, top, a))} ${P(wall(side, top, b))} ${P(
                wall(side, top + h, b)
              )} ${P(wall(side, top + h, a))}`;
            });
            return (
              <g key={`c${side}${i}`} className={on ? "room-bay" : "room-bay off"}>
                <polygon points={face} className="room-face" />
                {bands.map((d, k) => (
                  <polygon key={k} points={d} className={k % 3 === 1 ? "room-cable alt" : "room-cable"} />
                ))}
                {/* the door frame between one cabinet and the next */}
                <line
                  x1={wall(side, 0, b).x}
                  y1={wall(side, 0, b).y}
                  x2={wall(side, 1, b).x}
                  y2={wall(side, 1, b).y}
                  className="room-edge"
                />
                {/* status lights, one strip per cabinet */}
                {[0.74, 0.79, 0.84].map((u, k) => {
                  const p = wall(side, u, (a + b) / 2);
                  return (
                    <circle
                      key={k}
                      cx={p.x - side * 4 * b}
                      cy={p.y}
                      r={Math.max(0.9, 2.6 * b)}
                      className={k === 1 ? "room-led amber" : "room-led"}
                    />
                  );
                })}
              </g>
            );
          })
        )}

        {/* containment glass across the aisle, a third of the way in */}
        {(() => {
          const s = S[3];
          return (
            <g className="room-glass">
              <polygon
                points={`${P(wall(-1, 0.04, s))} ${P(wall(-1, 1, s))} ${P(
                  wall(-1, 1, S[4])
                )} ${P(wall(-1, 0.04, S[4]))}`}
              />
              <polygon
                points={`${P(wall(1, 0.04, s))} ${P(wall(1, 1, s))} ${P(wall(1, 1, S[4]))} ${P(
                  wall(1, 0.04, S[4])
                )}`}
              />
              <line
                x1={wall(-1, 0.04, s).x}
                y1={wall(-1, 0.04, s).y}
                x2={wall(1, 0.04, s).x}
                y2={wall(1, 0.04, s).y}
                className="room-edge"
              />
            </g>
          );
        })()}

        {/* the far wall, and the lit door in it */}
        <polygon
          points={`${P(wall(-1, 0, S[N]))} ${P(wall(1, 0, S[N]))} ${P(wall(1, 1, S[N]))} ${P(
            wall(-1, 1, S[N])
          )}`}
          className="room-back"
        />
        <polygon
          points={`${P(wall(-0.34, 0.3, S[N]))} ${P(wall(0.34, 0.3, S[N]))} ${P(
            wall(0.34, 1, S[N])
          )} ${P(wall(-0.34, 1, S[N]))}`}
          className={onCount >= N ? "room-door" : "room-door off"}
        />

        {/* the air of the room, over everything */}
        <rect x={0} y={0} width={W} height={H} fill="url(#room-air)" />
        <rect x={0} y={0} width={W} height={H} fill="url(#room-depth)" />
      </svg>
      <figcaption className="room-cap">{caption}</figcaption>
    </figure>
  );
}
