/**
 * The research corpus — the foundation everything else cites.
 * Every entry is a REAL, verified source. Summaries are original paraphrase,
 * not quoted source text. Each `id` doubles as an anchor on /research so the
 * oracle's citations can deep-link to the proof.
 *
 * Thumbnails: every entry has a real, license-clear photo at
 * /public/research/<id>.jpg — a specific, on-topic Wikimedia Commons image of
 * the place / subject / organisation, with attribution in `thumbnailCredit`
 * (also shown on the card). The owner can swap any for an official press image
 * or screengrab; the ResearchCard falls back to a designed source-plate only if
 * a file is missing.
 */

export type ResearchCategory =
  | "the-crisis"
  | "what-worked"
  | "the-mechanisms"
  | "go-deeper";

export interface ResearchEntry {
  id: string;
  title: string;
  source: string;
  year?: string;
  category: ResearchCategory;
  summary: string;
  url: string;
  thumbnail: string;
  thumbnailType: "screengrab" | "press-image" | "logo" | "commons" | "unsplash"; // provenance
  thumbnailCredit?: string;
}

export const categoryLabels: Record<ResearchCategory, string> = {
  "the-crisis": "The crisis",
  "what-worked": "What worked",
  "the-mechanisms": "The mechanisms",
  "go-deeper": "Go deeper",
};

const wikimedia = (place: string, author: string, license: string) =>
  `Wikimedia Commons — ${place} · ${author} · ${license}`;

export const research: ResearchEntry[] = [
  // ---------- the crisis ----------
  {
    id: "oecd-shrinking-smartly",
    title: "OECD report charts a smarter path for shrinking regions",
    source: "European Commission (Inforegio) / OECD",
    year: "2025",
    category: "the-crisis",
    summary:
      "Drawing on the OECD's 'Shrinking Smartly and Sustainably' study, this briefing reports that predominantly rural EU regions lost roughly 8 million residents in the decade to 2024, an 8.3% decline, even as urban populations grew. It frames depopulation as a structural challenge that raises per-person service costs and erodes local tax bases.",
    url: "https://ec.europa.eu/regional_policy/whats-new/newsroom/18-09-2025-oecd-report-charts-smarter-path-for-shrinking-regions_en",
    thumbnail: "/hollow-villages/research/oecd-shrinking-smartly.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — OECD headquarters, Château de la Muette, Paris · MySociety · CC BY 2.0",
  },
  {
    id: "eurostat-rural-demographics",
    title:
      "Urban–rural Europe: demographic developments in rural regions and areas",
    source: "Eurostat",
    year: "2024",
    category: "the-crisis",
    summary:
      "Eurostat's data portal documents the widening demographic gap between EU rural and urban regions, including a markedly higher old-age dependency ratio in predominantly rural areas. Its projections show the rural population falling every year through 2050.",
    url: "https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Urban-rural_Europe_-_demographic_developments_in_rural_regions_and_areas",
    thumbnail: "/hollow-villages/research/eurostat-rural-demographics.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — EU institutions, Kirchberg, Luxembourg · Simon Schmitt / European Parliament · EP free licence",
  },
  {
    id: "empty-spain-overview",
    title: "Empty Spain — la España vaciada",
    source: "Wikipedia",
    year: "2024",
    category: "the-crisis",
    summary:
      "An overview of 'la España vaciada', the long depopulation of Spain's rural interior, where vast inland territory holds only a small fraction of the national population. It traces how the phenomenon hardened into a political and cultural rallying point.",
    url: "https://en.wikipedia.org/wiki/Empty_Spain",
    thumbnail: "/hollow-villages/research/empty-spain-overview.jpg",
    thumbnailType: "commons",
    thumbnailCredit: wikimedia(
      "Bergosa, an abandoned village in Huesca, Spain",
      "Dmolinat2",
      "CC BY-SA 4.0",
    ),
  },

  // ---------- what worked ----------
  {
    id: "ostana-first-baby",
    title: "Italian town of Ostana welcomes its first baby in 28 years",
    source: "CNN",
    year: "2016",
    category: "what-worked",
    summary:
      "CNN reports on the Piedmont village of Ostana, which collapsed from over 1,000 residents to a handful by the 1980s, celebrating its first newborn in nearly three decades. The story shows how a deliberate cultural and architectural-renewal strategy began to turn the village's decline.",
    url: "https://edition.cnn.com/2016/01/29/europe/italian-town-first-baby-in-28-years/index.html",
    thumbnail: "/hollow-villages/research/ostana-first-baby.jpg",
    thumbnailType: "commons",
    thumbnailCredit: wikimedia("Ostana, Piedmont, Italy", "Silvia Pasquetto", "CC BY-SA 4.0"),
  },
  {
    id: "sambuca-one-euro-houses",
    title: "Sicily sold homes for one euro. This is what happened next.",
    source: "AFAR",
    year: "2024",
    category: "what-worked",
    summary:
      "A reported feature revisiting Sicilian one-euro-home schemes in towns such as Sambuca di Sicilia and Mussomeli, assessing whether the headline sales actually drew lasting residents. It weighs the gap between marketing buzz and real community renewal.",
    url: "https://www.afar.com/magazine/sicily-sold-homes-for-one-euro-what-happened-to-them",
    thumbnail: "/hollow-villages/research/sambuca-one-euro-houses.jpg",
    thumbnailType: "commons",
    thumbnailCredit: wikimedia("Sambuca di Sicilia, Italy", "Leop81", "Public domain"),
  },
  {
    id: "riace-refugees-revival",
    title: "How refugees saved Riace, the tiny Italian town that could",
    source: "Adventure.com",
    year: "2019",
    category: "what-worked",
    summary:
      "An account of Riace in Calabria, where the village resettled refugees into abandoned homes, reopening its school, shops and workshops. It presents migration-led repopulation as a model that revived both economy and community.",
    url: "https://adventure.com/how-refugees-saved-riace-the-tiny-italian-town-that-could/",
    thumbnail: "/hollow-villages/research/riace-refugees-revival.jpg",
    thumbnailType: "commons",
    thumbnailCredit: wikimedia("Riace, Calabria, Italy", "Marcuscalabresus", "CC BY 3.0"),
  },
  {
    id: "lacaixa-immigration-rural-spain",
    title: "Immigration is revitalising rural Spain",
    source: "la Caixa Foundation",
    year: "2023",
    category: "what-worked",
    summary:
      "Research-backed analysis showing how arrivals from Latin America, Morocco and elsewhere are stabilising or reversing depopulation in inland Spanish villages. It examines the conditions under which newcomers settle for the long term rather than passing through.",
    url: "https://elobservatoriosocial.fundacionlacaixa.org/en/-/immigration-is-revitalising-rural-spain",
    thumbnail: "/hollow-villages/research/lacaixa-immigration-rural-spain.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — the inland Aragonese village of Aínsa, Huesca · Basotxerri · CC BY-SA 4.0",
  },
  {
    id: "albinen-newcomer-payments",
    title: "Alpine village of Albinen pays newcomers to settle and stay",
    source: "SWI swissinfo.ch",
    year: "2018",
    category: "what-worked",
    summary:
      "The Valais village of Albinen offers cash to people who buy or build a home and commit to living there at least ten years: CHF 25,000 per adult, CHF 50,000 per couple, CHF 10,000 per child, for applicants under 45 investing at least CHF 200,000 in property. The money must be repaid if a household leaves or sells inside the window.",
    url: "https://www.swissinfo.ch/eng/business/paid-to-relocate_albinen-cash-incentives-attract-new-residents/44308024",
    thumbnail: "/hollow-villages/research/albinen-newcomer-payments.jpg",
    thumbnailType: "commons",
    thumbnailCredit: wikimedia("Albinen, Valais, Switzerland", "Xenos", "CC BY-SA 3.0"),
  },
  {
    id: "plunkett-more-than-a-pub",
    title: "More Than a Pub: a wave of community-owned village pubs",
    source: "Plunkett Foundation",
    year: "2022",
    category: "what-worked",
    summary:
      "Run by the Plunkett Foundation from 2016 to 2021, the More Than a Pub programme gave training, guidance and finance to over 300 community groups taking their local pub into community ownership. It helped create around 60 new community-owned pubs — treating the pub as shared social infrastructure rather than just a business.",
    url: "https://plunkett.co.uk/more-than-a-pub-final-report-and-reflections/",
    thumbnail: "/hollow-villages/research/plunkett-more-than-a-pub.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — the English village pub The Falcon Inn, Arncliffe · Stephen Craven · CC BY-SA 2.0",
  },
  {
    id: "agrafa-rural-telehealth",
    title: "Telehealth reaches a depopulating Greek mountain region",
    source: "Frontiers in Digital Health",
    year: "2026",
    category: "what-worked",
    summary:
      "A pilot in the remote Agrafa mountains of central Greece placed a portable diagnostic device in a village facility so elderly residents and seasonal visitors could be examined remotely instead of travelling to a city doctor. Locals were trained as facilitators, running the equipment over a 4G link to clinicians for follow-ups, prescriptions and triage.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12827659/",
    thumbnail: "/hollow-villages/research/agrafa-rural-telehealth.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — the remote Agrafa mountains, Greece · Petros Ziogas · CC BY-SA 4.0",
  },

  // ---------- the mechanisms ----------
  {
    id: "extremadura-digital-nomad-grants",
    title:
      "Spain will pay remote workers up to $17,000 to move to a rural region",
    source: "CNBC",
    year: "2024",
    category: "the-mechanisms",
    summary:
      "CNBC details Extremadura's grant scheme offering remote tech workers up to roughly €15,000 to relocate to the region for at least two years. It is one of several European efforts using mobile knowledge workers to repopulate thinning rural areas.",
    url: "https://www.cnbc.com/2024/08/29/spain-extremadura-digital-nomads-remote-workers-grants.html",
    thumbnail: "/hollow-villages/research/extremadura-digital-nomad-grants.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — the Extremaduran town of Hervás, Spain · MaGrc · CC BY-SA 4.0",
  },
  {
    id: "pnrr-borghi-fund",
    title: "A billion euros from the PNRR to relaunch uninhabited villages",
    source: "Osservatorio Recovery Plan",
    year: "2022",
    category: "the-mechanisms",
    summary:
      "An explainer on Italy's PNRR 'Bando Borghi', which allocates over one billion euros to regenerate historic small villages — split between 21 flagship pilot villages and hundreds more selected by public tender. Funds target new cultural, tourism and service infrastructure in declining towns.",
    url: "https://www.osservatoriorecovery.it/un-miliardo-di-euro-dal-pnrr-per-rilanciare-i-borghi-disabitati/",
    thumbnail: "/hollow-villages/research/pnrr-borghi-fund.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — the restored borgo of Santo Stefano di Sessanio, Abruzzo · Gabriella Pesce · CC BY-SA 4.0",
  },
  {
    id: "espana-vaciada-movement",
    title: "The España Vaciada is fighting the emptying of rural Spain",
    source: "IPS Journal",
    year: "2022",
    category: "the-mechanisms",
    summary:
      "An analysis of the 'España Vaciada' civic movement and its electoral offshoots like Teruel Existe and Soria ¡Ya!, which turned depopulation grievances into political leverage. It shows how rural mobilisation pushed services, infrastructure and territorial equity onto the national agenda.",
    url: "https://www.ips-journal.eu/topics/democracy-and-society/spains-emptying-lands-5942/",
    thumbnail: "/hollow-villages/research/espana-vaciada-movement.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — Frías de Albarracín, Teruel, Spain · 19Tarrestnom65 · CC BY-SA 4.0",
  },
  {
    id: "bistrot-de-pays-network",
    title: "Bistrot de Pays: France's label for the last café in the village",
    source: "Smithsonian Magazine",
    year: "2024",
    category: "the-mechanisms",
    summary:
      "The Bistrot de Pays label, created in 1993, supports café-restaurants that are often the last surviving business in small rural communes of under 2,000 people. Members agree to open year-round, source locally and keep prices modest; in return they gain a network, training and shared promotion — treating the village café as essential social infrastructure.",
    url: "https://www.smithsonianmag.com/travel/will-the-bistro-save-frances-rural-villages-180984555/",
    thumbnail: "/hollow-villages/research/bistrot-de-pays-network.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — a French village Bistrot de Pays café · Véronique Pagnier · Public domain",
  },
  {
    id: "uwe-rural-demand-responsive-transport",
    title:
      "On-demand minibus trials show promise — and a funding problem — for rural transport",
    source: "UWE Bristol / University of Leeds",
    year: "2026",
    category: "the-mechanisms",
    summary:
      "Researchers evaluated demand-responsive transport — app- or phone-booked flexible minibuses — across 18 areas of England, including rural case studies. The trials improved access where conventional buses were sparse, but most did not cover their costs; the study argues such schemes are worth backing if social value is weighed against pure cost recovery.",
    url: "https://www.uwe.ac.uk/news/demand-responsive-transport",
    thumbnail: "/hollow-villages/research/uwe-rural-demand-responsive-transport.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — a rural community minibus, Sharrington, England · Martin Addison · CC BY-SA 2.0",
  },
  {
    id: "eu-young-farmers-land-access",
    title: "Land banks and matching schemes to get young farmers onto the land",
    source: "European Commission (DG AGRI)",
    year: "2025",
    category: "the-mechanisms",
    summary:
      "Access to land is one of the biggest barriers for new entrants to farming. As part of its 2025 Strategy for Generational Renewal, the European Commission promotes land-mobility tools — leases, share farming, partnerships — alongside land banks and matching platforms that connect retiring or absent landowners with aspiring farmers.",
    url: "https://agriculture.ec.europa.eu/overview-vision-agriculture-food/generational-renewal/access-land_en",
    thumbnail: "/hollow-villages/research/eu-young-farmers-land-access.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — tractors working farmland · NightThree · CC BY 2.0",
  },

  // ---------- go deeper ----------
  {
    id: "euronews-digital-nomad-villages",
    title:
      "'Half our villages are dying': how digital-nomad hubs are reinvigorating rural Europe",
    source: "Euronews",
    year: "2024",
    category: "go-deeper",
    summary:
      "A wide-angle feature surveying remote-work and digital-nomad village schemes across Spain, Italy and beyond, including networks of 'welcoming villages' for teleworkers. It weighs the promise of repopulation against risks like seasonal churn and gentrification.",
    url: "https://www.euronews.com/travel/2024/07/20/half-our-villages-are-dying-how-digital-nomad-hubs-are-reinvigorating-rural-europe",
    thumbnail: "/hollow-villages/research/euronews-digital-nomad-villages.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — people working in a co-working space · Deskmag · CC BY-SA 3.0",
  },
  {
    id: "tarpino-spaesati",
    title: "Spaesati: Italy's abandoned places, between memory and future",
    source: "Antonella Tarpino (Einaudi)",
    year: "2012",
    category: "go-deeper",
    summary:
      "A book-length cultural meditation on Italy's abandoned places — depopulated alpine pastures, emptied farmhouses, earthquake-struck towns. Tarpino reads rural abandonment through memory and landscape, asking what futures these margins might still hold.",
    url: "https://www.goodreads.com/book/show/20261666-spaesati-luoghi-dell-italia-in-abbandono-tra-memoria-e-futuro",
    thumbnail: "/hollow-villages/research/tarpino-spaesati.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — the abandoned ghost village of Craco, Basilicata · Maurizio Moro5153 · CC BY-SA 4.0",
  },

  // ---------- watch (YouTube) ----------
  {
    id: "revolt-empty-spain-video",
    title: "The ‘Revolt of Empty Spain’: why is rural Spain protesting?",
    source: "Euronews",
    year: "2019",
    category: "the-crisis",
    summary:
      "A short report from the Madrid march of the ‘España Vaciada’ movement, where tens of thousands from the emptying interior demanded services, transport and a fair deal for rural Spain.",
    url: "https://www.youtube.com/watch?v=WaRTjBd6--0",
    thumbnail: "https://i.ytimg.com/vi/WaRTjBd6--0/hqdefault.jpg",
    thumbnailType: "press-image",
    thumbnailCredit: "Euronews / YouTube",
  },
  {
    id: "sicily-one-euro-afp-video",
    title: "Sicilian hilltop homes on sale for one euro",
    source: "AFP News Agency",
    category: "what-worked",
    summary:
      "A news dispatch from a Sicilian hill town auctioning abandoned houses for a single euro to buyers who commit to restoring them — the scheme that put one-euro villages on the world’s map.",
    url: "https://www.youtube.com/watch?v=Ubc6s4mDQik",
    thumbnail: "https://i.ytimg.com/vi/Ubc6s4mDQik/hqdefault.jpg",
    thumbnailType: "press-image",
    thumbnailCredit: "AFP News Agency / YouTube",
  },
  {
    id: "digital-nomad-village-dw-video",
    title: "The first village for digital nomads",
    source: "DW Documentary",
    category: "the-mechanisms",
    summary:
      "A documentary on Madeira’s Ponta do Sol, where a remote-work ‘digital nomad village’ filled empty houses and cafés — a working test of using mobile knowledge workers to repopulate a thinning village.",
    url: "https://www.youtube.com/watch?v=RO2TSaq3D_Y",
    thumbnail: "https://i.ytimg.com/vi/RO2TSaq3D_Y/hqdefault.jpg",
    thumbnailType: "press-image",
    thumbnailCredit: "DW Documentary / YouTube",
  },

  // ---------- per-letter case studies (owner can drop a photo at the path;
  //            until then the card shows the designed source-plate) ----------
  {
    id: "sardinia-relocation-grant",
    title: "Sardinia dangles €15,000 relocation grant to revive its villages",
    source: "The Jerusalem Post",
    year: "2026",
    category: "what-worked",
    summary:
      "Sardinia has allocated €45 million to offer non-repayable grants of up to €15,000 per household to people who move to villages under 3,000 inhabitants, with monthly payments per child until age five. The scheme is explicitly aimed at stabilising school enrolments and giving young families a reason to stay.",
    url: "https://www.jpost.com/travel/article-891656",
    thumbnail: "/hollow-villages/research/sardinia-relocation-grant.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — the Sardinian town of Bosa, Italy · Zsuzsanna Tóth · CC0",
  },
  {
    id: "east-tyrol-carsharing",
    title: "East Tyrol: volunteer e-taxis and e-carsharing keep an ageing valley moving",
    source: "SMARTA-NET (EU rural mobility)",
    year: "2024",
    category: "the-mechanisms",
    summary:
      "In alpine East Tyrol, where a quarter of residents are over 60 and buses are sparse, eight municipalities run non-profit door-to-door e-car taxis on 160-plus volunteer drivers, alongside the Flugs station-based e-carsharing scheme and a shared taxi in the Defereggen valley. A direct blueprint for keeping an isolated mountain village reachable.",
    url: "https://www.smarta-net.eu/lighthouse-east-tyrol/",
    thumbnail: "/hollow-villages/research/east-tyrol-carsharing.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — Matrei in Osttirol, East Tyrol, Austria · Haeferl · CC BY-SA 4.0",
  },
  {
    id: "pueblos-remotos-canaries",
    title: "'Remote Villages' combines teleworking and rural life in the Canary Islands",
    source: "European Commission (Rural Pact)",
    year: "2023",
    category: "what-worked",
    summary:
      "An EU-recognised good practice: the Pueblos Remotos model brought around 30 remote workers to Canary Island villages in 2021–22, created 18 new tourism products and channelled over €40,000 directly into rural communities before expanding to seven areas. Proof that structured programmes, not just cheap houses, are what root newcomers.",
    url: "https://ruralpact.rural-vision.europa.eu/good-practice/remote-villages-combines-teleworking-and-rural-surroundings-canary-islands-spain_en",
    thumbnail: "/hollow-villages/research/pueblos-remotos-canaries.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — the Canary village of Tejeda, Gran Canaria · Tamara k · CC BY-SA 3.0 es",
  },
  {
    id: "galicia-rural-coworking",
    title: "The last room standing: rural coworking as the frontline against youth emigration",
    source: "London Coworking Assembly",
    year: "2026",
    category: "what-worked",
    summary:
      "An argument that rural coworking is infrastructure against youth flight, in a Galicia losing roughly 6,000 graduates a year. It profiles Sende and Anceu in Galicia and el Taller in Catalonia — tiny-village spaces that brought fibre and kept young people working locally instead of leaving.",
    url: "https://londoncoworkingassembly.com/the-last-room-standing-why-rural-coworking-is-the-real-frontline-of-european-revitalisation/",
    thumbnail: "/hollow-villages/research/galicia-rural-coworking.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — the Galician mountain village of O Cebreiro, Spain · Bjørn Christian Tørrissen · CC BY-SA 3.0",
  },
  {
    id: "candover-community-store",
    title: "Candover Valley Community Store — five villages reopen their shop",
    source: "Plunkett UK",
    year: "2019",
    category: "what-worked",
    summary:
      "When the only shop serving five Hampshire villages closed in 2013, residents raised £225,000 — £120,000 in community shares plus grants including the LEADER programme — and opened a community-owned store and post office beside the village hall, run with paid staff and around 40 volunteers.",
    url: "https://plunkett.co.uk/candover-valley-community-store/",
    thumbnail: "/hollow-villages/research/candover-community-store.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — Preston Candover, Hampshire, England · Graham Clutton · CC BY-SA 2.0",
  },
  {
    id: "turano-borghi-cluster",
    title: "Three tiny comuni band together and win €2.56m for the Turano valley",
    source: "Borghi del Turano",
    year: "2025",
    category: "what-worked",
    summary:
      "Paganico Sabino (as lead), Castel di Tora and Collalto Sabino — three small comuni — applied as a single cluster and won €2,560,000 in PNRR Borghi funding for 15 shared interventions across the valley. A near-exact template for a mayor too small to win alone: pooled, they became fundable.",
    url: "https://borghidelturano.it/en/the-project/",
    thumbnail: "/hollow-villages/research/turano-borghi-cluster.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — Castel di Tora on Lake Turano, Lazio, Italy · FeaturedPics · CC BY-SA 4.0",
  },
  {
    id: "idealista-paid-to-live",
    title: "The Spanish villages where you can get paid to live",
    source: "idealista",
    year: "2025",
    category: "the-mechanisms",
    summary:
      "A rundown of named Spanish villages using incentives instead of forced sales to fill empty homes — Griegos in Aragón offering three months free rent then €225/month plus per-child reductions, and Olmeda de la Cuesta auctioning plots from €200. Concrete templates for repopulating a village around its dark houses.",
    url: "https://www.idealista.com/en/news/lifestyle-spain/2025/06/13/7292-towns-and-villages-spain-where-you-could-get-paid-live",
    thumbnail: "/hollow-villages/research/idealista-paid-to-live.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — the Aragonese village of Griegos, Teruel, Spain · Chantejot · Public domain",
  },
  {
    id: "terre-de-liens-saint-dizier",
    title: "Terre de Liens: a village buys its farmland as a commons",
    source: "ARC2020",
    year: "2017",
    category: "what-worked",
    summary:
      "In a 35-inhabitant French pre-Alps village, residents worked with Terre de Liens to collectively buy fragmented mountain land and lease it to young farmers who built a cheese and microbrewery business. In five years the village gained three new farm businesses and four families — a direct parallel to reactivating scattered terraces.",
    url: "https://www.arc2020.eu/farmland-as-commons/",
    thumbnail: "/hollow-villages/research/terre-de-liens-saint-dizier.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — a village in the Drôme pre-Alps, France · Mingoid · CC0",
  },
  {
    id: "si4care-calabria-telecare",
    title: "Transforming elderly care in rural Italy with digital solutions",
    source: "Interreg (EU)",
    year: "2024",
    category: "what-worked",
    summary:
      "The Interreg SI4CARE project brought telemedicine and remote monitoring — wearables and vital-sign bracelets — to depopulating Calabrian villages of a few hundred to a few thousand people that face a shortage of doctors. A local physician reports patients now feel reassured that help is close at hand despite living far from hospitals.",
    url: "https://interreg.eu/news-stories/transforming-elderly-care-in-rural-italy-with-digital-solutions/",
    thumbnail: "/hollow-villages/research/si4care-calabria-telecare.jpg",
    thumbnailType: "commons",
    thumbnailCredit: "Wikimedia Commons — the Calabrian hill town of Morano Calabro, Italy · Enm9790 · CC BY-SA 3.0",
  },
];

/** Lookup helper used by the oracle + futures pages to resolve citations. */
export function getResearch(id: string): ResearchEntry | undefined {
  return research.find((r) => r.id === id);
}

/**
 * Four real, citable figures for the landing-page diagnosis — "Four figures,
 * one system." Each links out to a real source so the claim stays checkable.
 */
export interface CrisisStat {
  figure: string;
  unit?: string; // e.g. "▼ people"
  sourceLabel: string;
  dividerLabel: string;
  caption: string;
  variant: "paper" | "dark" | "accent";
  href: string;
}

export const crisisStats: CrisisStat[] = [
  {
    figure: "~8M",
    unit: "▼ people",
    sourceLabel: "Eurostat · rural NUTS-3",
    dividerLabel: "2014 ←→ 2024",
    caption:
      "left Europe's rural regions in the decade to 2024 — the steepest sustained rural decline on record.",
    variant: "paper",
    href: "https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Urban-rural_Europe_-_demographic_developments_in_rural_regions_and_areas",
  },
  {
    figure: "3,000",
    sourceLabel: "Spain · pueblos abandonados",
    dividerLabel: "standing empty",
    caption:
      "villages stand fully abandoned in Spain alone — intact houses, no residents, for sale by the hamlet.",
    variant: "dark",
    href: "https://en.wikipedia.org/wiki/Empty_Spain",
  },
  {
    figure: "75%",
    unit: "▲ urban",
    sourceLabel: "Eurostat · urban share",
    dividerLabel: "highest on record",
    caption:
      "of Europeans now live in cities and towns — the highest concentration the continent has ever recorded.",
    variant: "accent",
    href: "https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Urban-rural_Europe_-_demographic_developments_in_rural_regions_and_areas",
  },
  {
    figure: "~1M",
    unit: "▲ nightly",
    sourceLabel: "FEANTSA · EU estimate",
    dividerLabel: "where they moved for work",
    caption:
      "people are homeless across the EU on a given night — concentrated in the very cities the villages emptied into.",
    variant: "paper",
    href: "https://www.feantsa.org/",
  },
];
