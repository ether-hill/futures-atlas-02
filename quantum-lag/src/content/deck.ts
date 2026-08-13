import type { ActMeta, Claim } from "./types";

/*
  The deck. Twenty claims, four acts of five. Transcribed from deck-final.md.

  The spine: a quantum state is destroyed by contact with the world. Act 1 shows
  that sensitivity being useful. Act 2 shows it being the obstacle. Act 3 shows
  it being the defence. Act 4 shows nobody able to date any of it while the
  world commits anyway.

  `prompt` is unset on every claim. The deck supplies no reasoning prompts, and
  a prompt that hints at a date is worse than none. The field and its no-year
  test are in place for when they are written.
*/

export const DECK_VERSION = "deck-final-2026-08-11";

export const ACTS: ActMeta[] = [
  {
    act: 1,
    title: "The property",
    premise:
      "Quantum states are exact and easily disturbed. Both facts make them useful before anyone builds a computer.",
    interstitial:
      "Everything in that act works because quantum states are exact and easily disturbed. A computer has to hold thousands of them steady at once, which is a very different problem.",
  },
  {
    act: 2,
    title: "The machine",
    premise: "The same fragility, now the obstacle.",
    interstitial:
      "A machine like that would break the encryption holding the internet together. The same physics can also protect a message so well that nobody can read it.",
  },
  {
    act: 3,
    title: "The distance",
    premise:
      "Fragility as the defence. Looking destroys the state, and here that is the point.",
    interstitial:
      "None of this tells you when a machine arrives that can break encryption. That has not stopped anyone from acting.",
  },
  {
    act: 4,
    title: "The deadline",
    premise: "Nobody can date it. The world commits anyway.",
  },
];

export const DECK: Claim[] = [
  // ================================================================== act one
  {
    id: "second-redefined",
    act: 1,
    claim:
      "Time itself is redefined using a quantum measurement, and the world's clocks are set by it.",
    short: "The second redefined",
    status: { kind: "happened", year: 1967 },
    hook: "Every satellite navigation fix you have ever taken depends on a quantum measurement.",
    story: [
      {
        kind: "text",
        text: "An atom can only absorb energy in fixed amounts, never in between. That is what the word quantum means. It also means every caesium atom responds to exactly one frequency, and always the same one.",
      },
      {
        kind: "text",
        text: "A pendulum can be filed down. A quartz crystal ages. An atom cannot be adjusted by anyone, so a clock built on one keeps the same time everywhere, forever.",
      },
      {
        kind: "visual",
        id: "energy-levels",
        caption:
          "The gap never changes, so the frequency that bridges it never changes either.",
      },
      {
        kind: "text",
        text: "In 1967 the world stopped defining the second by the movement of the earth and defined it by counting those vibrations instead.",
      },
      {
        kind: "text",
        text: "GPS works by comparing arrival times from several satellites, each carrying atomic clocks. Be out by a millionth of a second and you are three hundred metres from where you think you are.",
      },
    ],
    image: {
      src: "/evidence/second-redefined.jpg",
      width: 620,
      height: 360,
      alt:
        "Louis Essen and J. V. L. Parry standing beside the first caesium atomic clock at the National Physical Laboratory, 1955",
      credit: "National Physical Laboratory",
      licence: "Public domain",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Atomic_Clock-Louis_Essen.jpg",
    },
    sources: [
      {
        text: "Essen and Parry, Nature 176 (1955).",
        url: "https://doi.org/10.1038/176280a0",
      },
      {
        text: "General Conference on Weights and Measures, 1967.",
        url: "https://www.bipm.org/en/committees/cg/cgpm/13-1967/resolution-1",
      },
    ],
  },
  {
    id: "mri-spin",
    act: 1,
    claim:
      "Quantum sensing is installed in hospitals, reading the spin of atoms inside your body.",
    short: "Quantum sensing in hospitals",
    status: { kind: "happened", year: 1977 },
    hook: "The most widespread quantum device in the world is in hospitals, and almost nobody calls it one.",
    story: [
      {
        kind: "text",
        text: "An MRI scanner puts you inside a magnet strong enough to line up the hydrogen nuclei in your tissue. A radio pulse knocks them out of line. The scanner listens to how they settle back.",
      },
      {
        kind: "text",
        text: "The property it is reading is spin. An electron or a nucleus behaves as though it is spinning, and that spin points one way or the other, never anywhere in between. Different tissues settle at different rates, and that difference is the image.",
      },
      {
        kind: "visual",
        id: "spin-two-states",
        caption:
          "Up or down, and nothing in between. That is what makes it usable as a bit.",
      },
      {
        kind: "text",
        text: "Remember this one. A large share of quantum computers store information in exactly the same property.",
      },
      {
        kind: "text",
        text: "The first scan of a living person was made in 1977, on a machine called Indomitable. It took nearly five hours to produce a single cross-section of a chest. Within a decade hospitals had them as standard.",
      },
    ],
    image: {
      src: "/evidence/mri-spin.jpg",
      width: 1000,
      height: 1496,
      alt:
        "The Mark One, described as the first MRI scanner used on patients, built at Aberdeen Royal Infirmary",
      credit: "AndyGaskell",
      licence: "CC BY-SA 4.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:MRI_Scanner_Mark_One.jpg",
    },
    sources: [
      { text: "Damadian, Goldsmith and Minkoff (1977)." },
      {
        text: "Nobel Prize in Physiology or Medicine, 2003.",
        url: "https://www.nobelprize.org/prizes/medicine/2003/summary/",
      },
    ],
  },
  {
    id: "gravity-sensor",
    act: 1,
    claim:
      "A quantum sensor sees through solid ground, mapping what is buried by weighing it.",
    short: "Seeing through the ground",
    status: { kind: "happened", year: 2022 },
    hook: "You can weigh the ground from the pavement and find out what is inside it.",
    story: [
      {
        kind: "text",
        text: "Everything pulls on everything else, and a hole pulls slightly less than the rock around it. Stand above a buried cavity and you weigh a fraction less than you would a few metres away. The difference is about one part in a billion.",
      },
      {
        kind: "text",
        text: "That is far too small for an ordinary instrument to pick out from passing lorries and the vibration of the ground.",
      },
      {
        kind: "text",
        text: "A quantum gravimeter drops a cloud of atoms cooled to near absolute zero and times the fall using their own quantum behaviour. Two clouds fall at once, at different heights, so the vibration affects both equally and cancels.",
      },
      {
        kind: "visual",
        id: "gravity-dip",
        caption:
          "The reading dips where the ground is hollow.",
      },
      {
        kind: "text",
        text: "In 2022 a team in Birmingham mapped a tunnel a metre below a campus road. The instrument was on a trolley, outdoors, in ordinary weather. British utility companies dig around four million holes a year and most are exploratory.",
      },
      {
        kind: "text",
        text: "The same instrument, pointed elsewhere, finds voids inside volcanoes and water under deserts.",
      },
    ],
    image: {
      src: "/evidence/gravity-sensor.jpg",
      width: 1200,
      height: 800,
      alt:
        "A cold-atom experiment on an optical bench, the apparatus a quantum gravimeter shrinks into a trolley",
      credit: "Tomasz Kawalec",
      licence: "CC BY-SA 4.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Cold_atoms_experiment_04.JPG",
    },
    sources: [
      {
        text: "Stray et al., Nature 602 (2022).",
        url: "https://doi.org/10.1038/s41586-021-04315-3",
      },
    ],
  },
  {
    id: "quantum-phone",
    act: 1,
    claim: "A quantum chip goes on sale to the public, inside a phone.",
    short: "A quantum chip in a phone",
    status: { kind: "happened", year: 2020 },
    hook: "Some consumer products really do contain quantum hardware. This one does less than the word suggests.",
    story: [
      {
        kind: "text",
        text: "The chip generates random numbers. It watches quantum noise, which is genuinely unpredictable rather than merely complicated, and turns it into numbers nobody can guess. Good encryption depends on unguessable numbers, so this is useful.",
      },
      { kind: "text", text: "It performs no calculation of any kind." },
      {
        kind: "text",
        text: "A handset shipped with one in 2020 and the marketing used the word quantum throughout. Both things are true at once: the chip is quantum hardware, and the phone is not a quantum computer.",
      },
      {
        kind: "visual",
        id: "three-tiers",
        caption:
          "Sensing is already on the shelves. Computing is not.",
      },
      {
        kind: "text",
        text: "Most quantum branding on consumer products refers to randomness or sensing. Both are far easier than computing, which is why they arrived first and why they are already for sale.",
      },
    ],
    image: {
      src: "/evidence/quantum-phone.jpg",
      width: 1200,
      height: 1601,
      alt:
        "A Samsung Galaxy handset of the kind sold in ordinary shops, the product category the quantum chip shipped in",
      credit: "Beamish4",
      licence: "CC BY-SA 4.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_(Onyx_Black)_-_Front.jpg",
    },
    sources: [
      {
        text: "Samsung Galaxy A Quantum, with an ID Quantique chip, May 2020.",
      },
    ],
  },
  {
    id: "quantum-navigation",
    act: 1,
    claim:
      "Quantum navigation replaces GPS in service, on ordinary passenger flights.",
    short: "Quantum navigation in service",
    status: { kind: "expected", range: [2032, 2045] },
    hook: "Trial flights and everyday service are about fifteen years apart, and this is where the two get confused.",
    story: [
      {
        kind: "text",
        text: "Satellite navigation can be jammed or spoofed, and it has been, repeatedly, over the Baltic and the Middle East. A quantum inertial sensor needs no signal at all. It tracks its own motion by watching cold atoms respond to acceleration, and it drifts far less than the mechanical version.",
      },
      {
        kind: "text",
        text: "Trial flights carrying the equipment took place in 2024. That is the part people remember.",
      },
      {
        kind: "visual",
        id: "demo-to-service",
        caption:
          "Eight years between the trial flight and the earliest date anyone expects service, if it all goes well.",
      },
      {
        kind: "text",
        text: "Civil aviation certification takes decades and the equipment is currently the size of a wardrobe. Nothing about the physics is in doubt. The engineering, the shrinking and the paperwork are all unfinished.",
      },
    ],
    image: {
      src: "/evidence/quantum-navigation.jpg",
      width: 1200,
      height: 795,
      alt:
        "The flight deck of a Boeing 747-8, where a quantum inertial system would have to be certified before it flew in service",
      credit: "Alex Beltyukov",
      licence: "CC BY-SA 3.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Boeing_747-8I_flight_deck_Beltyukov.jpg",
    },
    sources: [
      {
        text: "UK quantum navigation flight trials, 2024.",
        url: "https://www.ukri.org/news/un-jammable-quantum-tech-takes-flight-to-boost-uks-resilience/",
      },
    ],
  },

  // ================================================================== act two
  {
    id: "superconductivity",
    act: 2,
    claim:
      "The effect that every quantum computer runs on is found: metals that carry electricity forever, losing none of it.",
    short: "Superconductivity found",
    status: { kind: "happened", year: 1911 },
    hook: "The first quantum technology was found by a man who was not looking for one.",
    story: [
      {
        kind: "text",
        text: "Leiden, April 1911. Heike Kamerlingh Onnes had learned to make liquid helium three years earlier and nobody else could do it. That gave him a monopoly on cold. He was chilling ordinary materials to see what they would do.",
      },
      {
        kind: "text",
        text: "Mercury, at four degrees above absolute zero, stopped resisting electricity altogether. Start a current going in a loop of it and the current never stops.",
      },
      {
        kind: "visual",
        id: "resistance-drop",
        caption: "Resistance falls, and then at 4.2 kelvin it stops existing.",
      },
      {
        kind: "text",
        text: "The reading was so clean that a fault in the equipment seemed likelier than the result. It took another forty six years before anyone could explain why it happens.",
      },
      {
        kind: "text",
        text: "A superconducting qubit is a small loop of that same effect, holding a current that never fades. Google and IBM build their machines from them, which is why the machines are kept colder than anywhere in nature.",
      },
      {
        kind: "visual",
        id: "temperature-scale",
        caption:
          "Colder than deep space by a factor of a few hundred.",
      },
    ],
    image: {
      src: "/evidence/superconductivity.jpg",
      width: 1000,
      height: 1380,
      alt:
        "Portrait of Heike Kamerlingh Onnes, who found superconductivity in Leiden in 1911",
      credit: "Nobel foundation",
      licence: "Public domain",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Kamerlingh_Onnes_signed.jpg",
    },
    sources: [
      { text: "Kamerlingh Onnes, Leiden Comm. 120b (1911)." },
      {
        text: "Nobel Prize, 1913.",
        url: "https://www.nobelprize.org/prizes/physics/1913/summary/",
      },
    ],
  },
  {
    id: "error-correction",
    act: 2,
    claim:
      "Quantum error correction starts working: adding qubits makes a machine more reliable, not less.",
    short: "Error correction starts working",
    status: { kind: "happened", year: 2024 },
    hook: "For thirty years, making these machines bigger made them worse.",
    story: [
      {
        kind: "text",
        text: "Qubits fail constantly. Heat, vibration and stray magnetic fields all destroy what they are holding. The fix is to spread one unit of information across many physical qubits, so that when some go wrong the others reveal it and the damage can be undone.",
      },
      {
        kind: "text",
        text: "That is error correction, and it explains why a machine with a thousand physical qubits might carry only a handful you can rely on. Headline qubit counts tell you almost nothing.",
      },
      {
        kind: "visual",
        id: "logical-qubit",
        caption:
          "Twenty five unreliable qubits, adding up to one you can trust.",
      },
      {
        kind: "text",
        text: "The catch is that every qubit added to the correction is itself unreliable. For three decades, scaling up introduced errors faster than it removed them.",
      },
      {
        kind: "text",
        text: "Google's Willow chip crossed that threshold in December 2024. Adding qubits now makes the machine steadier. Every roadmap in the field depends on this one result, and outside the field it passed almost unremarked.",
      },
    ],
    image: {
      src: "/evidence/error-correction.jpg",
      width: 1000,
      height: 683,
      alt:
        "A scanning electron micrograph of an eleven-qubit superconducting chip, the kind error correction is built from",
      credit: "FMNLab",
      licence: "CC BY 4.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:A_quantum_simulator_based_on_11_superconducting_qubits.png",
    },
    sources: [
      {
        text: "Google Quantum AI, Nature 638 (2025). Announced December 2024.",
        url: "https://doi.org/10.1038/s41586-024-08449-y",
      },
    ],
  },
  {
    id: "first-computer",
    act: 2,
    claim: "The first working quantum computer is built, holding two qubits.",
    short: "The first quantum computer",
    status: { kind: "happened", year: 1998 },
    hook: "The first quantum computer was a test tube.",
    story: [
      {
        kind: "text",
        text: "Chloroform molecules in liquid, at room temperature, inside a magnet of the kind used for hospital scans. The information sat in the spin of atomic nuclei, the same property an MRI reads.",
      },
      {
        kind: "text",
        text: "It held two qubits. It searched four possibilities and returned the right one.",
      },
      {
        kind: "visual",
        id: "machines-compared",
        caption: "A test tube in 1998. A room of refrigeration now.",
      },
      {
        kind: "text",
        text: "Nothing about it looked like a computer. There was no screen, no keyboard and no chip. There was a tube of liquid in a magnet, and it ran an algorithm correctly.",
      },
      {
        kind: "text",
        text: "Physicists then spent a decade arguing about whether anything in the tube had been meaningfully quantum at all.",
      },
    ],
    image: {
      src: "/evidence/first-computer.jpg",
      width: 1000,
      height: 1328,
      alt:
        "An IBM Quantum System One, a current machine, for scale against a test tube in a magnet",
      credit: "OJB Quantum",
      licence: "CC BY 4.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:IBM_Quantum_System_One.jpg",
    },
    sources: [
      { text: "Chuang, Gershenfeld and Kubinec, Phys. Rev. Lett. 80 (1998)." },
    ],
  },
  {
    id: "reliable-machine",
    act: 2,
    claim:
      "A quantum computer becomes reliable enough to use for real work, instead of being an experiment.",
    short: "A machine you can trust",
    // The bounds are the two cited estimates themselves: the manufacturer
    // roadmap at the near end, the surveyed specialists at the far end. The
    // decade between them is the disagreement, not a margin of error.
    status: { kind: "expected", range: [2029, 2039] },
    hook: "Every other date anyone argues about sits behind this one, and the estimates for it differ by ten years.",
    story: [
      {
        kind: "text",
        text: "Today's machines produce answers that have to be checked by other means. That makes them instruments rather than computers. A machine you can trust without verification is the line between the two, and nothing has crossed it.",
      },
      {
        kind: "text",
        text: "Every other date anyone argues about sits behind this one. Breaking encryption, designing medicines, doing work worth paying for, none of it happens first.",
      },
      {
        kind: "visual",
        id: "roadmap-gap",
        caption:
          "The people selling the machines, against the people studying them.",
      },
      {
        kind: "text",
        text: "IBM's published plan says 2029. Independent specialists asked in surveys cluster around the late 2030s. That gap of roughly ten years, between the people selling the machines and the people studying them, is the most useful thing on this card.",
      },
      {
        kind: "text",
        text: "When you next read a date for anything quantum, check which of those two groups produced it.",
      },
    ],
    image: {
      src: "/evidence/reliable-machine.jpg",
      width: 1000,
      height: 1000,
      alt:
        "A large-frame dilution refrigerator, the cooling stack a superconducting processor runs inside",
      credit: "OJB Quantum",
      licence: "CC BY 4.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Dilution_Fridge_with_Quantum_Processors_Enclosed_008_8K.png",
    },
    sources: [
      {
        text: "IBM Quantum roadmap, Starling.",
        url: "https://www.ibm.com/roadmaps/quantum/",
      },
      {
        text: "Global Risk Institute expert survey, 2025.",
        url: "https://globalriskinstitute.org/publication/2025-quantum-threat-timeline-report/",
      },
    ],
  },
  {
    id: "factoring-15",
    act: 2,
    claim:
      "A quantum computer completes the code-breaking method for the first time, correctly working out that 15 is 3 times 5.",
    short: "The code-breaking method runs",
    status: { kind: "happened", year: 2001 },
    hook: "The method that threatens internet encryption has already run on real hardware.",
    story: [
      {
        kind: "text",
        text: "Peter Shor published it in 1994. It takes a large number and finds the two primes that multiply to make it, which is the one operation the security of the internet assumes to be impractical.",
      },
      {
        kind: "text",
        text: "For seven years there was no machine to test it on.",
      },
      {
        kind: "text",
        text: "In 2001 a team at IBM Almaden built a molecule with seven usable nuclei, dissolved it, and ran the procedure. The machine returned 3 and 5. Everyone already knew the answer.",
      },
      {
        kind: "visual",
        id: "factoring-scale",
        caption:
          "Seven qubits handled 15. Nobody has built what RSA-2048 would take.",
      },
      {
        kind: "text",
        text: "Size is the only thing between that result and a broken banking system. The procedure is the same one; the machine would need to be perhaps a million times larger than anything that exists.",
      },
    ],
    image: {
      src: "/evidence/factoring-15.jpg",
      width: 1200,
      height: 1600,
      alt:
        "A 600 MHz nuclear magnetic resonance spectrometer, the kind of magnet the 2001 factoring experiment ran inside",
      credit: "Misra.saurabh1",
      licence: "Public domain",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:IISER_Nuclear_magnetic_resonance_spectrometer_600MHZ.jpg",
    },
    sources: [
      {
        text: "Vandersypen et al., Nature 414 (2001).",
        url: "https://doi.org/10.1038/414883a",
      },
      { text: "Shor, Proc. 35th FOCS (1994)." },
    ],
  },

  // ================================================================ act three
  {
    id: "quantum-encryption",
    act: 3,
    claim: "Quantum encryption is demonstrated for the first time.",
    short: "Quantum encryption demonstrated",
    status: { kind: "happened", year: 1989 },
    hook: "Unbreakable communication was demonstrated before most people had heard of the internet.",
    story: [
      {
        kind: "text",
        text: "Ordinary encryption is a mathematical bet. It assumes an eavesdropper cannot do a particular sum quickly enough to matter. Quantum encryption makes no such bet. It sends single particles of light, and reading one changes it.",
      },
      {
        kind: "text",
        text: "An eavesdropper cannot listen without leaving marks in the data. The two people talking compare notes, see the errors and know they were overheard.",
      },
      {
        kind: "visual",
        id: "tapped-channel",
        caption: "Listen in and you leave errors behind you.",
      },
      {
        kind: "text",
        text: "Charles Bennett and Gilles Brassard published the protocol in 1984 and spent five years trying to interest anyone in building it. The machine they eventually built sent photons across thirty two and a half centimetres of open air on a laboratory bench.",
      },
      {
        kind: "text",
        text: "The power supply was loud. Bennett later remarked that the system was secure against any eavesdropper who happened to be deaf.",
      },
    ],
    image: {
      src: "/evidence/quantum-encryption.jpg",
      width: 800,
      height: 671,
      alt:
        "Charles Bennett, who with Gilles Brassard sent the first message protected by quantum key distribution",
      credit: "IBM Research",
      licence: "CC BY-SA 2.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Dr._Charles_Bennett_IBM_Fellow.jpg",
    },
    sources: [
      {
        text: "Bennett, Bessette, Brassard, Salvail and Smolin, Journal of Cryptology 5 (1992).",
        url: "https://doi.org/10.1007/bf00191318",
      },
    ],
  },
  {
    id: "micius-satellite",
    act: 3,
    claim:
      "A satellite links two ground stations 1,200 kilometres apart with unbreakable quantum encryption.",
    short: "A link from orbit",
    status: { kind: "happened", year: 2017 },
    hook: "Thirty two centimetres to twelve hundred kilometres took twenty eight years.",
    story: [
      {
        kind: "text",
        text: "The Micius satellite carried the same idea into orbit. It sent entangled photons down to two observatories in China, far enough apart that nothing on the ground could have connected them.",
      },
      {
        kind: "text",
        text: "Photons travel better through space than through fibre, because most of the path is vacuum. Going up and coming down beat going sideways.",
      },
      {
        kind: "visual",
        id: "three-ranges",
        caption: "Thirty two centimetres, seven metres, twelve hundred kilometres.",
      },
      {
        kind: "text",
        text: "This is the most science fictional thing here, and it is now old enough to be unremarkable. Commercial services using the same principle run over city fibre in several countries.",
      },
      {
        kind: "text",
        text: "Then the field spent the next four years struggling to connect three machines in one building.",
      },
    ],
    image: {
      src: "/evidence/micius-satellite.jpg",
      width: 1000,
      height: 1478,
      alt:
        "A laser fired from an observatory toward orbit, the kind of optical link a quantum satellite uses",
      credit: "F. Kamphues/ESO",
      licence: "CC BY 4.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:CaNaPy_laser_(ann21011c).jpg",
    },
    sources: [
      {
        text: "Yin et al., Science 356 (2017).",
        url: "https://doi.org/10.1126/science.aan3211",
      },
    ],
  },
  {
    id: "teleportation",
    act: 3,
    claim:
      "Quantum teleportation is performed in a laboratory, moving information off one particle onto another.",
    short: "Teleportation in a lab",
    status: { kind: "happened", year: 1997 },
    hook: "Teleportation is a real laboratory procedure and it moves no matter at all.",
    story: [
      {
        kind: "text",
        text: "The state of one particle is transferred to another particle some distance away. The original loses that state in the process, so nothing is copied. Nothing travels between the two, and no message arrives faster than light, because an ordinary signal has to be sent to complete it.",
      },
      { kind: "text", text: "What moves is the information, not the thing." },
      {
        kind: "visual",
        id: "teleportation-steps",
        caption:
          "The state vanishes at A and shows up at B. Nothing crosses the middle.",
      },
      {
        kind: "text",
        text: "The word does a great deal of work here. Strip it away and the mechanism is stranger than the name suggests, because it means quantum information can be handed between machines without any quantum thing travelling between them.",
      },
      {
        kind: "text",
        text: "Nothing in the procedure gets faster than a phone call, because the phone call is part of the procedure.",
      },
    ],
    image: {
      src: "/evidence/teleportation.jpg",
      width: 1000,
      height: 1500,
      alt:
        "Anton Zeilinger, in whose group the first laboratory teleportation was demonstrated in 1997",
      credit: "Jaqueline Godany",
      licence: "CC BY 4.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Anton_Zeilinger.jpg",
    },
    sources: [
      {
        text: "Bouwmeester et al., Nature 390 (1997).",
        url: "https://doi.org/10.1038/37539",
      },
    ],
  },
  {
    id: "quantum-internet",
    act: 3,
    claim:
      "A quantum internet is switched on, connecting three machines in a working network.",
    short: "The quantum internet switched on",
    status: { kind: "happened", year: 2021 },
    hook: "The quantum internet exists. It is about seven metres long.",
    story: [
      {
        kind: "text",
        text: "Two machines sharing entanglement is a link, and links have existed since the 1990s. A network needs something harder. A machine in the middle has to join two links together without looking at what passes through, because looking would destroy it.",
      },
      {
        kind: "text",
        text: "QuTech in Delft managed that in 2021, with three processors named Alice, Bob and Charlie. Bob sat between the other two and connected them. Alice and Charlie ended up entangled having never exchanged anything directly.",
      },
      {
        kind: "visual",
        id: "link-to-network",
        caption: "A link is two. A network needs a third one in the middle.",
      },
      {
        kind: "text",
        text: "The three were in separate rooms of the same building, about seven metres apart. This is the entire quantum internet as it currently exists.",
      },
    ],
    image: {
      src: "/evidence/quantum-internet.jpg",
      width: 1000,
      height: 666,
      alt:
        "Racks of cabling in the QuTech laboratory in Delft, where the first three-node quantum network was built",
      credit: "Martijn Beekman / Ministerie van Economische Zaken",
      licence: "CC BY 2.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:QuTech_Lab_Tour_(26998880172).jpg",
    },
    sources: [
      {
        text: "Pompili et al., Science 372 (2021).",
        url: "https://doi.org/10.1126/science.abg1919",
      },
      {
        text: "Hermans et al., Nature 605 (2022).",
        url: "https://doi.org/10.1038/s41586-022-04697-y",
      },
    ],
  },
  {
    id: "network-cities",
    act: 3,
    claim: "A quantum internet connects cities, not rooms.",
    short: "A network between cities",
    status: { kind: "expected", range: [2032, 2045] },
    hook: "Delft's network runs seven metres. Nobody has built the device that would stretch it the ten kilometres to The Hague.",
    story: [
      {
        kind: "text",
        text: "Quantum signals fade. After a few hundred kilometres of fibre almost nothing survives. An ordinary network solves this with repeaters that read the signal and send a fresh copy, and that approach is unavailable here, because reading destroys what is being sent and quantum states cannot be copied.",
      },
      {
        kind: "text",
        text: "A quantum repeater would extend the range without reading anything. Working versions exist in laboratories at short range. Nothing yet works over the distances a network needs.",
      },
      {
        kind: "visual",
        id: "fibre-falloff",
        caption:
          "The signal dies before a repeater could help.",
      },
      {
        kind: "text",
        text: "The Dutch programme aims to connect four cities. The link between Delft and The Hague is about ten kilometres.",
      },
    ],
    image: {
      src: "/evidence/network-cities.jpg",
      width: 1045,
      height: 1163,
      alt:
        "A cut section of buried optical fibre cable, the medium a quantum signal fades in after a few hundred kilometres",
      credit: "Asurnipal",
      licence: "CC BY-SA 4.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Optical_fiber_cable-06ASD.jpg",
    },
    sources: [
      {
        text: "Wehner et al., Science 362 (2018).",
        url: "https://doi.org/10.1126/science.aam9288",
      },
      {
        text: "Quantum Internet Alliance roadmap.",
        url: "https://quantuminternetalliance.org/",
      },
    ],
  },

  // ================================================================= act four
  {
    id: "supremacy",
    act: 4,
    claim:
      "A quantum computer finishes a calculation in minutes that a supercomputer would need 10,000 years for.",
    short: "Ten thousand years, revised",
    status: {
      kind: "disputed",
      year: 2019,
      note: "the comparison did not hold",
    },
    hook: "The field's proudest moment was a deliberately useless calculation.",
    story: [
      {
        kind: "text",
        text: "Google's Sycamore chip sampled random numbers in a way chosen specifically because quantum machines find it easy and ordinary computers find it hard. The result had no application. It was never meant to have one. The point was to show a gap existed.",
      },
      {
        kind: "text",
        text: "Within three years, improved conventional methods cut the 10,000 years to a matter of days, and then to hours. The experiment stood. The number in the headline did not survive.",
      },
      {
        kind: "visual",
        id: "supremacy-collapse",
        caption: "Ten thousand years, then days, then hours, for the same calculation.",
      },
      {
        kind: "text",
        text: "A comparison like this one measures the quantum machine against the best conventional method anyone knows on the day of publication. Pan's group beat that method in 2022, and Begušić's team beat it again in 2024.",
      },
    ],
    image: {
      src: "/evidence/supremacy.jpg",
      width: 879,
      height: 534,
      alt:
        "A close view of Google's Sycamore processor, used for the 2019 sampling experiment",
      credit: "Google",
      licence: "CC BY 3.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Google_Sycamore_Chip_002.png",
    },
    sources: [
      {
        text: "Arute et al., Nature 574 (2019).",
        url: "https://doi.org/10.1038/s41586-019-1666-5",
      },
      {
        text: "Pan et al., PRL 129 (2022).",
        url: "https://doi.org/10.1103/physrevlett.129.090502",
      },
      {
        text: "Begušić et al., Science Advances (2024).",
        url: "https://doi.org/10.1126/sciadv.adk4321",
      },
    ],
  },
  {
    id: "legal-deadline",
    act: 4,
    claim:
      "Governments pass a law requiring today's encryption to be removed before quantum computers can break it.",
    short: "A deadline written into law",
    status: { kind: "happened", year: 2022 },
    hook: "There is a legal deadline for deleting the encryption protecting your bank.",
    policy: [
      { year: 2030, label: "Sensitive systems migrated" },
      { year: 2035, label: "Migration complete" },
    ],
    story: [
      {
        kind: "text",
        text: "The reasoning is not that a code-breaking machine is expected shortly. Replacing encryption across a banking system takes about a decade, so the work has to start long before anyone knows the date.",
      },
      {
        kind: "text",
        text: "The United States moved first, by memorandum in 2022. Its standards body followed with firm dates in 2024. The European Union agreed a shared timetable in 2025.",
      },
      {
        kind: "visual",
        id: "deadline-axis",
        caption:
          "The law is fixed. The machine it defends against is not.",
      },
      {
        kind: "text",
        text: "The replacement already exists. Encryption designed to resist quantum attack was finished and published in August 2024, and it runs on ordinary computers. Nothing is waiting on research. What remains is installing it everywhere.",
      },
      {
        kind: "text",
        text: "The first deadline lands in 2030 and covers the systems judged sensitive. Everything else has until 2035.",
      },
    ],
    image: {
      src: "/evidence/legal-deadline.jpg",
      width: 1000,
      height: 616,
      alt:
        "The West Wing of the White House, where the 2022 memorandum setting the migration deadline was signed",
      credit: "White House (Chuck Kennedy)",
      licence: "Public domain",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Entrance_of_the_West_Wing_under_snow.jpg",
    },
    sources: [
      {
        text: "White House NSM-10 (2022).",
        url: "https://www.presidency.ucsb.edu/documents/memorandum-promoting-united-states-leadership-quantum-computing-while-mitigating-risks",
      },
      {
        text: "NIST FIPS 203 to 205 (2024).",
        url: "https://csrc.nist.gov/pubs/fips/203/final",
      },
      {
        text: "NIST IR 8547 (2024).",
        url: "https://csrc.nist.gov/pubs/ir/8547/ipd",
      },
      {
        text: "EU Coordinated PQC Implementation Roadmap (2025).",
        url: "https://digital-strategy.ec.europa.eu/en/library/coordinated-implementation-roadmap-transition-post-quantum-cryptography",
      },
    ],
  },
  {
    id: "export-control",
    act: 4,
    claim:
      "Selling a quantum computer abroad is made illegal without a licence.",
    short: "Export controls at 34 qubits",
    status: { kind: "happened", year: 2024 },
    hook: "Five governments set the same limit on exporting quantum computers and none of them will say why.",
    story: [
      {
        kind: "text",
        text: "The threshold is 34 qubits, with a further condition on error rates. Above it, an export licence is required. Below it, no restriction.",
      },
      {
        kind: "text",
        text: "France, Spain, the United Kingdom, the Netherlands and Canada introduced the controls with matching wording. The United States followed in September 2024 at the same threshold.",
      },
      {
        kind: "visual",
        id: "qubit-threshold",
        caption: "The limit sits far below the machines that already exist, and further below anything dangerous.",
      },
      {
        kind: "text",
        text: "A machine at 34 qubits cannot break anything. New Scientist asked dozens of governments for the scientific basis of the number and was refused. The United Kingdom said explaining the reasoning would itself be a national security risk. Christopher Monroe, one of the founders of IonQ, said publicly that he could not work out where the figure came from.",
      },
      {
        kind: "text",
        text: "By the time the rule came in, machines thirty times that size were already running.",
      },
    ],
    image: {
      src: "/evidence/export-control.jpg",
      width: 1000,
      height: 666,
      alt:
        "Customs officers inspecting cargo at a container port, the machinery an export licence runs through",
      credit: "CBP Photography",
      licence: "Public domain",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Port_of_Savannah_Non-Intrusive_Inspections_(NII)_and_Cargo_Operations_(53069204840).jpg",
    },
    sources: [
      { text: "New Scientist, July 2024." },
      {
        text: "US Bureau of Industry and Security interim final rule, September 2024.",
      },
    ],
  },
  {
    id: "rsa-broken",
    act: 4,
    claim:
      "A quantum computer breaks the encryption that protects online banking.",
    short: "Banking encryption broken",
    // Bounds are the two figures the survey itself reports: one in three by
    // 2035, four in five by 2045.
    status: { kind: "expected", range: [2035, 2045] },
    hook: "No machine is close, and the specialists still will not rule it out this decade.",
    policy: [{ year: 2035, label: "Migration complete" }],
    story: [
      {
        kind: "text",
        text: "Nothing existing comes within several orders of magnitude. That is not in dispute.",
      },
      {
        kind: "text",
        text: "What is in dispute is the date. In a 2025 survey, half of the twenty six specialists asked put the chance at a coin flip or better within ten years. Almost none of them said never.",
      },
      {
        kind: "visual",
        id: "expert-spread",
        caption:
          "Not a date. A rising chance, with the deadlines laid over the top.",
      },
      {
        kind: "text",
        text: "Dutch intelligence has used 2030 as a planning assumption since 2014. That figure is not a forecast. It is a date chosen to organise work around, which is a different kind of number and is routinely reported as though it were a prediction.",
      },
    ],
    image: {
      src: "/evidence/rsa-broken.jpg",
      width: 1200,
      height: 1806,
      alt:
        "The rear of a server rack in a data centre, showing the network cabling that public-key encryption protects",
      credit: "Derrick Coetzee",
      licence: "CC0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Rear_of_rack_at_NERSC_data_center_-_closeup.jpg",
    },
    sources: [
      {
        text: "Global Risk Institute, Quantum Threat Timeline 2025.",
        url: "https://globalriskinstitute.org/publication/2025-quantum-threat-timeline-report/",
      },
      { text: "AIVD." },
    ],
  },
  {
    id: "requirement-falling",
    act: 4,
    claim:
      "The number of qubits needed to break encryption falls by a factor of a thousand, with nobody building anything.",
    short: "The requirement falls a thousandfold",
    status: { kind: "happened", year: 2025 },
    hook: "The machine needed to break RSA-2048 shrank by a factor of a thousand while the hardware stood still.",
    story: [
      {
        kind: "text",
        text: "In 2012 a credible estimate for breaking RSA-2048 was around a billion qubits. In 2019 it was twenty million. In 2025 it was under a million, in under a week.",
      },
      {
        kind: "text",
        text: "Across those thirteen years the largest machine anyone built went from a handful of qubits to about a thousand. The hardware barely moved. The requirement fell by three orders of magnitude.",
      },
      {
        kind: "visual",
        id: "requirement-falling",
        caption:
          "The estimate fell a thousandfold while the hardware barely moved.",
      },
      {
        kind: "text",
        text: "Every date anyone quotes for breaking encryption rests on a number that people are still revising on paper. There is no reason to think 2025 is the last revision.",
      },
      {
        kind: "text",
        text: "Every one of those revisions came out of a paper. Nobody built a machine in between.",
      },
    ],
    image: {
      src: "/evidence/requirement-falling.jpg",
      width: 1200,
      height: 938,
      alt:
        "A wafer of quantum processor chips, the hardware that barely moved while the estimate fell a thousandfold",
      credit: "Steve Jurvetson",
      licence: "CC BY 2.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Hot_off_the_press_%E2%80%94_the_latest_D-Wave_wafer_of_quantum_processors_and_TIME_cover_story.jpg",
    },
    sources: [
      { text: "Gidney (2025).", url: "https://arxiv.org/abs/2505.15917" },
      { text: "Gidney and Ekerå (2021)." },
      { text: "Fowler et al. (2012)." },
    ],
  },
];

/** Research mode draws two or three per act, act order preserved. */
export function drawResearchSet(deck: Claim[], seed: number): Claim[] {
  let state = seed >>> 0 || 1;
  const rand = () => {
    // xorshift32, deterministic per session so a reload draws the same set.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 100000) / 100000;
  };

  const out: Claim[] = [];
  for (const { act } of ACTS) {
    const pool = deck.filter((c) => c.act === act);
    const take = 2 + Math.floor(rand() * 2); // two or three
    const picked: Claim[] = [];
    const remaining = [...pool];
    while (picked.length < Math.min(take, pool.length)) {
      const i = Math.floor(rand() * remaining.length);
      picked.push(remaining.splice(i, 1)[0]!);
    }
    // Act order is preserved; order within the act follows the deck.
    picked.sort((a, b) => pool.indexOf(a) - pool.indexOf(b));
    out.push(...picked);
  }
  return out;
}
