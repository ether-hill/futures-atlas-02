/**
 * ShelfLife — the future-product prompt generator and its inventory.
 *
 * v1 generates PROMPTS, not products: the visitor assembles a scenario (aisle,
 * year, what changed about the world, optionally their own hunch) and gets two
 * copyable prompts — one for their image tool (Midjourney, DALL-E, …), one for
 * their chatbot (ChatGPT, Claude, …). No API call anywhere; the assembly is
 * deterministic and lives here so the page stays a static shell.
 *
 * STOCK is the living inventory: the keepers. Run the prompts, and when a
 * result makes you go hmmm, drop the image in public/shelflife/ and add an
 * entry here — `prompt` records the provenance. The shelf is the artifact.
 */

export interface ShelfLifeOption {
  id: string;
  label: string;
  /** the clause spliced into the prompts */
  clause: string;
}

export const AISLES: ShelfLifeOption[] = [
  { id: "health", label: "Health & body", clause: "the Health & body aisle" },
  { id: "home", label: "Home & climate", clause: "the Home & climate aisle" },
  { id: "food", label: "Food & drink", clause: "the Food & drink aisle" },
  { id: "mobility", label: "Mobility", clause: "the Mobility aisle" },
  { id: "work", label: "Work & focus", clause: "the Work & focus aisle" },
  { id: "care", label: "Family & care", clause: "the Family & care aisle" },
  { id: "play", label: "Play & escape", clause: "the Play & escape aisle" },
];

export const YEARS = ["2030", "2035", "2040", "2050"] as const;

/** What changed about the world — the force that makes the product exist. */
export const FORCES: ShelfLifeOption[] = [
  {
    id: "climate",
    label: "Climate adaptation",
    clause: "daily life has reorganised around heat, storms and water",
  },
  {
    id: "ai",
    label: "Ambient AI",
    clause: "capable AI is ambient, cheap and mostly invisible",
  },
  {
    id: "energy",
    label: "Volatile grid",
    clause: "clean energy is abundant but arrives in unreliable surges",
  },
  {
    id: "longevity",
    label: "Long lives",
    clause: "healthy lifespans routinely stretch past a hundred",
  },
  {
    id: "bio",
    label: "Grown, not made",
    clause: "growing materials and food has replaced manufacturing much of it",
  },
  {
    id: "repair",
    label: "Repair economy",
    clause: "new materials are rationed and repairing beats replacing",
  },
  {
    id: "privacy",
    label: "Guarded data",
    clause: "personal data became a currency people now fiercely guard",
  },
];

/** Photographic treatment for the image prompt. */
export const SHOTS: ShelfLifeOption[] = [
  {
    id: "studio",
    label: "Studio listing",
    clause:
      "clean e-commerce studio photograph, seamless white background, soft even lighting, centred product",
  },
  {
    id: "lifestyle",
    label: "In use at home",
    clause:
      "candid lifestyle photograph of the product in use in an ordinary home, natural window light",
  },
  {
    id: "unboxing",
    label: "Flat-lay unboxing",
    clause:
      "flat-lay unboxing photograph from above, product beside its packaging and accessories on a plain surface",
  },
];

export interface PromptInput {
  aisle: ShelfLifeOption;
  year: string;
  force: ShelfLifeOption;
  shot: ShelfLifeOption;
  /** the visitor's own hunch, optional */
  seed: string;
}

/** The chatbot prompt: an ordinary retail listing from a changed world. */
export function buildListingPrompt({ aisle, year, force, seed }: PromptInput): string {
  const product = seed
    ? `The product: ${seed}.`
    : `Invent one product that would sit in ${aisle.clause}.`;
  return [
    `You are a copywriter for an ordinary online marketplace in ${year} — a world where ${force.clause}. Nobody in ${year} finds this product remarkable; that is the point.`,
    ``,
    `${product}`,
    ``,
    `Write its listing exactly as the retailer would publish it:`,
    `- Product name (brandable but ordinary)`,
    `- One-line tagline`,
    `- Price in today's euros, with a delivery note`,
    `- Five specification bullets — concrete numbers, materials, battery life, sizes`,
    `- Three customer reviews: one delighted, one practical, one three-star with a mundane complaint`,
    `- One question-and-answer exchange from the listing page`,
    ``,
    `Keep the language flat and retail-plain. No sci-fi vocabulary, nothing "revolutionary". The future should feel ordinary.`,
  ].join("\n");
}

/** The image prompt: the listing photo for that same product. */
export function buildImagePrompt({ aisle, year, force, shot, seed }: PromptInput): string {
  const product = seed
    ? seed
    : `a consumer product from ${aisle.clause} of an online marketplace`;
  return [
    `Product photograph for an online marketplace listing in ${year}: ${product}.`,
    `${shot.clause}.`,
    `A world where ${force.clause}, but the product looks like an established category, not a concept render — restrained industrial design, believable materials, visible wear points.`,
    `Square crop. No text, no logos, no watermark.`,
  ].join(" ");
}

/* ------------------------------------------------------------------ */
/* The shelf                                                           */
/* ------------------------------------------------------------------ */

export interface ProductReview {
  stars: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  author?: string; // "Marta L., Rotterdam", or a role — some listings leave reviews unsigned
}

/**
 * The full retail listing behind a product's quickview — the standard
 * template for every product going forward. Paste the chatbot's output in
 * here; every section is optional and the quickview renders what exists.
 */
export interface ProductListing {
  delivery?: string; // the note under the price
  specs?: { label: string; value: string }[];
  reviews?: ProductReview[];
  qa?: { q: string; a: string }[];
}

export interface FutureProduct {
  id: string;
  name: string;
  aisle: string; // display label, e.g. "Health & body"
  year: string; // when it plausibly ships
  price: string; // display string, e.g. "€640" or "€6/mo"
  line: string; // one-line pitch / tagline, retail-plain
  image?: string; // /shelflife/<id>.jpg once generated; fa-hatch plate until then
  prompt?: string; // provenance: the image prompt that made it
  listing?: ProductListing; // the quickview copy
}

/** Seed inventory — placeholders to be replaced by generated keepers. */
export const STOCK: FutureProduct[] = [
  {
    id: "lingo-bud",
    name: "Lingo Bud Translator Earbuds",
    aisle: "Health & body",
    year: "2030",
    price: "€189",
    line: "Clear two-way translation for everyday conversations.",
    image: "/shelflife/lingo-bud.jpg",
    listing: {
      delivery: "Free delivery on orders over €50. Usually delivered in 2–3 working days.",
      specs: [
        {
          label: "Translation",
          value:
            "72 spoken languages, 38 offline language packs; two-way conversation mode",
        },
        {
          label: "Battery",
          value: "Up to 9 hours per charge; charging case provides 30 additional hours",
        },
        {
          label: "Materials",
          value: "Polycarbonate housing with medical-grade silicone ear tips",
        },
        {
          label: "Sizes",
          value: "Small, medium and large ear tips; earbuds measure 29 × 18 × 16 mm",
        },
        {
          label: "Weight",
          value: "5.2 g per earbud; USB-C charging case, 48 × 45 × 25 mm",
        },
      ],
      reviews: [
        {
          stars: 5,
          title: "Very pleased",
          body: "I bought these for a family trip and they worked better than expected. My mother speaks only Spanish and we could have a normal conversation without passing a phone back and forth. Comfortable enough to wear all afternoon.",
        },
        {
          stars: 4,
          title: "Useful for work",
          body: "I use them during meetings with clients who speak French and German. Translation is generally quick and the offline packs are useful on trains. Setup took about five minutes. The case is a little larger than I expected.",
        },
        {
          stars: 3,
          title: "Fine, but the fit could be better",
          body: "Translation is good and the battery lasts all day. Unfortunately the medium tips are slightly loose in my left ear. The small ones stay in better but don't block outside noise as well.",
        },
      ],
      qa: [
        {
          q: "Do both people need to wear an earbud?",
          a: "No. One person can wear an earbud while the other speaks normally. For two-way conversations, two earbuds provide the most natural experience.",
        },
      ],
    },
  },
  {
    id: "dewpoint-40",
    name: "DewPoint 40",
    aisle: "Home & climate",
    // No year in the copy. 2032 sits where this listing does: atmospheric water
    // harvesters are sold today, at industrial prices and industrial sizes. The
    // future part is a domestic one at €349 that a review can call noisy.
    year: "2032",
    price: "€349",
    line: "Morning water for your home and garden.",
    image: "/shelflife/dewpoint-40.jpg",
    listing: {
      delivery: "Standard delivery included. Delivered in 3–5 days.",
      specs: [
        { label: "Water capacity", value: "40 litres" },
        { label: "Collection area", value: "2.4 m² coated aluminium mesh" },
        { label: "Daily yield", value: "Up to 12 litres in suitable morning conditions" },
        { label: "Power", value: "18 W solar panel with 48-hour battery backup" },
        { label: "Size", value: "120 × 80 × 24 cm; wall or ground mounted" },
      ],
      reviews: [
        {
          stars: 5,
          title: "Very happy",
          body: "We installed ours beside the greenhouse in April. Most mornings there's enough water for the garden and we've cut down a lot on filling the watering cans.",
        },
        {
          stars: 4,
          title: "Works as expected",
          body: "Straightforward to install and the tank is a good size. Collection varies quite a bit depending on the morning, but that's to be expected. Filter takes a few minutes to clean.",
        },
        {
          stars: 3,
          title: "Fine, but noisy",
          body: "Does what it says, but the pump makes a noticeable noise when the tank is filling. Not a problem during the day, but I can hear it from the bedroom in the morning.",
        },
      ],
      qa: [
        {
          q: "Can I use the water for drinking?",
          a: "The DewPoint 40 is supplied for garden, cleaning and household non-drinking use. For drinking water, connect it to an approved household treatment system.",
        },
      ],
    },
  },
  {
    id: "meadow-wagyu",
    name: "MeadowWagyu – Lab Grown",
    aisle: "Food & drink",
    // No year came with the copy. 2030 is the earliest bracket the generator
    // offers and the one this listing reads as: cultured meat is already
    // approved for sale in Singapore and the US, so the future part is not the
    // technology, it is a whole cut on a supermarket shelf at this price.
    year: "2030",
    price: "€24.90 / 250 g",
    line: "Wagyu-style beef grown from cells, portioned and ready to cook.",
    image: "/shelflife/meadow-wagyu.jpg",
    listing: {
      delivery: "Refrigerated delivery included. Delivered in 1–2 days.",
      specs: [
        { label: "Weight", value: "250 g per pack" },
        { label: "Cut", value: "2 × 125 g sirloin portions" },
        {
          label: "Material",
          value: "Beef muscle and fat cells, cultured and formed into whole-cut portions",
        },
        { label: "Fat content", value: "22 g per 100 g" },
        {
          label: "Storage",
          value: "0–4°C; use within 3 days of delivery or freeze for up to 6 months",
        },
      ],
      reviews: [
        {
          stars: 5,
          title: "Very good",
          body: "Bought these for dinner with friends. Cooked them in the pan for about 4 minutes each side and they came out really tender. Will order again.",
        },
        {
          stars: 4,
          title: "As expected",
          body: "Good beef and easy to prepare. Two 125 g pieces is about right for us with potatoes and vegetables. Packaging arrived cold.",
        },
        {
          stars: 3,
          title: "Fine, but small",
          body: "Nothing wrong with the meat, but the portions looked a bit smaller than expected. Would prefer 150 g pieces.",
        },
      ],
      qa: [
        {
          q: "Does this need to be cooked differently from regular beef?",
          a: "No. Cook in a hot pan or on a grill as you would a similar beef cut. Follow the cooking instructions on the package.",
        },
      ],
    },
  },
  {
    id: "solocool-1",
    name: "NESTA SoloCool 1",
    aisle: "Home & climate",
    year: "2035",
    price: "€1,249",
    line: "A cool, quiet place to sit when the rest of the house is too warm.",
    image: "/shelflife/solocool-1.jpg",
    listing: {
      delivery:
        "Delivery from €49. Standard room-of-choice delivery to most EU locations within 5–8 working days. Assembly available at checkout.",
      specs: [
        {
          label: "External size",
          value: "140 × 125 × 205 cm; designed for one seated or reclining adult",
        },
        {
          label: "Cooling",
          value:
            "Low-noise personal cooling for indoor temperatures up to 42°C; adjustable from 20–26°C",
        },
        {
          label: "Power",
          value:
            "230V mains connection with integrated 1.8 kWh backup battery; up to 4 hours of cooling during a power interruption",
        },
        {
          label: "Materials",
          value:
            "Moulded insulated composite shell, aluminium base frame, clear polycarbonate front panel and washable fabric seating",
        },
        {
          label: "Weight",
          value: "118 kg; supplied on adjustable floor feet for permanent indoor placement",
        },
      ],
      reviews: [
        {
          stars: 5,
          title: "Exactly what we needed.",
          body: "We put it in the living room during the July heat period and now everyone knows whose turn it is. It is quiet enough to read or work in, and the chair is much more comfortable than I expected.",
          author: "Marta L., Rotterdam",
        },
        {
          stars: 4,
          title: "Does the job.",
          body: "Cooling is good and the controls are simple. We mainly use it in the afternoon when the front rooms get too warm. It takes up more floor space than you think, so measure first.",
          author: "Daniel P., Lyon",
        },
        {
          stars: 3,
          title: "Good, but the cable is a bit short.",
          body: "Keeps the temperature comfortable and the seat is good for a few hours. The power cable could be longer — we had to move a side table to reach the socket.",
          author: "Elena R., Valencia",
        },
      ],
      qa: [
        {
          q: "Does the SoloCool 1 need to be installed?",
          a: "No. The SoloCool 1 is delivered as a single unit and only needs a level indoor floor and a standard 230V socket. Allow 10 cm clearance around the rear and sides for ventilation.",
        },
      ],
    },
  },
  {
    id: "shiftcool-1",
    name: "NESTA ShiftCool 1",
    aisle: "Work & focus",
    year: "2033",
    price: "€2,890",
    line: "A cooled break space for one person.",
    image: "/shelflife/shiftcool-1.jpg",
    listing: {
      delivery:
        "Delivery and placement from €120. Delivered to ground-floor workplace locations within 10–15 working days. Site access check available before order.",
      specs: [
        {
          label: "External size",
          value: "115 × 120 × 210 cm; enclosed seating space for one adult",
        },
        {
          label: "Cooling",
          value:
            "Maintains a working temperature of 20–24°C in ambient conditions up to 45°C",
        },
        {
          label: "Power",
          value:
            "230V mains connection; integrated 2.0 kWh backup battery provides up to 3 hours of cooling during a power interruption",
        },
        {
          label: "Materials",
          value:
            "Powder-coated steel outer panels, insulated composite body, tempered glass door and commercial-grade vinyl seating",
        },
        {
          label: "Weight",
          value: "210 kg; fitted with four adjustable steel feet for fixed indoor installation",
        },
      ],
      reviews: [
        {
          stars: 5,
          title: "A useful addition to the floor.",
          body: "We installed two near the packing area last summer. They are used constantly during the hottest part of the shift. Simple to clean and the cooling is reliable.",
          author: "Operations Manager, Eindhoven",
        },
        {
          stars: 4,
          title: "Does what it is supposed to do.",
          body: "We use ours for short recovery breaks and phone calls. The door closes properly and it stays noticeably cooler than the main warehouse.",
          author: "Facilities Team, Ghent",
        },
        {
          stars: 3,
          title: "Good, but the screen is too bright at night.",
          body: "The cooling works well and it is solidly built. Our night shift asked us to dim the status screen because it is visible across the floor.",
          author: "Shift Supervisor, Duisburg",
        },
      ],
      qa: [
        {
          q: "Can the ShiftCool 1 be installed on a factory or warehouse floor?",
          a: "Yes. The ShiftCool 1 is designed for indoor workplaces including warehouses, workshops and production areas. It requires a level floor, a standard 230V connection and 15 cm clearance at the rear ventilation panel.",
        },
      ],
    },
  },
  {
    id: "omakase-a5",
    name: "Omakase A5, grown in Osaka",
    aisle: "Food & drink",
    year: "2031",
    price: "€38",
    line: "Cultivated wagyu, marbled to order, never a cow in sight.",
  },
  {
    id: "dewpoint-40",
    name: "DewPoint 40",
    aisle: "Home & climate",
    year: "2040",
    price: "€420",
    line: "Forty litres a week, harvested from the air you already have.",
  },
  {
    id: "recall-locket",
    name: "Recall Locket",
    aisle: "Family & care",
    year: "2040",
    price: "€129 + €6/mo",
    line: "A day's memories, backed up. Yours stay yours.",
  },
  {
    id: "stowaway-trike",
    name: "Stow-Away Cargo Trike",
    aisle: "Mobility",
    year: "2030",
    price: "€2,300",
    line: "Carries the week's shopping, folds to a suitcase.",
  },
  {
    id: "nightshift-lamp",
    name: "Nightshift Lamp",
    aisle: "Work & focus",
    year: "2037",
    price: "€85",
    line: "Knows which shift you are on and lights the room for it.",
  },
  {
    id: "seed-vault-24",
    name: "Heirloom Seed Vault, 24-year",
    aisle: "Home & climate",
    year: "2044",
    price: "€310",
    line: "Two dozen seasons of the garden you had, kept at four degrees.",
  },
  {
    id: "shutdown-room",
    name: "Shutdown Room, weekend pass",
    aisle: "Play & escape",
    year: "2036",
    price: "€140",
    line: "Forty-eight hours with nothing connected. Snacks included.",
  },
  {
    id: "zone-pass",
    name: "Zone 1–3 Pass, driverless",
    aisle: "Mobility",
    year: "2033",
    price: "€62/mo",
    line: "Any pod, any hour, three zones. Luggage counts as a seat.",
  },
  {
    id: "kettle-share",
    name: "Neighbourhood Kettle, 6-home share",
    aisle: "Food & drink",
    year: "2039",
    price: "€9/mo",
    line: "One very good kettle between six kitchens. Boils on the surge.",
  },
];
