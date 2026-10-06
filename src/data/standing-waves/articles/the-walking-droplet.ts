import type { Article } from "../types";

export const theWalkingDroplet: Article = {
  slug: "the-walking-droplet",
  title: "The Walking Droplet",
  standfirst:
    "In 2005 a drop of oil bouncing on a shaking bath started to walk, and for the next twenty years it was the closest thing anyone had to a quantum particle you could watch with your own eyes.",
  state: "published",
  box: {
    established:
      "Bouncing drops can walk, steered by their own waves, and show tunnelling-like crossings, orbits of fixed sizes and wave-shaped statistics in a corral.",
    contested: "Whether these analogues tell us anything about how real quantum particles work.",
    notSupported: "That walking droplets show quantum mechanics is 'really' a pilot wave, or that they reproduce double-slit interference.",
  },
  relatedEvents: ["couder-2005", "eddi-2009", "fort-2010", "harris-2013", "perrard-2014", "saenz-2018"],
  body: `
## A drop that does not land

Put a shallow bath of silicone oil on a speaker and shake it up and down. Below a certain strength of shaking the surface stays flat. Drip a small drop of the same oil onto it and something odd happens: the drop does not merge with the bath. A thin film of air is trapped underneath it every time it comes down, and the drop bounces, over and over, as long as the shaking continues [@protiere-2006].

Each bounce pushes a little ring of ripples out across the bath. Turn the shaking up, close to the point where the whole surface would break into ripples by itself, and those rings stop dying away quickly. They linger. In 2005 Yves Couder, Suzie Protière, Emmanuel Fort and Arezki Boudaoud reported what happens next: the drop starts landing on the slope of the ripple from its last bounce, gets a sideways kick, and begins to travel across the bath at a steady speed [@couder-2005]. They called it a walker.

The ripples that steer a walker are Faraday waves, the same kind that form on any shaken liquid: the surface responds at half the shaking frequency [[event:faraday-1831|(Faraday, 1831)]]. The drop is bouncing in step with them, so each landing feeds the wave that steers the next one.

## Why physicists cared

This is a particle carried along by a wave it makes itself. In 1927 Louis de Broglie had proposed exactly that picture for electrons: a real wave guiding a real particle [@bacciagaluppi-valentini-2009]. He dropped it soon afterwards, and David Bohm revived a version of it in 1952 [@bohm-1952a]. The walker looked like a working model of that idea, small enough to film.

Over the following decade, Couder and Fort's group in Paris, and later John Bush's group at MIT, built a run of experiments in which walkers did things that look like textbook quantum behaviour.

**Tunnelling.** Put a submerged barrier in a walker's way, a ridge where the oil is shallower. Usually the walker bounces back. Sometimes it gets across. Eddi and colleagues found that which one happens cannot be predicted for a single walker, and that the chance of crossing falls off exponentially as the barrier gets wider [@eddi-2009]. That is the shape of quantum tunnelling's statistics, produced by a drop in a dish.

**Orbits of fixed sizes.** On a rotating bath a walker is pushed into circles. Fort and colleagues found that when the ripples last long enough to remember the whole orbit, the circles only come in certain sizes [@fort-2010]. They compared it to the quantised orbits of the early atomic model. In 2014 Perrard and colleagues held a magnetised walker in a harmonic trap and found a small family of stable loops, sorted both by size and by how they turn [@perrard-2014].

**Statistics with the shape of a wave.** Harris and colleagues let a single walker wander in a circular pen for a long time and recorded where it went. Its path looks erratic. But the map of where it spent its time traces the pen's own wave pattern [@harris-2013], much as the electron density inside the 1993 "quantum corral" traced its standing waves [@crommie-lutz-eigler-1993]. In 2018 the MIT group added a hydrodynamic version of the "quantum mirage", in which a feature at one focus of an oval pen shows up at the other, empty focus [@saenz-2018; @manoharan-lutz-eigler-2000].

## What makes it work: memory

The key quantity in all of these experiments is how long the waves last. Close to the shaking threshold the ripples from each bounce persist for many bounces, so the wave under the drop carries a record of where the drop has been. The researchers call this path memory [@fort-2010]. With short memory, a walker mostly just walks. With long memory, the wave it steers by is shaped by its own history and by the walls, and the quantum-looking effects appear.

In 2013 Oza, Rosales and Bush wrote down an equation for the walker's motion that treats the drop as a moving source of standing waves and sums up their effect on it [@oza-2013]. It predicts when walking starts and how fast walkers go, and it is the basis of what Bush named pilot-wave hydrodynamics [@bush-2015]. Most of the field's later work, including work on how a walker's energy is shared out [@durey-bush-2025], builds on that model.

## What it is, and what it is not

A walker is a classical object. Every part of it obeys ordinary fluid mechanics: there is nothing in the oil that is not in a textbook on fluids. That is exactly why it is interesting. It shows that some behaviour people associate only with quantum mechanics, unpredictable crossings, fixed orbits, wave-shaped statistics, can come out of a particle guided by a wave with memory [@bush-oza-2021].

It does not show that electrons are walkers. Several things separate them, and the review by Bush and Oza is careful about this [@bush-oza-2021]:

- The walker's wave sits in ordinary space, on the surface of the bath. The guiding wave in Bohm's theory, for more than one particle, lives in a much larger mathematical space of all the particles' positions at once, 'unlike the waves in any pool of vibrating fluid' [@sep-bohmian-mechanics].
- Bell's theorem says any theory of hidden steering must be non-local [@bell-1964]. A walker's wave travels at a finite speed across the bath.
- The most famous claimed analogue, the double slit, did not survive careful repeats. That story has its own article.

Researchers in the field generally describe their results as *analogues*: classical systems that share some of the mathematics and the statistics, which can sharpen questions about the quantum case without answering them. Some argue the analogues may point toward a different reading of quantum theory; others think the gap is too wide. That argument is open. What is not open is the list of experiments above, which have been published, examined and built on.

## Why it still matters

New results keep coming. In 2025 the MIT group sent walkers across a standing ripple pattern and saw them scatter into preferred angles, a fluid echo of how a standing light wave can diffract electrons [@primkulov-2025-kapitza-dirac]. Other recent work is theoretical or not yet reviewed, and this site marks it that way on the [[event:kapitza-dirac-2025|timeline]].

The walking droplet is the one place where the old intuition, that quantum physics looks like vibration, is tested in a laboratory and written up where other scientists can check it. Where it succeeds and where it fails are both on the record.
`,
};
