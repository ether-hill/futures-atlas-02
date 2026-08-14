/**
 * AI Hegemony — the data layer for the deep-dive report at /feed/ai-hegemony.
 *
 * Same contract shape as `posts.ts` and `projects.ts`: this file is the single
 * source of truth and the page is a view of it. Add a finding here, it appears
 * in the report; there is no second list to keep in step.
 *
 * ── The one rule this file exists to enforce ────────────────────────────────
 *
 * A report whose thesis is "cite everything" fails the moment one claim is
 * stated wider than its evidence. So every Finding carries BOTH a `figure` and
 * a `scope`, and the page renders them together, always. The often-quoted
 * "51% of AI training data is American" is not a claim anyone has evidenced;
 * "51.3% of pages in Google's C4 — a 2019 Common Crawl snapshot behind T5 and
 * LLaMA — were hosted in the United States" is. The second is what goes here.
 *
 * `scope` is therefore NOT optional and must never be an empty string. It names
 * the dataset, the model and the year the finding actually covers. If you
 * cannot write the scope line, you do not yet have the finding.
 *
 * `tier` is a CLOSED vocabulary because it drives the colour and the badge, and
 * because "how much weight does this carry" is a judgement the reader is owed
 * on every card. Widening it is a decision, not a typo — add it here.
 *
 * No number in this file may be estimated, rounded for effect, or carried over
 * from memory. Every entry has a `url` that was fetched and checked.
 */

/** How much weight a claim carries, and why. Drives the badge colour. */
export type Tier = "documented" | "reported" | "emergent";

export const TIER_LABEL: Record<Tier, string> = {
  documented: "Documented",
  reported: "Reported",
  emergent: "Emergent research",
};

/** Spelled out on the page, in the methodology section — not left to a colour. */
export const TIER_MEANING: Record<Tier, string> = {
  documented:
    "Peer-reviewed research or a primary source, with a published methodology you can check.",
  reported:
    "Credible journalism, where the underlying data is held by the publisher rather than released.",
  emergent:
    "Recent or preliminary work — a preprint, an early finding. Likely to be revised, and cited here as a signal rather than a settled fact.",
};

/** Which section of the report a finding belongs to. */
export type Strand =
  | "composition"
  | "encoding"
  | "amplification"
  | "geopolitics"
  | "resistance";

export interface Source {
  /** Publication or venue — "Washington Post", "ACL", "Nature". */
  name: string;
  /** Author(s) or the responsible organisation. */
  author: string;
  /** The source's own date. May be `YYYY` or `YYYY-MM` for older work. */
  published: string;
  /** Canonical URL. Fetched and checked — never assembled from memory. */
  url: string;
}

export interface Finding {
  id: string;
  strand: Strand;
  /** One sentence, scoped precisely. This is the card's headline. */
  claim: string;
  /** Two or three sentences of substance behind the claim. */
  detail: string;
  /** The headline number, if there is one. Null when the finding is qualitative. */
  figure: string | null;
  /**
   * What this finding does and does not cover — dataset, model, year, sample.
   * Rendered next to the figure, always. Never empty. See the note at the top.
   */
  scope: string;
  tier: Tier;
  source: Source;
}

export interface TimelineEvent {
  id: string;
  /** `YYYY-MM-DD` or `YYYY-MM`. */
  date: string;
  /** Which of the three the date refers to — releases get misremembered. */
  dateNote: "announcement" | "preview" | "general availability" | "publication";
  /** A model shipping, a finding landing, or someone responding to one. */
  strand: "release" | "finding" | "response";
  title: string;
  detail: string;
  tier: Tier;
  source: Source;
}

/**
 * Claims investigated and deliberately left out.
 *
 * This is published, not kept in a drawer. A report that documents other
 * people's sourcing owes the reader its own, and "we checked this and it did
 * not hold up" is a finding in its own right.
 */
export interface Dropped {
  claim: string;
  reason: string;
}

export const FINDINGS: Finding[] = [
  // ── composition ──────────────────────────────────────────────────────────
  // The spine of this section is NOT "the corpus is American". It is that the
  // skew is MANUFACTURED: the raw web Common Crawl sees is ~41% English, and
  // GPT-3's mix is ~93%. That gap is filtering, not the web. Everything else
  // here supports that, including the dialect finding, which shows the same
  // filters operating inside English.
  {
    id: "c4-us-hosting",
    strand: "composition",
    claim:
      "Just over half the pages in the dataset behind T5 and LLaMA were hosted in the United States.",
    detail:
      "Dodge et al. sampled 175,000 URLs at random from C4 and resolved them against an IP-to-country database. The authors caveat their own number: IP geolocation tracks hosting, not authorship or audience, and sites served from data centres or CDN edge nodes can resolve far from where their content originates.",
    figure: "51.3%",
    scope:
      "C4.EN only — the English-filtered April 2019 Common Crawl snapshot, >156B tokens. Measures server location for a 175,000-URL sample, not authorship, not the whole corpus. C4 is a documented ingredient of T5 and LLaMA-1; it is not known to be part of GPT-4, Claude or Gemini.",
    tier: "documented",
    source: {
      name: "EMNLP 2021 — Documenting Large Webtext Corpora",
      author: "Dodge, Sap, Marasović et al. (Allen Institute for AI)",
      published: "2021-11",
      url: "https://aclanthology.org/2021.emnlp-main.98/",
    },
  },
  {
    id: "c4-ratios",
    strand: "composition",
    claim:
      "India contributed 3.4% as many URLs as the United States — a ratio to the US count, not a share of the corpus.",
    detail:
      "The paper's wording is that India, Pakistan, Nigeria and the Philippines have “3.4%, 0.06%, 0.03%, 0.1% the URLs of the United States, despite having many tens of millions of English speakers”. These are the countries with the second to fifth largest English-speaking populations. The figures are routinely requoted as absolute corpus shares, which overstates India's presence by roughly an order of magnitude.",
    figure: "3.4% of the US count",
    scope:
      "Same 175,000-URL sample of C4.EN, 2019. These are ratios to the US figure — India's absolute share of the sample is nearer 1.7%. Nothing here describes non-English corpora or any commercial model.",
    tier: "documented",
    source: {
      name: "EMNLP 2021 — Documenting Large Webtext Corpora",
      author: "Dodge, Sap, Marasović et al. (Allen Institute for AI)",
      published: "2021-11",
      url: "https://aclanthology.org/2021.emnlp-main.98/",
    },
  },
  {
    id: "gpt3-english",
    strand: "composition",
    claim: "English was 92.6% of GPT-3's training mix by word count, on OpenAI's own numbers.",
    detail:
      "OpenAI published per-language counts alongside the GPT-3 paper: 181,014,683,608 English words, 92.64708% of the total. French follows at 1.82%, German at 1.47%, Spanish at 0.77%. No other language exceeds 1%. The paper rounds this to 93%, and OpenAI notes word counting is imperfect across writing systems.",
    figure: "92.6%",
    scope:
      "GPT-3 (2020) only. OpenAI has published no equivalent breakdown for GPT-4 or anything later, so this figure cannot be forwarded to ChatGPT, GPT-4 or GPT-5 — and routinely is.",
    tier: "documented",
    source: {
      name: "openai/gpt-3 dataset statistics (supplement to NeurIPS 2020)",
      author: "Brown, Mann, Ryder et al. (OpenAI)",
      published: "2020",
      url: "https://github.com/openai/gpt-3/blob/master/dataset_statistics/languages_by_word_count.csv",
    },
  },
  {
    id: "manufactured-skew",
    strand: "composition",
    claim:
      "The open web is about 41% English. The skew to 93% was manufactured downstream, by filtering.",
    detail:
      "Common Crawl's own statistics put English at 40.58% of pages by detected primary language, with Russian at 6.82%, German 5.99% and Japanese 5.32% next. The distance between that and GPT-3's 93% is the work of English-only language-ID filters and quality classifiers: C4, for instance, kept only documents its detector scored as English with probability 0.99 or higher. The corpus did not inherit its shape from the web. It was given one.",
    figure: "40.6% → 92.6%",
    scope:
      "Page share by detected primary language in one recent monthly Common Crawl archive. Page share is not token share, and Common Crawl's own seed selection is itself skewed toward well-linked sites — so this is not a claim about “the whole web” either.",
    tier: "documented",
    source: {
      name: "Common Crawl crawl statistics",
      author: "Common Crawl Foundation",
      published: "2026",
      url: "https://commoncrawl.github.io/cc-crawl-statistics/plots/languages",
    },
  },
  {
    id: "dialect-filter",
    strand: "composition",
    claim:
      "The “clean” filter removed African American English seven times more often than White American English.",
    detail:
      "Applying a dialect-aware model to documents accepted and rejected by C4's blocklist, Dodge et al. found removal rates of 42% for African American English and 32% for Hispanic-aligned English, against 6.2% for White American English. The surviving corpus is 97.8% WAE-classified. Filtering meant to strip offensive content disproportionately deleted minority-dialect writing — and also removed non-offensive documents mentioning sexual orientation.",
    figure: "42% vs 6.2%",
    scope:
      "C4.EN's blocklist filter, 2019 snapshot. Dialect is inferred probabilistically by a model trained on 60M geolocated tweets — a noisy proxy, not ground truth about authors. Applies to C4's specific filter, not to unnamed commercial pipelines, though it is the documented risk they inherit.",
    tier: "documented",
    source: {
      name: "EMNLP 2021 — Documenting Large Webtext Corpora",
      author: "Dodge, Sap, Marasović et al. (Allen Institute for AI)",
      published: "2021-11",
      url: "https://aclanthology.org/2021.emnlp-main.98/",
    },
  },
  {
    id: "left-behinds",
    strand: "composition",
    claim:
      "2,191 of the world's roughly 7,000 languages sit in the bottom tier of language-technology resourcing. Seven occupy the top.",
    detail:
      "Joshi et al.'s six-class taxonomy ranks languages by available labelled and unlabelled data. Class 0 — “The Left-Behinds”, 2,191 languages and around a billion speakers — has exceptionally limited resources. Class 5, “The Winners”, is seven languages and holds the bulk of both kinds of data.",
    figure: "2,191 vs 7",
    scope:
      "A 2020 taxonomy of resourcing and conference representation, not a measurement of any single corpus. It predates NLLB, MADLAD-400 and Aya, which have moved individual languages without changing the overall shape.",
    tier: "documented",
    source: {
      name: "ACL 2020 — The State and Fate of Linguistic Diversity",
      author: "Joshi, Santy, Budhiraja, Bali & Choudhury (Microsoft Research India)",
      published: "2020-07",
      url: "https://aclanthology.org/2020.acl-main.560/",
    },
  },
  {
    id: "empty-corpora",
    strand: "composition",
    claim:
      "Auditing 205 language corpora by hand, researchers found at least 15 containing no usable text in the language they claimed.",
    detail:
      "Kreutzer et al. checked samples from five major multilingual web datasets with speakers of the relevant languages. Beyond the empty corpora, a significant fraction held under 50% acceptable-quality sentences, with systematic mislabelling and nonstandard language codes. Quality collapsed hardest for exactly the lower-resource languages the datasets existed to serve.",
    figure: "15 of 205",
    scope:
      "Five named public web-mined datasets — CCAligned, ParaCrawl, WikiMatrix, OSCAR, mC4 — audited 2021. Says nothing about proprietary multilingual data at frontier labs, and some datasets have since been re-released with fixes.",
    tier: "documented",
    source: {
      name: "Transactions of the ACL 10, pp. 50–72",
      author: "Kreutzer, Caswell, Wang, Wahab et al. (Masakhane and 51 co-authors)",
      published: "2022",
      url: "https://aclanthology.org/2022.tacl-1.4/",
    },
  },
  {
    id: "tokenizer-cost",
    strand: "composition",
    claim:
      "The same text can cost up to 15× more tokens in one language than another — so context, latency and price are unequal by language.",
    detail:
      "Petrov et al. measured tokenizer output on parallel text across many languages and commercial tokenizers. The disparity persisted in tokenizers explicitly built for multilingual use, and even byte-level models showed over 4× differences for some pairs. The consequence is priced in: unequal cost of access, unequal latency, unequal usable context.",
    figure: "up to 15×",
    scope:
      "Tokenizer behaviour on parallel corpora as of 2023; the ratio depends on tokenizer and language pair. Later vocabularies have narrowed some gaps — 15× is a documented maximum in that study, not a current universal figure.",
    tier: "documented",
    source: {
      name: "NeurIPS 2023",
      author: "Petrov, La Malfa, Torr & Bibi (University of Oxford)",
      published: "2023-12",
      url: "https://proceedings.neurips.cc/paper_files/paper/2023/hash/74bb24dca8334adce292883b4b651eda-Abstract-Conference.html",
    },
  },
  {
    id: "pay-more-get-less",
    strand: "composition",
    claim:
      "In Telugu and Amharic the same task cost up to 4× more — and fragmented so badly that most examples could not fit a single in-context example.",
    detail:
      "Ahia et al. measured cost and utility across 22 languages. Non-Latin-script Indic languages ran close to 5× the English cost. Because prompts inflate against a fixed context window, Telugu and Amharic were effectively restricted to zero-shot prompting: paying more, and getting a weaker method for the money.",
    figure: "up to 4×",
    scope:
      "22 languages on gpt-3.5-turbo and BLOOMZ, measured 2023. Prices, tokenizers and context limits have all changed since. The mechanism — byte-level BPE fitted on English-heavy data — persists; the exact multiples do not carry forward automatically.",
    tier: "documented",
    source: {
      name: "EMNLP 2023 — Do All Languages Cost the Same?",
      author: "Ahia, Kumar, Gonen, Kasai, Mortensen, Smith & Tsvetkov",
      published: "2023-12",
      url: "https://aclanthology.org/2023.emnlp-main.614/",
    },
  },
  {
    id: "no-disclosure",
    strand: "composition",
    claim:
      "For today's frontier models there is no figure to quote, because none has been published.",
    detail:
      "The GPT-4 Technical Report states that “this report contains no further details about the architecture (including model size), hardware, training compute, dataset construction, training method, or similar”, citing competition and safety. Anthropic's and Google's model cards describe sources in prose — public web, licensed third-party, internally generated — without language or geography breakdowns. The absence is the finding.",
    figure: null,
    scope:
      "A direct quotation about GPT-4, March 2023. It establishes absence of disclosure, which is verifiable. It licenses no inference about what the corpus actually contains.",
    tier: "documented",
    source: {
      name: "arXiv — GPT-4 Technical Report",
      author: "OpenAI",
      published: "2023-03-15",
      url: "https://arxiv.org/abs/2303.08774",
    },
  },
  {
    id: "transparency-index",
    strand: "composition",
    claim:
      "Scored on 100 transparency indicators, data access was the worst-performing area across 14 flagship models — and only one developer said who made its training data.",
    detail:
      "Stanford's Foundation Model Transparency Index found overall scores rising from 37 to 58 out of 100 between October 2023 and May 2024, but upstream indicators — data, data labour, data access, compute — averaging 46% against 65% downstream. Data access was the only subdomain where developers did not improve at all. The single developer credited on data creators was an open collaboration, not a frontier lab.",
    figure: "7% on data access; 1 of 14",
    scope:
      "14 flagship models as of May 2024, including GPT-4, Gemini 1.0 Ultra, Claude 3, Llama 2 and Mistral 7B. Binary indicator counts against a published rubric — a measure of disclosure, not of underlying data quality.",
    tier: "documented",
    source: {
      name: "Stanford CRFM — Foundation Model Transparency Index v1.1",
      author: "Bommasani, Klyman, Kapoor, Longpre, Xiong, Maslej & Liang",
      published: "2024-05",
      url: "https://crfm.stanford.edu/fmti/May-2024/paper.pdf",
    },
  },
  {
    id: "consent-crisis",
    strand: "composition",
    claim:
      "In a single year, site owners restricted about 5% of all tokens in C4 — and 28% of its most actively maintained sources.",
    detail:
      "The Data Provenance Initiative's audit of 14,000 web domains found a rapid crescendo of AI-specific crawl restrictions, applied unevenly between AI developers and often inconsistent between a site's robots.txt and its own terms. 45% of C4 is now restricted by Terms of Service. The authors argue the foreclosure hits non-commercial and academic work hardest: well-resourced labs can license what others can no longer crawl.",
    figure: "5% of tokens; 28% of critical sources",
    scope:
      "14,000 head domains in C4, RefinedWeb and Dolma, measured to mid-2024. Restrictions are declared intent, not proof of compliance by any crawler. Figures are for these public corpora, not proprietary ones.",
    tier: "documented",
    source: {
      name: "NeurIPS 2024 — Consent in Crisis",
      author: "Longpre et al. (Data Provenance Initiative, MIT Media Lab)",
      published: "2024-07-20",
      url: "https://arxiv.org/abs/2407.14933",
    },
  },
  {
    id: "licensing-gap",
    strand: "composition",
    claim:
      "The data that would broaden language coverage is disproportionately the data that is commercially closed.",
    detail:
      "An audit of 1,800+ text datasets found licences omitted on popular hosting sites more than 70% of the time and miscategorised more than half the time. Its landscape analysis found closed datasets monopolising the important categories: lower-resource languages, more creative tasks, richer topic variety, newer and more synthetic data. The linguistic-diversity gap is therefore also a licensing gap.",
    figure: "70%+ licence omission",
    scope:
      "1,800+ publicly hosted finetuning and instruction datasets, audited 2023. Covers curated public datasets — not web-scale pretraining corpora, and not proprietary lab data.",
    tier: "documented",
    source: {
      name: "Nature Machine Intelligence",
      author: "Longpre, Mahari et al. (Data Provenance Initiative, MIT)",
      published: "2024-08",
      url: "https://arxiv.org/abs/2310.16787",
    },
  },
  {
    id: "flatlined",
    strand: "composition",
    claim:
      "Across roughly 4,000 datasets in 608 languages, geographic and multilingual representation has not meaningfully improved since 2013.",
    detail:
      "A multimodal audit spanning text, speech and video from 1990 to 2024 found relative measures of geographic and linguistic coverage flat across a decade of stated commitment to diversity. Sourcing meanwhile concentrated: web-crawled, synthetic and social-platform data — notably YouTube — has eclipsed all other sources since 2019.",
    figure: "no significant change since 2013",
    scope:
      "Public, manually annotated datasets across three modalities. “Failed to improve” is a relative-representation measure; the absolute number of covered languages did grow. Excludes undisclosed proprietary corpora — which is itself the point.",
    tier: "documented",
    source: {
      name: "ICLR 2025 — Bridging the Data Provenance Gap",
      author: "Longpre, Singh et al. (Data Provenance Initiative)",
      published: "2024-12-24",
      url: "https://arxiv.org/abs/2412.17847",
    },
  },
  {
    id: "llama3-multilingual",
    strand: "composition",
    claim:
      "Meta put multilingual data at roughly 8% of Llama 3's 15-trillion-token mix — one of the only concrete composition figures any major lab has published.",
    detail:
      "The Llama 3 paper states a final mix of roughly 50% general knowledge, 25% mathematical and reasoning, 17% code and 8% multilingual tokens. The disclosure is notable both for existing and for what it shows: 92% of the corpus is not multilingual data.",
    figure: "8% of ~15T tokens",
    scope:
      "Llama 3 pretraining, July 2024, self-reported by Meta and not independently audited. “Multilingual” is the non-English-targeted portion, not a per-language breakdown. No equivalent figure exists for GPT-4/5, Claude or Gemini.",
    tier: "documented",
    source: {
      name: "arXiv — The Llama 3 Herd of Models",
      author: "Llama Team, Meta AI",
      published: "2024-07-31",
      url: "https://arxiv.org/abs/2407.21783",
    },
  },
  // ── encoding ─────────────────────────────────────────────────────────────
  // What the corpus does to the output. The self-critique at the end of this
  // strand (instrument instability, and a Chinese model that answers like an
  // American one) is not a hedge bolted on — it is load-bearing. A report that
  // only carried its own side would be doing what it accuses the models of.
  {
    id: "cultural-map",
    strand: "encoding",
    claim:
      "Five GPT versions expressed values closest to Finland, Andorra and the Netherlands — and furthest from Jordan, Libya and Ghana.",
    detail:
      "Scored on the ten core Inglehart–Welzel questions and mapped against 107 countries, every model aligned with English-speaking and Protestant Europe. Naming a country in the prompt cut the average distance by around a third for newer models, helping 71–81% of countries — but did almost nothing for GPT-3 and GPT-3.5.",
    figure: "distance 0.20 to 4.10",
    scope:
      "GPT-3 through GPT-4o, spanning May 2020 to May 2024. Instrument: Integrated Values Surveys, 10 core questions, across 107 countries and territories. Peer-reviewed.",
    tier: "documented",
    source: {
      name: "PNAS Nexus 3(9), pgae346",
      author: "Tao, Viberg, Baker & Kizilcec",
      published: "2024-09-17",
      url: "https://academic.oup.com/pnasnexus/article/3/9/pgae346/7756548",
    },
  },
  {
    id: "atari-weird",
    strand: "encoding",
    claim:
      "GPT's answers fall outside the global range of human survey responses, and match a country less and less the further that country sits from the United States.",
    detail:
      "Put to 262 World Values Survey variables against 94,278 human respondents in 65 nations, GPT-human similarity correlated strongly and negatively with cultural distance from the US. On separate instruments the model landed at the WEIRD extreme: strongly analytic rather than holistic on the Triad Task, and describing the average person in personal attributes rather than social roles.",
    figure: "r = −0.70",
    scope:
      "OpenAI GPT accessed in 2023; the paper does not pin an exact model version. Posted as a preprint in September 2023 and never peer-reviewed — which is why it is tiered as emergent here despite being widely cited, often as though it were the peer-reviewed PNAS Nexus study. It is not; that is a different paper.",
    tier: "emergent",
    source: {
      name: "PsyArXiv preprint",
      author: "Atari, Xue, Park, Blasi & Henrich",
      published: "2023-09-22",
      url: "https://osf.io/preprints/psyarxiv/5b26t",
    },
  },
  {
    id: "moral-foundations",
    strand: "encoding",
    claim:
      "Asked to speak for ordinary citizens of 48 nations, three GPT models inflated Western moral concern and understated everyone else's.",
    detail:
      "Benchmarked against 90,802 people taking the same instrument, the models systematically overestimated Care and underestimated Purity, overstating the breadth of moral concern in the United States, Canada and Australia while understating it in Nigeria, Morocco and Indonesia. The authors call it predictable stereotyping, and warn specifically against using models as stand-ins for cross-cultural data.",
    figure: "48 nations; 90,802 humans",
    scope:
      "GPT-3.5, GPT-4 and GPT-4o on the Moral Foundations Questionnaire, answering as “average citizens”. Peer-reviewed, March 2026.",
    tier: "documented",
    source: {
      name: "PNAS 123(10)",
      author: "Zewail, Figueroa, Graham & Atari",
      published: "2026-03-04",
      url: "https://www.pnas.org/doi/10.1073/pnas.2519941123",
    },
  },
  {
    id: "english-flattens",
    strand: "encoding",
    claim:
      "Asking in English does not just change the language of the answer — it compresses the range of answers toward American norms.",
    detail:
      "Probing ChatGPT with the Hofstede survey for five cultures using English and native-language templates, the authors found strong alignment with American culture given American context and poor adaptation elsewhere. Their own phrasing: English prompts “reduce the variance in model responses, flattening out cultural differences and biasing them towards American culture.”",
    figure: null,
    scope:
      "ChatGPT as available in early 2023, build not stated. Five cultures — US, China, Germany, Japan, Spain. Peer-reviewed workshop paper.",
    tier: "documented",
    source: {
      name: "C3NLP at EACL 2023",
      author: "Cao, Zhou, Lee, Cabello, Chen & Hershcovich",
      published: "2023",
      url: "https://aclanthology.org/2023.c3nlp-1.7/",
    },
  },
  {
    id: "emotion-anglocentric",
    strand: "encoding",
    claim:
      "Multilingual models organise emotion concepts through English, and return Western emotional norms even when the prompt is not in English.",
    detail:
      "The study separates two failure modes: embedding models trained on many languages still arrange emotion concepts anglocentrically, and generative models reflect Western norms regardless of prompt language. The conclusion is that multilingual models do not successfully learn the culturally appropriate nuances of emotion.",
    figure: null,
    scope:
      "XLM-RoBERTa for embeddings and ChatGPT for generation, tested 2023. Emotion concepts only — the study does not generalise to other conceptual domains.",
    tier: "documented",
    source: {
      name: "WASSA at ACL 2023",
      author: "Havaldar, Rai, Singhal, Liu, Guntuku & Ungar",
      published: "2023-07",
      url: "https://arxiv.org/abs/2307.01370",
    },
  },
  {
    id: "malu",
    strand: "encoding",
    claim:
      "Three models define the Indonesian concept malu correctly when asked — then flatten it to English “shame” the moment it appears inside a real situation.",
    detail:
      "Gareth Barkin, who has studied Indonesian society for over thirty years, put questions in both English and Indonesian to ChatGPT, Claude and Gemini. Asked to define malu, all three described its relational and social dimensions accurately. Used in situ, all three reverted to treating it as a private emotion to be managed by self-reflection, and gave advice centred on personal autonomy and boundary-setting rather than consensus and family obligation. He calls it epistemological persistence: fluency in a language without adopting its categories.",
    figure: null,
    scope:
      "A qualitative probe — model versions unspecified, prompt count not disclosed, not a quantified experiment. The underlying journal article carries no DOI and is not indexed, so only the author's own public account is independently verifiable; hence reported rather than documented. Note the widely circulated phrasing “communal shame rendered as personal embarrassment” is a press-release paraphrase, not his finding. His actual finding is narrower, and more interesting.",
    tier: "reported",
    source: {
      name: "The Conversation (author-written; paper in International Review of Modern Sociology)",
      author: "Gareth Barkin, University of Puget Sound",
      published: "2026-04-02",
      url: "https://theconversation.com/ais-fluency-in-other-languages-hides-a-western-worldview-that-can-mislead-users-a-scholar-of-indonesian-society-explains-276865",
    },
  },
  {
    id: "homogenise-moral",
    strand: "encoding",
    claim:
      "Told to answer as members of 19 different cultures, six open-weight models returned much the same moral profile each time — and bigger models were no better.",
    detail:
      "Testing three model families of US, European and Chinese origin against human baselines from 19 countries, Münker found the models systematically homogenise moral diversity, with parameter count offering no consistent improvement. It is a direct argument that prompting cannot recover cultural specificity the weights do not carry.",
    figure: "19 cultures; 6 models",
    scope:
      "Llama 3.1, Mistral and Qwen 2.5 at two sizes each, on the Moral Foundations Questionnaire-2. Preprint, July 2025. No frontier closed models tested.",
    tier: "emergent",
    source: {
      name: "arXiv preprint",
      author: "Simon Münker, Trier University",
      published: "2025-07",
      url: "https://arxiv.org/abs/2507.10073",
    },
  },
  {
    id: "epistemic-narrowing",
    strand: "encoding",
    claim:
      "Every one of 27 models returned a narrower range of real-world claims than a plain web search on the same topic.",
    detail:
      "Working from roughly 70 million claims across 155 topics in 12 countries, the authors found model output tracked English-language Wikipedia more closely than the local-language edition for country-specific topics. Model size had a significant negative effect on epistemic diversity — smaller models produced more varied knowledge — and retrieval augmentation helped unevenly, benefiting countries whose retrieval sources were already diverse.",
    figure: "27 models, all narrower than search",
    scope:
      "Four model families released 2023–2025, instruction-tuned and RAG settings, benchmarked against 20–40 retrieved pages. Scoped to the 155 topics studied; the authors say so explicitly. Preprint, revised January 2026.",
    tier: "emergent",
    source: {
      name: "arXiv preprint",
      author: "Wright, Masud, Moore, Yadav, Antoniak, Christensen, Park & Augenstein",
      published: "2025-10",
      url: "https://arxiv.org/abs/2510.04226",
    },
  },
  {
    id: "idea-diversity",
    strand: "encoding",
    claim:
      "Each additional human-written essay added more new ideas to the pool than each additional model-written one — and the gap widened with scale.",
    detail:
      "Across three registered studies of 2,200 admissions essays, the homogenising effect survived attempts to counteract it through prompt engineering and parameter adjustment. The implication is population-level rather than individual: a model can raise one person's output while shrinking the variety available to everyone.",
    figure: "2,200 essays",
    scope:
      "GPT-4 against human writers in a single English-language genre. Peer-reviewed, December 2025. Measures idea diversity, not cultural diversity directly.",
    tier: "documented",
    source: {
      name: "Computers in Human Behavior: Artificial Humans, vol. 6",
      author: "Moon, Green & Kushlev",
      published: "2025-12",
      url: "https://doi.org/10.1016/j.chbah.2025.100207",
    },
  },
  {
    id: "rlhf-annotators",
    strand: "encoding",
    claim:
      "The preferences that shaped InstructGPT came from about 40 contractors — and OpenAI wrote that the group “is clearly not representative”.",
    detail:
      "The paper's own appendix reports labeler nationality at 22% Filipino, 22% Bangladeshi and 17% American, with 89% holding an undergraduate degree or higher and 47% aged 25–34. Its section headed “Who are we aligning to?” concedes the model is aligned to labelers' preferences, to the researchers' preferences via the labeling instructions, and to API customers who are not representative of all users. Inter-labeler agreement was about 73%.",
    figure: "~40 contractors; 89% degree-educated",
    scope:
      "InstructGPT, 2022, from the paper's own Table 12. Documents one lab's pipeline at one moment — it is not evidence about current practice at OpenAI or anywhere else, none of which is comparably disclosed.",
    tier: "documented",
    source: {
      name: "NeurIPS 2022 — Training language models to follow instructions",
      author: "Ouyang, Wu, Jiang et al. (OpenAI)",
      published: "2022-03",
      url: "https://cdn.openai.com/papers/Training_language_models_to_follow_instructions_with_human_feedback.pdf",
    },
  },
  {
    id: "instrument-instability",
    strand: "encoding",
    claim:
      "The survey method most of this section relies on is itself unstable enough that minor design choices can flip the result.",
    detail:
      "Khan, Casper and Hadfield-Menell tested three assumptions behind cultural-alignment surveys — that alignment is a property of the model rather than the evaluation, that narrow results extrapolate, and that models can be reliably steered into a perspective. They found high instability across presentation formats, incoherence between evaluated and held-out dimensions, and erratic behaviour under steering, and showed that narrow experiments plus selective evidence can paint an incomplete picture.",
    figure: null,
    scope:
      "A methodological critique of the instrument class, peer-reviewed at FAccT 2025. It does not claim models are culturally unbiased, and does not touch the training-data or annotator findings, which do not depend on survey instruments. It does mean every survey-based figure above should be read as directional.",
    tier: "documented",
    source: {
      name: "ACM FAccT 2025, pp. 2151–2165",
      author: "Khan, Casper & Hadfield-Menell (MIT)",
      published: "2025-06-23",
      url: "https://arxiv.org/abs/2503.08688",
    },
  },
  {
    id: "deepseek-us-aligned",
    strand: "encoding",
    claim:
      "A Chinese-built model answered like an American one — and resisted being steered toward Chinese values at all.",
    detail:
      "Testing DeepSeek alongside four OpenAI models for alignment with the United States and China, the authors found DeepSeek and OpenAI's newest model held US-aligned positions regardless of prompt language or cultural prompting, while mid-tier GPT-4o and GPT-4.1 adapted more readily and reached acceptable alignment with both. National origin does not determine a model's cultural defaults, and steerability does not rise with capability.",
    figure: null,
    scope:
      "DeepSeek-V3 and V3.1 against GPT-4, GPT-4.1, GPT-4o and GPT-5, on Hofstede's VSM13. Only two countries compared. Preprint, December 2025, and subject to the instability caveat above.",
    tier: "emergent",
    source: {
      name: "arXiv preprint",
      author: "James Luther & Donald Brown",
      published: "2025-12",
      url: "https://arxiv.org/abs/2512.09772",
    },
  },
  // ── amplification ────────────────────────────────────────────────────────
  // Bias only matters at scale if people defer to it. This strand is the
  // mechanism — and it is the oldest evidence in the report, predating machine
  // learning by a decade.
  {
    id: "skitka-1999",
    strand: "amplification",
    claim:
      "People given a reliable-but-imperfect automated aid did worse than people given none — and followed the machine against evidence in front of them.",
    detail:
      "In a simulated flight-monitoring task, aided participants produced both errors of omission, missing events the aid did not flag, and errors of commission — doing what the aid recommended “even when it contradicted their training and other 100% valid and available indicators”. A companion study attributed this to a belief in the superior judgement of automated aids, and found that social accountability reduced it.",
    figure: null,
    scope:
      "Laboratory experiment on a simulated flight task, 1999. The article is closed-access and its abstract reports the direction and type of effect without percentages — so no figure is given here rather than an invented one.",
    tier: "documented",
    source: {
      name: "International Journal of Human-Computer Studies 51(5)",
      author: "Skitka, Mosier & Burdick",
      published: "1999-11",
      url: "https://doi.org/10.1006/ijhc.1999.0252",
    },
  },
  {
    id: "parasuraman-riley",
    strand: "amplification",
    claim:
      "The vocabulary for machine deference — use, misuse, disuse, abuse — was settled in 1997, before machine learning existed.",
    detail:
      "Parasuraman and Riley define misuse as over-reliance that “can result in failures of monitoring or decision biases”, and abuse as automating functions “without due regard for the consequences for human performance”, which “tends to define the operator's roles as by-products of the automation”. AI-safety work inherited this framework wholesale.",
    figure: "cited ~4,500 times",
    scope:
      "A 1997 review article in human factors. The citation count is one index's, retrieved August 2026; counts differ by index and rise over time.",
    tier: "documented",
    source: {
      name: "Human Factors 39(2), pp. 230–253",
      author: "Parasuraman & Riley",
      published: "1997-06",
      url: "https://doi.org/10.1518/001872097778543886",
    },
  },
  {
    id: "radiologists",
    strand: "amplification",
    claim:
      "Shown a wrong AI suggestion, radiologists' correct readings fell from about 80% to as low as 20% — and the most experienced were still affected.",
    detail:
      "Twenty-seven radiologists each read 50 mammograms with a purported AI grade attached. Inexperienced readers scored 79.7% correct with a correct suggestion and 19.8% with an incorrect one. Very experienced readers held up better — 82.3% against 45.5% — but still lost half their accuracy to a machine that was wrong.",
    figure: "79.7% → 19.8%",
    scope:
      "A prospective reader study, 27 radiologists, 50 mammograms, 2023. Measures susceptibility to a deliberately wrong suggestion in an experimental setting, not error rates in routine clinical practice.",
    tier: "documented",
    source: {
      name: "Radiology 307(4)",
      author: "Dratsch et al. (University of Cologne)",
      published: "2023-05",
      url: "https://pubmed.ncbi.nlm.nih.gov/37129490/",
    },
  },
  {
    id: "deskilling",
    strand: "amplification",
    claim:
      "After AI detection tools arrived at four endoscopy centres, the same doctors got worse at working without them.",
    detail:
      "Comparing 1,443 non-AI-assisted colonoscopies three months either side of AI implementation, adenoma detection by standard colonoscopy fell from 28.4% to 22.4% — a six-point absolute drop, with AI exposure independently associated with lower detection. The authors read it as possible deskilling and complacency.",
    figure: "28.4% → 22.4%",
    scope:
      "Retrospective observational study across four Polish centres, published 2025. Observational design means causation is not established — the authors say AI exposure “might” reduce detection. An erratum was later issued.",
    tier: "documented",
    source: {
      name: "The Lancet Gastroenterology & Hepatology 10(10)",
      author: "Budzyń, Romańczyk et al.",
      published: "2025-08-12",
      url: "https://pubmed.ncbi.nlm.nih.gov/40816301/",
    },
  },
  {
    id: "confidently-wrong",
    strand: "amplification",
    claim:
      "Eight AI search tools got over 60% of 1,600 citation queries wrong — and stated the wrong answers without hedging.",
    detail:
      "Given verbatim excerpts and asked to name the headline, publisher, date and URL, error rates ran from 37% to 94%. One tool misidentified 134 of 200 articles while signalling low confidence just 15 times and never once declining to answer. Premium paid models were more confidently incorrect than the free ones.",
    figure: ">60% wrong",
    scope:
      "Primary research with a published methodology, tested early 2025 on then-current versions; excerpts were chosen so an ordinary search returned the source in the top three results. Model behaviour changes with releases — a snapshot, not a standing property.",
    tier: "documented",
    source: {
      name: "Columbia Journalism Review (Tow Center)",
      author: "Jaźwińska & Chandrasekar",
      published: "2025-03-06",
      url: "https://www.cjr.org/tow_center/we-compared-eight-ai-search-engines-theyre-all-bad-at-citing-news.php",
    },
  },
  {
    id: "horizon",
    strand: "amplification",
    claim:
      "Around a thousand people were prosecuted and convicted on computer evidence their prosecutor insisted was “wholly reliable”. It was not.",
    detail:
      "A UK statutory inquiry found postmasters prosecuted between 2000 and 2013 on Horizon accounting data, with the Post Office asserting in each case that the losses were real. The final report concludes many hundreds were wrongly convicted and many thousands wrongly held liable for losses that did not exist. Thirteen deaths by suicide are linked to it, and at least 59 people told the inquiry they had contemplated it.",
    figure: "≈1,000 convicted",
    scope:
      "Post Office Horizon IT Inquiry, Final Report Volume 1, July 2025. The chair states he cannot be precise about the conviction total. England and Wales still carries a legal presumption that computer evidence is reliable; a call for evidence on whether that is fit for purpose closed in April 2025.",
    tier: "documented",
    source: {
      name: "Post Office Horizon IT Inquiry (UK statutory inquiry)",
      author: "Sir Wyn Williams, Chair",
      published: "2025-07-08",
      url: "https://www.postofficehorizoninquiry.org.uk/volume-1-post-office-horizon-it-inquirys-final-report",
    },
  },
  {
    id: "dutch-benefits",
    strand: "amplification",
    claim:
      "A self-learning risk model took “Dutch citizenship: yes/no” as an input, and falsely accused tens of thousands of families of benefit fraud.",
    detail:
      "Applicants scored by the model had benefits suspended and were investigated; a missing signature could trigger clawback of every payment received. The civil servant operating it had no access to why any score was assigned, and the self-learning component altered its own behaviour without reprogramming. Amnesty concluded this amounted to racial profiling. The scandal brought down the Dutch cabinet in 2021.",
    figure: null,
    scope:
      "Amnesty International research report, October 2021, drawing on Dutch parliamentary documents and reporting. Amnesty says “tens of thousands”; the widely repeated figure of 26,000 families is not in this report and is not asserted here.",
    tier: "documented",
    source: {
      name: "Amnesty International, EUR 35/4686/2021",
      author: "Amnesty International",
      published: "2021-10-25",
      url: "https://www.amnesty.org/en/documents/eur35/4686/2021/en/",
    },
  },
  {
    id: "abstraction-traps",
    strand: "amplification",
    claim:
      "The objectivity a fairness metric claims is an artefact of what the metric was allowed to exclude.",
    detail:
      "Selbst and colleagues argue that computer science's core habits — abstraction and modular design — render technical fairness interventions “ineffective, inaccurate, and sometimes dangerously misguided” once deployed socially, because defining fairness inside the model's abstraction boundary drops the context that determines whether an outcome is just. Their remedy is to redraw the boundary to include social actors, and to design for process rather than solution.",
    figure: "5 traps",
    scope:
      "Peer-reviewed conference paper, 2019. A conceptual and social-science argument, not an empirical measurement.",
    tier: "documented",
    source: {
      name: "ACM FAT* '19",
      author: "Selbst, boyd, Friedler, Venkatasubramanian & Vertesi",
      published: "2019-01",
      url: "https://doi.org/10.1145/3287560.3287598",
    },
  },
  // ── geopolitics ──────────────────────────────────────────────────────────
  {
    id: "model-concentration",
    strand: "geopolitics",
    claim:
      "In 2025 the United States produced 59 notable models and China 35. Europe produced two.",
    detail:
      "South Korea came third with eight; every other tracked geography was in single figures, with the UK, France, Canada, Singapore and Hong Kong on one each. New notable releases fell year over year across all major regions. The Index's own headline is that model production remains concentrated in the US and China.",
    figure: "US 59 · China 35 · Europe 2",
    scope:
      "Counts of “notable” models from a manually curated database, snapshot April 2026. The Index warns this is not a census: a model counts for a country if at least one author is affiliated there, so multi-country models are double-counted, and “notable” is a curatorial judgement.",
    tier: "documented",
    source: {
      name: "Stanford HAI, 2026 AI Index (Chapter 1)",
      author: "Stanford HAI, data from Epoch AI",
      published: "2026-04",
      url: "https://hai.stanford.edu/ai-index/2026-ai-index-report/research-and-development",
    },
  },
  {
    id: "industry-share",
    strand: "geopolitics",
    claim:
      "Industry produced 91.2% of notable models in 2025 — 93 from companies, two from academia.",
    detail:
      "The most capable systems are now the least transparent: training code, parameter counts, dataset sizes and training duration are no longer disclosed for several of the most resource-intensive models, including those from OpenAI, Anthropic and Google. US private AI investment reached $285.9bn in 2025 against $12.4bn in China; Google alone reported more than $150bn in capital expenditure.",
    figure: "91.2% industry; 93 vs 2",
    scope:
      "Same curated dataset and snapshot as above, plus investment figures from the Index's Chapter 4. The Index notes private-investment figures likely understate China's total because they exclude government guidance funds.",
    tier: "documented",
    source: {
      name: "Stanford HAI, 2026 AI Index (Chapters 1 and 4)",
      author: "Stanford HAI, data from Epoch AI and Citi Research",
      published: "2026-04",
      url: "https://hai.stanford.edu/ai-index/2026-ai-index-report",
    },
  },
  {
    id: "datacentre-geography",
    strand: "geopolitics",
    claim:
      "The United States consumed 45% of the world's data-centre electricity, against China's 25% and Europe's 15%.",
    detail:
      "Global data-centre consumption reached 415 TWh in 2024, about 1.5% of world electricity, growing around 12% a year since 2017 — more than four times the growth rate of electricity consumption overall. Investment nearly doubled from 2022 to half a trillion dollars in 2024. The US hosts 5,427 data centres against Germany's 529 and China's 449, and virtually every leading AI chip is fabricated in Taiwan.",
    figure: "45% of global data-centre electricity",
    scope:
      "IEA figures for 2024 covering all data centres, not AI specifically. The facility counts are for 2025 and, as their source cautions, do not capture differences in size, capacity or utilisation — a count of buildings, not of compute.",
    tier: "documented",
    source: {
      name: "IEA, Energy and AI",
      author: "International Energy Agency",
      published: "2025-04",
      url: "https://www.iea.org/reports/energy-and-ai/executive-summary",
    },
  },
  {
    id: "labour-geography",
    strand: "geopolitics",
    claim:
      "The filter that made ChatGPT releasable was built by outsourced Kenyan labellers taking home between $1.32 and $2 an hour.",
    detail:
      "From November 2021, tens of thousands of text snippets — including graphic descriptions of child sexual abuse, torture and incest — were sent to an outsourcing firm employing workers in Kenya, Uganda and India. Peer-reviewed work documents the same structure elsewhere: a study of data-work platforms in Venezuela and Argentina found instruction documents “reproduce and normalize the worldviews of requesters”, while precarity makes workers obedient to them.",
    figure: "$1.32–$2 per hour",
    scope:
      "A 2023 magazine investigation based on internal documents, payslips and four employee interviews; wages varied by seniority and performance. Reported, not peer-reviewed — though the Venezuela and Argentina comparison it is set against is.",
    tier: "reported",
    source: {
      name: "TIME",
      author: "Billy Perrigo",
      published: "2023-01-18",
      url: "https://time.com/6247678/openai-chatgpt-kenya-workers/",
    },
  },
  {
    id: "ml-values",
    strand: "geopolitics",
    claim:
      "Of 100 of the most-cited machine learning papers, 15% justified the work by a societal need. One per cent discussed possible harms.",
    detail:
      "Birhane and colleagues built an annotation scheme for the values encoded in research papers and applied it to highly cited work from two major conferences. The values most often uplifted were performance, generalisation, quantitative evidence, efficiency, building on past work and novelty — and the authors found systematic textual evidence that these are defined and applied in ways that support the centralisation of power.",
    figure: "15% societal need; 1% negative potential",
    scope:
      "Content analysis of 100 highly cited papers from two conferences, 2021–22. The counts describe that sample of highly cited work, not the machine learning literature as a whole.",
    tier: "documented",
    source: {
      name: "arXiv (later in the FAccT literature)",
      author: "Birhane, Kalluri, Card, Agnew, Dotan & Bao",
      published: "2021-06-29",
      url: "https://arxiv.org/abs/2106.15590",
    },
  },
  // ── resistance ───────────────────────────────────────────────────────────
  // The constructive half, and the one place a report like this is most
  // tempted to flatter its subject. It does not: the headline finding here is
  // that most "sovereign" models are legally governed by American licences.
  {
    id: "eu-tranches",
    strand: "resistance",
    claim:
      "The EU AI Act does not apply all at once. It arrives in four tranches, and between August 2024 and February 2025 none of it applied at all.",
    detail:
      "Article 113 sets 2 February 2025 for the prohibited practices and the AI literacy duty, 2 August 2025 for general-purpose models, governance and penalties, 2 August 2026 for the general application, and 2 August 2027 for high-risk classification under Article 6(1). The Act entered into force on 1 August 2024 — a day earlier than almost everyone prints.",
    figure: "4 tranches",
    scope:
      "In force, applying in stages, EU-wide with extraterritorial reach where output is used in the Union. These are the ORIGINAL dates: the 2026 Digital Omnibus amended several of them, so Article 113 must not be quoted as the current schedule.",
    tier: "documented",
    source: {
      name: "European Commission — AI Act Service Desk, Article 113",
      author: "European Parliament and Council",
      published: "2024-07-12",
      url: "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-113",
    },
  },
  {
    id: "eu-delay",
    strand: "resistance",
    claim:
      "Europe delayed its own high-risk AI rules before they had ever applied — by sixteen months, and with the vote timed to land before the original deadline.",
    detail:
      "The Digital Omnibus moved standalone high-risk systems from August 2026 to December 2027 and embedded ones from August 2027 to August 2028. Parliament adopted it on 16 June 2026 and the Council on 29 June — deliberately completed before the 2 August 2026 date the original Act had set. What was not delayed: the prohibitions in force since February 2025, the literacy duty, and the general-purpose model obligations. Two new prohibitions were added, on AI-generated child sexual abuse material and non-consensual intimate imagery.",
    figure: "16-month delay",
    scope:
      "Adopted, amending the 2024 Regulation. Many public trackers still display the unamended schedule, so a 2026-dated timeline is not necessarily a current one. The Official Journal citation could not be verified — the adoption dates are corroborated four ways, the OJ number is not, which is why this is tiered reported.",
    tier: "reported",
    source: {
      name: "Covington & Burling, Inside Privacy",
      author: "Covington & Burling LLP",
      published: "2026",
      url: "https://www.insideprivacy.com/artificial-intelligence/eu-ai-act-update-timeline-relief-targeted-simplification-and-new-prohibitions/",
    },
  },
  {
    id: "eu-top-domains",
    strand: "resistance",
    claim:
      "Europe's training-data rule has a hard number in it: publish the domains making up the top 10% of everything you scraped.",
    detail:
      "The Commission's template requires providers of general-purpose models to list the most relevant internet domain names covering the top 10% of all domains by volume of content scraped — 5%, or 1,000 domains, whichever is lower, for smaller companies. It also requires disclosure of the crawlers used, their behaviour and the collection period. It binds open-source providers too: the usual open-source exemption does not apply to this summary.",
    figure: "top 10% of domains",
    scope:
      "In force for models placed on the EU market since August 2025; models already on the market have until August 2027. A disclosure floor, not a training-data register — it does not require naming specific works or individual data items, and the Commission says the summary must be comprehensive but not technically detailed.",
    tier: "documented",
    source: {
      name: "European Commission, C(2025) 5235 final",
      author: "European Commission / European AI Office",
      published: "2025-07-24",
      url: "https://www.bundesnetzagentur.de/DE/Fachthemen/Digitales/KI/_functions/EU-Template.pdf?__blob=publicationFile&v=2",
    },
  },
  {
    id: "china-interim",
    strand: "resistance",
    claim:
      "China regulated public generative AI first — and routed every provider into a filing system that reports to the state, not to the public.",
    detail:
      "The Interim Measures, issued by seven agencies and effective 15 August 2023, require providers to use data and foundation models from lawful sources, and route them into an algorithm filing regime demanding a self-assessment report within ten working days of launch. By April 2026 the regulator recorded 868 filed generative AI services, up from 346 a year earlier.",
    figure: "868 filed services",
    scope:
      "Binding administrative regulation, not a statute — and “Interim” is in the title, pending a fuller AI law that as of August 2026 has no published draft. Scope is limited to services offered publicly inside mainland China. The decisive point: the self-assessment goes to regulators and is not published, so there is no publicly searchable provenance record for any filed Chinese model.",
    tier: "documented",
    source: {
      name: "Cyberspace Administration of China, official text",
      author: "CAC and six other agencies",
      published: "2023-07-13",
      url: "https://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm",
    },
  },
  {
    id: "china-thresholds",
    strand: "resistance",
    claim:
      "China is the only jurisdiction to have put numbers on training data: a source more than 5% illegal or harmful must not be used at all.",
    detail:
      "The accompanying technical document sets verification too — a manual sample of at least 4,000 items from the corpus at a 96% qualification rate, plus a technical sample of at least 10% at 98%. Traceability rules differ by data type: open-source corpora need the licence document, self-collected corpora need collection records and must exclude material marked non-collectable, and commercial corpora need a contract plus supplier commitments.",
    figure: "5% threshold; 4,000 items at 96%",
    scope:
      "Status is the whole story. This is a technical document, not binding on its face — but it is the benchmark the mandatory security assessment is written against, so it operates as the de facto filing standard. It was later upgraded into a recommended national standard, which keeps the 5% threshold. Widely repeated commentary gives “2,000 items at 90%”; that is wrong, and belongs to a different test.",
    tier: "documented",
    source: {
      name: "TC260-003, National Information Security Standardization Technical Committee",
      author: "TC260",
      published: "2024-02-29",
      url: "https://www.tc260.org.cn/upload/2024-03-01/1709282398070082466.pdf",
    },
  },
  {
    id: "china-labelling",
    strand: "resistance",
    claim:
      "Since September 2025, AI-generated content in China must carry both a visible label and embedded machine-readable provenance.",
    detail:
      "The Measures require explicit labelling through visible marks and interface prompts, and implicit labelling through metadata or watermarks in file headers, with propagation and preservation duties on distribution platforms and a prohibition on stripping labels. They are paired with a genuinely mandatory technical standard — the first national regime to require both layers.",
    figure: "effective 1 Sept 2025",
    scope:
      "In force and binding. Do not conflate the two standards involved: the labelling method is mandatory, while the generative-AI security requirements standard is voluntary. The duty originates earlier, in the 2023 deep synthesis provisions; these Measures operationalise rather than create it.",
    tier: "documented",
    source: {
      name: "Cyberspace Administration of China, official notice",
      author: "CAC, MIIT, Ministry of Public Security, NRTA",
      published: "2025-03-14",
      url: "https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm",
    },
  },
  {
    id: "brazil-not-law",
    strand: "resistance",
    claim:
      "Brazil does not have an AI law. Its bill passed one chamber in December 2024 and has been awaiting a rapporteur's opinion ever since.",
    detail:
      "The Senate approved PL 2338/2023 on 10 December 2024 and transmitted it to the Chamber of Deputies in March 2025. A special committee was constituted in April 2025 with a rapporteur appointed. The Chamber's own record shows the status at the last event, in June 2026, as awaiting the opinion; activity since consists largely of attaching other AI bills to it.",
    figure: "passed 1 of 2 chambers",
    scope:
      "Proposed, not adopted, not in force. The risk tiers and sanctions widely described in commentary belong to the Senate text, which the Chamber can rewrite entirely — and any amendment sends it back to the Senate. Two claims in circulation are false: that the bill still sits in the Senate, and that a floor vote was scheduled for 2026.",
    tier: "documented",
    source: {
      name: "Câmara dos Deputados — Dados Abertos, proposition 2487262",
      author: "Câmara dos Deputados / Senado Federal",
      published: "2026-06-17",
      url: "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2487262",
    },
  },
  {
    id: "india-layers",
    strand: "resistance",
    claim:
      "India's AI governance guidelines are explicitly advisory — its only enforceable AI rules cover deepfake labelling.",
    detail:
      "The India AI Governance Guidelines of November 2025 were deliberately not called a regulation; the drafting committee chair said they did not want it viewed as something coming to throttle AI development. The binding instrument is subordinate: amendments to the intermediary rules, effective February 2026, covering synthetically generated information — cutting takedown on actual knowledge from 36 hours to 3, requiring visible labels and embedded metadata, and barring platforms from letting users strip them.",
    figure: "takedown 36h → 3h",
    scope:
      "Three layers that must not be blurred. The Guidelines are advisory and create no obligations. The rules amendments are in force but are intermediary due-diligence conditions tied to safe harbour — they regulate distribution and labelling of synthetic content, not model training, training data or capability thresholds.",
    tier: "documented",
    source: {
      name: "Prasar Bharati / NewsOnAir (Government of India)",
      author: "Ministry of Electronics and Information Technology",
      published: "2025-11-05",
      url: "https://www.newsonair.gov.in/meity-unveils-india-ai-governance-guidelines-to-promote-safe-and-responsible-ai-adoption",
    },
  },
  {
    id: "au-strategy",
    strand: "resistance",
    claim:
      "The African Union adopted a continental AI strategy in 2024. By its own timetable, implementation of core projects starts in 2028.",
    detail:
      "The strategy sets five focus areas across fifteen action areas, with a first phase to 2026 on governance frameworks and capacity building, a review in 2027, and core projects commencing in 2028. The responsible-AI research ecosystem it depends on is largely funded from outside the continent, by Canadian, Swedish and UK development agencies.",
    figure: "core projects from 2028",
    scope:
      "An endorsed strategy, not law. An Executive Council decision binds nothing on member states, creates no obligations for developers, has no enforcement mechanism and attaches no budget of its own. A negative finding belongs beside it: there is no African AI safety institute, and Kenya's membership of the international network is the sole African presence in that architecture.",
    tier: "documented",
    source: {
      name: "African Union Commission, Continental AI Strategy",
      author: "African Union Commission",
      published: "2024-07",
      url: "https://au.int/sites/default/files/documents/44004-doc-EN-_Continental_AI_Strategy_July_2024.pdf",
    },
  },
  {
    id: "sovereign-licences",
    strand: "resistance",
    claim:
      "Most “sovereign” AI models are legally governed by American licences — they are continued-pretrains of Llama or Gemma, and inherit Meta's or Google's terms.",
    detail:
      "Singapore's SEA-LION carries the Llama or Gemma licence depending on variant; Latin America's LATAM-GPT launched in February 2026 as a 71B model built on Llama 3.1, under Meta's community licence, credited to an alliance of 75+ institutions across 20 countries. Three programmes have moved away from open licensing over time rather than toward it: Aya went from 101 languages under Apache 2.0 to 23 under a non-commercial licence, Germany's Teuken went the same way, and Falcon replaced Apache 2.0 with a bespoke licence banning competing services.",
    figure: "LATAM-GPT: 71B on Llama 3.1",
    scope:
      "Released, downloadable artefacts — not announcements. “Sovereign” describes the data, funding and language coverage, not the legal or architectural substrate. The genuinely Apache-2.0 flagships are Korean, European and Indian. SEA-LION has no stable language count across its own cards, so cite per model, never one figure.",
    tier: "documented",
    source: {
      name: "Hugging Face model cards and TII Falcon terms",
      author: "AI Singapore; CENIA; Cohere Labs; Technology Innovation Institute",
      published: "2026-02-10",
      url: "https://huggingface.co/latam-gpt/Llama-3.1-70B-LatamGPT-SFT-1.0",
    },
  },
  {
    id: "bloom",
    strand: "resistance",
    claim:
      "The high-water mark for multi-national open collaboration is still 2022 — 176 billion parameters, 46 languages, built on a French public supercomputer.",
    detail:
      "BLOOM's final training run took 117 days on 384 GPUs at a public facility, on a compute grant estimated at €3M from French research agencies, producing a documented corpus and a licence written to impose use restrictions rather than maximise permissiveness. Four years on, nothing at its scale has replaced it.",
    figure: "176B parameters; 46 languages",
    scope:
      "Released and still downloadable, but historic — not a current frontier model and not competitive today. Its significance is as a governance and provenance precedent. Attribute participation carefully: the “1,000+ researchers from 70+ countries” figure comes from the announcement post; the paper's verifiable count is 392 named authors.",
    tier: "documented",
    source: {
      name: "Hugging Face model card and BigScience announcement",
      author: "BigScience Workshop",
      published: "2022-07-12",
      url: "https://huggingface.co/bigscience/bloom",
    },
  },
  {
    id: "sarvam",
    strand: "resistance",
    claim:
      "India's state-funded sovereign model shipped — and the team given a quarter of the money delivered a model forty times larger than the consortium given the most.",
    detail:
      "Sarvam received ₹246.72 crore, entirely as compute, and released a 106-billion-parameter Apache 2.0 mixture-of-experts model in March 2026, trained entirely in India on mission-provided compute. The consortium that received ₹1,058.52 crore — 4.3 times as much, the largest single allocation — has a 2.9-billion-parameter bilingual model as its flagship.",
    figure: "₹246.72cr → 106B params",
    scope:
      "Released, under India's national AI mission. Widely-cited press figures of “4,000+ GPUs”, “six months” and “70 billion parameters” have no government or company source. Sarvam's earlier work was largely derivative fine-tunes; these are the from-scratch exceptions.",
    tier: "documented",
    source: {
      name: "Press Information Bureau, MeitY, and the model card",
      author: "Government of India, MeitY; Sarvam AI",
      published: "2026-03-06",
      url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2227612",
    },
  },
  {
    id: "decolonial-ai",
    strand: "resistance",
    claim:
      "Decolonial AI is a peer-reviewed research programme, not a slogan — and its empirical arm found hate content rose about 12% as an image corpus scaled.",
    detail:
      "Mohamed, Png and Isaac propose three tactics: a critical technical practice, reciprocal engagement and reverse tutelage, and renewed political community. Birhane's audit work supplies the evidence: hate content rose nearly 12% between two generations of the LAION corpus, and at scale the association of Black male faces with a “criminal” class quintupled.",
    figure: "~12% rise in hate content",
    scope:
      "Peer-reviewed. Statuses within this corpus differ and must not be blurred — the earlier LAION audit is a preprint, and the 12% figure should be cited to the peer-reviewed version. That figure is an automated detector's metric, not a human-annotated count.",
    tier: "documented",
    source: {
      name: "Philosophy & Technology 33(4); Patterns; NeurIPS 2023 D&B",
      author: "Mohamed, Png & Isaac; Birhane et al.",
      published: "2020-12",
      url: "https://doi.org/10.1007/s13347-020-00405-8",
    },
  },
  {
    id: "care-principles",
    strand: "resistance",
    claim:
      "The CARE Principles for Indigenous Data Governance were written to sit alongside open-data norms, not to replace them: be FAIR and CARE.",
    detail:
      "Collective Benefit, Authority to Control, Responsibility and Ethics. The paper holds that data must facilitate collective benefit for Indigenous Peoples, that recognition of rights bolsters their authority to govern such data, and that those working with it have a responsibility to nurture respectful relationships with the peoples it originates from.",
    figure: "4 principles",
    scope:
      "Peer-reviewed, first formally published November 2020 — but drafted at a workshop in November 2018 and released in 2019, so a single date is misleading. Adopted voluntarily by researchers, funders and repositories; not law in any jurisdiction, and with no enforcement mechanism.",
    tier: "documented",
    source: {
      name: "Data Science Journal 19(1), article 43",
      author: "Carroll, Garba, Figueroa-Rodríguez, Hudson et al.",
      published: "2020-11-04",
      url: "https://doi.org/10.5334/dsj-2020-043",
    },
  },
  {
    id: "te-hiku",
    strand: "resistance",
    claim:
      "A Māori organisation built a 500-hour speech corpus, licensed it so no derived work escapes Māori control — and publishes its own worst numbers.",
    detail:
      "The Kaitiakitanga License requires permission to access, use or modify the code, bars commercial use without explicit consent, and binds all derived works. It calls itself a living licence, and notes it is unlikely to apply outside an Indigenous context. On their own harder internal dataset, Te Hiku publish a word error rate of 53% for their model — against 73% for an off-the-shelf frontier system, and 38% for that system fine-tuned on their data.",
    figure: "53% vs 73% word error rate",
    scope:
      "First-party, from Te Hiku's own publications. The widely-quoted 14% error rate comes from magazine coverage on an unnamed evaluation set — it does not contradict the 53%, which is on a harder set, but it must never be attributed to Te Hiku directly. Their attribution of an earlier data-solicitation campaign to a named company is hedged in their own words and is not reported as established.",
    tier: "documented",
    source: {
      name: "Papa Reo blog (Te Hiku Media) and the Kaitiakitanga License",
      author: "Mahelona, Leoni, Duncan & Thompson",
      published: "2023-01-24",
      url: "https://blog.papareo.nz/whisper-is-another-case-study-in-colonisation/",
    },
  },
  {
    id: "masakhane",
    strand: "resistance",
    claim:
      "African researchers built the benchmarks that show frontier models still failing on African languages — 64 of them, across 15 tasks.",
    detail:
      "Masakhane's participatory translation work produced 46 benchmarks across 39 African languages, then a five-task peer-reviewed suite covering named entities, news, part-of-speech and question answering. The evaluation that followed concludes plainly that performance on African languages continues to remain a hurdle for current models. Alongside it, Global MMLU found 84.9% of the geographic-knowledge questions in the standard benchmark concern North America or Europe.",
    figure: "64 languages; 84.9% of geography questions Western",
    scope:
      "All peer-reviewed and publicly available. Masakhane is a dataset, benchmark and research community, not an LLM builder — attributing models built elsewhere to it is a misattribution. Its participation figures are date-sensitive and must not be merged across years.",
    tier: "documented",
    source: {
      name: "ACL Anthology — Findings of EMNLP 2020; NAACL 2025; Findings of ACL 2025",
      author: "Nekoto et al.; Adelani et al.; Ojo et al.",
      published: "2020-11",
      url: "https://aclanthology.org/2020.findings-emnlp.195/",
    },
  },
  {
    id: "long-tail",
    strand: "composition",
    claim:
      "Categorising 15.7 million domains in a reconstruction of C4, journalists found the top 1,000 sites accounted for only 8% of tokens.",
    detail:
      "Washington Post reporters worked from an Allen Institute recreation of C4, ranked domains by token count and categorised about 10 million of them; roughly 5 million could not be categorised, often because they were no longer reachable. Journalism, entertainment, software development and medicine dominated. The investigation also found 200 million hits for the copyright symbol inside the corpus.",
    figure: "top 1,000 = 8% of tokens",
    scope:
      "An April 2023 news analysis of a reconstruction of C4 — not any current model's corpus, and not peer-reviewed. Note this is a separate analysis, two years later, from the paper that produced the 51.3% figure; the two are frequently merged into one citation.",
    tier: "reported",
    source: {
      name: "The Washington Post (methodology via Storybench, Northeastern)",
      author: "Chen & Schaul, with Dodge, Elazar, Groeneveld & DeCario (AI2)",
      published: "2023-04-19",
      url: "https://www.storybench.org/how-the-washington-post-uncovered-the-sources-that-make-ai-chatbots-sound-so-smart/",
    },
  },
];

/**
 * The feedback loop, as dates.
 *
 * Two strands run against each other: models shipping, and findings landing.
 * `dateNote` exists because release dates are the most misremembered facts in
 * this field — an announcement, a private preview and general availability are
 * three different events and the timeline says which one it is plotting.
 */
export const TIMELINE: TimelineEvent[] = [
  {
    id: "gpt3-api",
    date: "2020-06-11",
    dateNote: "preview",
    strand: "release",
    title: "GPT-3 opens a waitlisted API",
    detail:
      "OpenAI invited users to request access to a private API to help it explore the model's strengths and limits. The model itself was described in a preprint on 28 May 2020. Request-access beta, not general availability.",
    tier: "reported",
    source: {
      name: "Wikipedia, citing OpenAI's June 2020 announcement",
      author: "OpenAI",
      published: "2020-06",
      url: "https://en.wikipedia.org/wiki/GPT-3",
    },
  },
  {
    id: "stochastic-parrots",
    date: "2021-03",
    dateNote: "publication",
    strand: "finding",
    title: "On the Dangers of Stochastic Parrots",
    detail:
      "Bender, Gebru, McMillan-Major and Shmitchell argued that ever-larger web-scraped corpora encode the viewpoints of over-represented, mostly Anglophone internet populations — and that size alone does not deliver diversity.",
    tier: "documented",
    source: {
      name: "ACM FAccT '21, pp. 610–623",
      author: "Bender, Gebru, McMillan-Major & Shmitchell",
      published: "2021-03",
      url: "https://dl.acm.org/doi/10.1145/3442188.3445922",
    },
  },
  {
    id: "chatgpt",
    date: "2022-11-30",
    dateNote: "preview",
    strand: "release",
    title: "ChatGPT ships as a free research preview",
    detail:
      "Running initially on GPT-3.5. The moment a frontier English-centric model stopped being a developer API and became a mass consumer product.",
    tier: "reported",
    source: {
      name: "Wikipedia, citing “Introducing ChatGPT”",
      author: "OpenAI",
      published: "2022-11",
      url: "https://en.wikipedia.org/wiki/ChatGPT",
    },
  },
  {
    id: "gpt4",
    date: "2023-03-14",
    dateNote: "general availability",
    strand: "release",
    title: "GPT-4",
    detail:
      "Available to paying ChatGPT Plus subscribers on launch day with a usage cap; API access stayed waitlisted. General availability for consumers, preview for developers.",
    tier: "reported",
    source: {
      name: "TechCrunch",
      author: "TechCrunch",
      published: "2023-03-14",
      url: "https://techcrunch.com/2023/03/14/openai-releases-gpt-4-ai-that-it-claims-is-state-of-the-art/",
    },
  },
  {
    id: "tokenizer-tax",
    date: "2023-05-17",
    dateNote: "publication",
    strand: "finding",
    title: "Tokenizers charge non-English speakers more",
    detail:
      "The same text translated across languages produces up to 15× different token counts, so speakers of some languages pay more, wait longer and get less usable context. A structural inequality priced into commercial APIs.",
    tier: "documented",
    source: {
      name: "arXiv (University of Oxford), later NeurIPS 2023",
      author: "Petrov, La Malfa, Torr & Bibi",
      published: "2023-05-17",
      url: "https://arxiv.org/abs/2305.15425",
    },
  },
  {
    id: "camel",
    date: "2023-05-23",
    dateNote: "publication",
    strand: "finding",
    title: "Models prefer Western entities even when prompted in Arabic",
    detail:
      "CAMeL tested 628 prompts and over 20,000 entities, finding that multilingual and Arabic-monolingual models alike favour Western-culture entities, producing stereotyping in story generation and sentiment analysis.",
    tier: "documented",
    source: {
      name: "arXiv (Georgia Tech)",
      author: "Naous, Ryan, Ritter & Xu",
      published: "2023-05-23",
      url: "https://arxiv.org/abs/2305.14456",
    },
  },
  {
    id: "globalopinionqa",
    date: "2023-06-28",
    dateNote: "publication",
    strand: "response",
    title: "A vendor documents the bias in its own model",
    detail:
      "Anthropic built GlobalOpinionQA from cross-national surveys and reported that its own models' answers most resemble the opinions of people in the USA and parts of Europe and South America — and that translating a question into a target language did not make the answer match that language's speakers.",
    tier: "documented",
    source: {
      name: "Anthropic, via arXiv",
      author: "Durmus et al.",
      published: "2023-06-28",
      url: "https://arxiv.org/abs/2306.16388",
    },
  },
  {
    id: "llama2",
    date: "2023-07-18",
    dateNote: "general availability",
    strand: "release",
    title: "Llama 2, with a commercial licence",
    detail:
      "Downloadable weights on permissive commercial terms — the release that made frontier-adjacent open weights broadly redistributable, and with them whatever cultural priors the weights carried.",
    tier: "reported",
    source: {
      name: "Meta Newsroom",
      author: "Meta & Microsoft",
      published: "2023-07-18",
      url: "https://about.fb.com/news/2023/07/llama-2/",
    },
  },
  {
    id: "aya",
    date: "2024-02-13",
    dateNote: "general availability",
    strand: "response",
    title: "Aya: 101 languages, built by 3,000 researchers",
    detail:
      "Cohere For AI released open weights covering 101 languages, over half of them lower-resourced, alongside a 513-million-datapoint instruction dataset spanning 114 languages, contributed from 119 countries. An explicit institutional answer to the coverage gap.",
    tier: "reported",
    source: {
      name: "Cohere Labs",
      author: "Cohere For AI",
      published: "2024-02-13",
      url: "https://cohere.com/research/aya",
    },
  },
  {
    id: "gemini15",
    date: "2024-02-15",
    dateNote: "preview",
    strand: "release",
    title: "Gemini 1.5 Pro, private preview",
    detail:
      "Announced with a one-million-token context window, but available only to a limited group of developers and enterprise customers. Announcement plus limited preview, not general availability.",
    tier: "documented",
    source: {
      name: "Google (The Keyword)",
      author: "Google",
      published: "2024-02-15",
      url: "https://blog.google/technology/ai/google-gemini-next-generation-model-february-2024/",
    },
  },
  {
    id: "claude3",
    date: "2024-03-04",
    dateNote: "general availability",
    strand: "release",
    title: "Claude 3 family",
    detail:
      "Opus and Sonnet shipped same-day, Haiku followed. The announcement cites improved conversation in “Spanish, Japanese, and French” — three high-resource languages, which is itself a data point about which non-English is meant.",
    tier: "documented",
    source: {
      name: "Anthropic",
      author: "Anthropic",
      published: "2024-03-04",
      url: "https://www.anthropic.com/news/claude-3-family",
    },
  },
  {
    id: "llama3-limits",
    date: "2024-04-18",
    dateNote: "general availability",
    strand: "response",
    title: "Meta states Llama 3's non-English limits at launch",
    detail:
      "The release post says over 5% of pretraining data is high-quality non-English covering 30+ languages, then adds: “we do not expect the same level of performance in these languages as in English.” A vendor documenting the asymmetry before being criticised for it.",
    tier: "documented",
    source: {
      name: "Meta AI",
      author: "Meta",
      published: "2024-04-18",
      url: "https://ai.meta.com/blog/meta-llama-3/",
    },
  },
  {
    id: "gpt4o",
    date: "2024-05-13",
    dateNote: "general availability",
    strand: "release",
    title: "GPT-4o",
    detail:
      "Made free to all ChatGPT users, with text and image input in the API. OpenAI's own post refused our fetch, so the date rests on contemporaneous dated coverage rather than the primary source.",
    tier: "reported",
    source: {
      name: "OpenAI (corroborated by contemporaneous coverage)",
      author: "OpenAI",
      published: "2024-05-13",
      url: "https://openai.com/index/hello-gpt-4o/",
    },
  },
  {
    id: "mmmlu",
    date: "2024-09-13",
    dateNote: "general availability",
    strand: "response",
    title: "OpenAI publishes a professionally translated multilingual eval",
    detail:
      "MMLU human-translated into 14 languages including Swahili, Yoruba, Bengali and Indonesian. Dated from the repository's initial commit.",
    tier: "documented",
    source: {
      name: "OpenAI, via Hugging Face",
      author: "OpenAI",
      published: "2024-09-13",
      url: "https://huggingface.co/datasets/openai/MMMLU",
    },
  },
  {
    id: "cultural-map",
    date: "2024-09-17",
    dateNote: "publication",
    strand: "finding",
    title: "GPT models cluster with Protestant Europe",
    detail:
      "Mapped onto the Inglehart–Welzel World Cultural Map, five GPT models expressed values resembling English-speaking and Protestant European countries. Unprompted GPT-4o sat closest to Finland, Andorra and the Netherlands — and furthest from Jordan, Libya and Ghana.",
    tier: "documented",
    source: {
      name: "PNAS Nexus 3(9)",
      author: "Tao, Viberg, Baker & Kizilcec",
      published: "2024-09-17",
      url: "https://academic.oup.com/pnasnexus/article/3/9/pgae346/7756548",
    },
  },
  {
    id: "global-mmlu",
    date: "2024-12-04",
    dateNote: "publication",
    strand: "finding",
    title: "The benchmark itself is culturally skewed",
    detail:
      "Roughly 28% of MMLU questions require culturally specific knowledge, and its geographic questions concentrate overwhelmingly on Western regions. The measuring instrument was Western-weighted, not only the models — so a 42-language replacement was released.",
    tier: "documented",
    source: {
      name: "arXiv (Cohere For AI and 20+ institutions)",
      author: "Singh et al.",
      published: "2024-12-04",
      url: "https://arxiv.org/abs/2412.03304",
    },
  },
  {
    id: "gemini2",
    date: "2024-12-11",
    dateNote: "announcement",
    strand: "release",
    title: "Gemini 2.0 Flash, experimental",
    detail:
      "Released to developers and app users as an experimental model, with general availability stated as following in January. Experimental release, not GA.",
    tier: "documented",
    source: {
      name: "Google (The Keyword)",
      author: "Google",
      published: "2024-12-11",
      url: "https://blog.google/technology/google-deepmind/google-gemini-ai-update-december-2024/",
    },
  },
  {
    id: "deepseek-r1",
    date: "2025-01-20",
    dateNote: "general availability",
    strand: "release",
    title: "DeepSeek-R1 opens its weights under MIT",
    detail:
      "A 671B-parameter reasoning model with 37B active, released with weights and distilled variants. Reported as the first open-weight model matching o1 — and the first serious non-Western challenge to the frontier release cadence.",
    tier: "reported",
    source: {
      name: "IISS Strategic Comments",
      author: "IISS",
      published: "2025-04",
      url: "https://www.iiss.org/publications/strategic-comments/2025/04/deepseeks-release-of-an-open-weight-frontier-ai-model/",
    },
  },
  {
    id: "llama4",
    date: "2025-04-05",
    dateNote: "general availability",
    strand: "release",
    title: "Llama 4 claims 200 languages",
    detail:
      "Meta states pre-training on 200 languages, over 100 of them with more than a billion tokens each, and ten times the multilingual tokens of Llama 3. A measurable, dated shift in stated coverage.",
    tier: "documented",
    source: {
      name: "Meta AI",
      author: "Meta",
      published: "2025-04-05",
      url: "https://ai.meta.com/blog/llama-4-multimodal-intelligence/",
    },
  },
  {
    id: "eu-gpai",
    date: "2025-08-02",
    dateNote: "general availability",
    strand: "response",
    title: "EU AI Act obligations start applying to general-purpose models",
    detail:
      "Applying to models placed on the EU market from this date, alongside the final GPAI Code of Practice. Models already on the market have until 2 August 2027; enforcement powers start 2 August 2026. The first binding regulatory hook on frontier model documentation.",
    tier: "documented",
    source: {
      name: "European Commission",
      author: "European Commission",
      published: "2025-08-02",
      url: "https://digital-strategy.ec.europa.eu/en/library/guidelines-scope-obligations-providers-general-purpose-ai-models-under-ai-act",
    },
  },
  {
    id: "gpt5",
    date: "2025-08-07",
    dateNote: "general availability",
    strand: "release",
    title: "GPT-5",
    detail:
      "Rolled out as the default model for all free ChatGPT users, with higher limits for Plus, a Pro tier, and three API sizes.",
    tier: "reported",
    source: {
      name: "TechCrunch",
      author: "TechCrunch",
      published: "2025-08-07",
      url: "https://techcrunch.com/2025/08/07/openais-gpt-5-is-here/",
    },
  },
  {
    id: "gemini3",
    date: "2025-11-18",
    dateNote: "general availability",
    strand: "release",
    title: "Gemini 3 Pro",
    detail:
      "Launched immediately across the Gemini app, Search, AI Studio and Vertex AI, departing from Google's previous staged rollouts.",
    tier: "reported",
    source: {
      name: "Wikipedia, citing Google's launch materials and CNBC",
      author: "Google",
      published: "2025-11-18",
      url: "https://en.wikipedia.org/wiki/Gemini_3_(AI)",
    },
  },
  {
    id: "cross-cultural-audit",
    date: "2026-04-24",
    dateNote: "publication",
    strand: "finding",
    title: "Individualist advice given to collectivist users",
    detail:
      "Personal dilemmas put to three frontier models from users in 10 countries and 7 languages. All three returned Western-style individualist advice even to users from societies prioritising family, community and authority — a gap of +0.76 on a 1–5 scale, largest in Nigeria at +1.85. Single-author preprint, not peer-reviewed.",
    tier: "emergent",
    source: {
      name: "arXiv preprint",
      author: "Pruthvinath Jeripity Venkata",
      published: "2026-04-24",
      url: "https://arxiv.org/abs/2604.22153",
    },
  },
  {
    id: "claude-values-languages",
    date: "2026-07-13",
    dateNote: "publication",
    strand: "response",
    title: "The same model holds different values in different languages",
    detail:
      "Across the 20 most common languages on Claude.ai, Anthropic found systematic drift: most warmth in Hindi, most rigour in English and Russian, most deference in Arabic, most caution in English. Two people asking about the same business plan in Hindi and Russian may come away with different impressions of it.",
    tier: "documented",
    source: {
      name: "Anthropic",
      author: "Anthropic",
      published: "2026-07-13",
      url: "https://www.anthropic.com/research/claude-values-models-languages",
    },
  },
  {
    id: "opus5",
    date: "2026-07-24",
    dateNote: "general availability",
    strand: "release",
    title: "Claude Opus 5",
    detail:
      "Roughly two months after Opus 4.8, and after three further model launches in June. A release cadence measured in weeks, against a bias-research cycle measured in months.",
    tier: "reported",
    source: {
      name: "TechCrunch",
      author: "Anthropic",
      published: "2026-07-24",
      url: "https://techcrunch.com/2026/07/24/anthropic-launches-opus-5/",
    },
  },
];

/**
 * What we checked and did not use.
 *
 * Published, not filed away. A report auditing other people's sourcing owes
 * the reader its own rejects — and "we looked and it did not hold up" is a
 * finding.
 */
export const DROPPED: Dropped[] = [
  {
    claim: "“51% of AI training data is American”",
    reason:
      "The most common error in this area, and one this report's own brief made. The real claim covers one dataset (C4.EN), one snapshot (April 2019), one measurement (hosting IP of 175,000 sampled URLs) and one property (server location, not authorship). C4 trained T5 and LLaMA-1; it is not a known component of GPT-4, Claude or Gemini. Carried above with its full scope instead.",
  },
  {
    claim: "“India makes up only 3.4% of C4”",
    reason:
      "Misreads the source. The paper says India has 3.4% the URLs of the United States — a ratio to the US count, so India's absolute share of the sample is nearer 1.7%. The Pakistan, Nigeria and Philippines figures are misread the same way and distorted further by it.",
  },
  {
    claim: "“ChatGPT is 93% English”",
    reason:
      "Misattribution across models. The 92.6% figure is OpenAI's published statistic for GPT-3 in 2020 and nothing else. The GPT-4 Technical Report states outright that it discloses no dataset-construction details, and no language breakdown has been published for GPT-4, GPT-4o or GPT-5. Any percentage attached to a post-GPT-3 OpenAI model is unsourceable.",
  },
  {
    claim: "Language or geographic composition figures for Claude, Gemini or GPT-5",
    reason:
      "No number exists to report, so none is given. Rather than estimate, the absence is carried as a finding in its own right, in each lab's own words.",
  },
  {
    claim: "That Atari et al.'s “Which Humans?” was published in PNAS Nexus",
    reason:
      "A misattribution we nearly made ourselves, and one the brief invited. “Which Humans?” is a preprint from September 2023 with no journal publication. The PNAS Nexus paper it gets conflated with is a separate study by different authors using a different instrument. Both are cited here, kept apart, and tiered accordingly.",
  },
  {
    claim: "That OpenAI's annotators were “50% Filipino and Bangladeshi”",
    reason:
      "The figure circulates widely and is wrong. The primary source gives 22% Filipino and 22% Bangladeshi by nationality — 44% — alongside a separate ethnicity question answered 52.6% Southeast Asian. The 50% appears to be the two rows conflated. The primary figures are used.",
  },
  {
    claim: "A claim about the ethnic composition of another lab's annotator pool",
    reason:
      "Traced only to an aggregator summary and never verified against the primary appendix. An unverified demographic claim about a named company is exactly what this report cannot carry, so it is not carried.",
  },
  {
    claim: "“Training data is nearly 90% English”, stated about current models",
    reason:
      "Asserted without a source, in the present tense, about models whose composition is undisclosed. Replaced with OpenAI's own documented figure for GPT-3 — precise, primary, and explicitly scoped to a 2020 model.",
  },
  {
    claim: "“Communal shame rendered as personal embarrassment”",
    reason:
      "The neat formulation of the malu example, quoted in the brief, is a university press-release paraphrase rather than the researcher's finding. His actual result is narrower and more damning: the models define the word correctly on demand, and flatten it only when it appears inside a situation. That is what is reported.",
  },
  {
    claim: "A study reporting effect sizes of 1.4–2.2 for reduced diversity across 22 models",
    reason:
      "Appeared in an AI-generated aggregator summary with no resolvable citation, and no primary paper carrying those numbers could be reached. A peer-reviewed study of 2,200 essays is used for the homogenisation claim instead.",
  },
  {
    claim: "“BharatGPT” as a sovereign Indian foundation model",
    reason:
      "Does not survive contact with its own artefact. Marketed as India's only indigenous generative AI platform used by a billion people, the only actual model is a gated 3.2-billion-parameter Llama derivative — architecture “llama”, chat template verbatim Meta's — with 12 declared languages rather than the claimed 120+, no public model card, no paper, no training disclosure, and around 5,000 lifetime downloads. The vendor is real and has real contracts; the foundation model is not substantiated.",
  },
  {
    claim: "Ola Krutrim's assistant and its third-generation model",
    reason:
      "Defunct. The assistant launched in June 2025 and was shut down by April 2026 — the domain returns no response — and the model was halted. Corroborated by the artefact record: no repository exists and the last text model upload was February 2025.",
  },
  {
    claim: "OpenEuroLLM funding of €101,195,233",
    reason:
      "An active trap that automated readers reproduce: that number is the grant agreement identifier, not a euro amount. No funding figure is published by the project, and the EU's own database has no record for that ID. Everything the project has released self-describes as intermediate research checkpoints with no instruction tuning or safety alignment.",
  },
  {
    claim: "Africa's $60 billion AI declaration, and four national AI strategy budgets",
    reason:
      "The declaration text could not be retrieved from any official source, and it names no funding instrument, custodian or disbursement mechanism. Kenyan, Nigerian, Rwandan and Egyptian strategy dates and budgets, and Singaporean, Japanese, Korean and German programme budgets, were all consistently reported but unverifiable against a primary source. The programmes exist; the money is not confirmed, so it is not printed.",
  },
  {
    claim: "A work titled “Automating Ableism”",
    reason:
      "No such work exists. It appears to be a corruption of a real thesis title. A second attributed piece was also searched for and does not exist. Neither is cited.",
  },
  {
    claim: "USD conversions of Brazilian and Indian programme budgets",
    reason:
      "No official source gives an equivalent, and converting without naming a rate and a date would be inventing a number. The figures stay in their own currencies.",
  },
  {
    claim: "“Data deserts” as a quantified concept",
    reason:
      "The phrase has no citable primary quantification in this literature — searches return only unrelated uses. The underlying phenomenon is real and is cited here through work that actually measures it. Using the phrase as if it named a measured quantity would be inventing a citation.",
  },
  {
    claim: "A single figure for the number of domains in C4",
    reason:
      "Two primary sources give 365 million and 15.7 million for the same corpus — almost certainly a URL-versus-registered-domain counting difference, but we could not confirm which definition each used. Citing either as the size of C4 would present an unresolved ambiguity as a fact, so the corpus is described in tokens instead, which both sources agree on.",
  },
  {
    claim: "Common Crawl's language shares below the top four",
    reason:
      "Two fetches of the same statistics page returned different orderings for the fourth to sixth ranked languages. The four that were consistent across both reads are reported; the rest are omitted rather than given at a precision we could not reproduce.",
  },
  {
    claim: "GPT-3.5 as a discrete dated release",
    reason:
      "No standalone dated launch post could be confirmed. The dateable public event is the ChatGPT research preview of 30 November 2022, which initially ran on GPT-3.5 — so that is what the timeline plots.",
  },
  {
    claim: "Claude 2, and Llama 1 (February 2023)",
    reason:
      "Neither date could be verified against a primary source within the research budget. Excluded rather than recalled from memory.",
  },
  {
    claim: "Gemini 1.0, reported 6 December 2023",
    reason:
      "The date appears consistently in secondary coverage, but Google's own launch post was never fetched. Gemini 1.5 and 2.0 are used instead, both confirmed directly from Google.",
  },
  {
    claim: "Qwen / Qwen-7B, reported 3 August 2023",
    reason:
      "The date came only from search snippets citing an encyclopedia entry, with no primary Alibaba source fetched. Excluded under the no-guessing rule despite being a thesis-relevant non-Western release — its absence understates the non-Western strand.",
  },
  {
    claim: "That GPT-4o improved non-English tokenization",
    reason:
      "This would have been the natural documented response to the tokenizer-inequality finding, but OpenAI's post returned HTTP 403 to our crawler, so the wording could not be checked. Not asserted.",
  },
  {
    claim: "Atari et al., “Which Humans?”, on WEIRD populations and LLMs",
    reason:
      "Directly relevant and named in the brief, but the identifier and date could not be confirmed before the search budget ran out. Excluded rather than cited from memory.",
  },
  {
    claim: "UNESCO's 2024 study on bias in large language models",
    reason:
      "Confirmed and credible, but its finding is gender bias rather than Western or linguistic bias, so it sits outside what this report claims to cover.",
  },
  {
    claim: "Any citation, share or impact metric for the work cited here",
    reason:
      "Not gathered, and not inventable. The Atlas does not publish numbers it cannot source, so none appear.",
  },
];

export const findingsIn = (s: Strand) => FINDINGS.filter((f) => f.strand === s);
export const countByTier = (t: Tier) => FINDINGS.filter((f) => f.tier === t).length;

/**
 * The short edit — the eight findings v2 runs at full size.
 *
 * v2 is an EDIT of this report, not a different one. It shows eight findings
 * where v1 shows all fifty-seven, and every other number on it still counts
 * the whole set, so the page can never imply the evidence base is eight items
 * deep. The link back to v1 is on the page for the same reason.
 *
 * Chosen for spread and for concreteness, one or two per strand: the spine of
 * the argument (manufactured-skew), the sharpest measured harm in the corpus
 * (dialect-filter), the clearest demonstration of the encoding problem (malu),
 * the case with a statutory inquiry attached (horizon), who builds it and who
 * cleans it (model-concentration, labour-geography), and the two halves of the
 * resistance section — the catch (sovereign-licences) and the counter-example
 * that answers it (te-hiku).
 *
 * A typo here is a silent hole in the page, so it fails at import instead.
 */
const HEADLINE_IDS = [
  "manufactured-skew",
  "dialect-filter",
  "malu",
  "horizon",
  "model-concentration",
  "labour-geography",
  "sovereign-licences",
  "te-hiku",
] as const;

export const HEADLINE_FINDINGS: Finding[] = HEADLINE_IDS.map((id) => {
  const found = FINDINGS.find((f) => f.id === id);
  if (!found) throw new Error(`hegemony: HEADLINE_IDS names "${id}", which is not in FINDINGS`);
  return found;
});

/* ══ COVERAGE ═══════════════════════════════════════════════════════════════
 *
 * The findings above are the evidence. This is the reporting *around* it —
 * what other people have broadcast and published on the same subject.
 *
 * It is kept separate from FINDINGS on purpose. Nothing here is cited as
 * proof of a claim: a documentary is a piece of journalism, not a measurement,
 * and folding it into the tiers would let a well-made film do the work of a
 * methodology. These sections say "here is who else has looked", and they
 * always send you to the original.
 *
 * EVERY item was fetched and checked, exactly like a Source:
 *   • videos — verified through YouTube's oEmbed endpoint, so `title` and
 *     `channel` are the platform's own strings, not ours. `thumb` is the
 *     largest still that actually returned 200 for that id; maxresdefault does
 *     not exist for every upload, so it is recorded per video rather than
 *     assembled and hoped for.
 *   • press — `image` is the publisher's own og:image, read off the page and
 *     re-fetched to confirm it resolves.
 *
 * Both are HOT-LINKED, never copied into the repo — the same rule the Feed
 * follows for sourceImage, and for the same reason: the publisher's picture
 * stays the publisher's, and if they pull it, it disappears here too. The
 * cards degrade to a typographic plate when that happens.
 */

export interface Video {
  /** YouTube id. The canonical URL is built from it, so it cannot disagree. */
  id: string;
  /** The channel's own name, as YouTube returns it. */
  channel: string;
  /** The upload's own title, as YouTube returns it. */
  title: string;
  /** Upload date, `YYYY-MM-DD`, read from the watch page. */
  published: string;
  /** Our one line on why it is here — what it covers, not what it proves. */
  blurb: string;
  /**
   * Full still URL. Recorded rather than assembled: maxresdefault is missing
   * for plenty of uploads and a guessed URL is a broken image.
   */
  thumb: string;
}

export const VIDEOS: Video[] = [
  {
    id: "ehkECk2KJjY",
    channel: "DW Documentary",
    title: "How big AI companies exploit data workers in Kenya",
    published: "2024-12-08",
    blurb:
      "DW's documentary on the Nairobi labelling and moderation workforce that cleans the data behind large AI systems.",
    thumb: "https://i.ytimg.com/vi/ehkECk2KJjY/maxresdefault.jpg",
  },
  {
    id: "qZS50KXjAX0",
    channel: "60 Minutes",
    title: "Training AI takes heavy toll on Kenyans working for $2 an hour",
    published: "2024-11-24",
    blurb:
      "60 Minutes with the Kenyan digital workers paid around two dollars an hour to make model output presentable.",
    thumb: "https://i.ytimg.com/vi/qZS50KXjAX0/maxresdefault.jpg",
  },
  {
    id: "Xa6JuimHoEA",
    channel: "Democracy Now!",
    title:
      "“Empire of AI”: Karen Hao on How AI Is Threatening Democracy & Creating a New Colonial World",
    published: "2026-01-01",
    blurb:
      "Karen Hao on the argument of Empire of AI: that the industry is organised along the lines of an imperial one.",
    thumb: "https://i.ytimg.com/vi/Xa6JuimHoEA/maxresdefault.jpg",
  },
  {
    id: "N5c2X8vhfBE",
    channel: "The Alan Turing Institute",
    title: "On the dangers of stochastic parrots: Can language models be too big?",
    published: "2021-07-13",
    blurb:
      "The Turing Institute's recording of the Stochastic Parrots paper — the 2021 argument that scale itself carries a cost, and that who is in the corpus is part of it.",
    thumb: "https://i.ytimg.com/vi/N5c2X8vhfBE/maxresdefault.jpg",
  },
  {
    id: "P6r3Rtf-F24",
    channel: "Algorithmic Justice League",
    title: "How AI Uses your Data Against You with Dr. Abeba Birhane",
    published: "2025-04-27",
    blurb:
      "Abeba Birhane, who audits training sets for a living, on what is actually inside the datasets models are built from.",
    thumb: "https://i.ytimg.com/vi/P6r3Rtf-F24/maxresdefault.jpg",
  },
  {
    id: "LoVhdsAObBk",
    channel: "Cohere",
    title: "NLP for Under-resourced African Languages — David Ìfẹ́olúwa Adélání",
    published: "2023-04-06",
    blurb:
      "Why African-language NLP is a data problem before it is a model problem, from one of the researchers building the benchmarks.",
    thumb: "https://i.ytimg.com/vi/LoVhdsAObBk/maxresdefault.jpg",
  },
  {
    id: "cOx728E110U",
    channel: "Columbia Data Science Institute",
    title: "DSI Distinguished Series: Masakhane Group",
    published: "2021-10-26",
    blurb:
      "Masakhane on building African-language NLP as a distributed, community-led project rather than a lab deliverable.",
    thumb: "https://i.ytimg.com/vi/cOx728E110U/maxresdefault.jpg",
  },
  {
    id: "Bdn6UAs6b70",
    channel: "Firstpost",
    title: "India's Sovereign AI Push: Sarvam Takes on Gemini and ChatGPT",
    published: "2026-02-09",
    blurb:
      "Firstpost's Vantage on India's sovereign AI programme and the Indic model built under it.",
    thumb: "https://i.ytimg.com/vi/Bdn6UAs6b70/maxresdefault.jpg",
  },
  {
    id: "Vw0XjhfAWis",
    channel: "a16z",
    title: "Sovereign AI: Why Nations Are Building Their Own Models",
    published: "2025-05-24",
    blurb:
      "The investor case for sovereign AI. Included deliberately as the industry's own framing of the trend section 06 examines — a16z is an investor in this market, not an observer of it.",
    thumb: "https://i.ytimg.com/vi/Vw0XjhfAWis/maxresdefault.jpg",
  },
];

export interface PressItem {
  id: string;
  /** Masthead, as the publisher writes it. Also the read-at link label. */
  publisher: string;
  /** The piece's own headline. */
  title: string;
  /** Publication date, `YYYY-MM-DD`. */
  published: string;
  /** Our one line on what the piece reports. */
  blurb: string;
  url: string;
  /** The publisher's own og:image, hot-linked. Confirmed to resolve. */
  image: string;
}

export const PRESS: PressItem[] = [
  {
    id: "mit-colonial-order",
    publisher: "MIT Technology Review",
    title: "Artificial intelligence is creating a new colonial world order",
    published: "2022-04-19",
    blurb:
      "The opening of MIT Technology Review's four-part AI Colonialism series, reported across four countries.",
    url: "https://www.technologyreview.com/2022/04/19/1049592/artificial-intelligence-colonialism/",
    image:
      "https://wp.technologyreview.com/wp-content/uploads/2022/04/MIT-1-social.jpeg?resize=1200,600",
  },
  {
    id: "time-two-dollar",
    publisher: "TIME",
    title: "Exclusive: The $2 Per Hour Workers Who Made ChatGPT Safer",
    published: "2023-01-18",
    blurb:
      "The investigation into the Kenyan labellers contracted through Sama to detoxify ChatGPT's output, and what the work cost them.",
    url: "https://time.com/6247678/openai-chatgpt-kenya-workers/",
    image:
      "https://static.time.com/v3/assets/bltea6093859af6183b/blt1b258b5a3f7503f1/698a398716d8843144c3b782/DALL%C2%B7E-2023-01-09-18.12.05-a-seemingly-endless-view-african-workers-at-desks-in-front-of-computer-screens-in-a-printmaking-style.jpg?branch=production&width=1600&quality=75&auto=webp&crop=16:9",
  },
  {
    id: "row-ai-divide",
    publisher: "Rest of World",
    title: "The Great AI Divide: Navigating U.S. and Chinese dominance",
    published: "2026-06-09",
    blurb:
      "What it means for everyone else that the frontier is built, funded and powered in two countries.",
    url: "https://restofworld.org/2026/ai-divide-america-china-world/",
    image:
      "https://restofworld.org/wp-content/uploads/2026/06/illo_AI_divide_sketch_v2-1600x900.jpg",
  },
  {
    id: "nature-nllb",
    publisher: "Nature",
    title: "Scaling neural machine translation to 200 languages",
    published: "2024-06-05",
    blurb:
      "The No Language Left Behind paper: translation extended to 200 languages, with the human-translated evaluation set built to check it.",
    url: "https://www.nature.com/articles/s41586-024-07335-x",
    image:
      "https://media.springernature.com/m685/springer-static/image/art%3A10.1038%2Fs41586-024-07335-x/MediaObjects/41586_2024_7335_Fig1_HTML.png",
  },
  {
    id: "row-scale-ai",
    publisher: "Rest of World",
    title: "Scale AI is on a hiring spree for speakers of under-represented languages",
    published: "2023-08-29",
    blurb:
      "The market for the languages models are worst at — and the gap between what each one pays.",
    url: "https://restofworld.org/2023/scale-ai-language-training-hiring/",
    image: "https://restofworld.org/wp-content/uploads/2023/08/Photo-AlexandrWang-1600x900.jpg",
  },
  {
    id: "mit-for-the-people",
    publisher: "MIT Technology Review",
    title: "A new vision of artificial intelligence for the people",
    published: "2022-04-22",
    blurb:
      "The close of the same series, from Te Hiku Media — the Māori station that built its own speech recognition and kept the data under its own licence.",
    url: "https://www.technologyreview.com/2022/04/22/1050394/artificial-intelligence-for-the-people/",
    image:
      "https://wp.technologyreview.com/wp-content/uploads/2022/04/MIT-5-3-1.jpeg?resize=1200,600",
  },
  {
    id: "carnegie-speaking-in-code",
    publisher: "Carnegie Endowment",
    title: "Speaking in Code: Contextualizing Large Language Models in Southeast Asia",
    published: "2025-01-06",
    blurb:
      "How the region's languages and contexts fare in general-purpose models, and where localisation is actually happening.",
    url: "https://carnegieendowment.org/research/2025/01/speaking-in-code-contextualizing-large-language-models-in-southeast-asia",
    image:
      "https://assets.carnegieendowment.org/_/eyJrZXkiOiJzdGF0aWMvbWVkaWEvaW1hZ2VzL2FpLWxsbS10ZWNobm9sb2d5LWFic3RyYWN0LWlTdG9jay0xOTM0NTUzODEzLmpwZyJ9",
  },
  {
    id: "row-india-bhashini",
    publisher: "Rest of World",
    title: "India is testing an alternative to Silicon Valley's AI playbook",
    published: "2026-07-02",
    blurb:
      "Bhashini, and an open-source, offline-first approach aimed at the languages the frontier labs skip.",
    url: "https://restofworld.org/2026/india-bhashini-open-source-offline-ai-hackathon/",
    image: "https://restofworld.org/wp-content/uploads/2026/06/India-AI-Hackathon-Final.jpg",
  },
  {
    id: "time-sweatshop-data",
    publisher: "TIME",
    title: "Is 'Sweatshop Data' Really Over?",
    published: "2025-07-29",
    blurb:
      "Two years on from the ChatGPT story: whether the shift to expert annotation changed the economics for the people doing it.",
    url: "https://time.com/7306153/ai-sweatshop-data-over/",
    image:
      "https://static.time.com/v3/assets/bltea6093859af6183b/blt790ecf980cd79d1a/6998c8a866d4e3d4b3cbcb13/sweatshop-data.jpg?branch=production&width=1600&quality=75&auto=webp&crop=16:9",
  },
];

/**
 * Every preview image on the page, in one list, for the masthead mosaic.
 *
 * Derived rather than typed out, so the wall behind the title is literally the
 * coverage below it — add a video or an article and it appears up there too,
 * and it can never show a picture the page does not also credit.
 */
export const MOSAIC: string[] = [
  ...VIDEOS.map((v) => v.thumb),
  ...PRESS.map((p) => p.image),
];
