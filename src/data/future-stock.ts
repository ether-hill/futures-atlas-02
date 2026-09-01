/**
 * Future Stock — the future-product prompt generator and its inventory.
 *
 * v1 generates PROMPTS, not products: the visitor assembles a scenario (aisle,
 * year, what changed about the world, optionally their own hunch) and gets two
 * copyable prompts — one for their image tool (Midjourney, DALL-E, …), one for
 * their chatbot (ChatGPT, Claude, …). No API call anywhere; the assembly is
 * deterministic and lives here so the page stays a static shell.
 *
 * STOCK is the living inventory: the keepers. Run the prompts, and when a
 * result makes you go hmmm, drop the image in public/future-stock/ and add an
 * entry here — `prompt` records the provenance. The shelf is the artifact.
 */

export interface FutureStockOption {
  id: string;
  label: string;
  /** the clause spliced into the prompts */
  clause: string;
}

export const AISLES: FutureStockOption[] = [
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
export const FORCES: FutureStockOption[] = [
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
export const SHOTS: FutureStockOption[] = [
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
  aisle: FutureStockOption;
  year: string;
  force: FutureStockOption;
  shot: FutureStockOption;
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
  author: string; // "Marta L., Rotterdam"
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
  image?: string; // /future-stock/<id>.jpg once generated; fa-hatch plate until then
  prompt?: string; // provenance: the image prompt that made it
  listing?: ProductListing; // the quickview copy
}

/** Seed inventory — placeholders to be replaced by generated keepers. */
export const STOCK: FutureProduct[] = [
  {
    id: "clarity-duo",
    name: "Clarity Duo",
    aisle: "Health & body",
    year: "2032",
    price: "€640",
    line: "Hearing aids that translate nine languages as you listen.",
  },
  {
    id: "solocool-1",
    name: "NESTA SoloCool 1",
    aisle: "Home & climate",
    year: "2035",
    price: "€1,249",
    line: "A cool, quiet place to sit when the rest of the house is too warm.",
    image: "/future-stock/solocool-1.jpg",
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
    id: "stillpoint-s1",
    name: "Stillpoint S1",
    aisle: "Work & focus",
    year: "2033",
    price: "€3,900 or €89/mo",
    line: "Ten minutes of nowhere, installed on the shop floor.",
    image: "/future-stock/stillpoint-s1.jpg",
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
];
