import type { Article } from "../types";

export const whereTheAnalogyBreaks: Article = {
  slug: "where-the-analogy-breaks",
  title: "Where the Analogy Breaks",
  standfirst:
    "In 2006 walking droplets seemed to pass the most famous test in quantum physics. Three teams tried to repeat it, and what they found is the clearest lesson in this whole project.",
  state: "published",
  box: {
    established:
      "Careful repeats did not reproduce the 2006 droplet interference pattern. The drop is steered by both slits, through its own wave echoing off the slit it did not use.",
    contested:
      "How much of the original result was noise from too few runs, and whether any regime of the experiment gives interference-like statistics.",
    notSupported:
      "That walking droplets reproduce quantum double-slit interference, or that they show quantum mechanics is 'really' classical.",
  },
  relatedEvents: ["tonomura-1989", "couder-fort-2006", "andersen-2015", "batelaan-2016", "pucci-2018", "wolchover-2018", "ellegaard-levinsen-2020"],
  body: `
## The test that matters

The double-slit experiment is the result that every account of quantum physics comes back to. Send electrons one at a time toward a barrier with two openings. Each electron arrives at the screen as a single dot, in a place nobody can predict. But after thousands of them, the dots have built up a pattern of stripes, the kind made when two sets of waves overlap and add up in some places and cancel in others [@tonomura-1989; @bach-2013].

The puzzle is that each electron is detected as one particle, yet the stripes only make sense if something went through both openings. Any picture of quantum physics has to explain that.

## The claim

In 2006 Yves Couder and Emmanuel Fort sent walking droplets through a barrier with one slit, then two [@couder-fort-2006]. Each droplet passed through one slit only, and its exit angle looked random. But the histogram of many exit angles appeared to show the familiar stripes: peaks and gaps like a diffraction pattern for one slit, like an interference pattern for two.

It looked like a working classical version of the quantum result, and of de Broglie's old idea that a particle is guided by a wave [[event:solvay-1927|(1927)]]. The droplet goes through one slit; its wave goes through both. The paper drew wide attention.

It was also thin. The double-slit histogram rested on 75 droplet passes [@bush-oza-2021]. For a pattern of several narrow peaks, that is very few.

## The tests

**Copenhagen, 2015.** A group at the Technical University of Denmark and the Niels Bohr Institute, including Tomas Bohr, built their own version and made it more controlled. They did not see the interference. Their measurements, in particular how long and how variably droplets took to pass through the slits, 'cast strong doubt' on the original result [@andersen-2015]. They also made an argument of principle: because the droplet always goes through one slit, its statistics must differ from the quantum ones, whatever the wave does.

**Nebraska, 2016.** Herman Batelaan's group, who had done a controlled electron double slit [@bach-2013], tried a droplet version. One double-slit run gave a two-lobed pattern unlike Couder's; a single-slit run showed peaks like diffraction. They were explicit that they 'cannot draw general conclusions due to the limited amount of data available' [@batelaan-2016]. It is a preliminary result and this site marks it that way, not as a refutation.

**MIT, 2018.** John Bush's group, the group behind much of the walker theory, ran a long study of single and double slits [@pucci-2018]. They found that what a droplet does depends strongly on how hard the bath is shaken, and that the droplet's interaction with the slit walls dominates. Peaks like the 2006 ones do appear in some settings. But in real diffraction, the number of peaks changes with the width of the slit in a precise way. Theirs did not. So the peaks were not diffraction. They also found that in the double slit, the droplet *is* influenced by both openings, through its spread-out wave.

Quanta Magazine summarised the repeats in October 2018 under the headline "Famous Experiment Dooms Alternative to Quantum Weirdness" [@wolchover-2018]. That headline is the magazine's framing. The papers themselves are narrower: they say this experiment does not show interference.

## The result

The Copenhagen researchers kept going. In 2020 Carsten Ellegaard and Mogens Levinsen scanned the experiment's settings systematically [@ellegaard-levinsen-2020]. Their conclusions:

1. The randomness in the original result was 'an artifact of lack of control'. With the conditions held steady, every pattern they saw had an identifiable cause.
2. There is a genuine extra effect when the second slit is open. It comes 'solely' from the droplet's own wave bouncing back off the exit of the slit the droplet did *not* pass through.
3. They showed this directly: blocking the entrance or exit of the unused slit changes the effect in the way an echo would.

So the droplet does feel both slits, through its wave, just as Pucci and colleagues had found. But the result is an echo steering a particle, not two waves overlapping into stripes. The 2021 review of the field describes the Copenhagen and MIT findings as 'largely consistent' with each other [@bush-oza-2021].

## Why it breaks: the plain version

A walking droplet's wave is a real ripple on a real surface. It spreads at a finite speed, it reflects off walls, and it carries a record of where the drop has been. That is enough to give tunnelling-like crossings and wave-shaped statistics in a pen [[event:harris-2013|(2013)]].

A quantum wave is not like that in three ways, and each one matters here:

- **It is not in ordinary space.** For more than one particle, the quantum wave lives in a mathematical space of all the particles' positions at once, 'unlike the waves in any pool of vibrating fluid' [@sep-bohmian-mechanics].
- **It has no memory.** An electron's interference pattern does not depend on where earlier electrons went; the electrons can be sent so far apart in time that only one is in the apparatus at once [@tonomura-1989]. A walker's wave is its memory.
- **It must be non-local.** Bell's theorem shows any theory in which hidden details steer quantum particles must let distant parts affect each other instantly [@bell-1964]. Ripples on a bath travel at a finite speed. Work on Bell-type tests with droplets so far is in computer models, not experiments, and in weaker versions of the test [@papatryfonos-2024-bell].

## What the story is good for

This is how science is meant to work, and it rarely gets told this cleanly. A striking result was published; other groups tried to repeat it; the repeats were published too; and a mechanism was found that explains what was really going on. Nobody was disgraced. The walker programme carried on, and still produces new analogues [[event:kapitza-dirac-2025|(2025)]].

The lesson for anyone reading about cymatics and quantum physics is this: a vibrating fluid can share a great deal of mathematics with quantum mechanics and still be a different thing. The double slit is where you can see the difference.
`,
};
