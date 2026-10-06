import type { Article } from "../types";

export const faradayWaves: Article = {
  slug: "faraday-waves",
  title: "Faraday Waves: Where Cymatics Meets the Lab",
  standfirst:
    "Shake a dish of water up and down and its surface breaks into still, geometric ripples. Faraday described them in 1831, and they are the physics behind most 'cymatics' images.",
  state: "published",
  box: {
    established:
      "A shaken liquid ripples at half the shaking frequency, and the dish's size and shape decide which pattern forms. This has been measured and modelled for decades.",
    contested:
      "Exactly which pattern wins when several are possible: it depends on depth, viscosity, edge conditions and how the shaking is started.",
    notSupported: "That the patterns encode hidden information about the sound, the water or the person making the sound.",
  },
  relatedEvents: ["faraday-1831", "couder-2005"],
  body: `
## Half the note

In 1831 Michael Faraday published a long paper on the patterns formed by particles and liquids on vibrating surfaces [@faraday-1831]. Among his observations: when a layer of liquid is shaken up and down, its surface does not simply bob with the shaking. Past a certain strength it breaks into a lattice of standing ripples, and those ripples rise and fall at *half* the frequency of the shaking.

That halving is the signature of what physicists now call a parametric instability. The liquid is not being pushed sideways at all. Shaking it vertically changes the effective gravity it feels, up and down, twice per ripple cycle, and that rhythm pumps energy into waves at half the drive frequency. A child on a swing who stands and squats twice per swing is doing the same thing.

These ripples are Faraday waves. They are the same waves that steer a walking droplet [[event:couder-2005|(2005)]], and they are what most modern "cymatics" photographs of water show.

## What picks the pattern

Two things decide what you see.

**The wavelength is set by the liquid.** For a given frequency, a surface wave on water has one wavelength, fixed by gravity, surface tension and the depth of the water. At the frequencies used in cymatics demonstrations, tens to a couple of hundred hertz, the wavelength is a few millimetres and surface tension matters as much as gravity [@douady-1990].

**The shape is set by the container.** A wave of that wavelength has to fit the dish. In a large tray, far from the walls, the liquid can pick stripes, squares or hexagons, the simplest ways of filling a flat surface with one wavelength; which one wins depends on viscosity, depth and forcing, and was the subject of careful experiments from the late 1980s [@douady-1990]. In a small round dish the walls dominate, and the pattern is one of the dish's own modes: a set of rings and spokes, like the modes of a drum [@shao-2021].

That is why a small change in frequency can make one figure snap into a quite different one. The wavelength shifts a little, and a different mode of the dish becomes the best fit.

## Measured, not just photographed

The patterns in small dishes have been measured systematically. Merlin and Rupert Sheldrake photographed water in a 24.25 mm cell across 50 to 200 Hz and recorded how amplitude, frequency, depth and temperature changed the pattern and how long it took to form [@sheldrake-2017]. Shao and colleagues at Clemson measured the first fifty resonant modes of water in a cylinder whose water's edge was pinned to the rim, and predicted their frequencies with a standard calculation, finding excellent agreement [@shao-2021]. One finding from both lines of work matters for anyone looking at these images: whether the water's edge slides along the wall or sticks to it changes which mode appears at a given frequency.

The [simulator](/standing-waves/simulator) on this site uses exactly this physics: it computes the wavelength from the water's properties and depth, lists the dish's modes, and shows the one nearest half the drive frequency. Its choices were checked against those two sets of measurements.

## Where this meets quantum physics, and where it doesn't

A small dish of water has a short list of allowed patterns because it has a wall. That is the same reason an electron in an atom has a short list of allowed states: it is a wave that is held in [[event:schrodinger-1926|(1926)]]. The maths of "which shapes fit" is shared, and it is the subject of the first article in this series.

The physics is not shared. A Faraday wave is a ripple on a real surface driven by real shaking, and it needs a constant supply of energy to exist; stop the speaker and it dies away. An atom's states need no driving at all. And a Faraday pattern is a property of the dish and the liquid, not of the sound in any deeper sense: the same note gives a different figure in a different dish, or the same dish with a little more water.

So when a cymatics image is described as making sound "visible", the accurate version is narrower: it makes visible which mode of that particular container a given frequency selects. That is a real and beautiful thing to see. It is not a picture of the note itself, and it is not a picture of matter.
`,
};
