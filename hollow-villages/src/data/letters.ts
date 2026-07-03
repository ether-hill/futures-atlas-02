/**
 * Letters to the Oracle. Ten correspondents, each a different pressure point,
 * so the replies collectively map the crisis from the inside.
 *
 * The oracle does NOT solve the surface complaint ("no bus → get a bus"). It
 * names the SYSTEM the complaint is a symptom of, then answers at the level of
 * the system:
 *
 *   reframe    — what they named (symptom) vs the pattern underneath (system),
 *                a bold thesis, and the village in 2050 if the system flips.
 *   levers     — radical-but-real moves that get it there.
 *   actors     — who can do what, tier by tier (optional per letter).
 *   articleIds — real precedents, resolved against the research corpus.
 *   resources  — real, currently-open funding & support programmes (verified).
 *
 * Every articleId is a verified entry in src/data/research.ts (with its own
 * thumbnail). Every resource is a real programme with a working page; the
 * response renders the administering body's favicon as its logo.
 */

export interface Correspondent {
  name: string;
  age: number;
  role?: string;
  place?: string; // composite descriptor, never a real named town
}

export interface Reframe {
  symptom: string; // what they named
  system: string; // the systemic pattern underneath (the reframe)
  thesis: string; // one bold sentence — the visionary turn
  vision2050: string; // 2–4 sentences: the village in 2050 if the system flips
}

export interface Lever {
  n: string; // "01"
  title: string;
  detail: string;
}

export interface Actor {
  tier: string; // "You, now" · "The village" · "Region & nation"
  who: string; // one line on what this level can move
  moves: string[];
}

export interface Resource {
  kind: "Funding" | "Support" | "Toolkit" | "Network";
  name: string;
  org: string;
  detail: string;
  url: string;
  domain: string; // for the org favicon shown as a logo
}

export interface Letter {
  id: string;
  correspondent: Correspondent;
  pressurePoint: string;
  body: string; // first person, in their voice
  reframe: Reframe;
  levers: Lever[];
  actors?: Actor[];
  articleIds: string[]; // resolved against the research corpus
  resources: Resource[];
  futurePairId: string;
}

export const letters: Letter[] = [
  /* ─────────────────────────── ANNA, 8 ─────────────────────────── */
  {
    id: "anna-8",
    correspondent: { name: "Anna", age: 8, role: "the only child in the village", place: "an Alpine hamlet" },
    pressurePoint: "Youth drain",
    body: "Dear Oracle, my name is Anna and I am 8. I am the only kid in my class now because Matteo moved away before the winter. The teacher only comes three days and the other days I do the work on my own at the kitchen table. My nonna says when she was little the village was full of children. I don't really believe her. Is it true? And if it's true, can it be full again?",
    reframe: {
      symptom: "You're the only child left, and the teacher only comes three days a week.",
      system:
        "An empty classroom is never the first thing to go wrong — it's the last. When work thins out and homes get expensive and the bus stops coming, the young families leave first, and the school empties a few years later. So a village doesn't lose its children because children stopped being born. It loses them because it slowly stopped being a place a young family could say yes to. That's a chain of decisions, Anna, and decisions can be made the other way.",
      thesis:
        "Your nonna is telling the truth — and a village that emptied of children on purpose can fill back up on purpose.",
      vision2050:
        "By 2050 you're not the only one in the class. The old school is the busiest room in the village — the eighty-year-olds teach the eight-year-olds, and something happens there after the lessons end. A young family took the empty house by the church because someone made it worth their while, and their kids walk to school with a younger one you look out for. There's a loud afternoon in the square each spring that you'll remember, one day, as the start of it.",
    },
    levers: [
      {
        n: "01",
        title: "Keep the school by making it more than a school",
        detail:
          "A village loses its children fastest when it loses the school, so the school has to become the thing worth keeping. Turn the building into the busy heart of the place — a room where elders teach, where things happen after class, where the whole village has a reason to walk in. Ostana in Piedmont went from a thousand people to a handful, then rebuilt around exactly this kind of cultural renewal and welcomed its first baby in twenty-eight years.",
      },
      {
        n: "02",
        title: "Give one young family a real reason to come",
        detail:
          "Children arrive with parents, and parents go where there's a home they can afford and a hand to settle in. The move that works isn't a slogan — it's money and a house: some Alpine villages simply pay young families to move and stay a decade; others hand over an empty house for almost nothing on the condition you fix it up and live in it.",
      },
      {
        n: "03",
        title: "Put the village back on the map",
        detail:
          "A spring festival or a summer camp brings the first new faces, and a few of them come back to live. This isn't wishful thinking — national village-revival funds exist to pay for exactly this, and a small place that organises itself is precisely what they're looking to back.",
      },
    ],
    actors: [
      {
        tier: "You, now",
        who: "What one eight-year-old can actually move",
        moves: [
          "When a new family comes to look at the village, be the one who shows their kids around. A child who's happy here is the best reason a family ever gets to stay.",
          "Tell your teacher you want the school to be open on the other days too — for anything, not just lessons. A used building is a building nobody closes.",
        ],
      },
      {
        tier: "The village",
        who: "What a mayor or council can start this year",
        moves: [
          "Write a Smart Village strategy with the local action group — the one document that unlocks school, housing and repopulation money as a single package.",
          "Copy Albinen: vote a relocation grant for young families and pair it with an empty house handed over cheap for restoration.",
          "Bid into the national villages fund for the festival, the camp, the renovated school-as-hub.",
        ],
      },
    ],
    articleIds: ["ostana-first-baby", "albinen-newcomer-payments", "sardinia-relocation-grant"],
    resources: [
      {
        kind: "Funding",
        name: "Support for Smart Villages strategies (CAP / LEADER)",
        org: "European Commission · DG Agriculture & Rural Development",
        detail:
          "Under the 2023–27 CAP, EU rural-development money funds bottom-up Smart Village strategies through LEADER, explicitly covering basic services like schools, health and transport. A hamlet like Anna's can work with its Local Action Group to design a strategy that keeps the school open and rebuilds the services young families need.",
        url: "https://agriculture.ec.europa.eu/common-agricultural-policy/rural-development/supporting-smart-village-strategies_en",
        domain: "agriculture.ec.europa.eu",
      },
      {
        kind: "Funding",
        name: "Piano Nazionale Borghi (National Villages Plan)",
        org: "Italy · Ministry of Culture / Cassa Depositi e Prestiti",
        detail:
          "Italy's recovery plan devotes hundreds of millions of euros to regenerating historic villages at risk of depopulation — funding restored housing, co-working, libraries and the services that make a village viable for young families again.",
        url: "https://www.cdp.it/sitointernet/page/en/650_million_euros_from_the_NRRP_to_enhance_423_historic_villages_parks_and_gardens?contentId=PRG40043",
        domain: "cdp.it",
      },
      {
        kind: "Funding",
        name: "Albinen residency incentive scheme",
        org: "Municipality of Albinen, Valais (Switzerland)",
        detail:
          "This Alpine village pays newcomers under 45 CHF 25,000 per adult and CHF 10,000 per child to buy or build a home and stay ten years. It's the clearest replicable template for a hamlet trying to attract young families and keep its school alive.",
        url: "https://www.swissinfo.ch/eng/business/attracting-new-residents-_move-to-albinen-and-get-chf25-000/43719788",
        domain: "swissinfo.ch",
      },
      {
        kind: "Network",
        name: "A Long-Term Vision for Rural Areas — 'Stronger' action plan",
        org: "European Commission · Rural Pact",
        detail:
          "The EU's rural-vision hub connects small villages to youth-focused schemes (Erasmus+, the European Solidarity Corps) and to a community platform of places solving the same school-closure problem. It's the umbrella that links a single hamlet to the funding streams and peers it needs.",
        url: "https://rural-vision.europa.eu/action-plan/stronger_en",
        domain: "rural-vision.europa.eu",
      },
    ],
    futurePairId: "anna-8",
  },

  /* ────────────────────────── GIORGIO, 72 ──────────────────────── */
  {
    id: "giorgio-72",
    correspondent: { name: "Giorgio", age: 72, role: "retired, lifelong resident", place: "a high valley village" },
    pressurePoint: "Mobility & ageing",
    body: "Dear Oracle, I've lived here my whole life and I don't want to leave, but it's getting harder. My wife passed two years ago and she was the one who drove. The bus to town goes Tuesday and Friday and that's the lot. Most of my friends have gone to live with their children in the city. I manage well enough, but the doctor is forty minutes away and the winters worry me. I'm not asking for much. I'd just like to stay.",
    reframe: {
      symptom: "The bus runs twice a week, the doctor is forty minutes away, and you no longer drive.",
      system:
        "Services get planned by headcount, and a thin valley always loses that arithmetic — too few people to justify a daily bus, a local surgery, a warm room kept open. So one by one the things that made staying possible get withdrawn as 'not viable,' and ageing in place quietly turns into a logistics problem the person is left to solve alone. What's failing you isn't the village. It's a rulebook that measures a place by cost per head instead of by whether a life can be lived in it.",
      thesis:
        "You can stay — because the ride, the check-up and the winter are small, fixable things wearing the costume of an inevitable one.",
      vision2050:
        "By 2050 the road is the same but the winter isn't. A small van comes when you phone it, not when a timetable allows, and two neighbours who also stopped driving are in it with you. The clinic opens a screen two mornings a week, so a repeat prescription no longer costs you a mountain. And the last café is warm and open because the village owns it now — somewhere to simply be, with other people already there.",
    },
    levers: [
      {
        n: "01",
        title: "A van you phone for, not a bus you wait for",
        detail:
          "Swap the timetable nobody can use for a minibus you book the day before. Demand-responsive transport keeps thin valleys reachable where the scheduled bus has died; it rarely turns a profit, and it isn't meant to — it's cheap insurance against a place going dark. Alpine East Tyrol runs door-to-door e-taxis on 160-plus volunteer drivers doing exactly this.",
      },
      {
        n: "02",
        title: "Bring the doctor to the village",
        detail:
          "Most of that forty-minute trip is a conversation and a prescription — things a screen and a trained neighbour in the room can handle. A pilot in the remote Greek mountains put a portable diagnostic device and a local facilitator in the village so elderly residents are examined over a link instead of travelling for hours.",
      },
      {
        n: "03",
        title: "Keep one warm room open all winter",
        detail:
          "Half of what you miss is simply somewhere to be. The last café or shop, run by the community instead of one exhausted owner, is what keeps a winter from being silent — the social infrastructure a place needs as much as the road.",
      },
    ],
    actors: [
      {
        tier: "You, now",
        who: "What one person can move this month",
        moves: [
          "Ask at the comune who else in the valley has stopped driving. Three or four of you sharing one car for the market run fixes most of it — and puts company back in the car.",
          "Report the gap in writing: a paper trail of a missed clinic or a stranded week is what turns an annoyance into a fundable case.",
        ],
      },
      {
        tier: "The village & region",
        who: "What a council can set up with EU backing",
        moves: [
          "Use SMARTA's free toolkits to stand up a community-car or on-demand minibus scheme designed for exactly this profile.",
          "Apply to the regional LEADER action group for the running costs of that van and a warm community room.",
          "Join a telecare pilot so a nurse-plus-screen covers the routine visits and the doctor drives only when it matters.",
        ],
      },
    ],
    articleIds: ["uwe-rural-demand-responsive-transport", "east-tyrol-carsharing", "agrafa-rural-telehealth"],
    resources: [
      {
        kind: "Support",
        name: "SMARTA / SMARTA-NET — shared rural mobility",
        org: "European Commission · DG MOVE",
        detail:
          "The EU's rural-mobility initiative designs and shares demand-responsive and community transport for ageing, depopulating areas. It offers free toolkits, a good-practice database and step-by-step guidance a village can use to launch an on-demand or volunteer-driver service.",
        url: "https://ruralsharedmobility.eu/",
        domain: "ruralsharedmobility.eu",
      },
      {
        kind: "Funding",
        name: "LEADER / Community-Led Local Development",
        org: "EU · EAFRD, via Local Action Groups",
        detail:
          "Local Action Groups award grants for essential rural services — including community transport and social spaces — and decide locally what to fund. Giorgio's village could apply to its regional LAG to run a community-car scheme or keep a warm room open through the winter.",
        url: "https://elard.eu/leader-clld/",
        domain: "elard.eu",
      },
      {
        kind: "Support",
        name: "CARES — Remote Healthcare for Silver Europe",
        org: "Interreg Europe",
        detail:
          "An interregional project across nine EU countries improving telecare and telemedicine policy for elderly people far from a doctor. It provides tested good practices for standing up rural telehealth of exactly the forty-minutes-away kind Giorgio faces.",
        url: "https://syddansksundhedsinnovation.dk/en/projects/2023/cares-remote-healthcare-for-silver-europe",
        domain: "syddansksundhedsinnovation.dk",
      },
      {
        kind: "Network",
        name: "European Rural Mobility Network (ERMN)",
        org: "SMARTA-NET · EU CAP Network",
        detail:
          "The first pan-European network for rural mobility, linking 70-plus municipalities across 15 countries to share shared-mobility models and financing. A small village can join free for peer support on launching a demand-responsive or community-car service.",
        url: "https://www.smarta-net.eu/ermn/",
        domain: "smarta-net.eu",
      },
    ],
    futurePairId: "giorgio-72",
  },

  /* ─────────────────────────── MARA, 34 ────────────────────────── */
  {
    id: "mara-34",
    correspondent: { name: "Mara", age: 34, role: "remote worker, newly arrived", place: "a hilltop village" },
    pressurePoint: "The newcomer who wants life",
    body: "Hi — I moved here about eight months ago from the city. I work remotely, the house was cheap, the view is unreal, and most mornings I can't believe my luck. But honestly it's lonelier than I expected. There's nowhere to just run into people. Everyone's kind but they've known each other for fifty years and I'm 'the one who took the old Silva place.' I don't want to give up and move back. I just don't know how you build a life here from scratch.",
    reframe: {
      symptom: "The house and the view are perfect, but there's nowhere to run into people and no way in.",
      system:
        "Villages that empty out don't just lose bodies — they lose the everyday places where a stranger becomes a neighbour: the café, the shop, the club, the reason to be in the square at six. When those go, the remaining community closes into the people who already know each other, and the newcomer bounces off a surface that isn't unkind, just complete. Your loneliness isn't a personality problem. It's the missing social infrastructure of a thinned-out place, and infrastructure can be rebuilt.",
      thesis:
        "What you're missing isn't the city — it's a place to bump into people, and a village can absolutely have one. The catch, and the opening, is that you get to be the person who starts it.",
      vision2050:
        "By 2050 you're not 'the one in the Silva place' anymore. There's a café busy on a Wednesday and a co-working room where the other remote arrivals land, so leaving the house has a point. A handful of people came the way you did — some the village actually recruited — and the calendar of things to do is one you no longer have to invent alone.",
    },
    levers: [
      {
        n: "01",
        title: "A room where remote workers land",
        detail:
          "You're not the only one up here working off a laptop; you're just scattered. A co-working corner in a café or a civic building gives the newcomers a fixed place and time to collide — the single cheapest cure for the winter that sends people back to the city. Village colivings like Rooral in Andalusia are built entirely around this collision.",
      },
      {
        n: "02",
        title: "Let the village recruit more of you",
        detail:
          "One rooted newcomer brings others, and regions have started paying for exactly that: Extremadura offers remote workers thousands of euros to move and stay, precisely because arrivals keep the shop and the school alive. If your comune doesn't run a scheme yet, this is the thing to push it toward.",
      },
      {
        n: "03",
        title: "Share the social life across the valley",
        detail:
          "No single hamlet can fill a calendar, but a few together can — a market, a summer festival, a music night that rotates. Networks of 'welcoming villages' for teleworkers exist across Spain and Italy to do just this, turning isolated arrivals into a distributed community.",
      },
    ],
    actors: [
      {
        tier: "You, now",
        who: "What one newcomer can start",
        moves: [
          "Pick one thing and make it regular — a Friday table at the bar, a monthly film night, a Sunday walk anyone can join. Reliable beats ambitious; the second person to show up is how a village adopts you.",
          "Find the other laptops. A shared table two mornings a week is a co-working hub before it has a name.",
        ],
      },
      {
        tier: "The village",
        who: "What the comune can put behind you",
        moves: [
          "Turn a civic building into a coworking + events room and list the village on a welcoming-villages / nomad network.",
          "Adopt or lobby for a relocation grant so newcomers arrive with support, not just a cheap house.",
          "Back a rotating valley calendar so no single hamlet has to carry the social life alone.",
        ],
      },
    ],
    articleIds: ["euronews-digital-nomad-villages", "extremadura-digital-nomad-grants", "pueblos-remotos-canaries"],
    resources: [
      {
        kind: "Funding",
        name: "Grants for Digital Nomads & Teleworkers (Programa I)",
        org: "Junta de Extremadura · Plataforma ONE",
        detail:
          "An official regional grant paying remote workers who relocate to Extremadura €8,000 (or €10,000 for women, under-30s, or anyone settling in a village under 5,000 people), plus up to €5,000 more for staying a third year. It subsidises exactly the cost of a newcomer building a life in a small village.",
        url: "https://one.gob.es/en/aid-and-calls/program-i-grants-attraction-and-establishment-digital-nomads-teleworkers-and-self",
        domain: "one.gob.es",
      },
      {
        kind: "Network",
        name: "Digital Nomads Madeira Islands (Ponta do Sol)",
        org: "Startup Madeira · Regional Government of Madeira",
        detail:
          "The pioneering government-backed nomad village, running since 2021, with free co-working, on-the-ground community managers, an active Slack and a weekly calendar of events and hikes. It's a proven answer to Mara's exact problem: connecting isolated remote workers into a real community.",
        url: "https://digitalnomads.startupmadeira.eu/",
        domain: "startupmadeira.eu",
      },
      {
        kind: "Network",
        name: "Rooral — village coliving",
        org: "Rooral, Benarrabá (Andalusia)",
        detail:
          "The self-described 'first village coliving' embeds remote workers into a depopulating Spanish village as one big family — shared dinners, local festivities, skill-swaps and volunteering alongside 1GB-fibre co-working. Its whole design solves integrating a lonely newcomer rather than isolating her.",
        url: "https://www.rooral.co/",
        domain: "rooral.co",
      },
      {
        kind: "Toolkit",
        name: "Support for Smart Villages strategies",
        org: "European Commission · DG AGRI (CAP / LEADER)",
        detail:
          "The EU framework funding community-led Smart Village strategies through LEADER, explicitly to tackle depopulation, service gaps and connectivity. Mara's village council can use it to fund local co-working, connectivity or newcomer-integration projects via its LEADER action group.",
        url: "https://agriculture.ec.europa.eu/common-agricultural-policy/rural-development/supporting-smart-village-strategies_en",
        domain: "agriculture.ec.europa.eu",
      },
    ],
    futurePairId: "mara-34",
  },

  /* ─────────────────────────── TOMÁS, 19 ───────────────────────── */
  {
    id: "tomas-19",
    correspondent: { name: "Tomás", age: 19, role: "wants to leave, feels he shouldn't", place: "a southern hill village" },
    pressurePoint: "The leaver's dilemma",
    body: "I'm 19 and everyone keeps telling me how lucky I am to be from somewhere this beautiful. Honestly? I want out. There's no work, nobody my age stayed, and anything I'd actually want to do is a forty-minute drive minimum. I feel bad about it because my parents are here and the place is slowly dying and I'd be one more person leaving. But I'm not going to waste my twenties out of guilt. Is there any version of this where staying isn't a dead end?",
    reframe: {
      symptom: "No work, no one your age left, and everything you'd want to do is forty minutes away.",
      system:
        "For two centuries the deal has been fixed: opportunity concentrates in cities, and the countryside exports its young to reach it. That's why leaving reads as ambition and staying reads as settling — you've been handed a script, not a fact. And a village that offers a nineteen-year-old nothing isn't expressing its nature; it's showing the result of decades in which no one built the work, the training, or the company here on purpose.",
      thesis:
        "Leaving isn't a betrayal and you should go if you need to — but the dead end is made of three fixable things, not one true one.",
      vision2050:
        "By 2050 there's a maker space and an apprenticeship behind the old shopfronts, and fibre to the last house means the job no longer requires the city. The road out is still there — it's just no longer the only road. A nineteen-year-old decides to stay, not out of guilt, but because for once the maths adds up.",
    },
    levers: [
      {
        n: "01",
        title: "Somewhere to train and make things",
        detail:
          "An apprenticeship plus a shared workshop behind an empty shopfront turns 'nothing here for me' into a first job and a skill. These are being built across rural Europe precisely to give young people a reason that isn't nostalgia — and to keep the talent a region is otherwise bleeding.",
      },
      {
        n: "02",
        title: "Work that doesn't need the city",
        detail:
          "Decent internet and a desk you can share means the job can be anywhere. The same regions paying outsiders to move to the countryside would far rather keep the ones already born there — and EU youth schemes will fund the placement or training that bridges you into that work.",
      },
      {
        n: "03",
        title: "Fund the thing you'd build",
        detail:
          "If you'd start something here, the barrier is capital and know-how, not desire. Rural-development money runs through local action groups that can co-finance a young person's enterprise, and a Europe-wide 'startup village' movement now exists to back exactly that.",
      },
    ],
    actors: [
      {
        tier: "You, now",
        who: "What you can do before you decide for good",
        moves: [
          "Find the one skill this area would pay for — building, tourism, growing, code — and get it, even abroad on a funded placement. Leaving with a plan to come back is its own kind of staying.",
          "Use an Erasmus+ or ALMA placement as the bridge: real experience you can carry home, fully paid for.",
        ],
      },
      {
        tier: "The village & region",
        who: "What can be built for people your age",
        moves: [
          "Open a maker space / co-working room in an empty shopfront and wire it with real fibre.",
          "Route LEADER money into youth enterprise and apprenticeships instead of watching the young leave.",
          "Plug into the European Startup Village Forum for the model and the partners.",
        ],
      },
    ],
    articleIds: ["extremadura-digital-nomad-grants", "galicia-rural-coworking", "eu-young-farmers-land-access"],
    resources: [
      {
        kind: "Funding",
        name: "ALMA (Aim, Learn, Master, Achieve)",
        org: "European Commission · ESF+ / Youth Guarantee",
        detail:
          "ALMA gives disadvantaged 18–29s home training, a fully-funded supervised work placement in another EU country (travel, accommodation, mentoring covered), then follow-up support to land a job or course back home. It fits Tomás exactly: a young person with no local work who could gain real experience and a path forward.",
        url: "https://employment-social-affairs.ec.europa.eu/policies-and-activities/skills-and-qualifications/alma-active-inclusion-initiative-young-people_en",
        domain: "employment-social-affairs.ec.europa.eu",
      },
      {
        kind: "Funding",
        name: "Erasmus+ — VET learners, apprentices & recent graduates",
        org: "European Commission · Erasmus+",
        detail:
          "Funds work placements abroad of two weeks to twelve months for vocational learners, apprentices and recent graduates, with a strong work-based component in a host company. For Tomás it's a funded way to get the trade experience he can't find within forty minutes of home.",
        url: "https://erasmus-plus.ec.europa.eu/opportunities/individuals/trainees/vocational-education-apprenticeships-and-recent-graduates",
        domain: "erasmus-plus.ec.europa.eu",
      },
      {
        kind: "Funding",
        name: "LEADER / Community-Led Local Development",
        org: "ELARD · European Network of Local Action Groups",
        detail:
          "LEADER channels EU rural money through 2,500-plus local action groups covering over half the EU's rural population, funding youth enterprise, services and ICT. Tomás's village likely sits in a LAG that can co-finance a local start-up, training or hub — a way to build something where he lives.",
        url: "https://elard.eu/leader-clld/",
        domain: "elard.eu",
      },
      {
        kind: "Network",
        name: "European Startup Village Forum",
        org: "European Commission · Joint Research Centre",
        detail:
          "A JRC forum promoting startup-driven innovation in rural areas, connecting entrepreneurs, institutions and practitioners and helping regions fund 'Startup Villages'. It points a would-be rural founder like Tomás to the networks and models behind reviving a hill-village economy instead of abandoning it.",
        url: "https://joint-research-centre.ec.europa.eu/projects-and-activities/european-startup-village-forum_en",
        domain: "joint-research-centre.ec.europa.eu",
      },
    ],
    futurePairId: "tomas-19",
  },

  /* ─────────────────────────── YUSUF, 45 ───────────────────────── */
  {
    id: "yusuf-45",
    correspondent: { name: "Yusuf", age: 45, role: "ran the last shop, just closed it", place: "a village of a few hundred" },
    pressurePoint: "Collapse of the last service",
    body: "Dear Oracle, I ran the only shop in the village for eleven years and last month I locked it for the last time. I couldn't make it pay and I was worn out, doing the accounts at midnight. Now there's nowhere to buy bread or a stamp, and worse, nowhere for people to stand and talk. Old Teresa used to come in just for that. I keep feeling like I've let everyone down, even though no one has said it to my face. Did I have any other choice?",
    reframe: {
      symptom: "The last shop closed because one owner couldn't make it pay — and now there's nowhere to gather.",
      system:
        "A village shop is judged as a private business, so the moment it can't clear a profit it's allowed to die — even though what it really provides is public: bread, the post, and the only room where Teresa gets to talk to someone. Treating shared infrastructure as one person's balance sheet guarantees it fails, then blames the person holding it. You didn't lose a business. The village lost a service that was never yours alone to carry.",
      thesis:
        "You didn't let anyone down — you kept a public service alive out of your own pocket for eleven years longer than the arithmetic allowed. The fix is to stop making it one person's job.",
      vision2050:
        "By 2050 the shutter is up again, and your name is on none of it — because it belongs to all of them. It's not just a shop but a hub: groceries, the post counter, a rack of shared e-bikes and a car-club bay out front, a coffee machine and two tables. Teresa has somewhere to stop, the young have a way to get to town without a car of their own, and the last room in the village is the busiest.",
    },
    levers: [
      {
        n: "01",
        title: "A shop the village owns together",
        detail:
          "A shop that loses money for one owner can break even when the community owns it and a rota of people give the hours. Across rural Britain hundreds of villages have reopened the shop and the pub exactly this way, treating them as shared social infrastructure rather than someone's failing business.",
      },
      {
        n: "02",
        title: "One room doing four jobs",
        detail:
          "Don't reopen a shop — reopen a hub: groceries, the post relay, a shared-mobility point (e-bikes and a car club so people without a car can still reach town), a coffee machine and a couple of tables. France's 1000 Cafés and Bistrot de Pays networks keep the last village room alive by bundling everything a place needs into one space that can actually pay for itself.",
      },
      {
        n: "03",
        title: "Fund it as infrastructure, not charity",
        detail:
          "Reopening the last shop is exactly what community-ownership funds and rural-development money are for. Treated as infrastructure rather than a favour, there's grant money, community shares and expert help to seed it — the Candover Valley store reopened on £225,000 raised this way.",
      },
    ],
    actors: [
      {
        tier: "You, now",
        who: "What the person who ran it can start",
        moves: [
          "Call a meeting — the comune, the regulars, Teresa. The thing you ran as a business, the village might run as a shared one, and you're the person who knows how it works.",
          "Get free advice from Plunkett (or the national equivalent) on community shares and legal structure before anyone reaches for their own wallet.",
        ],
      },
      {
        tier: "The village",
        who: "How to reopen it for good",
        moves: [
          "Run a community share offer so ownership — and the risk — is spread across the whole village.",
          "Apply to 1000 Cafés / a community-ownership fund to seed the multi-service hub.",
          "Bundle the post, a shared-mobility point (e-bikes and a car club), groceries and coffee into one room so it clears its costs.",
        ],
      },
    ],
    articleIds: ["plunkett-more-than-a-pub", "candover-community-store", "bistrot-de-pays-network"],
    resources: [
      {
        kind: "Support",
        name: "Community-owned shops, pubs & hubs advice",
        org: "Plunkett UK (Plunkett Foundation)",
        detail:
          "A national charity giving rural communities free, specialist support to save or set up a community-owned shop, pub, café or multi-service hub — from feasibility and legal structure to community share offers. It backs over 800 trading community-owned businesses reopening exactly the last village shop.",
        url: "https://plunkett.co.uk/",
        domain: "plunkett.co.uk",
      },
      {
        kind: "Network",
        name: "1000 Cafés",
        org: "Groupe SOS (France)",
        detail:
          "Opens or reopens multi-service village cafés in communes under 3,500 people, combining a café with a bread depot, grocery, postal relay and digital access, plus a support network for managers. Built for Yusuf's exact gap — 1,700-plus mayors have applied and 350-plus communes have been backed.",
        url: "https://www.1000cafes.org/",
        domain: "1000cafes.org",
      },
      {
        kind: "Network",
        name: "Label Bistrot de Pays",
        org: "Fédération nationale des Bistrots de Pays",
        detail:
          "A label for a bistrot that is the last business in a rural commune under 2,000 people, requiring it to provide basic services (bread, tobacco, papers, small groceries) and host cultural events. It recognises and promotes the last village café as social infrastructure, with free labelling.",
        url: "https://www.bistrotdepays.com/",
        domain: "bistrotdepays.com",
      },
      {
        kind: "Funding",
        name: "Smart Villages / LEADER (CAP 2023–27)",
        org: "European Commission · EU CAP Network",
        detail:
          "EU rural funding for community-led development and Smart Village strategies, including investment in basic services to tackle depopulation. LEADER grants routinely co-fund village shops and multi-service hubs as essential local infrastructure.",
        url: "https://agriculture.ec.europa.eu/common-agricultural-policy/rural-development/supporting-smart-village-strategies_en",
        domain: "agriculture.ec.europa.eu",
      },
    ],
    futurePairId: "yusuf-45",
  },

  /* ────────────────────────── BIANCA, 51 ───────────────────────── */
  {
    id: "bianca-51",
    correspondent: { name: "Sylvie", age: 51, role: "mayor of a commune of ~400", place: "a commune in the Cévennes, France" },
    pressurePoint: "Governance & scale",
    body: "I'm the mayor of a commune of 390 people. I have the legal responsibilities of a city and a budget that wouldn't cover a city's stationery. The region remembers we exist at election time and not much in between. People tell me to be 'entrepreneurial.' I'd settle for fixing the road up to the top hamlet and keeping the doctor. Genuinely — where does someone like me even start?",
    reframe: {
      symptom: "City-scale legal duties, a rounding-error budget, and a region that forgets you between elections.",
      system:
        "Public money and attention flow to scale — programmes are written for units big enough to 'administer' funding, which quietly designs the smallest places out of every competition. So a commune of 390 isn't failing; it's the intended casualty of a system that measures viability by size and treats a hundred tiny municipalities as a hundred separate problems instead of one shared one. The fix isn't to shrink your ambition. It's to change the unit.",
      thesis:
        "You're not too small to matter — you're too small alone, and that's a different problem with a real answer: stop competing with the next valley for scraps and start adding yourself to it.",
      vision2050:
        "By 2050 the road to the top hamlet is fixed and the doctor still comes — paid for by a bid no village your size could have written alone. Your 390 and your neighbours' hundreds are one fundable cluster now, sharing a school, a transport contract and a regeneration officer. Too small to matter apart; together, impossible to skip.",
    },
    levers: [
      {
        n: "01",
        title: "Pool the basics with your neighbours",
        detail:
          "Your 390 and their 600 become a thousand a programme officer can't round down. Share one school, one transport contract, one regeneration officer across the cluster — the cluster is the smallest unit most funds will actually back, and the quickest scale you can build.",
      },
      {
        n: "02",
        title: "Bid for the big fund as a group",
        detail:
          "National and EU village-revival money goes to plans, not wishes — and increasingly to clusters over single villages. Some schemes even let neighbouring communes bid as one: in Italy's Turano valley, three tiny communes did exactly that and won €2.56m together — the same pooling a French commune can do.",
      },
      {
        n: "03",
        title: "Get organised, get loud",
        detail:
          "Spain's emptied interior turned grievance into votes and forced services and broadband back onto the national budget. Organised small places get answered; isolated ones get rounded down — and there are European alliances built to give a commune like yours that collective voice.",
      },
    ],
    actors: [
      {
        tier: "You, now",
        who: "The mayor's first, cheapest move",
        moves: [
          "Phone the mayor of the next commune over. Money flows to scale, and the fastest way to build scale is to be the one who picks up the phone.",
          "Use the Rural Revitalisation Platform's self-assessment and case studies to arrive at that call with a plan, not just a problem.",
        ],
      },
      {
        tier: "The cluster",
        who: "What a group of small communes can do that none can alone",
        moves: [
          "Form or join a LEADER Local Action Group so bottom-up projects get funded across the whole area.",
          "Submit a joint bid as a cluster of communes with one lead — the pooling that unlocks funds no single village could win.",
          "Join a rural-communities alliance to push for 'rural proofing' and territorial equity at regional and EU level.",
        ],
      },
    ],
    articleIds: ["pnrr-borghi-fund", "turano-borghi-cluster", "espana-vaciada-movement"],
    resources: [
      {
        kind: "Funding",
        name: "LEADER / CLLD (Community-Led Local Development)",
        org: "EU CAP Network · European Commission (EAFRD)",
        detail:
          "Roughly €5bn in 2023–27 flows through ~2,678 Local Action Groups — public-private partnerships municipalities join — to fund bottom-up rural projects for services, mobility and development. Perfect for a 390-person commune too small alone: Sylvie can act inside a LAG covering her whole cluster to reach fundable scale.",
        url: "https://eu-cap-network.ec.europa.eu/news/leader-facts-and-figures-new-lags-2023-2027_en",
        domain: "eu-cap-network.ec.europa.eu",
      },
      {
        kind: "Support",
        name: "Rural Revitalisation Platform",
        org: "European Commission · Rural Pact",
        detail:
          "A one-stop EU hub for communities facing population loss and ageing — self-assessment tools, funded good-practice case studies and a space to form action groups. Built precisely for local authorities like Sylvie who need proven models plus routes to EU money.",
        url: "https://ruralpact.rural-vision.europa.eu/rural-revitalisation_en",
        domain: "ruralpact.rural-vision.europa.eu",
      },
      {
        kind: "Support",
        name: "Petites Villes de Demain",
        org: "France · Agence Nationale de la Cohésion des Territoires (ANCT)",
        detail:
          "A national programme giving nearly 1,600 small towns and their surrounding rural communes a dedicated project manager plus priority access to state funding and engineering to revitalise services and town centres. For a small commune, it's the state route to the expertise and money a village this size can't marshal alone.",
        url: "https://agence-cohesion-territoires.gouv.fr/petites-villes-de-demain-45",
        domain: "agence-cohesion-territoires.gouv.fr",
      },
      {
        kind: "Network",
        name: "European Rural Communities Alliance (ERCA)",
        org: "European Rural Communities Alliance",
        detail:
          "A pan-European alliance of rural movements that connects communities, runs the European Rural Parliament and campaigns for 'rural proofing' and territorial equity in EU policy. It gives a small, overlooked commune a collective voice at European level — the leverage Sylvie lacks against her region.",
        url: "https://ruralcommunities.eu/",
        domain: "ruralcommunities.eu",
      },
    ],
    futurePairId: "bianca-51",
  },
  /* ────────────────────────── HENRIK, 58 ───────────────────────── */
  {
    id: "henrik-58",
    correspondent: { name: "Henrik", age: 58, role: "GP covering five valleys", place: "a mountain district" },
    pressurePoint: "Health-service desert",
    body: "I'm the only doctor for five valleys and I'm 58. My patients are old and getting older, the distances are brutal, and I'm tired in a way that sleep no longer fixes. When I retire — and I'll have to — no young doctor is going to take this on, it's an impossible job. I'm not writing to be rescued. I'm writing to ask what happens to my patients when I can't do it anymore.",
    reframe: {
      symptom: "One doctor, five valleys, no successor — and the arithmetic runs out when you retire.",
      system:
        "Rural care keeps being designed as a single heroic person covering an impossible area, so the whole system rests on one body and collapses the day that body stops. The real shortage isn't doctors; it's a model — care organised around one professional's stamina instead of a distributed system where the routine is handled close to home and the scarce expertise is spent only where it must be. A younger you doing the same impossible thing was never the answer.",
      thesis:
        "You've been trying to be a whole health system inside one body. The fix isn't a replacement for you — it's a system so no single person is ever the whole of it.",
      vision2050:
        "By 2050 the clinic opens two mornings a week with a screen on the wall and a nurse at the door. A telehealth point and a trained facilitator handle the conversations and prescriptions in each village; a rotating surgery and a community health worker cover the rest; and one contract split across five valleys makes the job survivable. Care reaches everyone — and the person delivering it gets to grow old too.",
    },
    levers: [
      {
        n: "01",
        title: "See people without the drive",
        detail:
          "Telemedicine isn't science fiction for a place like yours. A pilot in the remote Greek mountains put a portable diagnostic device and a trained local in the village, so elderly patients are examined over a link for follow-ups, prescriptions and triage instead of losing a day to the journey.",
      },
      {
        n: "02",
        title: "A clinic that travels on a timetable",
        detail:
          "A rotating surgery that visits each village on a known day, with a community health worker covering the gaps between, means care reaches everyone without one person driving themselves into the ground. Interreg projects fund exactly this across doctor-short rural regions.",
      },
      {
        n: "03",
        title: "Share the post across the valleys",
        detail:
          "One contract covering all five valleys, split between several practitioners, turns an impossible solo job into a workable shared one. WHO's rural-retention guidance gives a region the framework — incentives, career paths, working conditions — to argue for exactly that instead of advertising a post no one will take.",
      },
    ],
    actors: [
      {
        tier: "You, now",
        who: "What the retiring doctor can set in motion",
        moves: [
          "Mark a week of visits: the ones that are really a conversation and a prescription don't need the drive — they need a screen and a trained pair of hands in each village. Handing those off is how the model starts.",
          "Put the succession problem to the region as a system-design question, armed with WHO's retention framework, not as a plea for a heroic replacement.",
        ],
      },
      {
        tier: "Region & nation",
        who: "The levers only the health system holds",
        moves: [
          "Fund telehealth points and a rotating clinic through EU4Health or Horizon Europe.",
          "Create a shared multi-practitioner contract across the five valleys so the job is survivable.",
          "Train and pay community health workers to cover the everyday between visits.",
        ],
      },
    ],
    articleIds: ["agrafa-rural-telehealth", "si4care-calabria-telecare", "oecd-shrinking-smartly"],
    resources: [
      {
        kind: "Funding",
        name: "EU4Health Programme 2021–2027",
        org: "European Commission · HaDEA",
        detail:
          "The EU's largest-ever health programme (€4.4bn) funds digital-health tools and telemedicine, staff reserves and better access to care. It's the natural EU pot for building a telehealth-and-shared-staff model that removes reliance on one solo GP.",
        url: "https://health.ec.europa.eu/funding/eu4health-programme-2021-2027-vision-healthier-european-union_en",
        domain: "health.ec.europa.eu",
      },
      {
        kind: "Funding",
        name: "Horizon Europe — Cluster 1: Health",
        org: "European Commission · HaDEA",
        detail:
          "Funds research and innovation in digital health, telemedicine and more equitable health systems, via calls on the EU Funding & Tenders Portal. A regional consortium could win funding to pilot rotating clinics and remote monitoring across Henrik's five valleys.",
        url: "https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe/cluster-1-health_en",
        domain: "research-and-innovation.ec.europa.eu",
      },
      {
        kind: "Network",
        name: "Interreg (cross-border & transnational cooperation)",
        org: "European Union · Interreg",
        detail:
          "Interreg finances cooperation across regions, and its projects already fund telemedicine, wearables and remote elderly-monitoring in depopulating rural areas (e.g. SI4CARE in doctor-short Calabrian villages). For a GP covering mountain valleys, it can pool patients and practitioners across administrative lines.",
        url: "https://interreg.eu/programmes/",
        domain: "interreg.eu",
      },
      {
        kind: "Toolkit",
        name: "Health workforce attraction & retention in rural areas",
        org: "World Health Organization",
        detail:
          "WHO's evidence-based guideline sets out the levers — financial incentives, career pathways, working conditions and support — to attract and keep health workers in remote areas. It gives Henrik's region a recognised framework to argue for a shared contract instead of an impossible solo post.",
        url: "https://www.who.int/publications/i/item/9789240024229",
        domain: "who.int",
      },
    ],
    futurePairId: "henrik-58",
  },

];

export function getLetter(id: string): Letter | undefined {
  return letters.find((l) => l.id === id);
}

/*
 * FUTURE: live generation.
 * In v1 every reply is pre-authored here. The /oracle "Write your own letter"
 * affordance is disabled. In v2 it POSTs the visitor's letter to the Anthropic
 * API (claude-sonnet-4-6), passing the `research` corpus as grounding context
 * and requiring the reply to cite real articleIds + real resources — the same
 * shape this file already defines, so only the data source changes.
 */
