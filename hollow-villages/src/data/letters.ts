/**
 * Letters to the Oracle. Ten correspondents, each a different pressure point,
 * so the replies collectively map the crisis from the inside.
 *
 * Letters are written to sound like real people — specific, plain, a little
 * unpolished. The oracle answers warmly and directly: a short read of the
 * problem, one thing the writer can do now, then 2–3 GENUINELY DIFFERENT
 * solutions (not one lever restated at every level of government), and a dated
 * 2050 picture. Every solution is grounded; `researchIds` list real precedents.
 */

export interface Correspondent {
  name: string;
  age: number;
  role?: string;
  place?: string; // composite descriptor, never a real named town
}

export interface Solution {
  title: string; // short, concrete
  body: string; // the move, in plain language
  researchIds?: string[]; // the precedent(s) for this specific move
}

export interface OracleReply {
  opening: string; // the oracle's read of the problem, addresses them by name
  personal: string; // one thing the writer themselves can do now
  solutions: Solution[]; // 2–3 distinct structural moves
  vision2050: string; // the dated picture, ties to the render
  researchIds: string[]; // all precedents, for the "where this happened" grid
  futurePairId: string;
}

export interface Letter {
  id: string;
  correspondent: Correspondent;
  pressurePoint: string;
  body: string; // first person, in their voice
  reply: OracleReply;
}

export const letters: Letter[] = [
  {
    id: "anna-8",
    correspondent: { name: "Anna", age: 8, role: "the only child in the village", place: "an Alpine hamlet" },
    pressurePoint: "Youth drain",
    body: "Dear Oracle, my name is Anna and I am 8. I am the only kid in my class now because Matteo moved away before the winter. The teacher only comes three days and the other days I do the work on my own at the kitchen table. My nonna says when she was little the village was full of children. I don't really believe her. Is it true? And if it's true, can it be full again?",
    reply: {
      opening:
        "Anna — it's true, your nonna isn't making it up. And it isn't a fairy tale either: villages like yours really have filled back up with children. It's slow, but it happens.",
      personal:
        "Here's something only you can do. When a new family comes to look at the village, be the one who shows the children around. A kid who's happy here is the best reason for a family to stay. Tell your teacher you want that job.",
      solutions: [
        {
          title: "Keep the school open by making it more than a school",
          body: "A village loses its children fastest when it loses the school. The way to keep it is to make the building the busy heart of the place — somewhere the older people teach things, and something happens after class. Ostana, almost empty in the 1980s, did this and a few years later had its first baby in twenty-eight years.",
          researchIds: ["ostana-first-baby"],
        },
        {
          title: "Give one young family a real reason to come",
          body: "Children arrive with parents, and parents go where there's a home they can afford and a little help to settle in. Some villages simply pay young families to move and stay; others fix up an empty house and hand it over for almost nothing.",
          researchIds: ["albinen-newcomer-payments", "sambuca-one-euro-houses"],
        },
        {
          title: "Put the village back on the map",
          body: "A small summer festival or a camp brings the first new faces, and some of them come back to live. National funds for reviving small villages exist to pay for exactly this kind of thing.",
          researchIds: ["pnrr-borghi-fund"],
        },
      ],
      vision2050:
        "By 2050 you're not the only one in the class. There's a younger one you walk to school in the mornings, and a loud afternoon in the square that you can remember being the start of.",
      researchIds: ["ostana-first-baby", "albinen-newcomer-payments", "sambuca-one-euro-houses", "pnrr-borghi-fund"],
      futurePairId: "anna-8",
    },
  },
  {
    id: "giorgio-72",
    correspondent: { name: "Giorgio", age: 72, role: "retired, lifelong resident", place: "a high valley village" },
    pressurePoint: "Mobility & ageing",
    body: "Dear Oracle, I've lived here my whole life and I don't want to leave, but it's getting harder. My wife passed two years ago and she was the one who drove. The bus to town goes Tuesday and Friday and that's the lot. Most of my friends have gone to live with their children in the city. I manage well enough, but the doctor is forty minutes away and the winters worry me. I'm not asking for much. I'd just like to stay.",
    reply: {
      opening:
        "Giorgio — you can stay. What's failing isn't the village, it's the ride to town, and that's a smaller and more fixable thing than it feels like on a quiet Tuesday.",
      personal:
        "This month, ask at the comune who else in the valley has stopped driving. There are always a few. Three or four of you sharing one car for the market runs fixes most of it — and it puts company back in the car with you.",
      solutions: [
        {
          title: "A van you phone for, not a bus you wait for",
          body: "Instead of a timetable, a small van you book the day before. These on-demand services have kept thin valleys reachable where the regular bus died. They don't turn a profit — they're cheap insurance against a place going dark.",
          researchIds: ["uwe-rural-demand-responsive-transport"],
        },
        {
          title: "Bring the doctor to the village",
          body: "A lot of that forty-minute trip is a check-up or a repeat prescription — things that can be done over a screen with a nurse or a trained neighbour in the room. A project in the Greek mountains does exactly this for people in your situation.",
          researchIds: ["agrafa-rural-telehealth"],
        },
        {
          title: "Keep one warm room open all winter",
          body: "Half of what you miss is simply somewhere to be. The last café or shop, run by the community instead of one exhausted owner, is what keeps a winter from being silent.",
          researchIds: ["bistrot-de-pays-network", "plunkett-more-than-a-pub"],
        },
      ],
      vision2050:
        "By 2050 the road is the same but the winter isn't. There's a van that comes when you call it, a screen at the clinic two mornings a week, and a warm room with other people already in it.",
      researchIds: ["uwe-rural-demand-responsive-transport", "agrafa-rural-telehealth", "bistrot-de-pays-network"],
      futurePairId: "giorgio-72",
    },
  },
  {
    id: "mara-34",
    correspondent: { name: "Mara", age: 34, role: "remote worker, newly arrived", place: "a hilltop village" },
    pressurePoint: "The newcomer who wants life",
    body: "Hi — I moved here about eight months ago from the city. I work remotely, the house was cheap, the view is unreal, and most mornings I can't believe my luck. But honestly it's lonelier than I expected. There's nowhere to just run into people. Everyone's kind but they've known each other for fifty years and I'm 'the one who took the old Rossi place.' I don't want to give up and move back. I just don't know how you build a life here from scratch.",
    reply: {
      opening:
        "Mara — what's missing isn't the city, it's somewhere to bump into people, and a village can have that. The catch, and the opportunity, is that you'll have to be the one who starts it.",
      personal:
        "Pick one thing and make it regular: a Friday table at the bar, a monthly film night in the hall, a Sunday walk anyone can join. Reliable beats ambitious. The second person who turns up is how a village quietly adopts you.",
      solutions: [
        {
          title: "A room where remote workers land",
          body: "You're not the only one up here working off a laptop. A co-working corner in a café or a civic building gives the scattered newcomers a reason to leave the house — and a reason to last another winter.",
          researchIds: ["euronews-digital-nomad-villages"],
        },
        {
          title: "Let the village recruit more of you",
          body: "One rooted newcomer brings others. Regions like Extremadura now pay remote workers to move precisely because they keep the shop and the school alive. If yours doesn't do this yet, it's worth pushing the comune to try.",
          researchIds: ["extremadura-digital-nomad-grants"],
        },
        {
          title: "Share the social life across the valley",
          body: "No single hamlet can fill a calendar, but a few together can — a market, a summer festival, a music night that moves around. Networks of 'welcoming villages' across Spain and Italy exist for exactly this.",
          researchIds: ["euronews-digital-nomad-villages"],
        },
      ],
      vision2050:
        "By 2050 you're not 'the one in the Rossi place' anymore. There's a café busy on a Wednesday, a handful of others who arrived the way you did, and a calendar you didn't have to invent on your own.",
      researchIds: ["euronews-digital-nomad-villages", "extremadura-digital-nomad-grants", "albinen-newcomer-payments"],
      futurePairId: "mara-34",
    },
  },
  {
    id: "tomas-19",
    correspondent: { name: "Tomás", age: 19, role: "wants to leave, feels he shouldn't", place: "a southern hill village" },
    pressurePoint: "The leaver's dilemma",
    body: "I'm 19 and everyone keeps telling me how lucky I am to be from somewhere this beautiful. Honestly? I want out. There's no work, nobody my age stayed, and anything I'd actually want to do is a forty-minute drive minimum. I feel bad about it because my parents are here and the place is slowly dying and I'd be one more person leaving. But I'm not going to waste my twenties out of guilt. Is there any version of this where staying isn't a dead end?",
    reply: {
      opening:
        "Tomás — leaving isn't a betrayal, and you should go if you need to. But the dead end is specific: no work, no training, no one around. Those are three fixable things, not a fact about where you're from.",
      personal:
        "Before you decide for good, find the one skill this area would actually pay for — building, anything with tourism, growing, code — and learn it somewhere you can carry it home. Leaving with a plan to come back is its own kind of staying.",
      solutions: [
        {
          title: "Somewhere to train and make things",
          body: "An apprenticeship and a shared workshop behind one of those empty shopfronts turns 'nothing here for me' into a first job. These are being built across rural Europe specifically to give people your age a reason that isn't nostalgia.",
          researchIds: ["euronews-digital-nomad-villages"],
        },
        {
          title: "Work that doesn't need the city",
          body: "Decent internet and a desk you can share means the job can be anywhere. The same regions paying outsiders to move out here would much rather keep the ones already born here.",
          researchIds: ["extremadura-digital-nomad-grants"],
        },
        {
          title: "A way onto the land, if that's your thing",
          body: "If you'd ever work the land, the barrier is access, not desire — and land-matching schemes exist to get young people onto ground that absent owners are just sitting on.",
          researchIds: ["eu-young-farmers-land-access"],
        },
      ],
      vision2050:
        "By 2050 there's a workshop behind the old shop, fast internet to the last house, and a 19-year-old deciding to stay — not out of guilt, but because for once it adds up.",
      researchIds: ["euronews-digital-nomad-villages", "extremadura-digital-nomad-grants", "eu-young-farmers-land-access"],
      futurePairId: "tomas-19",
    },
  },
  {
    id: "yusuf-45",
    correspondent: { name: "Yusuf", age: 45, role: "ran the last shop, just closed it", place: "a village of a few hundred" },
    pressurePoint: "Collapse of the last service",
    body: "Dear Oracle, I ran the only shop in the village for eleven years and last month I locked it for the last time. I couldn't make it pay and I was worn out, doing the accounts at midnight. Now there's nowhere to buy bread or a stamp, and worse, nowhere for people to stand and talk. Old Teresa used to come in just for that. I keep feeling like I've let everyone down, even though no one has said it to my face. Did I have any other choice?",
    reply: {
      opening:
        "Yusuf — you didn't let anyone down. You kept a public service alive out of your own pocket for eleven years longer than the arithmetic allowed. The real problem was that it was yours alone to carry.",
      personal:
        "Call a meeting — the comune, a few of the regulars, Teresa. The thing you ran as a business, the village might run as a shared one. And the first person they'll need is the one who already knows where the bread comes from.",
      solutions: [
        {
          title: "A shop the village owns together",
          body: "A shop that loses money for one owner can break even when the community owns it and a few people give the hours. Across rural Britain hundreds of villages have reopened the shop and the pub exactly this way.",
          researchIds: ["plunkett-more-than-a-pub"],
        },
        {
          title: "One room doing four jobs",
          body: "Don't reopen a shop — reopen a hub: groceries, the post counter, parcel pickup, a coffee machine and two tables. France's network of last-village cafés stays alive by bundling everything a place needs into one room that can pay for itself.",
          researchIds: ["bistrot-de-pays-network"],
        },
        {
          title: "Fund it as infrastructure, not charity",
          body: "Reopening the last shop is exactly what national village-revival funds are meant for. Treated as infrastructure rather than a favour, there's money to seed it.",
          researchIds: ["pnrr-borghi-fund"],
        },
      ],
      vision2050:
        "By 2050 the shutter is up again and your name is on none of it — because it belongs to all of them. Teresa has somewhere to stop, and the midnight accounts are someone else's problem, split three ways.",
      researchIds: ["plunkett-more-than-a-pub", "bistrot-de-pays-network", "pnrr-borghi-fund"],
      futurePairId: "yusuf-45",
    },
  },
  {
    id: "bianca-51",
    correspondent: { name: "Bianca", age: 51, role: "mayor of a comune of ~400", place: "an Apennine commune" },
    pressurePoint: "Governance & scale",
    body: "I'm the mayor of a comune of 390 people. I have the legal responsibilities of a city and a budget that wouldn't cover a city's stationery. The region remembers we exist at election time and not much in between. People tell me to be 'entrepreneurial.' I'd settle for fixing the road up to the top hamlet and keeping the doctor. Genuinely — where does someone like me even start?",
    reply: {
      opening:
        "Mayor — you're not too small to matter. You're too small alone, which is a different problem with a real answer: stop competing with the next valley for scraps and start adding yourself to it.",
      personal:
        "Your first move isn't a budget line, it's a phone call to the mayor of the next comune over. Money flows to scale, and the quickest way to build scale is to be the one who picks up the phone.",
      solutions: [
        {
          title: "Pool the basics with your neighbours",
          body: "Your 390 and their 600 become a thousand a programme officer can't skip. Share one school, one transport contract, one regeneration officer across the cluster — the cluster is the smallest unit most funds will actually back.",
          researchIds: ["oecd-shrinking-smartly"],
        },
        {
          title: "Bid for the big fund as a group",
          body: "National village-revival money — like Italy's billion-euro borghi programme — goes to plans, not wishes, and to clusters more than to single hamlets. Write the bid together and you're suddenly fundable.",
          researchIds: ["pnrr-borghi-fund"],
        },
        {
          title: "Get organised, get loud",
          body: "Spain's emptied interior turned its grievance into votes and forced services and broadband back onto the national budget. Organised small places get answered; isolated ones get rounded down.",
          researchIds: ["espana-vaciada-movement"],
        },
      ],
      vision2050:
        "By 2050 the road to the top hamlet is fixed and the doctor still comes — paid for by a bid no village your size could ever have written alone.",
      researchIds: ["oecd-shrinking-smartly", "pnrr-borghi-fund", "espana-vaciada-movement"],
      futurePairId: "bianca-51",
    },
  },
  {
    id: "elif-40",
    correspondent: { name: "Elif", age: 40, role: "diaspora heir, lives in the city", place: "her grandmother's village" },
    pressurePoint: "Absentee ownership",
    body: "Dear Oracle, my grandmother's house has been in the family for nearly a hundred years. I live in the city now — I go back every August, open the shutters for two weeks, then lock it all up again. I can't sell it; it would break my mother's heart and mine. But I can't move back either, my whole life is here. So it sits dark eleven months of the year while the village gets quieter around it. I feel guilty and I can't even say what I'm guilty of. What am I meant to do with it?",
    reply: {
      opening:
        "Elif — the house isn't a burden and it isn't a shrine. It's a key you're holding just outside the lock. You don't have to choose between selling your history and abandoning it.",
      personal:
        "You can let someone live in it without giving it up — a long lease, a rent-to-buy, or a few years of low rent traded for someone restoring it. Owning the house and keeping it dark were never the same thing.",
      solutions: [
        {
          title: "Match the house to someone who needs it",
          body: "An empty house held by an absent owner is the most common kind of rural decay and the most reversible. Across inland Spain, newcomers — many from much further away — are being matched to exactly these houses and quietly holding villages above the line.",
          researchIds: ["lacaixa-immigration-rural-spain", "riace-refugees-revival"],
        },
        {
          title: "Trade restoration for tenancy",
          body: "Schemes that sell empty houses cheap on the condition you fix them up — or pay people to settle and stay a decade — exist to turn dark houses into lived-in ones without ever forcing a sale.",
          researchIds: ["sambuca-one-euro-houses", "albinen-newcomer-payments"],
        },
      ],
      vision2050:
        "By 2050 your grandmother's shutters are open on a grey Tuesday in February. The warmth behind them isn't yours — and that turns out to be the whole point.",
      researchIds: ["lacaixa-immigration-rural-spain", "sambuca-one-euro-houses", "albinen-newcomer-payments"],
      futurePairId: "elif-40",
    },
  },
  {
    id: "rosa-29",
    correspondent: { name: "Rosa", age: 29, role: "agronomist, would-be farmer", place: "her family's valley" },
    pressurePoint: "Land access & livelihood",
    body: "I trained as an agronomist because I wanted to come back and farm here, where my family is from. The problem isn't knowledge or willingness — it's that the land is in a thousand pieces, each one belonging to someone who left and won't sell, or won't even answer the phone. There are terraces gone to scrub that I could have producing in a single season. I have everything except the ground. How do you farm land you can't get your hands on?",
    reply: {
      opening:
        "Rosa — the land isn't gone, it's asleep in a hundred names. Waking it is slow, unglamorous paperwork, but it's a known job with known tools, not an impossible one.",
      personal:
        "Start with a map, not a tractor. Find out who owns each parcel and write to them. A young farmer with a concrete plan is exactly who a tired, faraway heir is relieved to hand a lease to.",
      solutions: [
        {
          title: "A land bank to assemble the pieces",
          body: "You shouldn't have to chase a hundred owners yourself. Land banks and matching schemes — central to the EU's plan for getting young farmers onto the land — gather the scattered plots and lease them on to new growers.",
          researchIds: ["eu-young-farmers-land-access"],
        },
        {
          title: "Share the kit, not just the land",
          body: "What kills a small new farm is the cost of the press, the cold store, the machine. A cooperative across several growers makes viable what no one of you could afford alone.",
          researchIds: ["eu-young-farmers-land-access"],
        },
        {
          title: "You won't be the only newcomer",
          body: "The people repopulating rural Europe increasingly arrive from elsewhere — and a working farm is a strong reason for others to follow you in.",
          researchIds: ["lacaixa-immigration-rural-spain"],
        },
      ],
      vision2050:
        "By 2050 the terraces below the village are in green rows again, worked by someone who was 29 once and means to still be here at 70.",
      researchIds: ["eu-young-farmers-land-access", "lacaixa-immigration-rural-spain"],
      futurePairId: "rosa-29",
    },
  },
  {
    id: "henrik-58",
    correspondent: { name: "Henrik", age: 58, role: "GP covering five valleys", place: "a mountain district" },
    pressurePoint: "Health-service desert",
    body: "I'm the only doctor for five valleys and I'm 58. My patients are old and getting older, the distances are brutal, and I'm tired in a way that sleep no longer fixes. When I retire — and I'll have to — no young doctor is going to take this on, it's an impossible job. I'm not writing to be rescued. I'm writing to ask what happens to my patients when I can't do it anymore.",
    reply: {
      opening:
        "Henrik — you've been trying to be a whole health system inside one body. The answer was never a younger version of you doing the same impossible thing. It's a system built so no single person is the whole of it.",
      personal:
        "Look at a week of your visits and mark the ones that are really a conversation and a prescription. Those don't need the drive — they need a screen and a trained pair of hands in each village. Handing those off is how you get the rest of your time back.",
      solutions: [
        {
          title: "See people without the drive",
          body: "Telemedicine isn't science fiction for a place like yours. A project in the remote Greek mountains put a diagnostic device and a trained local in the village so elderly patients are examined over a video link instead of travelling for hours.",
          researchIds: ["agrafa-rural-telehealth"],
        },
        {
          title: "A clinic that travels on a timetable",
          body: "A rotating surgery that visits each village on a known day, with a community health worker covering the gaps between, means care reaches everyone without one person driving themselves into the ground.",
          researchIds: ["agrafa-rural-telehealth"],
        },
        {
          title: "Share the post across the valleys",
          body: "One contract covering all five valleys, split between several practitioners, turns an impossible solo job into a workable shared one — the kind of arrangement that survives a retirement.",
          researchIds: ["oecd-shrinking-smartly"],
        },
      ],
      vision2050:
        "By 2050 the clinic opens two mornings a week with a screen on the wall and a nurse at the door. Care reaches all five valleys, and the person delivering it gets to grow old too.",
      researchIds: ["agrafa-rural-telehealth", "oecd-shrinking-smartly"],
      futurePairId: "henrik-58",
    },
  },
  {
    id: "lucia-16",
    correspondent: { name: "Lucia", age: 16, role: "bright, ambitious, sixteen", place: "a remote upland village" },
    pressurePoint: "Connectivity & horizon",
    body: "Dear Oracle, I'm 16 and I'm good at things, maths mostly. My school has eleven students across three years and the internet drops in the middle of nearly every online lesson. I love it here, I really do, but I already know I'm going to leave, because everything that's going to happen seems to happen somewhere with a better signal. Tell me I'm wrong. Or tell me what would have to change so that I am.",
    reply: {
      opening:
        "Lucia — you're not wrong that the world is currently elsewhere. You're wrong that it has to stay that way. Right now your horizon is literally the speed of your connection, and that's a number, and numbers get fixed.",
      personal:
        "Use the signal you've got to reach the courses a school of eleven can't offer — and tell the adults, loudly, that the dropping line isn't an annoyance. It's the whole argument for fixing it.",
      solutions: [
        {
          title: "Fibre to the last house",
          body: "Bandwidth is the cheapest thing a region can do to keep its young. Where the cable reaches, remote work and real online learning follow, and every scheme paying people to move rural depends on a signal that holds.",
          researchIds: ["extremadura-digital-nomad-grants"],
        },
        {
          title: "A school that's a node, not a dead end",
          body: "A connected learning hub links your eleven students to a hundred others and to teachers you'll never have in the building — so a tiny school stops meaning a tiny horizon.",
          researchIds: ["euronews-digital-nomad-villages"],
        },
      ],
      vision2050:
        "By 2050 the line doesn't drop, your school is a node on a network instead of a dead end, and staying is something you get to choose rather than a sentence you serve.",
      researchIds: ["extremadura-digital-nomad-grants", "euronews-digital-nomad-villages", "eurostat-rural-demographics"],
      futurePairId: "lucia-16",
    },
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
 * and requiring the reply to cite real researchIds — the same shape this file
 * already defines, so only the data source changes.
 */
