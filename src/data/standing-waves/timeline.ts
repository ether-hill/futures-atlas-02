import type { TimelineEvent } from "./types";

/**
 * The chronology. Every entry was checked against its sources before it went
 * in, and anything that could not be checked was cut rather than guessed:
 * the brief's "Stern–Gerlach analog" (no such paper exists), and the
 * folklore that the 1927 Solvay conference "rejected" the pilot wave (the
 * conference settled nothing; de Broglie dropped it himself, soon after).
 *
 * `finding` is one sentence a 12-year-old can follow. `detail` is the
 * technical version. Both say only what the cited sources say.
 */
export const EVENTS: TimelineEvent[] = [
  // ------------------------------------------------------------ CYMATICS + WAVE PHYSICS
  {
    id: "hooke-1680",
    year: 1680,
    dateLabel: "8 July 1680 (reported)",
    lane: "cymatics",
    title: "Hooke watches flour move on a vibrating surface",
    people: ["hooke"],
    finding:
      "Robert Hooke sprinkled flour on a vibrating surface to watch it shake. A century before Chladni, the trick was already in the air.",
    detail:
      "Wheatstone (1833) records that Hooke 'had proposed to observe the vibrations of a bell by strewing flour upon it'. Hooke's diary for 8 July 1680 is reported to describe flour on a glass plate bowed with a violin bow; that entry is cited by secondary histories, not yet checked here against the published diary, and one of them (APS News, 2017) gives the same date but describes sand on a metal plate. Hooke saw the flour move; the symmetric figures are Chladni's discovery.",
    status: "historical",
    sourceIds: ["wheatstone-1833", "mcveigh-2000", "aps-news-2017-hooke", "robinson-adams-hooke-diary"],
  },
  {
    id: "chladni-1787",
    year: 1787,
    lane: "cymatics",
    title: "Chladni publishes the sand figures",
    people: ["chladni"],
    finding:
      "Ernst Chladni bowed metal plates covered in sand and drew the patterns the sand made: lines where the plate stays still while the rest shakes.",
    detail:
      "Entdeckungen über die Theorie des Klanges (Leipzig, 1787) catalogues the nodal figures of square and round plates in engraved tables. Wheatstone (1833) credits Chladni with 'the sole merit' of discovering the symmetrical figures. They are nodal lines: the plate's standing-wave modes made visible.",
    status: "historical",
    sourceIds: ["chladni-1787", "wheatstone-1833"],
    mediaId: "chladni-1787-tab-8",
    relatedArticle: "same-math-different-worlds",
  },
  {
    id: "germain-1816",
    year: 1816,
    dateLabel: "1808–1816",
    lane: "wave-physics",
    title: "A prize for the maths of the plate; Germain wins",
    people: ["germain", "chladni"],
    finding:
      "After Chladni showed his figures in Paris, the French Academy offered a prize for the maths behind them. Sophie Germain, self-taught, won it on her third try.",
    detail:
      "Chladni demonstrated in Paris in 1808 and the Institut set a prize for a mathematical theory of vibrating elastic plates (the announcement is dated 1809 in one source, 1811 in another). Germain was the sole entrant in 1811, received an honourable mention in 1813, and was awarded the prize in January 1816. Her theory was judged imperfect; a complete plate theory came later.",
    status: "historical",
    sourceIds: ["oconnor-robertson-germain", "holmes-2023-germain", "bucciarelli-dworsky-1980"],
  },
  {
    id: "faraday-1831",
    year: 1831,
    dateLabel: "Read 12 May 1831",
    lane: "wave-physics",
    title: "Faraday: shaken liquids ripple, and light dust goes the other way",
    people: ["faraday"],
    finding:
      "Michael Faraday found that very light powder gathers where a plate shakes most, not least, and that liquid on a shaking surface breaks into ripples.",
    detail:
      "Heavy grains settle on Chladni's nodal lines, but light powders such as lycopodium gather at the places of greatest vibration, carried by air currents; Faraday showed it with card obstacles and in a partial vacuum. The same paper describes 'crispations' on liquids over vibrating surfaces: the standing ripples now called Faraday waves.",
    status: "historical",
    sourceIds: ["faraday-1831"],
    mediaId: "faraday-1831-crispations-fig-14",
    relatedArticle: "faraday-waves",
  },
  {
    id: "kirchhoff-1850",
    year: 1850,
    lane: "wave-physics",
    title: "Kirchhoff's theory of the elastic plate",
    people: [],
    finding: "Gustav Kirchhoff published a mathematical theory of how a thin plate bends and vibrates.",
    detail:
      "Über das Gleichgewicht und die Bewegung einer elastischen Scheibe (J. reine angew. Math. 40, 1850) gives a theory of the equilibrium and motion of an elastic plate. Standard histories credit it with the free-edge conditions missing from earlier work; that attribution is not yet checked here against a secondary source.",
    status: "historical",
    sourceIds: ["kirchhoff-1850"],
  },
  {
    id: "rayleigh-1877",
    year: 1877,
    dateLabel: "1877–1878",
    lane: "wave-physics",
    title: "Rayleigh's Theory of Sound",
    people: [],
    finding: "Lord Rayleigh wrote the book that put the physics of vibrating strings, plates and air into one place.",
    detail: "The Theory of Sound appeared in two volumes (Macmillan, 1877 and 1878) and covers the vibrations of strings, bars, membranes and plates.",
    status: "historical",
    sourceIds: ["rayleigh-1877", "rayleigh-1878"],
  },
  {
    id: "watts-hughes-1885",
    year: 1885,
    dateLabel: "1885; published 1886 and 1891",
    lane: "cymatics",
    title: "Watts Hughes sings figures into being",
    people: ["watts-hughes"],
    finding:
      "A Welsh singer sang into a tube covered by a thin stretched skin, and the patterns her voice made on it looked like flowers and ferns.",
    detail:
      "By her own account Margaret Watts Hughes first obtained voice-figures in 1885 with an instrument she called the eidophone: an elastic membrane over a receiver, sung into through a tube. She published them in the Proceedings of the Musical Association (1886), the Century Magazine (1891) and a book (2nd ed., 1904).",
    status: "historical",
    sourceIds: ["watts-hughes-1886", "watts-hughes-1891-century", "watts-hughes-1904", "griffith-1959-dwb", "ruhse-2026-artnodes"],
    mediaId: "watts-hughes-1891-daisy",
  },
  {
    id: "waller-1961",
    year: 1961,
    dateLabel: "1961 (posthumous)",
    lane: "cymatics",
    title: "Waller's Chladni Figures",
    people: ["waller"],
    finding: "A physicist who spent decades on plate patterns left a book explaining their symmetry, published after she died.",
    detail:
      "Mary Désirée Waller wrote more than thirty papers on Chladni figures and free plates. Chladni Figures: A Study in Symmetry (G. Bell, 1961) appeared after her death in December 1959.",
    status: "historical",
    sourceIds: ["waller-1961", "aim25-waller", "waller-1957-ajp"],
  },
  {
    id: "kac-1966",
    year: 1966,
    lane: "wave-physics",
    title: "Can one hear the shape of a drum?",
    people: [],
    finding: "A mathematician asked whether the notes a drum can play tell you its exact shape. In 1992 the answer turned out to be no.",
    detail:
      "Kac's 1966 paper asked whether the spectrum of a membrane determines its shape. Gordon, Webb and Wolpert (1992) built two different plane shapes with identical spectra. The same question applies to any wave system with a boundary, atoms included.",
    status: "established",
    sourceIds: ["kac-1966", "gordon-webb-wolpert-1992"],
    relatedArticle: "scars-and-billiards",
  },
  {
    id: "jenny-1967",
    year: 1967,
    dateLabel: "1967 and 1972",
    lane: "cymatics",
    title: "Jenny names the field Kymatik",
    people: ["jenny"],
    finding: "A Swiss doctor photographed sand, liquids and pastes on vibrating plates, and called the study 'cymatics'.",
    detail:
      "Hans Jenny's Kymatik appeared in two volumes (Basilius Presse, Basel, 1967 and 1972), the first with the parallel title 'Cymatics'. The Swiss historical lexicon calls him the founder of Kymatik and records that he worked as an anthroposophist in the tradition of Goethe's method, not as a physicist.",
    status: "historical",
    sourceIds: ["jenny-1967", "jenny-1972", "bartschi-hls-jenny"],
    relatedArticle: "vibration-isnt-magic",
  },
  {
    id: "lauterwasser-2006",
    year: 2006,
    lane: "cymatics",
    title: "Water Sound Images",
    people: ["lauterwasser"],
    finding: "A photographer published pictures of patterns that music makes on the surface of water.",
    detail:
      "Alexander Lauterwasser's Water Sound Images (MACROmedia, 2006; from the German Wasser Klang Bilder) photographs sound-driven patterns on water, extending Chladni's and Jenny's work with music as the source. Its reception has been in arts reviews, not physics journals.",
    status: "historical",
    sourceIds: ["lauterwasser-2006", "harle-2007-leonardo"],
  },
  {
    id: "cymascope-dolphin-2016",
    year: 2016,
    dateLabel: "Dec 2015 (press); 2016 (paper)",
    lane: "cymatics",
    title: "'What the dolphin saw'",
    people: ["reid"],
    finding:
      "A team said patterns made by dolphin clicks in water show what a dolphin 'sees'. Scientists and journalists pointed out that nothing in the pictures could show that.",
    detail:
      "Kassewitz, Reid and colleagues played recorded dolphin echolocation into the CymaScope and reported images resembling the objects echolocated, publicised in December 2015 before a paper. Reporting noted the claim was unpublished and could not show dolphin perception; a linguist called the output 'pretty pictures, no scientific results'. The paper appeared in 2016 in a journal from OMICS, against which the US FTC later won a judgment for deceptive claims about peer review. No independent replication has been found.",
    status: "unsupported-claim",
    sourceIds: ["kassewitz-2016", "cymascope-oceanography", "vezina-2015-mittr", "poser-2016-languagelog", "ftc-v-omics-2019"],
    relatedArticle: "vibration-isnt-magic",
  },

  // ------------------------------------------------------------ QUANTUM
  {
    id: "debroglie-1924",
    year: 1924,
    lane: "quantum",
    title: "De Broglie: matter has a wavelength",
    people: ["de-broglie"],
    finding: "A young physicist proposed that electrons, which everyone thought of as tiny balls, also behave like waves.",
    detail:
      "Louis de Broglie's Paris doctoral thesis, Recherches sur la théorie des quanta (defended 1924, published in Annales de Physique in 1925), assigned a wavelength to every moving particle. He received the 1929 Nobel Prize in Physics for the discovery of the wave nature of electrons.",
    status: "historical",
    sourceIds: ["debroglie-1925", "nobel-physics-1929"],
    relatedArticle: "same-math-different-worlds",
  },
  {
    id: "schrodinger-1926",
    year: 1926,
    lane: "quantum",
    title: "Schrödinger: quantisation as a wave problem",
    people: [],
    finding:
      "Schrödinger wrote down a wave equation for the electron, and its allowed shapes turned out to be the atom's allowed states, just as a plate has allowed patterns.",
    detail:
      "In Quantisierung als Eigenwertproblem, quantisation becomes an eigenvalue problem: only certain solutions of a wave equation satisfy its conditions, and those give the discrete energies. Hydrogen's states are the separable stationary solutions, labelled by three quantum numbers. For a confined particle it is the condition at the walls that makes the energies discrete, as it is for the modes of a string.",
    status: "historical",
    sourceIds: ["schrodinger-1926", "hyperphysics-hydrogen", "hyperphysics-particle-box"],
    relatedArticle: "same-math-different-worlds",
  },
  {
    id: "solvay-1927",
    year: 1927,
    dateLabel: "October 1927",
    lane: "quantum",
    title: "De Broglie presents a pilot wave, then drops it",
    people: ["de-broglie"],
    finding:
      "At a famous meeting in Brussels, de Broglie suggested a real wave that steers each particle. He gave the idea up soon after.",
    detail:
      "At the Fifth Solvay Conference de Broglie presented his pilot-wave theory and it was discussed at length. The common story that the conference rejected it is folklore: the conference reached no consensus on interpretation. What the sources support is that de Broglie (and Born) abandoned the approach very quickly afterwards.",
    status: "historical",
    sourceIds: ["bacciagaluppi-valentini-2009", "sep-bohmian-mechanics"],
  },
  {
    id: "bohm-1952",
    year: 1952,
    lane: "quantum",
    title: "Bohm revives the pilot wave",
    people: ["bohm"],
    finding:
      "David Bohm showed that a version of the steering-wave idea gives exactly the same predictions as standard quantum mechanics.",
    detail:
      "Bohm's two Physical Review papers rediscovered and extended de Broglie's theory into a deterministic interpretation that reproduces non-relativistic quantum mechanics. The guiding wave is not in ordinary space: for several particles it lives in their joint configuration space.",
    status: "established",
    sourceIds: ["bohm-1952a", "bohm-1952b", "sep-bohmian-mechanics"],
  },
  {
    id: "bell-1964",
    year: 1964,
    lane: "quantum",
    title: "Bell: any such theory must be non-local",
    people: [],
    finding:
      "John Bell proved that any theory where hidden details steer particles must let distant things affect each other instantly.",
    detail:
      "Bell's theorem grew out of his study of Bohmian mechanics. It shows that any hidden-variables account reproducing quantum predictions must be non-local, as Bohm's is. The guiding wave lives in configuration space, 'unlike the waves in any pool of vibrating fluid' (Goldstein), which is the deepest limit on any droplet analogy.",
    status: "established",
    sourceIds: ["bell-1964", "sep-bohmian-mechanics"],
    relatedArticle: "where-the-analogy-breaks",
  },
  {
    id: "heller-1984",
    year: 1984,
    lane: "quantum",
    title: "Heller: scars of periodic orbits",
    people: [],
    finding:
      "Even in a chaotic box, some quantum wave patterns pile up along the paths a bouncing ball would repeat, like scars.",
    detail:
      "Heller showed that bound-state eigenfunctions of classically chaotic systems can concentrate along unstable periodic orbits of the classical motion, which he called scars.",
    status: "established",
    sourceIds: ["heller-1984"],
    relatedArticle: "scars-and-billiards",
  },
  {
    id: "stockmann-stein-1990",
    year: 1990,
    lane: "wave-physics",
    title: "Microwave billiards stand in for quantum ones",
    people: [],
    finding: "Flat metal boxes filled with microwaves let physicists study the wave patterns of quantum chaos on a lab bench.",
    detail:
      "Stöckmann and Stein measured microwave absorption in billiard-shaped cavities; in a thin enough cavity the microwave equation has the same form as the two-dimensional Schrödinger equation. Sridhar (1991) imaged scarred eigenfunctions directly in chaotic cavities.",
    status: "established",
    sourceIds: ["stockmann-stein-1990", "sridhar-1991"],
    relatedArticle: "scars-and-billiards",
  },
  {
    id: "corral-1993",
    year: 1993,
    lane: "quantum",
    title: "The quantum corral",
    people: [],
    finding: "Scientists built a ring of 48 atoms on copper and photographed electron waves standing inside it.",
    detail:
      "Crommie, Lutz and Eigler confined surface-state electrons inside a ring of iron atoms on Cu(111) and imaged the standing-wave density with a scanning tunnelling microscope. The circular corral is what later walking-droplet corral experiments set out to mimic.",
    status: "established",
    sourceIds: ["crommie-lutz-eigler-1993"],
  },
  {
    id: "tonomura-1989",
    year: 1989,
    lane: "quantum",
    title: "One electron at a time, a pattern builds",
    people: [],
    finding:
      "Send electrons one by one past two paths and each lands as a single dot, but thousands of dots build up stripes that only waves make.",
    detail:
      "Tonomura and colleagues recorded single-electron arrivals in an electron biprism interferometer (two paths, not two slits) and showed the interference pattern accumulating dot by dot. Bach et al. (2013) did it with a real, controllable double slit. This is the result the droplets were later claimed to copy.",
    status: "established",
    sourceIds: ["tonomura-1989", "bach-2013"],
    relatedArticle: "where-the-analogy-breaks",
  },
  {
    id: "mirage-2000",
    year: 2000,
    lane: "quantum",
    title: "The quantum mirage",
    people: [],
    finding: "An atom placed at one focus of an oval corral made a ghost image of itself appear at the other, empty focus.",
    detail:
      "Manoharan, Lutz and Eigler placed a magnetic atom at one focus of an elliptical corral and measured its electronic signature projected to the other focus. Sáenz et al. reproduced a hydrodynamic version in 2018.",
    status: "established",
    sourceIds: ["manoharan-lutz-eigler-2000"],
  },

  // ------------------------------------------------------------ PILOT-WAVE HYDRODYNAMICS
  {
    id: "couder-2005",
    year: 2005,
    lane: "pilot-wave",
    title: "Droplets learn to walk",
    people: ["couder", "fort"],
    finding:
      "A drop of oil bouncing on a shaking bath of the same oil can start to travel across it, pushed along by the ripples it makes itself.",
    detail:
      "Couder, Protière, Fort and Boudaoud showed that above a threshold of forcing, drops bouncing on a vertically vibrated bath begin to 'walk' at constant speed, propelled by their own Faraday wave field. Two walkers interact through their waves and can orbit each other.",
    status: "established",
    sourceIds: ["couder-2005", "protiere-2006"],
    relatedArticle: "the-walking-droplet",
  },
  {
    id: "couder-fort-2006",
    year: 2006,
    lane: "pilot-wave",
    title: "Droplet 'interference' claimed",
    people: ["couder", "fort"],
    finding:
      "Droplets sent through one or two slits seemed to land in stripes, like electrons do, and the result made headlines.",
    detail:
      "Couder and Fort sent walkers through single and double slits. Each deflection looked random, but histograms over many walkers resembled diffraction and interference patterns. The double-slit histogram rested on 75 trajectories. Later, more controlled repeats did not reproduce it.",
    status: "contested",
    sourceIds: ["couder-fort-2006", "bush-oza-2021"],
    relatedArticle: "where-the-analogy-breaks",
    thread: "double-slit",
    threadRole: "claim",
  },
  {
    id: "eddi-2009",
    year: 2009,
    lane: "pilot-wave",
    title: "Unpredictable tunnelling",
    people: ["couder", "fort"],
    finding: "Whether a walking drop gets across an underwater barrier or bounces back cannot be predicted, only its odds.",
    detail:
      "Eddi, Fort, Moisy and Couder found that crossing a submerged barrier was unpredictable for an individual walker, and that the probability of crossing fell off exponentially with barrier width, an analogue of quantum tunnelling.",
    status: "established",
    sourceIds: ["eddi-2009"],
    relatedArticle: "the-walking-droplet",
  },
  {
    id: "fort-2010",
    year: 2010,
    lane: "pilot-wave",
    title: "Orbits come in fixed sizes",
    people: ["couder", "fort"],
    finding: "On a spinning bath, walking drops only settle into circles of certain sizes, a bit like the energy levels of an atom.",
    detail:
      "In a rotating frame, Fort et al. found walkers' orbits quantised into discrete radii, but only at long path memory, when the wave field records the whole orbit. They interpreted it as an analogue of quantised angular momentum.",
    status: "established",
    sourceIds: ["fort-2010"],
    relatedArticle: "the-walking-droplet",
  },
  {
    id: "harris-2013",
    year: 2013,
    lane: "pilot-wave",
    title: "Wave-like statistics in a corral",
    people: ["bush", "couder", "fort"],
    finding:
      "A single drop wandering in a round pen visits some spots more than others, and its favourite spots trace out a wave pattern.",
    detail:
      "Harris et al. tracked a walker in a circular corral for long times. Its position histogram followed the corral's Faraday wave mode, a hydrodynamic analogue of the electron density in a quantum corral.",
    status: "established",
    sourceIds: ["harris-2013"],
    relatedArticle: "the-walking-droplet",
  },
  {
    id: "oza-2013",
    year: 2013,
    lane: "pilot-wave",
    title: "A trajectory equation",
    people: ["bush"],
    finding: "Mathematicians wrote down an equation that predicts how a walking drop moves, from the waves it has left behind.",
    detail:
      "Oza, Rosales and Bush derived an integro-differential equation for the walker's horizontal motion, treating the drop as a continuous moving source of standing waves. It predicts the onset of walking and walking speeds in good agreement with experiment, and is the basis of 'hydrodynamic pilot-wave theory'.",
    status: "established",
    sourceIds: ["oza-2013"],
  },
  {
    id: "perrard-2014",
    year: 2014,
    lane: "pilot-wave",
    title: "Double quantisation in a trap",
    people: ["couder", "fort"],
    finding: "Held by a magnet, a walking drop only follows a few allowed loops, sorted by both size and spin.",
    detail:
      "Perrard et al. confined a walker in a harmonic potential (a magnetised drop in a magnetic field) and found a discrete set of stable orbits, circles, ovals, lemniscates and trefoils, quantised in both extent and angular momentum and tied to self-organised modes of the wave field.",
    status: "established",
    sourceIds: ["perrard-2014"],
    relatedArticle: "the-walking-droplet",
  },
  {
    id: "bush-2015",
    year: 2015,
    lane: "pilot-wave",
    title: "Pilot-wave hydrodynamics, reviewed",
    people: ["bush"],
    finding: "The field got its name and its first big review.",
    detail:
      "Bush's Annual Review of Fluid Mechanics article collected a decade of walker experiments and the theory around them under the name pilot-wave hydrodynamics.",
    status: "historical",
    sourceIds: ["bush-2015"],
  },
  {
    id: "andersen-2015",
    year: 2015,
    lane: "pilot-wave",
    title: "Copenhagen repeat: no interference",
    people: ["bohr"],
    finding: "A team in Denmark rebuilt the double-slit experiment with more care, and the stripes did not appear.",
    detail:
      "Andersen et al. ran their own walker double slit. Their measurements, notably long and variable slit-passage times, 'cast strong doubt' on the reported interference. They also argued that walker statistics must differ in principle from quantum ones, because the droplet always goes through one slit.",
    status: "not-replicated",
    sourceIds: ["andersen-2015", "bush-oza-2021"],
    relatedArticle: "where-the-analogy-breaks",
    thread: "double-slit",
    threadRole: "test",
  },
  {
    id: "batelaan-2016",
    year: 2016,
    lane: "pilot-wave",
    title: "Nebraska: too little data to say",
    people: [],
    finding: "A second group's first tries came out differently from the original, but they said there was not enough data to conclude anything.",
    detail:
      "Batelaan's group built a Couder-style setup. One double-slit run gave a two-lobed distribution 'in contrast with the results reported by Couder'; one single-slit run showed diffraction-like peaks. The authors wrote that they 'cannot draw general conclusions due to the limited amount of data available'.",
    status: "contested",
    sourceIds: ["batelaan-2016"],
    relatedArticle: "where-the-analogy-breaks",
  },
  {
    id: "pucci-2018",
    year: 2018,
    lane: "pilot-wave",
    title: "MIT repeat: not diffraction",
    people: ["bush"],
    finding:
      "MIT found some stripe-like peaks, but they did not change with slit width the way real wave diffraction must.",
    detail:
      "Pucci et al. found the behaviour depends strongly on forcing and is dominated by a wall effect. Peaks like Couder and Fort's appear in some regimes, but their number does not depend on slit width as Fraunhofer diffraction requires. In the double slit the drop is nonetheless influenced by both slits through its extended wave.",
    status: "not-replicated",
    sourceIds: ["pucci-2018", "bush-oza-2021"],
    relatedArticle: "where-the-analogy-breaks",
    thread: "double-slit",
    threadRole: "test",
  },
  {
    id: "wolchover-2018",
    year: 2018,
    dateLabel: "11 October 2018",
    lane: "pilot-wave",
    title: "The verdict in the press",
    people: [],
    finding: "A science magazine reported that the repeats had not found the droplet stripes.",
    detail:
      "Quanta Magazine reported the replications under the headline 'Famous Experiment Dooms Alternative to Quantum Weirdness'. The headline is the magazine's framing: the papers themselves are narrower, and walker research continued.",
    status: "historical",
    sourceIds: ["wolchover-2018"],
    relatedArticle: "where-the-analogy-breaks",
  },
  {
    id: "saenz-2018",
    year: 2018,
    lane: "pilot-wave",
    title: "A hydrodynamic quantum mirage",
    people: ["bush"],
    finding: "In an oval pen with a dip at one focus, a walking drop spent extra time at the other, empty focus.",
    detail:
      "Sáenz, Cristea-Platon and Bush put a submerged well at one focus of an elliptical corral. The walker's position histogram showed a projected peak at the empty focus, analogous to the 2000 quantum mirage.",
    status: "established",
    sourceIds: ["saenz-2018"],
    relatedArticle: "the-walking-droplet",
  },
  {
    id: "ellegaard-levinsen-2020",
    year: 2020,
    lane: "pilot-wave",
    title: "The extra effect is an echo from the other slit",
    people: [],
    finding:
      "The Danish team found the droplet's path really is steered by both slits, but by its own wave bouncing back off the slit it did not use, not by quantum interference.",
    detail:
      "Ellegaard and Levinsen scanned the parameters and concluded the original randomness was 'an artifact of lack of control'; all the patterns they saw were causal. The extra double-slit effect came 'solely' from back-scatter of the wave off the outlet of the slit the drop did not pass, shown by blocking that slit's inlet or outlet.",
    status: "established",
    sourceIds: ["ellegaard-levinsen-2020", "bush-oza-2021"],
    relatedArticle: "where-the-analogy-breaks",
    thread: "double-slit",
    threadRole: "result",
  },
  {
    id: "bush-oza-2021",
    year: 2021,
    lane: "pilot-wave",
    title: "Hydrodynamic quantum analogs, reviewed",
    people: ["bush"],
    finding: "The field's main review set out which quantum effects the droplets copy and which they do not.",
    detail:
      "Bush and Oza's review (online December 2020) surveys the analogues and the double-slit dispute, and describes Ellegaard and Levinsen's results as 'largely consistent' with Pucci et al.",
    status: "historical",
    sourceIds: ["bush-oza-2021"],
  },
  {
    id: "frumkin-bush-2023",
    year: 2023,
    lane: "pilot-wave",
    title: "A classical 'bomb tester'",
    people: ["bush"],
    finding:
      "Droplets reproduced the statistics of a famous quantum puzzle, which shows those statistics alone cannot prove anything spooky happened.",
    detail:
      "Frumkin and Bush reproduced the statistics of the Elitzur–Vaidman bomb tester with walking droplets and argue that inferring an interaction-free measurement from those statistics is unwarranted in this classical system.",
    status: "established",
    sourceIds: ["frumkin-bush-2023"],
  },
  {
    id: "bell-model-2024",
    year: 2024,
    lane: "pilot-wave",
    title: "A Bell violation, in a model",
    people: ["bush"],
    finding: "A computer model of two coupled droplets broke a famous quantum test limit, but only in a weak version of the test.",
    detail:
      "Papatryfonos et al. simulated two tunnelling walkers coupled through a shared wave. Under some conditions the model violated Bell's inequality in a static test, where settings are not switched during the run. It is a numerical model, not an experiment, and not a loophole-free test.",
    status: "contested",
    sourceIds: ["papatryfonos-2024-bell"],
    relatedArticle: "where-the-analogy-breaks",
  },
  {
    id: "superradiance-2022",
    year: 2022,
    dateLabel: "2022 (theory); 2023 (experiment)",
    lane: "pilot-wave",
    title: "Hydrodynamic superradiance",
    people: ["bush"],
    finding:
      "Two droplets trapped in neighbouring wells escape faster or slower depending on the distance between them, an echo of how atoms can glow together.",
    detail:
      "Papatryfonos et al. modelled two coupled droplet 'two-level systems' and found tunnelling rates enhanced or suppressed sinusoidally with the length of the coupling cavity, a classical analogue of superradiance. Frumkin et al. (2023) saw the same sinusoidal enhancement experimentally in droplet emission from coupled vibrating cavities; that experiment uses ejected drops, not walkers.",
    status: "established",
    sourceIds: ["papatryfonos-2022-superradiance", "frumkin-2023-superradiant-emission"],
  },
  {
    id: "jerking-points-2026",
    year: 2026,
    dateLabel: "July 2026",
    lane: "pilot-wave",
    title: "One hidden force behind several effects",
    people: [],
    finding:
      "Mathematicians found a tiny force, left over from a droplet's sudden changes of speed, that explains several of its quantum-looking tricks at once.",
    detail:
      "Blitstein, Rosales and Sáenz identify a wave-mediated non-local force arising from path memory and an unusual interference near 'jerking points', where the walker's velocity changes rapidly. Exponentially small but crucial, it accounts for speed oscillations, wave-like statistics in potential wells and non-specular reflections within one framework.",
    status: "established",
    sourceIds: ["blitstein-2026"],
  },
  {
    id: "bell-preprint-2026",
    year: 2026,
    dateLabel: "August 2026",
    lane: "pilot-wave",
    title: "Bell violations in a model, again (preprint)",
    people: ["bush"],
    finding: "A new, not-yet-reviewed computer study says two simulated droplets can break Bell's limit even in a stricter version of the test.",
    detail:
      "An arXiv preprint uses a reduced Lorenz-like model of two walkers and reports CHSH S > 2 persisting in dynamic tests after the subsystems are isolated, which it attributes to the wave being shaped by the measurement settings. A model, not an experiment, and not peer reviewed at the time of writing.",
    status: "contested",
    sourceIds: ["lopez-2026-sync-bell-preprint"],
    relatedArticle: "where-the-analogy-breaks",
  },
  {
    id: "durey-bush-2025",
    year: 2025,
    lane: "pilot-wave",
    title: "Where a walker's energy goes",
    people: ["bush"],
    finding: "Researchers worked out how a walking drop shares its energy between bouncing, waves and motion.",
    detail:
      "Durey and Bush derived how a walker's energy divides between gravitational, wave and kinetic forms, and showed the split depends only on the drop's speed relative to its maximum.",
    status: "established",
    sourceIds: ["durey-bush-2025"],
  },
  {
    id: "kapitza-dirac-2025",
    year: 2025,
    lane: "pilot-wave",
    title: "Droplets diffracted by a standing wave",
    people: ["bush"],
    finding: "Walking drops crossing a still ripple pattern scattered into preferred angles, echoing how light can diffract electrons.",
    detail:
      "Primkulov et al. sent walkers across a standing Faraday wave. In some regimes the deflection angles form a diffraction-like pattern reminiscent of the Kapitza–Dirac effect. Experiments and simulations trace it to non-resonant bouncing effects, studied in a companion paper.",
    status: "established",
    sourceIds: ["primkulov-2025-kapitza-dirac", "primkulov-2025-nonresonant"],
  },
  {
    id: "aharonov-bohm-preprint-2025",
    year: 2025,
    dateLabel: "December 2025",
    lane: "pilot-wave",
    title: "An Aharonov–Bohm analogue (preprint)",
    people: ["bush"],
    finding:
      "A new, not-yet-reviewed paper says a walking drop is nudged by a hidden whirlpool it never touches, through its wave.",
    detail:
      "An arXiv preprint reports a walker circling a shielded vortex whose flow does not reach it, yet whose presence biases the walker's orbital speed via the pilot wave, which the authors liken to an Aharonov–Bohm phase. Not peer reviewed at the time of writing.",
    status: "contested",
    sourceIds: ["rozenman-2025-ab-preprint"],
  },
];
