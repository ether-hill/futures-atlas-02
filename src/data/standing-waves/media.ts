import type { MediaItem } from "./types";

/**
 * The gallery, and the only images the project shows.
 *
 * Allowed: figures computed in the browser by this site, public-domain plates,
 * Commons / CC items with full credit, our own rig (public/standing-waves/own/,
 * empty until there is footage), and items with written permission. NOT
 * allowed without permission: Hans Jenny's Kymatik photographs, CymaScope
 * images, film stills, other artists' work — profiles link out to those.
 *
 * Archive images are hot-linked from upload.wikimedia.org at the width the
 * page needs, never copied into the repo (the rule the feed follows for a
 * publisher's artwork). Width/height are the served thumbnail's, so nothing
 * shifts as it loads.
 */

// LICENSE-CONTENT §2: generated imagery made for the Atlas is all rights
// reserved. The maths that draws it is the code, and the code is MIT.
const OURS = "Futures Atlas, computed in your browser";
const OURS_LICENCE = "All rights reserved";

function chladni(n: number, m: number): MediaItem {
  return {
    id: `gen-chladni-${n}-${m}`,
    title: `Square plate, mode (${n}, ${m})`,
    kind: "generated",
    src: `chladni:${n},${m}`,
    alt: `Computed Chladni figure for a square plate, mode ${n},${m}: the lines where the plate stays still, drawn as a symmetric web of curves.`,
    credit: OURS,
    license: OURS_LICENCE,
    lane: "cymatics",
    tags: ["square plate", "chladni"],
  };
}

function bessel(m: number, k: number): MediaItem {
  return {
    id: `gen-bessel-${m}-${k}`,
    title: `Round plate, ${m} diameter${m === 1 ? "" : "s"} and ${k} ring${k === 1 ? "" : "s"}`,
    kind: "generated",
    src: `bessel:${m},${k}`,
    alt: `Computed nodal pattern of a round plate: ${m} straight line${m === 1 ? "" : "s"} through the centre and ${k} circle${k === 1 ? "" : "s"} inside the rim.`,
    credit: OURS,
    license: OURS_LICENCE,
    lane: "wave-physics",
    tags: ["round plate", "bessel"],
  };
}

function faraday(kind: "stripes" | "squares" | "hexagons"): MediaItem {
  return {
    id: `gen-faraday-${kind}`,
    title: `Faraday pattern: ${kind} (illustrative)`,
    kind: "generated",
    src: `faraday:${kind}`,
    alt: `An illustrative ${kind} pattern: the still lines of ${kind === "stripes" ? "one" : kind === "squares" ? "two" : "three"} overlapping standing waves of one wavelength.`,
    credit: OURS,
    license: OURS_LICENCE,
    lane: "cymatics",
    tags: ["faraday", "illustrative"],
  };
}

const GENERATED: MediaItem[] = [
  chladni(1, 2),
  chladni(1, 4),
  chladni(2, 5),
  chladni(3, 5),
  chladni(1, 6),
  chladni(4, 7),
  bessel(0, 2),
  bessel(2, 1),
  bessel(3, 2),
  bessel(5, 1),
  bessel(4, 3),
  bessel(7, 2),
  faraday("stripes"),
  faraday("squares"),
  faraday("hexagons"),
];

/* Verified on each Commons file page (licence, author, source) — see the
   project notes. Portraits are tagged "portrait" and appear on profiles only. */
const ARCHIVE: MediaItem[] = [
  {
    "id": "chladni-1787-tab-1",
    "title": "Chladni, Entdeckungen über die Theorie des Klanges (1787), Tab. I",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Ernst_Florens_Friedrich_Chladni_-_Entdeckungen_%C3%BCber_die_Theorie_des_Klanges_-_1787.pdf/page81-960px-Ernst_Florens_Friedrich_Chladni_-_Entdeckungen_%C3%BCber_die_Theorie_des_Klanges_-_1787.pdf.jpg",
    "width": 1158,
    "height": 1402,
    "alt": "An engraved plate of twelve numbered circles in a ruled frame, labelled 'Tab. I'. Each circle shows a nodal pattern on a round plate: crosses, many-pointed stars and curved lines dividing the disc.",
    "credit": "Ernst Florens Friedrich Chladni, Entdeckungen über die Theorie des Klanges, Leipzig, 1787, Tab. I (digitised copy via e-rara.ch, doi:10.3931/e-rara-4235)",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ernst_Florens_Friedrich_Chladni_-_Entdeckungen_%C3%BCber_die_Theorie_des_Klanges_-_1787.pdf",
    "lane": "cymatics",
    "tags": [
      "chladni",
      "plate",
      "1787",
      "circular plate",
      "nodal lines"
    ]
  },
  {
    "id": "chladni-1787-tab-2",
    "title": "Chladni, Entdeckungen über die Theorie des Klanges (1787), Tab. II",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Ernst_Florens_Friedrich_Chladni_-_Entdeckungen_%C3%BCber_die_Theorie_des_Klanges_-_1787.pdf/page83-960px-Ernst_Florens_Friedrich_Chladni_-_Entdeckungen_%C3%BCber_die_Theorie_des_Klanges_-_1787.pdf.jpg",
    "width": 1158,
    "height": 1402,
    "alt": "An engraved plate, 'Tab. II', of twelve numbered circles showing nodal patterns on round plates: a solid many-rayed star, curved grids, concentric rings and spoked divisions.",
    "credit": "Ernst Florens Friedrich Chladni, Entdeckungen über die Theorie des Klanges, Leipzig, 1787, Tab. II (digitised copy via e-rara.ch, doi:10.3931/e-rara-4235)",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ernst_Florens_Friedrich_Chladni_-_Entdeckungen_%C3%BCber_die_Theorie_des_Klanges_-_1787.pdf",
    "lane": "cymatics",
    "tags": [
      "chladni",
      "plate",
      "1787",
      "circular plate",
      "nodal lines"
    ]
  },
  {
    "id": "chladni-1787-tab-8",
    "title": "Chladni, Entdeckungen über die Theorie des Klanges (1787), Tab. VIII",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Ernst_Florens_Friedrich_Chladni_-_Entdeckungen_%C3%BCber_die_Theorie_des_Klanges_-_1787.pdf/page95-960px-Ernst_Florens_Friedrich_Chladni_-_Entdeckungen_%C3%BCber_die_Theorie_des_Klanges_-_1787.pdf.jpg",
    "width": 1158,
    "height": 1402,
    "alt": "An engraved plate, 'Tab. VIII', of twenty numbered squares, each showing the nodal lines of a vibrating square plate: crosses, diagonals, circles and curved bands.",
    "credit": "Ernst Florens Friedrich Chladni, Entdeckungen über die Theorie des Klanges, Leipzig, 1787, Tab. VIII (digitised copy via e-rara.ch, doi:10.3931/e-rara-4235)",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ernst_Florens_Friedrich_Chladni_-_Entdeckungen_%C3%BCber_die_Theorie_des_Klanges_-_1787.pdf",
    "lane": "cymatics",
    "tags": [
      "chladni",
      "plate",
      "1787",
      "square plate",
      "nodal lines"
    ]
  },
  {
    "id": "chladni-1787-tab-9",
    "title": "Chladni, Entdeckungen über die Theorie des Klanges (1787), Tab. IX",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Ernst_Florens_Friedrich_Chladni_-_Entdeckungen_%C3%BCber_die_Theorie_des_Klanges_-_1787.pdf/page97-960px-Ernst_Florens_Friedrich_Chladni_-_Entdeckungen_%C3%BCber_die_Theorie_des_Klanges_-_1787.pdf.jpg",
    "width": 1158,
    "height": 1402,
    "alt": "An engraved plate, 'Tab. IX', of twenty numbered squares filled with more complex nodal patterns of a square plate: wavy parallel lines, lattices and a ring inside a square.",
    "credit": "Ernst Florens Friedrich Chladni, Entdeckungen über die Theorie des Klanges, Leipzig, 1787, Tab. IX (digitised copy via e-rara.ch, doi:10.3931/e-rara-4235)",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ernst_Florens_Friedrich_Chladni_-_Entdeckungen_%C3%BCber_die_Theorie_des_Klanges_-_1787.pdf",
    "lane": "cymatics",
    "tags": [
      "chladni",
      "plate",
      "1787",
      "square plate",
      "nodal lines"
    ]
  },
  {
    "id": "orsted-1810-klangfigurerne-tab-1",
    "title": "Ørsted, Forsøg over Klangfigurerne (1810), Tab. 1",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Hans_Christian_%C3%98rsted_Fors%C3%B6g_over_Klangfigurerne_Tab_1.png/1920px-Hans_Christian_%C3%98rsted_Fors%C3%B6g_over_Klangfigurerne_Tab_1.png",
    "width": 1934,
    "height": 2096,
    "alt": "An engraved plate of eight figures: small squares and a circle marked with star and cross shapes, a ring, and two large gridded squares crossed by curved and diagonal lines.",
    "credit": "Hans Christian Ørsted, 'Forsøg over Klangfigurerne', Det kongelige danske Videnskabernes Selskabs Skrivter for Aar 1807 og 1808, vol. 5, 1810",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Hans_Christian_%C3%98rsted_Fors%C3%B6g_over_Klangfigurerne_Tab_1.png",
    "lane": "cymatics",
    "tags": [
      "orsted",
      "chladni figures",
      "1810",
      "square plate"
    ]
  },
  {
    "id": "faraday-1831-crispations-fig-14",
    "title": "Faraday, 'On a Peculiar Class of Acoustical Figures' (1831), p. 325, Figs. 14–15",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/On_a_Peculiar_Class_of_Acoustical_Figures%3B_and_on_Certain_Forms_Assumed_by_Groups_of_Particles_upon_Vibrating_Elastic_Surfaces_%28IA_jstor-107936%29.pdf/page27-960px-On_a_Peculiar_Class_of_Acoustical_Figures%3B_and_on_Certain_Forms_Assumed_by_Groups_of_Particles_upon_Vibrating_Elastic_Surfaces_%28IA_jstor-107936%29.pdf.jpg",
    "width": 1064,
    "height": 1393,
    "alt": "A printed journal page headed 'Of fluids on vibrating elastic surfaces, 325'. Fig. 14 is a row of four small woodcuts: concentric rings, rings breaking into a lattice, a diagonal crossed lattice, and a square grid of heaps; Fig. 15 is a block of short dashes.",
    "credit": "Michael Faraday, 'On a Peculiar Class of Acoustical Figures; and on Certain Forms Assumed by Groups of Particles upon Vibrating Elastic Surfaces', Philosophical Transactions of the Royal Society 121 (1831), 299–340, p. 325",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:On_a_Peculiar_Class_of_Acoustical_Figures;_and_on_Certain_Forms_Assumed_by_Groups_of_Particles_upon_Vibrating_Elastic_Surfaces_(IA_jstor-107936).pdf",
    "lane": "wave-physics",
    "tags": [
      "faraday",
      "crispations",
      "faraday waves",
      "1831",
      "phil trans"
    ]
  },
  {
    "id": "watts-hughes-1891-daisy",
    "title": "Margaret Watts Hughes, voice-figure 'Daisy form' (1891)",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/9/9b/SoundDaisy_Margaret_Watts_Hughes.jpeg",
    "width": 521,
    "height": 496,
    "alt": "A circular halftone of a voice-figure: a pale many-petalled rosette at the centre surrounded by dark radiating streaks, captioned 'Daisy form'.",
    "credit": "Margaret Watts Hughes, 'Visible Sound: Voice-Figures', The Century Magazine 42 (1891)",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:SoundDaisy_Margaret_Watts_Hughes.jpeg",
    "lane": "cymatics",
    "tags": [
      "watts hughes",
      "eidophone",
      "voice figure",
      "1891"
    ]
  },
  {
    "id": "watts-hughes-1891-fern",
    "title": "Margaret Watts Hughes, voice-figure 'Fern form' (1891)",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/9/97/SoundFern_Margaret_Watts_Hughes.jpeg",
    "width": 484,
    "height": 457,
    "alt": "A circular halftone of a voice-figure: dark, frond-like branching shapes like fern leaves on a pale ground, captioned 'Fern form'.",
    "credit": "Margaret Watts Hughes, 'Visible Sound: Voice-Figures', The Century Magazine 42 (1891)",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:SoundFern_Margaret_Watts_Hughes.jpeg",
    "lane": "cymatics",
    "tags": [
      "watts hughes",
      "eidophone",
      "voice figure",
      "1891"
    ]
  },
  {
    "id": "watts-hughes-1891-tree",
    "title": "Margaret Watts Hughes, voice-figure 'Tree form' (1891)",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/9/98/SoundTree_Margaret_Watts_Hughes.jpeg",
    "width": 402,
    "height": 539,
    "alt": "A rectangular halftone of a voice-figure resembling a pale branching tree above a ridged landscape, captioned 'Tree form'.",
    "credit": "Margaret Watts Hughes, 'Visible Sound: Voice-Figures', The Century Magazine 42 (1891)",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:SoundTree_Margaret_Watts_Hughes.jpeg",
    "lane": "cymatics",
    "tags": [
      "watts hughes",
      "eidophone",
      "voice figure",
      "1891"
    ]
  },
  {
    "id": "watts-hughes-1891-eidophone",
    "title": "Margaret Watts Hughes, diagram of the eidophone (1891)",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/6/65/SoundEidophone_Margaret_Watts_Hughes.jpeg",
    "width": 223,
    "height": 566,
    "alt": "Line drawings of four versions of the eidophone: a receiver with a membrane-covered mouth (lettered A, B, C) joined to a mouthpiece tube, captioned 'The eidophone'.",
    "credit": "Margaret Watts Hughes, 'Visible Sound: Voice-Figures', The Century Magazine 42 (1891)",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:SoundEidophone_Margaret_Watts_Hughes.jpeg",
    "lane": "cymatics",
    "tags": [
      "watts hughes",
      "eidophone",
      "apparatus",
      "1891"
    ]
  },
  {
    "id": "chladni-plate-photo-matemateca-17",
    "title": "Chladni figure on a square brass plate (Matemateca IME-USP)",
    "kind": "cc",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Chladni_plate_17.jpg/1920px-Chladni_plate_17.jpg",
    "width": 4753,
    "height": 4753,
    "alt": "A square brass plate on a black background, clamped at its centre, with orange sand gathered into an X across the diagonals and an arc near each edge.",
    "credit": "Exhibit by Estes Objethos Atelier, photo by Rodrigo Tetsuo Argenton; Matemateca (IME-USP), 2016",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Chladni_plate_17.jpg",
    "lane": "cymatics",
    "tags": [
      "chladni",
      "photograph",
      "square plate",
      "sand"
    ]
  },
  {
    "id": "chladni-plate-photo-matemateca-06",
    "title": "Chladni figure on a rectangular brass plate (Matemateca IME-USP)",
    "kind": "cc",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Chladni_plate_06.jpg/1920px-Chladni_plate_06.jpg",
    "width": 3636,
    "height": 4671,
    "alt": "A rectangular brass plate on black, clamped at one point, with sand lying in thin curving lines that bend in from the edges.",
    "credit": "Exhibit by Estes Objethos Atelier, photo by Rodrigo Tetsuo Argenton; Matemateca (IME-USP), 2016",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Chladni_plate_06.jpg",
    "lane": "cymatics",
    "tags": [
      "chladni",
      "photograph",
      "rectangular plate",
      "sand"
    ]
  },
  {
    "id": "chladni-round-plate-kuiper-3c4l",
    "title": "Round Chladni plate, 3 circular and 4 linear nodes, 5.289 kHz",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Round_Chladni_plate_with_3_circular_and_4_linear_nodes.jpg/1920px-Round_Chladni_plate_with_3_circular_and_4_linear_nodes.jpg",
    "width": 3872,
    "height": 2592,
    "alt": "A black iron disc on a driver, with sand gathered into three rings crossed by spokes; a function generator beside it reads 5.289 kHz.",
    "credit": "Pieter Kuiper, own work (released into the public domain)",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Round_Chladni_plate_with_3_circular_and_4_linear_nodes.jpg",
    "lane": "cymatics",
    "tags": [
      "chladni",
      "photograph",
      "round plate",
      "measured frequency"
    ]
  },
  {
    "id": "chladni-round-plate-kuiper-4c2l",
    "title": "Round Chladni plate, 4 circular and 2 linear nodes, 5.670 kHz",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Round_Chladni_plate_with_4_circular_and_2_linear_nodes.JPG/1920px-Round_Chladni_plate_with_4_circular_and_2_linear_nodes.JPG",
    "width": 3872,
    "height": 2592,
    "alt": "The same black iron disc with sand in four concentric rings cut by one straight diameter; the function generator beside it reads 5.670 kHz.",
    "credit": "Pieter Kuiper, own work, 2011 (released into the public domain)",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Round_Chladni_plate_with_4_circular_and_2_linear_nodes.JPG",
    "lane": "cymatics",
    "tags": [
      "chladni",
      "photograph",
      "round plate",
      "measured frequency"
    ]
  },
  {
    "id": "chladni-plate-pattern-revisorius",
    "title": "Chladni plate pattern in white sand",
    "kind": "cc",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Chladni_Plate_Pattern_2.jpg/1920px-Chladni_Plate_Pattern_2.jpg",
    "width": 2648,
    "height": 2741,
    "alt": "Close-up of a dark plate covered in white grains gathered into a symmetrical pattern of loops and curved bands.",
    "credit": "Revisorius, own work, 2020",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Chladni_Plate_Pattern_2.jpg",
    "lane": "cymatics",
    "tags": [
      "chladni",
      "photograph",
      "sand",
      "high mode"
    ]
  },
  {
    "id": "chladni-quadratic-plate-high-contrast",
    "title": "Square Chladni plate on a vibration generator",
    "kind": "cc",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Quadratic_Chladni_plate.JPG/1920px-Quadratic_Chladni_plate.JPG",
    "width": 2560,
    "height": 2020,
    "alt": "A square plate mounted on a white vibration generator on a lab bench, with sand forming a lattice of dark cells and pale lines.",
    "credit": "High Contrast, own work, 2011",
    "license": "CC BY 3.0 de",
    "licenseUrl": "https://creativecommons.org/licenses/by/3.0/de/deed.en",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Quadratic_Chladni_plate.JPG",
    "lane": "cymatics",
    "tags": [
      "chladni",
      "photograph",
      "square plate",
      "apparatus"
    ]
  },
  {
    "id": "chladni-harpsichord-soundboard",
    "title": "Chladni figures on a harpsichord soundboard",
    "kind": "cc",
    "src": "https://upload.wikimedia.org/wikipedia/commons/5/54/Resonance_Chladni_Soundboard_Harpsichord_Clavecin.jpg",
    "width": 1024,
    "height": 768,
    "alt": "A white harpsichord soundboard seen from above with a round rose, and dark seeds gathered into long curving lines across it.",
    "credit": "WikiRigaou, own work, 2005",
    "license": "CC BY-SA 3.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Resonance_Chladni_Soundboard_Harpsichord_Clavecin.jpg",
    "lane": "cymatics",
    "tags": [
      "chladni",
      "photograph",
      "instrument",
      "soundboard"
    ]
  },
  {
    "id": "faraday-waves-water-bremps",
    "title": "Faraday waves in water at about 50 Hz",
    "kind": "cc",
    "src": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Faraday_Waves.jpg",
    "width": 1406,
    "height": 818,
    "alt": "A shallow glass dish of water on a brown surface, its surface rippled into a regular pattern of small standing-wave peaks.",
    "credit": "Bremps, own work, 2023",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Faraday_Waves.jpg",
    "lane": "wave-physics",
    "tags": [
      "faraday waves",
      "photograph",
      "water",
      "standing waves"
    ]
  },
  {
    "id": "superwalking-droplet-video",
    "title": "Still from a high-speed video of a superwalking droplet",
    "kind": "cc",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Superwalking_droplet.webm.480p.vp9_%281%29.webm/500px--Superwalking_droplet.webm.480p.vp9_%281%29.webm.jpg",
    "width": 853,
    "height": 404,
    "alt": "A still from a high-speed video: an oil droplet travelling across a vibrating fluid bath, carrying the waves it makes with it.",
    "credit": "Rahil Valani, own work, 2019 (Wiki Science Competition 2019 national finalist)",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Superwalking_droplet.webm.480p.vp9_(1).webm",
    "lane": "pilot-wave",
    "tags": [
      "walking droplets",
      "superwalker",
      "video",
      "experiment"
    ]
  },
  {
    "id": "walking-droplet-pair-simulation",
    "title": "Simulated pair of walking droplets (Oza stroboscopic model)",
    "kind": "cc",
    "src": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Walking_droplet_pair.png",
    "width": 702,
    "height": 682,
    "alt": "A plotted simulation: a green and blue concentric wave field on axes, with blue and red trajectories of two droplets running up from the bottom and curling into a loop.",
    "credit": "ALopez1986, own work, 2024 — numerical simulation, not a photograph",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Walking_droplet_pair.png",
    "lane": "pilot-wave",
    "tags": [
      "walking droplets",
      "simulation",
      "pilot wave",
      "trajectory"
    ]
  },
  {
    "id": "portrait-chladni-chretien-1809",
    "title": "Ernst Chladni, physionotrace by Chrétien (1809)",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Chladni_portrait_by_Chretien_1809.jpg/1920px-Chladni_portrait_by_Chretien_1809.jpg",
    "width": 2456,
    "height": 2700,
    "alt": "A circular engraved profile of a young man with short tousled hair and a high collar, facing right, signed 'E. F. F. Chladni'.",
    "credit": "Gilles-Louis Chrétien, physionotrace engraving, Paris, 1809",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Chladni_portrait_by_Chretien_1809.jpg",
    "lane": "cymatics",
    "tags": [
      "portrait",
      "chladni"
    ]
  },
  {
    "id": "portrait-faraday-brady",
    "title": "Michael Faraday, daguerreotype, Mathew Brady studio (1844–60)",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Michael_Faraday%2C_by_Mathew_Brady_studio%2C_between_1844_and_1860.jpg/1920px-Michael_Faraday%2C_by_Mathew_Brady_studio%2C_between_1844_and_1860.jpg",
    "width": 2859,
    "height": 3747,
    "alt": "A tarnished daguerreotype of Michael Faraday, seated, in a dark coat with a high collar, his hand resting on a table.",
    "credit": "Mathew Brady studio, daguerreotype, between 1844 and 1860; Library of Congress Prints and Photographs, cph.3g06710",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Michael_Faraday,_by_Mathew_Brady_studio,_between_1844_and_1860.jpg",
    "lane": "wave-physics",
    "tags": [
      "portrait",
      "faraday",
      "daguerreotype"
    ]
  },
  {
    "id": "portrait-germain-chegaray",
    "title": "Sophie Germain, posthumous medallion portrait by Berthe Chégaray (1896)",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/4/4f/Ch%C3%A9garay_-_Sophie_Germain.png",
    "width": 1788,
    "height": 1895,
    "alt": "A photograph of a round relief medallion showing a woman's profile facing left with her hair gathered up, inscribed 'A la mémoire de Sophie Germain philosophe 1776–1831'.",
    "credit": "Berthe Chégaray (née Becher), reproduced in La Revue des revues, 15 September 1898, p. 37 — a memorial medallion made 65 years after her death; no portrait from life is known",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ch%C3%A9garay_-_Sophie_Germain.png",
    "lane": "wave-physics",
    "tags": [
      "portrait",
      "germain",
      "posthumous"
    ]
  },
  {
    "id": "portrait-hooke-greer-2004",
    "title": "Robert Hooke, reconstruction by Rita Greer (2004)",
    "kind": "cc",
    "src": "https://upload.wikimedia.org/wikipedia/commons/1/10/13_Portrait_of_Robert_Hooke.JPG",
    "width": 1359,
    "height": 1620,
    "alt": "A painted portrait of a thin man with long dark curled hair, holding a quill at a desk with a spring, a watch and an ammonite fossil, headed 'Robert Hooke 1635–1703'.",
    "credit": "Rita Greer, oil on board, 2004 — a modern reconstruction; no authenticated portrait of Hooke survives",
    "license": "Free Art License (FAL)",
    "licenseUrl": "http://artlibre.org/licence/lal/en",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:13_Portrait_of_Robert_Hooke.JPG",
    "lane": "wave-physics",
    "tags": [
      "portrait",
      "hooke",
      "reconstruction",
      "modern painting"
    ]
  },
  {
    "id": "portrait-de-broglie-rol-1929",
    "title": "Louis de Broglie, press photograph by Agence Rol (13 November 1929)",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Prince_Louis-Victor_de_Broglie_%28prix_Nobel_de_physique%2C_13_novembre_1929%29_-_btv1b532220521.jpg/1920px-Prince_Louis-Victor_de_Broglie_%28prix_Nobel_de_physique%2C_13_novembre_1929%29_-_btv1b532220521.jpg",
    "width": 6077,
    "height": 8354,
    "alt": "A black-and-white photograph of Louis de Broglie in a three-piece suit, seated with hands clasped in front of bookshelves.",
    "credit": "Agence Rol, press photograph, 13 November 1929; Bibliothèque nationale de France (Gallica, btv1b532220521)",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Prince_Louis-Victor_de_Broglie_(prix_Nobel_de_physique,_13_novembre_1929)_-_btv1b532220521.jpg",
    "lane": "quantum",
    "tags": [
      "portrait",
      "de broglie",
      "nobel 1929",
      "photograph"
    ]
  },
  {
    "id": "portrait-rayleigh-psm-1884",
    "title": "Lord Rayleigh, engraving from Popular Science Monthly (1884)",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/c/ca/PSM_V25_D738_John_William_Strutt_Lord_Rayleigh.jpg",
    "width": 1734,
    "height": 2166,
    "alt": "An engraved head-and-shoulders portrait of a balding man with dark side-whiskers and a moustache, in a wing collar and dark coat.",
    "credit": "Unknown engraver, Popular Science Monthly, vol. 25, 1884",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:PSM_V25_D738_John_William_Strutt_Lord_Rayleigh.jpg",
    "lane": "wave-physics",
    "tags": [
      "portrait",
      "rayleigh",
      "engraving"
    ]
  },
  {
    "id": "rayleigh-theory-of-sound-1894-title",
    "title": "Rayleigh, The Theory of Sound, 2nd ed. (1894), title page",
    "kind": "public-domain",
    "src": "https://upload.wikimedia.org/wikipedia/commons/0/0f/Rayleigh%2C_John_William_Strutt_%E2%80%93_Theory_of_sound%2C_1894_%E2%80%93_BEIC_6738003.jpg",
    "width": 1168,
    "height": 1890,
    "alt": "The printed title page of 'The Theory of Sound' by Lord Rayleigh, 1894.",
    "credit": "John William Strutt, Lord Rayleigh, The Theory of Sound, 2nd ed., London: Macmillan, 1894; scan BEIC digital library",
    "license": "Public domain",
    "licenseUrl": "https://creativecommons.org/publicdomain/mark/1.0/",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Rayleigh,_John_William_Strutt_%E2%80%93_Theory_of_sound,_1894_%E2%80%93_BEIC_6738003.jpg",
    "lane": "wave-physics",
    "tags": [
      "rayleigh",
      "theory of sound",
      "title page",
      "1894"
    ]
  }
];

export const MEDIA: MediaItem[] = [...ARCHIVE, ...GENERATED];

/** What a caption must say about how a computed figure was made, and where it simplifies. */
export function captionFor(m: MediaItem): string | undefined {
  if (m.src.startsWith("chladni:"))
    return "cos(nπx)cos(mπy) − cos(mπx)cos(nπy) = 0: the classic approximation for a square plate, a sum of two simple modes. A real plate's free edges have no exact formula, so real sand figures differ in detail.";
  if (m.src.startsWith("bessel:"))
    return "Jₘ(kr)·cos mθ = 0, the drum-head solution with the rim held still. A plate clamped at its centre with a free rim puts its rings in slightly different places.";
  if (m.src.startsWith("faraday:"))
    return "Illustrative only: standing plane waves added together to show the geometry. Not a simulation of the liquid. Which pattern a real bath picks depends on its depth, viscosity and how hard it is shaken.";
  return undefined;
}
