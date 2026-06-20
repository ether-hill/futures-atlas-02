/**
 * Before -> 2050 render pairs, one per correspondent. The "before" is that
 * correspondent's village today (real free-stock, sourced into /public/villages
 * by letter id); the "after" is the owner's 2050 render of the SAME frame with
 * the reply's lever realised. See /public/hollow-villages/villages/CREDITS.md.
 *
 * RULE: same viewpoint, keep the bones — revival is reoccupation, not demolition.
 * realPlaceCaption is set only where the before photo is a verifiable real place.
 */

export interface FuturePair {
  id: string; // matches Letter.reply.futurePairId (we use the letter id)
  letterId: string;
  beforeImage: string; // "/hollow-villages/villages/giorgio-72-before.jpg" (sourced)
  afterImage: string; // "/hollow-villages/villages/giorgio-72-after.jpg" (OWNER adds later)
  realPlaceCaption?: string; // name the real place IF the before is verifiably one
  conceptText: string; // the 2050 narrative for this place
  callout: string; // short label of the change realised, shown on the render
  researchIds: string[];
  /** true until the owner replaces the placeholder "after" render */
  afterIsPlaceholder?: boolean;
}

const slot = (id: string) => ({
  beforeImage: `/hollow-villages/villages/${id}-before.jpg`,
  afterImage: `/hollow-villages/villages/${id}-after.jpg`,
  afterIsPlaceholder: true,
});

export const futurePairs: FuturePair[] = [
  {
    id: "anna-8",
    letterId: "anna-8",
    ...slot("anna-8"),
    realPlaceCaption: "Usseaux, Piedmont, Italy",
    conceptText:
      "The square that held only echoes holds children again. The old school is a village-as-classroom where the eighty-year-olds teach the eight-year-olds, and a festival each spring puts the place back on the map. Anna is not the last child. By 2050 she is the first of the next ones.",
    callout: "Square reoccupied · intergenerational school",
    researchIds: ["ostana-first-baby", "pnrr-borghi-fund"],
  },
  {
    id: "giorgio-72",
    letterId: "giorgio-72",
    ...slot("giorgio-72"),
    realPlaceCaption: "Cervara di Roma, Lazio, Italy",
    conceptText:
      "The switchback road still climbs. But the square below it is not silent on a Tuesday: a demand-responsive van waits at the kerb, summoned by a phone call rather than a timetable, and the three neighbours who no longer drive are out together. Reach, returned.",
    callout: "Demand-responsive van · midweek life",
    researchIds: ["uwe-rural-demand-responsive-transport"],
  },
  {
    id: "mara-34",
    letterId: "mara-34",
    ...slot("mara-34"),
    realPlaceCaption: "Santo Stefano di Sessanio, Abruzzo, Italy",
    conceptText:
      "The beautiful dead lane keeps its view and loses its silence. A civic building is now a co-working hub; a café spills onto the street; the windows are lit because the people behind them need each other and the shop, so both stay. Density and difference, arrived by fibre.",
    callout: "Co-working hub · café · lit windows",
    researchIds: ["extremadura-digital-nomad-grants", "euronews-digital-nomad-villages"],
  },
  {
    id: "tomas-19",
    letterId: "tomas-19",
    ...slot("tomas-19"),
    realPlaceCaption: "Pentedattilo, Calabria, Italy",
    conceptText:
      "The shuttered frontages that offered Tomás nothing now offer a maker space and an apprenticeship. E-bikes lean by the door; the road out is still there, but it is no longer the only road. A future built here that finally includes the nineteen-year-old.",
    callout: "Maker space · apprenticeships · e-bikes",
    researchIds: ["euronews-digital-nomad-villages", "eu-young-farmers-land-access"],
  },
  {
    id: "yusuf-45",
    letterId: "yusuf-45",
    ...slot("yusuf-45"),
    realPlaceCaption: "Craco, Basilicata, Italy",
    conceptText:
      "The shop Yusuf shuttered reopens — not as one man's losing battle but as the village's own: post counter, groceries, a coffee machine, a few tables. A community-run multi-service shop, the kind that has held the last service open across rural Britain and France. The social anchor, re-dropped.",
    callout: "Community-run multi-service shop",
    researchIds: ["plunkett-more-than-a-pub", "bistrot-de-pays-network"],
  },
  {
    id: "bianca-51",
    letterId: "bianca-51",
    ...slot("bianca-51"),
    realPlaceCaption: "Castelmezzano, Basilicata, Italy",
    conceptText:
      "The tired municipal frontage is busy again, but the work behind it is shared: Bianca's village of four hundred pools governance with its neighbours to reach the scale that funding requires, and the borghi money lands at last. Too small to matter alone; together, impossible to skip.",
    callout: "Inter-municipal cooperation · funded works",
    researchIds: ["pnrr-borghi-fund", "espana-vaciada-movement"],
  },
  {
    id: "elif-40",
    letterId: "elif-40",
    ...slot("elif-40"),
    realPlaceCaption: "Apricale, Liguria, Italy",
    conceptText:
      "Elif's family house is no longer dark eleven months of the year. A rent-to-buy and heritage-restoration pathway matched it with people who needed exactly it; the shutters are open on a February Tuesday. The diaspora house, lived in — by someone, at last.",
    callout: "House restored · occupied year-round",
    researchIds: ["sambuca-one-euro-houses", "lacaixa-immigration-rural-spain"],
  },
  {
    id: "rosa-29",
    letterId: "rosa-29",
    ...slot("rosa-29"),
    realPlaceCaption: "Corippo, Ticino, Switzerland",
    conceptText:
      "The terraces that lay fragmented among absent heirs are worked again. A land-matching scheme assembled the scattered plots and put them in the hands of a young farmer who wanted them; the cooperative shares the press and the cold store. Land returned to livelihood.",
    callout: "Land-matching · young-farmer plots",
    researchIds: ["eu-young-farmers-land-access", "lacaixa-immigration-rural-spain"],
  },
  {
    id: "henrik-58",
    letterId: "henrik-58",
    ...slot("henrik-58"),
    realPlaceCaption: "Bosco Gurin, Ticino, Switzerland",
    conceptText:
      "Henrik no longer has to be everywhere at once. The shuttered clinic is a rotating surgery and a telemedicine point; a community health worker covers the days between. Care reaches the five valleys without one doctor driving himself into the ground to deliver it.",
    callout: "Rotating clinic · telemedicine point",
    researchIds: ["agrafa-rural-telehealth"],
  },
  {
    id: "lucia-16",
    letterId: "lucia-16",
    ...slot("lucia-16"),
    realPlaceCaption: "Soglio, Graubünden, Switzerland",
    conceptText:
      "The world stops being elsewhere. Fibre reaches the tiny school, which becomes a connected learning hub linked to others across the region; the broadband no longer flickers and neither does Lucia's sense that her horizon could include staying. A future that does not require the train out.",
    callout: "Connected learning hub · fibre",
    researchIds: ["euronews-digital-nomad-villages", "extremadura-digital-nomad-grants"],
  },
];

export function getFuturePair(id: string): FuturePair | undefined {
  return futurePairs.find((p) => p.id === id);
}
