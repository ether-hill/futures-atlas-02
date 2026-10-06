import type { Article } from "../types";

export const sameMathDifferentWorlds: Article = {
  slug: "same-math-different-worlds",
  title: "Same Maths, Different Worlds",
  standfirst:
    "A ringing plate and an atom both have a short list of allowed shapes, and for the same reason: each is a wave held in by something.",
  state: "published",
  box: {
    established:
      "Plate patterns and atomic states are both solutions of wave equations with boundary conditions, and in both the boundary is what makes only certain shapes allowed.",
    contested: "How far the likeness can be pushed before it misleads; physicists use it as a teaching tool and a lab model, with limits.",
    notSupported: "That a plate pattern is a picture of an atom, or that the shared maths means a shared physics.",
  },
  relatedEvents: ["chladni-1787", "germain-1816", "debroglie-1924", "schrodinger-1926", "kac-1966"],
  body: `
## Why only some shapes

Pluck a guitar string. It does not wobble in any old way. It vibrates in a set of shapes: one big arc, or two half-arcs with a still point in the middle, or three, and so on. Each shape has its own pitch. Anything in between does not last.

The reason is the two ends. The string is pinned at both, so whatever wave it carries must be zero there. Only waves that fit a whole number of half-wavelengths between the pins survive [@hyperphysics-standing-waves]. That is the whole trick: **a wave with a boundary has a short list of allowed shapes**. Physicists call them modes, and the act of being restricted to a list is called quantisation.

## Plates: the same idea in two dimensions

A metal plate is a string spread out into a sheet. Bow its edge and it rings in one of its modes, with lines across it that stay still while the parts on either side swing in opposite directions. In 1787 Ernst Chladni made those lines visible by sprinkling sand on the plate: the sand is thrown off the moving parts and comes to rest on the still lines [@chladni-1787]. Every figure he drew is one mode of the plate. The still lines are called nodal lines.

The shape of the plate decides the list. A square plate has one set of figures, a round plate another. Working out that list mathematically turned out to be hard. After Chladni showed his figures in Paris, the French Institut set a prize for the theory; Sophie Germain won it in 1816 with a theory that was judged imperfect [@oconnor-robertson-germain; @bucciarelli-dworsky-1980], and Gustav Kirchhoff published a fuller theory of the elastic plate in 1850 [@kirchhoff-1850]. A plate is stiff, so its equation is more complicated than a string's, but the principle is the same: the edges set the rules, and the rules allow only certain shapes [@rayleigh-1877].

The computed figures in this project's [gallery](/standing-waves/gallery) are drawn from those modes, and each one says what approximation it uses.

## Atoms: the same idea, again

In 1924 Louis de Broglie proposed that electrons behave as waves [@debroglie-1925]. Two years later Erwin Schrödinger wrote down the wave equation they obey, and showed that the allowed states of an atom come out of it the same way a string's notes do: as the solutions that satisfy the equation's conditions, and only those [@schrodinger-1926]. He called his paper *Quantisation as an Eigenvalue Problem*, which is a mathematician's way of saying "the list of allowed shapes".

For a particle trapped in a box, the parallel with a string is exact: the wave must vanish at the walls, so only certain wavelengths fit, so only certain energies are allowed [@hyperphysics-particle-box]. For the hydrogen atom, the allowed states are labelled by three whole numbers, and each has its own pattern of places where the wave is zero, its nodes [@hyperphysics-hydrogen].

## The signature picture

Put the two side by side. A round plate has modes with some number of straight nodal lines through the centre and some number of nodal rings. A slice through a hydrogen state has some number of nodal lines through the nucleus and some number of nodal rings. The counting matches: for every plate mode there is an atomic state with the same count of each. The [Mode ↔ Orbital](/standing-waves/gallery) slider on this site steps through them together.

## Where the parallel stops

The counting matches. The spacing does not, and the reason is the most important thing on this page.

A plate is held in by a hard edge, a wall the wave cannot pass. An electron in an atom has no wall at all. It is held in by the pull of the nucleus, which gets weaker the further out you go. So the atom's rings spread out toward the edge, while the plate's are packed more evenly. Same kind of maths, different confinement, different numbers.

And the differences go deeper than spacing:

- **What is waving.** A plate's wave is metal moving up and down. An electron's wave is not a motion of anything you could see. What it tells you is where the electron is likely to be found when you look [@hyperphysics-hydrogen].
- **What keeps it going.** A plate rings only while you bow it, and dies away when you stop. An atom's states are stable with nothing driving them at all.
- **Hearing the shape.** Even the list of allowed frequencies does not fully pin down the shape that made it. Two differently shaped drums can play exactly the same notes [@kac-1966; @gordon-webb-wolpert-1992].

So a Chladni figure is not a picture of an atom, and an atom is not a tiny vibrating plate. What they share is a structure: a wave, a boundary, and a short list of allowed shapes. That is a real and deep connection, and it is the honest core of every claim that cymatics "shows" quantum physics. The rest of this project is about what happens when people push it further, carefully [[event:couder-2005|(the walking droplets)]] or not [[event:cymascope-dolphin-2016|(the claims)]].
`,
};
