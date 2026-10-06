import type { Person } from "./types";

/**
 * Profiles. Factual: what each person did, and where that is recorded.
 * Living people get their work and nothing personal — no birth years where
 * none is published by them or their institution. Disputed claims go in
 * `contested`, with sources on both sides.
 */
export const PEOPLE: Person[] = [
  {
    id: "hooke",
    name: "Robert Hooke",
    years: "1635–1703",
    role: "English natural philosopher; Curator of Experiments to the Royal Society",
    summary:
      "Robert Hooke was one of the most prolific experimenters of the early Royal Society, where he was responsible for devising and showing experiments at its meetings. His place in this story is small but early. Writing in 1833, Charles Wheatstone recorded that Hooke had proposed watching the vibrations of a bell by strewing flour on it, and Hooke's diary for 8 July 1680 is reported to describe flour moving on a glass plate bowed with a violin bow. What Hooke saw was the flour moving, not the symmetric figures: Wheatstone gives the discovery of those to Chladni alone, a century later. No portrait of Hooke made in his lifetime is known to survive; the image here is a modern reconstruction.",
    contributions: [
      "Proposed strewing flour on a vibrating bell to see its motion (reported by Wheatstone, 1833)",
      "Diary entry of 8 July 1680, reported to describe flour on a bowed glass plate",
    ],
    sourceIds: ["gnd-authority-records", "wheatstone-1833", "mcveigh-2000", "robinson-adams-hooke-diary"],
    portraitMediaId: "portrait-hooke-greer-2004",
  },
  {
    id: "chladni",
    name: "Ernst Chladni",
    years: "1756–1827",
    role: "German physicist and musician; founder of the experimental acoustics of plates",
    summary:
      "Ernst Florens Friedrich Chladni was born in Wittenberg and died in Breslau. In Entdeckungen über die Theorie des Klanges (Leipzig, 1787) he showed that a metal plate bowed at its edge throws sand into regular figures, and he catalogued them in engraved tables for square and round plates. The sand collects along nodal lines, where the plate stays still while the parts around it swing in opposite directions; each figure is one of the plate's modes of vibration. He went on to write a general treatise on acoustics (1802), and translated it into French himself (1809). His demonstration in Paris in 1808 led the French Institut to set a prize for a mathematical theory of the vibrating plate.",
    contributions: [
      "Nodal sand figures of vibrating plates, 1787",
      "Die Akustik (1802) and its French translation (1809)",
      "The 1808 Paris demonstration that prompted the plate-theory prize",
    ],
    sourceIds: ["gnd-authority-records", "chladni-1787", "wheatstone-1833", "chladni-2015-treatise", "oconnor-robertson-germain"],
    portraitMediaId: "portrait-chladni-chretien-1809",
  },
  {
    id: "germain",
    name: "Sophie Germain",
    years: "1776–1831",
    role: "French mathematician; theory of elastic surfaces and number theory",
    summary:
      "Sophie Germain was born and died in Paris and was largely self-taught, barred as a woman from formal study. When the French Institut offered a prize for a mathematical theory of vibrating elastic plates, after Chladni's 1808 demonstration, she was the only entrant in 1811, received an honourable mention in 1813, and was awarded the prize in January 1816. Her theory was judged imperfect and the complete theory of the plate came later, but her work is recognised as foundational to the theory of elasticity, and her treatment of curvature is the subject of continuing historical study. In number theory she proved a result on Fermat's Last Theorem now known as Germain's theorem, and corresponded with Gauss under the name 'M. LeBlanc'.",
    contributions: [
      "Prize of the Institut for the theory of elastic surfaces, 1816",
      "Germain's theorem on Fermat's Last Theorem",
    ],
    contested:
      "Not her claims but the record: sources disagree on when the plate prize was announced (1809 in Holmes 2023, 1811 in older accounts). The award in January 1816 is not in dispute.",
    sourceIds: ["oconnor-robertson-germain", "holmes-2023-germain", "bucciarelli-dworsky-1980", "dahan-dalmedico-1987"],
    portraitMediaId: "portrait-germain-chegaray",
  },
  {
    id: "faraday",
    name: "Michael Faraday",
    years: "1791–1867",
    role: "English experimental physicist and chemist, Royal Institution",
    summary:
      "Michael Faraday is best known for his work on electricity and magnetism, but in 1831 he published a long paper on acoustical figures that belongs at the root of this story. He showed that while heavy grains settle on a plate's still lines, as Chladni found, very light powders gather where the plate vibrates most, carried there by currents in the air; the effect changed when he repeated it in thinner air. In the same paper he described the 'crispations' that form on a liquid lying on a vibrating surface: regular standing ripples that respond at half the frequency of the shaking. Those are now called Faraday waves. They are what most modern cymatics images of water show, and they are the waves that walking droplets ride.",
    contributions: [
      "Light powders gather at the places of greatest vibration, through air currents (1831)",
      "'Crispations' on vibrated liquids: Faraday waves (1831)",
    ],
    sourceIds: ["gnd-authority-records", "faraday-1831"],
    portraitMediaId: "portrait-faraday-brady",
  },
  {
    id: "watts-hughes",
    name: "Margaret Watts Hughes",
    years: "1842–1907",
    role: "Welsh singer and philanthropist; inventor of the eidophone",
    summary:
      "Margaret (Megan) Watts Hughes was a Welsh singer, born in Dowlais. Looking for a way to show the intensity of vocal sounds, she began in 1885 to sing into a tube ending in a stretched elastic membrane, an instrument she called the eidophone, and found that materials on the membrane formed figures: some geometric, some resembling flowers, ferns and trees. She presented them to the Musical Association, where her paper was published in 1886, and to the Royal Institution and Royal Society; an illustrated account followed in the Century Magazine in 1891 and a book in a second edition in 1904. Recent scholarship treats her work as sitting between science, art and music. She also founded a home for homeless boys.",
    contributions: [
      "The eidophone and its voice-figures, from 1885",
      "'Voice Figures', Proceedings of the Musical Association, 1886",
      "'Visible Sound: Voice-Figures', Century Magazine, 1891",
    ],
    sourceIds: ["griffith-1959-dwb", "watts-hughes-1886", "watts-hughes-1891-century", "watts-hughes-1904", "ruhse-2026-artnodes"],
  },
  {
    id: "waller",
    name: "Mary Désirée Waller",
    years: "1886–1959",
    role: "British physicist, London (Royal Free Hospital) School of Medicine for Women",
    summary:
      "Mary Désirée Waller taught physics at the London (Royal Free Hospital) School of Medicine for Women from 1915 to 1947, rising to senior lecturer, and took her PhD at London in 1941. Over several decades she published more than thirty papers on Chladni figures and the vibration of free plates, including work on how to interpret the figures. Her book Chladni Figures: A Study in Symmetry, published by G. Bell in 1961, appeared after her death in December 1959. It treats the figures as a problem in symmetry: which patterns a plate of a given shape can make, and why. She is one of the few people in this story who studied the figures as physics for a whole career.",
    contributions: [
      "More than thirty papers on Chladni figures and free plates",
      "'Interpreting Chladni figures', American Journal of Physics, 1957",
      "Chladni Figures: A Study in Symmetry (1961, posthumous)",
    ],
    sourceIds: ["aim25-waller", "waller-1961", "waller-1957-ajp"],
  },
  {
    id: "jenny",
    name: "Hans Jenny",
    years: "1904–1972",
    role: "Swiss physician and painter; named and founded Kymatik (cymatics)",
    summary:
      "Hans Jenny was born in Basel and died in Dornach. He worked as a physician in Dornach and taught at the Rudolf Steiner School in Zurich. He photographed sand, powders, liquids and pastes on plates and membranes driven by controlled tones, and published the results as Kymatik in two volumes (Basel: Basilius Presse, 1967 and 1972), the first with the parallel title 'Cymatics'. The Swiss historical lexicon calls him the founder of Kymatik and records that he worked as an anthroposophist following Goethe's method of observation. His photographs are not reproduced here because they are not free to reproduce.",
    contributions: [
      "Kymatik / Cymatics, vol. 1 (1967) and vol. 2 (1972)",
      "Named the field Kymatik",
    ],
    contested:
      "His framework was explicitly anthroposophical and Goethean, not that of physics (HLS).",
    sourceIds: ["bartschi-hls-jenny", "jenny-1967", "jenny-1972", "gnd-authority-records"],
  },
  {
    id: "lauterwasser",
    name: "Alexander Lauterwasser",
    years: "Living",
    role: "German photographer and author; sound-driven patterns on water",
    summary:
      "Alexander Lauterwasser photographs the patterns that sound and music make on the surface of water. His book Wasser Klang Bilder was published in English as Water Sound Images (MACROmedia, 2006), extending the work of Chladni and Jenny by using water as the medium and music, not only pure tones, as the source. The images show the standing waves of a driven water surface, the physics described on this site as Faraday waves. The book's reception has been in arts review rather than physics: the review found here praised the images and did not assess scientific claims. This profile lists only his published work.",
    contributions: ["Water Sound Images (2006; German edition Wasser Klang Bilder)"],
    sourceIds: ["lauterwasser-2006", "harle-2007-leonardo"],
  },
  {
    id: "reid",
    name: "John Stuart Reid",
    years: "Living",
    role: "Acoustics researcher; co-developer of the CymaScope",
    summary:
      "John Stuart Reid leads the team behind the CymaScope, an instrument that drives a small cell of water with sound and photographs the resulting surface patterns. In December 2015 the team and dolphin researcher Jack Kassewitz publicised images made by playing dolphin echolocation clicks into the instrument, described as showing what a dolphin perceives; the paper followed in 2016, with Reid as a co-author. He is also a co-author of a 2019 conference chapter on turning Raman spectra of cells into sound. The CymaScope's own site makes further claims, including a 'sono-pictorial' dolphin language. This profile reports what has been published and how it was received, below; it makes no judgement beyond the sources.",
    contributions: [
      "Co-developer of the CymaScope",
      "Co-author, dolphin echolocation imaging paper, 2016",
      "Co-author, sonified Raman signals chapter, 2019",
    ],
    contested:
      "The dolphin-imaging claim was criticised on release as unpublished and as unable to show what a dolphin perceives (MIT Technology Review, 2015), and a linguist called CymaScope output 'pretty pictures, no scientific results' (Language Log, 2016). The 2016 paper appeared in a journal from OMICS, against which the US Federal Trade Commission later won a judgment over deceptive claims about peer review. No independent replication or refereed critique was found in either direction; the support is the authors' own paper and site.",
    elsewhere: [{ label: "CymaScope: oceanography images", url: "https://cymascope.com/oceanography/" }],
    sourceIds: ["cymascope-oceanography", "kassewitz-2016", "ji-park-reid-2019", "vezina-2015-mittr", "poser-2016-languagelog", "ftc-v-omics-2019"],
  },
  {
    id: "de-broglie",
    name: "Louis de Broglie",
    years: "1892–1987",
    role: "French theoretical physicist; proposed that matter behaves as waves",
    summary:
      "Louis de Broglie proposed in his 1924 Paris doctoral thesis that every moving particle has a wavelength: electrons, which were thought of as tiny points, also behave as waves. The idea was confirmed by electron diffraction experiments and earned him the 1929 Nobel Prize in Physics. At the 1927 Solvay conference he presented a 'pilot-wave' picture, in which a real wave guides a real particle, and then abandoned it soon afterwards. He held the chair of theoretical physics at the University of Paris from 1932 and became Permanent Secretary of the Académie des Sciences in 1942. His pilot-wave idea was revived by David Bohm in 1952, and it is the picture walking-droplet experiments were compared to from 2005 on.",
    contributions: [
      "The wave nature of matter: 1924 thesis, published 1925",
      "Nobel Prize in Physics, 1929",
      "Pilot-wave theory, presented at Solvay in 1927 and then set aside by him",
    ],
    sourceIds: ["debroglie-1925", "nobel-debroglie-bio", "nobel-physics-1929", "bacciagaluppi-valentini-2009", "sep-bohmian-mechanics"],
    portraitMediaId: "portrait-de-broglie-rol-1929",
  },
  {
    id: "bohm",
    name: "David Bohm",
    years: "1917–1992",
    role: "Theoretical physicist; revived the pilot-wave interpretation of quantum mechanics",
    summary:
      "David Bohm published two papers in 1952 that rediscovered and extended de Broglie's pilot-wave idea into a complete interpretation of quantum mechanics. In it, particles have definite positions at all times and are guided by the wavefunction, and the theory reproduces the predictions of standard non-relativistic quantum mechanics. It is now often called de Broglie–Bohm theory or Bohmian mechanics. With Yakir Aharonov he showed in 1959 that electromagnetic potentials have direct, measurable effects on quantum particles, the Aharonov–Bohm effect. He spent more than thirty years at Birkbeck College, London, and was elected a Fellow of the Royal Society. His work is the reason the walking droplets were described as a 'pilot-wave' system.",
    contributions: [
      "Pilot-wave (de Broglie–Bohm) interpretation of quantum mechanics, 1952",
      "The Aharonov–Bohm effect, with Yakir Aharonov, 1959",
    ],
    sourceIds: ["bohm-1952a", "bohm-1952b", "aharonov-bohm-1959", "hiley-1997", "sep-bohmian-mechanics"],
  },
  {
    id: "couder",
    name: "Yves Couder",
    years: "1941–2019",
    role: "Physicist, Université Paris Diderot; co-discoverer of walking droplets",
    summary:
      "Yves Couder was a French physicist whose work ranged across soap films and two-dimensional turbulence, fingering instabilities, the growth patterns of plants and the dynamics of drops. In 2005, with Suzie Protière, Emmanuel Fort and Arezki Boudaoud, he reported that drops bouncing on a vibrated bath can walk across it, steered by their own waves. With Fort he went on to lead the experiments that made walkers famous: the 2006 single- and double-slit experiment, unpredictable tunnelling in 2009 and orbits quantised by path memory in 2010. He helped found the Matière et Systèmes Complexes laboratory in Paris, was a member of the French Academy of Sciences and received the 2012 Euromech Fluid Mechanics Prize. He died in Paris on 2 April 2019.",
    contributions: [
      "Walking droplets, 2005",
      "Walker single- and double-slit experiment, 2006 (later not replicated)",
      "Tunnelling (2009), quantised orbits (2010), double quantisation in a trap (2014)",
    ],
    contested:
      "His 2006 double-slit result with Emmanuel Fort was not reproduced by later, more controlled experiments in Copenhagen (2015, 2020) and at MIT (2018). The rest of the programme stands.",
    sourceIds: ["huerre-2020", "euromech-couder", "couder-2005", "couder-fort-2006", "andersen-2015", "pucci-2018"],
  },
  {
    id: "fort",
    name: "Emmanuel Fort",
    years: "Living researcher",
    role: "Physicist, professor at ESPCI Paris, PSL University",
    summary:
      "Emmanuel Fort is a physicist and professor at ESPCI Paris, PSL University. He was one of the four authors of the 2005 paper that reported walking droplets, and Yves Couder's closest collaborator on the walker experiments that followed. With Couder he published the 2006 single- and double-slit experiment, and he was a co-author on the 2009 tunnelling result, the 2010 work showing that path memory quantises a walker's orbits, the 2013 circular-corral statistics and the 2014 study of a walker held in a harmonic trap. The 2006 double-slit result was not reproduced by later groups; the other experiments stand and have been built on. As of 2023 he held the AXA Chair in Biomedical Imaging.",
    contributions: [
      "Walking droplets, 2005 (co-author)",
      "Walker slit experiments, 2006, with Couder",
      "Path-memory quantisation, 2010; double quantisation, 2014",
    ],
    contested:
      "The 2006 double-slit result with Yves Couder was not reproduced by later, more controlled experiments (Andersen et al. 2015; Pucci et al. 2018; Ellegaard & Levinsen 2020).",
    sourceIds: ["uva-fort-2023", "couder-2005", "couder-fort-2006", "fort-2010", "perrard-2014", "pucci-2018"],
  },
  {
    id: "bush",
    name: "John W. M. Bush",
    years: "Living researcher",
    role: "Professor of Applied Mathematics, MIT; named the field of pilot-wave hydrodynamics",
    summary:
      "John Bush is a professor of applied mathematics at MIT, where his group has published much of the theory and many of the experiments on walking droplets. With Anand Oza and Rodolfo Rosales he derived the 2013 trajectory equation that models a walker as a moving source of standing waves, and his 2015 Annual Review article gave the field its name, pilot-wave hydrodynamics. His group repeated the slit experiments in 2018 and found they did not show true diffraction; it also produced a hydrodynamic quantum mirage (2018) and, in 2025, walkers diffracted by a standing Faraday wave. His 2021 review with Oza, 'Hydrodynamic quantum analogs', is the standard account of what the droplets do and do not reproduce.",
    contributions: [
      "Trajectory equation for walkers, 2013 (with Oza and Rosales)",
      "'Pilot-wave hydrodynamics', 2015, and 'Hydrodynamic quantum analogs', 2021",
      "Slit repeat (2018), hydrodynamic mirage (2018), Kapitza–Dirac analogue (2025)",
    ],
    sourceIds: ["usc-bush-bio", "oza-2013", "bush-2015", "bush-oza-2021", "pucci-2018", "saenz-2018", "primkulov-2025-kapitza-dirac"],
  },
  {
    id: "bohr",
    name: "Tomas Bohr",
    years: "Living researcher",
    role: "Professor of Physics, Technical University of Denmark",
    summary:
      "Tomas Bohr is a professor of physics at the Technical University of Denmark (DTU Physics), where he has directed Fluid•DTU, and works on fluid dynamics and dynamical systems. He co-wrote the 1998 Cambridge monograph Dynamical Systems Approach to Turbulence. In the walking-droplet story he is the senior author of the 2015 Copenhagen double-slit experiment, which rebuilt Couder and Fort's setup with tighter control and did not find interference; the paper also argued that the statistics of a droplet that always passes through one slit must differ in principle from quantum statistics. That work, and the 2020 follow-up by his Copenhagen colleagues Ellegaard and Levinsen, is the main reason the 2006 result is now listed as not replicated.",
    contributions: [
      "Dynamical Systems Approach to Turbulence (with Jensen, Paladin and Vulpiani), 1998",
      "Senior author, Copenhagen walker double-slit experiment, 2015",
    ],
    sourceIds: ["dtu-bohr", "bohr-1998", "andersen-2015", "ellegaard-levinsen-2020"],
  },
];
