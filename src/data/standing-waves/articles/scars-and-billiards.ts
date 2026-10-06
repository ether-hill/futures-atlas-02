import type { Article } from "../types";

export const scarsAndBilliards: Article = {
  slug: "scars-and-billiards",
  title: "Scars and Billiards",
  standfirst:
    "Physicists use flat metal boxes full of microwaves, and plates you can hear, to study quantum waves they cannot easily see. It works because the equations really are the same.",
  state: "published",
  box: {
    established:
      "In a thin enough cavity, microwaves obey the same equation as a quantum particle in a flat box, so cavities are used as working models of quantum chaos.",
    contested: "How far results from these classical stand-ins carry over to messier real quantum systems.",
    notSupported: "That because a plate or cavity shares the maths, it shares the physics of matter.",
  },
  relatedEvents: ["kac-1966", "heller-1984", "stockmann-stein-1990"],
  body: `
## Billiards, with waves

A billiard, to a physicist, is a flat table with walls and a ball that bounces off them without losing speed. On a round table the ball's path is orderly. On a table shaped like a stadium, with straight sides and rounded ends, the path becomes chaotic: two shots that start almost the same end up nowhere near each other.

Now replace the ball with a wave. A wave in a closed box can only settle into certain shapes, the box's modes, the same way a plate can only ring in certain patterns [[event:chladni-1787|(Chladni)]]. The question that grew into the field of *quantum chaos* is: what do those wave shapes look like when the ball's path in the same box would be chaotic?

## Scars

The expectation was that in a chaotic box the waves would look like noise, spread evenly everywhere, because the bouncing ball eventually goes everywhere. In 1984 Eric Heller showed that this is not always true. Some of the wave patterns concentrate along particular paths: the short, unstable loops a ball could repeat forever if aimed perfectly [@heller-1984]. He called them scars. They are the ghost of an orbit, left in a wave.

This was a result about quantum mechanics: the waves were the allowed states of a particle in a box. But nobody can easily build a box for a single electron and photograph its states. So people built a different box.

## Microwaves in a metal box

In 1990 Hans-Jürgen Stöckmann and Jörg Stein took flat metal cavities, shaped like billiard tables, and measured how they absorbed microwaves [@stockmann-stein-1990]. If a cavity is thin enough, the equation the microwaves obey inside it has exactly the same form as the two-dimensional Schrödinger equation for a particle in a box of that shape. The cavity's resonances are the box's allowed states.

That made the cavity a quantum-chaos laboratory you could put on a bench. A year later Srinivas Sridhar mapped the wave patterns inside chaotic microwave cavities directly, and saw Heller's scars [@sridhar-1991].

The word that matters is *same form*. The microwaves are not quantum particles, and nobody claims they are. The cavity is useful precisely because the maths is shared and the physics is not: you get to measure the solutions of an equation without having to make electrons sit still.

## Can you hear the shape of a drum?

Plates and drums sit on the same footing. In 1966 Mark Kac asked whether you could work out the exact shape of a drum just from the list of notes it can play [@kac-1966]. If two different shapes always gave different notes, the notes would be a fingerprint of the shape. The answer, found in 1992, is no: Gordon, Webb and Wolpert built two different shapes that play exactly the same notes [@gordon-webb-wolpert-1992].

That result matters here because it is the same question asked of atoms and molecules. A spectrum, the list of allowed frequencies, says a lot about a system's shape, but not everything.

## What a Chladni plate has in common with all this

A Chladni plate, a drum, a microwave cavity and a quantum box are all the same kind of problem: a wave held in by a boundary, with a short list of allowed shapes. The sand on a plate draws the lines where one of those shapes stays still. A scar is a place where one of them piles up. The numbers that come out are different, because the equations differ in detail: a stiff plate obeys a fourth-order equation, a drum and a microwave cavity a second-order one [@rayleigh-1877]. But the habit of thought is shared, and the tools pass back and forth between the fields.

This is the honest version of "cymatics shows quantum physics". The patterns on a plate are not atoms. They are solutions of a wave equation with a boundary, and so are atoms. Physicists have used that likeness for a century, and they have used it carefully: as a model with stated limits, checked against the real thing.
`,
};
