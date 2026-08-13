/**
 * The real source document: Pope Leo XIV's first encyclical, Magnifica
 * humanitas (25 May 2026). Everything in this file is factual, digested from
 * the published text and its coverage — see SOURCES. Direct quotes are short
 * excerpts, attributed.
 */

export interface Chapter {
  label: string;
  title: string;
  range: string;
  summary: string;
}

export interface Theme {
  title: string;
  body: string;
}

export const ENCYCLICAL = {
  title: "Magnifica humanitas",
  translation: "Magnificent Humanity",
  subtitle: "On Safeguarding the Human Person in the Time of Artificial Intelligence",
  author: "Pope Leo XIV",
  tradition: "Roman Catholic Church",
  signed: "15 May 2026",
  published: "25 May 2026",
  context:
    "Leo XIV — the first American pope, elected in May 2025 — chose his papal name to align with Leo XIII, whose 1891 encyclical Rerum novarum answered the upheavals of the industrial revolution. Magnifica humanitas was published 135 years later, deliberately re-asking Rerum novarum's question for the age of AI. Leo presented it personally at the Vatican — unusual for a pope — before an audience that included AI researchers.",
} as const;

export const CHAPTERS: Chapter[] = [
  {
    label: "Introduction",
    title: "A change of era",
    range: "§1–16",
    summary:
      "Names the present moment a rapid 'change of era' and poses the encyclical's foundational question: while some vie for the future of new technologies, what becomes of the human person?",
  },
  {
    label: "Chapter One",
    title: "A Dynamic Approach Faithful to the Gospel",
    range: "§17–45",
    summary:
      "Sets the method: the Church reads new technology neither with fear nor worship, but dynamically, from within the Gospel's account of the human person.",
  },
  {
    label: "Chapter Two",
    title: "Foundations and Principles of the Church's Social Doctrine",
    range: "§46–89",
    summary:
      "Grounds the argument in Catholic social teaching: the person created in the image and likeness of God, and human dignity as the fundamental criterion for judging technological progress.",
  },
  {
    label: "Chapter Three",
    title: "Technology and Dominance; Human Grandeur in Light of AI's Promises",
    range: "§90–130",
    summary:
      "Rejects the claim that AI is conscious or sentient — 'these systems merely imitate certain functions of human intelligence… do not feel joy or pain' — and celebrates what finite, embodied humans have achieved precisely because of their limits: King, Mandela, Mother Teresa, Beethoven's Ninth, Guernica.",
  },
  {
    label: "Chapter Four",
    title: "Safeguarding Humanity During the Transformation: Truth, Work, Freedom",
    range: "§131–181",
    summary:
      "Identifies the three spheres under pressure: truth (deepfakes and automatic content demand a shared pursuit of the veracity of facts), work (automation without social discernment makes people 'less human'), and freedom (digital dependency, mass data collection, invisible behavioural influence).",
  },
  {
    label: "Chapter Five",
    title: "The Culture of Power and the Civilization of Love",
    range: "§182–228",
    summary:
      "Confronts the normalization of war — autonomous weapons that remove human control from lethal decisions, arms races, eroded humanitarian law — and opposes to it a 'civilization of love' built on justice, dialogue and the voices of war's victims.",
  },
  {
    label: "Conclusion",
    title: "What are we building?",
    range: "§229–245",
    summary:
      "Returns to the encyclical's two rival construction sites — Babel and Nehemiah's Jerusalem — and asks each reader which one their work on technology is serving.",
  },
];

export const THEMES: Theme[] = [
  {
    title: "Dignity is the criterion",
    body: "Human dignity — the person created in the image and likeness of God — is the fundamental measure for every technological choice, not efficiency, profit or capability.",
  },
  {
    title: "AI is not conscious",
    body: "AI systems imitate certain functions of human intelligence but undergo no experiences, have no body, feel no joy or pain, and lack the affective, relational and spiritual life through which humans grow wise.",
  },
  {
    title: "No technology is neutral",
    body: "Technology takes on the characteristics of those who devise, finance, regulate and use it. The question 'what are we building?' can never be answered by the tools themselves.",
  },
  {
    title: "Babel or Nehemiah",
    body: "Two biblical construction sites frame the choice: Babel — collective effort under an oppressive plan — or Nehemiah's rebuilding of Jerusalem — shared, human-centered work in which every family holds a section of the wall.",
  },
  {
    title: "Truth, work, freedom",
    body: "The three spheres to safeguard: truth against synthetic media, dignified work against undiscerning automation, and freedom against dependency and invisible behavioural influence.",
  },
  {
    title: "Against autonomous weapons",
    body: "AI-driven warfare removes human responsibility from lethal decisions; Leo argues just-war reasoning is being outrun, and condemns arms races and machines empowered to kill.",
  },
  {
    title: "Against a two-tier humanity",
    body: "Post-humanist visions of 'second-class' human beings subordinate to elites are condemned alongside technology's real new slaveries: exploited content moderators, abusive rare-earth mining, industrialized child exploitation.",
  },
  {
    title: "A civilization of love",
    body: "The alternative to the culture of power: technology re-ordered toward justice, unity, diplomacy and care — 'to do what is in us for the succour of those years wherein we are set.'",
  },
];

export const QUOTES: { text: string; ref: string }[] = [
  {
    text: "These systems merely imitate certain functions of human intelligence… they do not undergo experiences, do not possess a body, do not feel joy or pain.",
    ref: "Chapter Three",
  },
  {
    text: "No technology is neutral, and therefore Artificial Intelligence is not neutral either.",
    ref: "Chapter Two",
  },
  {
    text: "Only the shared pursuit of the veracity of facts can provide a solid foundation for just communication.",
    ref: "Chapter Four",
  },
  {
    text: "It is not our part to master all the tides of the world, but to do what is in us for the succour of those years wherein we are set.",
    ref: "Chapter Five, quoting Tolkien's Gandalf",
  },
];

export const RECEPTION: string[] = [
  "The encyclical went viral within days — memes, Dune's 'Butlerian jihad' comparisons, and a YouGov poll in which 83% of U.S. respondents agreed AI lacks emotional capacity.",
  "Archbishop of Canterbury Sarah Mullally led a House of Lords debate on it; Orthodox commentators called its ecumenical dimension 'explicit and compelling'; evangelical and Jewish responses were engaged but mixed.",
  "Silicon Valley's response was 'fairly muted' — some found merit, others dismissed the Vatican's understanding of the technology.",
  "The Vatican followed through: a Commission on Artificial Intelligence spanning seven curial departments, an extraordinary consistory of cardinals, and grassroots pastoral resources.",
];

export type SourceKind = "primary" | "article" | "analysis" | "explainer" | "reference" | "video";

export interface Source {
  id: string;
  label: string;
  publisher: string;
  kind: SourceKind;
  url: string;
  /**
   * The publisher's own preview image (og:image) or the video's thumbnail,
   * hot-linked rather than copied — the same thing any link card shows. Three
   * entries have none; those render as typographic cards, which is why the
   * carousel never assumes an image is there.
   */
  image?: string;
}

/**
 * Everything written about the real encyclical that this project actually read.
 * Every URL was fetched and checked, and the list deliberately mixes the
 * primary text, news, explainers, criticism and broadcast — the speculative
 * half of this project is only defensible if the factual half is this legible.
 */
export const SOURCES: Source[] = [
  {
    id: "vatican-full-text",
    label: "Encyclical Letter Magnifica Humanitas",
    publisher: "The Holy See",
    kind: "primary",
    url: "https://www.vatican.va/content/leo-xiv/en/encyclicals/documents/20260515-magnifica-humanitas.html",
  },
  {
    id: "vatican-news",
    label: "AI must serve humanity, not concentrate power",
    publisher: "Vatican News",
    kind: "article",
    url: "https://www.vaticannews.va/en/pope/news/2026-05/pope-leo-xiv-encyclical-magnifica-humanitas-ai.html",
    image: "https://www.vaticannews.va/content/dam/vaticannews/agenzie/images/srv/2026/05/25/2026-05-15-firma-enciclica--magnifica-humanitas-/1779693363479.JPG/_jcr_content/renditions/cq5dam.thumbnail.cropped.1500.844.jpeg",
  },
  {
    id: "wikipedia",
    label: "Magnifica humanitas",
    publisher: "Wikipedia",
    kind: "reference",
    url: "https://en.wikipedia.org/wiki/Magnifica_humanitas",
  },
  {
    id: "time",
    label: "Pope Leo uses first major papal text to warn about AI",
    publisher: "TIME",
    kind: "article",
    url: "https://time.com/article/2026/05/25/pope-leo-encyclical-ai-magnifica-humanitas/",
    image: "https://static.time.com/v3/assets/bltea6093859af6183b/bltd056b16e323d9ec1/6a14b732f78d6ba720e8188f/pope-leo-encyclical-ai-magnifica-humanitas.jpg?branch=production&amp;width=3840&amp;quality=75&amp;auto=webp&amp;crop=16:9",
  },
  {
    id: "ncregister",
    label: "Full text of Magnifica Humanitas",
    publisher: "National Catholic Register",
    kind: "primary",
    url: "https://www.ncregister.com/cna/full-text-magnifica-humanitas",
    image: "https://publisher-ncreg.s3.us-east-2.amazonaws.com/pb-ncregister/swp/hv9hms/media/2026052610050_176e231a-c9f2-4907-8a90-20556a46a745.jpg",
  },
  {
    id: "usccb",
    label: "Magnifica Humanitas resources",
    publisher: "USCCB",
    kind: "reference",
    url: "https://www.usccb.org/magnifica-humanitas",
    image: "https://www.usccb.org/sites/default/files/usccb_logo_text_2025.png",
  },
  {
    id: "dicastery",
    label: "Magnifica Humanitas",
    publisher: "Dicastery for Integral Human Development",
    kind: "primary",
    url: "https://www.humandevelopment.va/en/magnifica-humanitas.html",
  },
  {
    id: "georgetown",
    label: "Leo XIV laid out his vision for AI. What happens next?",
    publisher: "Georgetown University",
    kind: "article",
    url: "https://www.georgetown.edu/news/pope-leo-xiv-laid-out-his-vision-for-ai-what-is-it-and-what-happens-next/",
    image: "https://www.georgetown.edu/wp-content/uploads/2026/06/GettyImages-174878998-scaled-e1780598426195.jpg",
  },
  {
    id: "ascension",
    label: "A complete guide to Pope Leo's first encyclical",
    publisher: "Ascension",
    kind: "explainer",
    url: "https://ascensionpress.com/blogs/articles/a-complete-guide-to-pope-leo-s-encyclical-magnificent-humanitas",
    image: "http://ascensionpress.com/cdn/shop/articles/Pope_Leo_-_Waving_Election_d381e7cb-ee9e-4c61-ad61-2dc2052ab4da.webp?v=1781949934",
  },
  {
    id: "cafod",
    label: "Magnifica Humanitas explained",
    publisher: "CAFOD",
    kind: "explainer",
    url: "https://cafod.org.uk/pray/magnifica-humanitas-explained",
    image: "https://images.ctfassets.net/vy3axnuecuwj/RWMDjimKgsbG8R8gYEQ4c/725346fbd87cea5210df7905de34bbe8/17_March_Pope_Leo.jpg",
  },
  {
    id: "scu",
    label: "What it means for business leaders",
    publisher: "Santa Clara University",
    kind: "analysis",
    url: "https://www.scu.edu/business/blog/leadership-ethics/magnifica-humanitas-ai-ethics-business-leaders/",
    image: "https://www.scu.edu/media/leavey-school-of-business/stories/magnifica-humanitas-ai-ethics-business-leaders.jpg",
  },
  {
    id: "angelus",
    label: "Silicon Valley has been largely silent",
    publisher: "Angelus News",
    kind: "analysis",
    url: "https://angelusnews.com/faith/silicon-valley-magnifica-humanitas/",
    image: "https://angelusnews.com/wp-content/uploads/2026/06/20260526T1022-MAGNIFICA-HUMANITAS-AI-CALL-TO-ACTION-1820439-scaled-e1780361371762-1024x577.jpg",
  },
  {
    id: "catholic-outlook",
    label: "Receiving Magnifica Humanitas: theology of reception",
    publisher: "Catholic Outlook",
    kind: "analysis",
    url: "https://catholicoutlook.org/receiving-magnifica-humanitas-notes-on-the-theology-of-reception-in-the-age-of-the-digital-encyclical/",
    image: "https://catholicoutlook.org/wp-content/uploads/2025/06/Pope-Leo-General-Audience-4-June-AA.jpg",
  },
  {
    id: "ewtn-nightly",
    label: "Pope Leo XIV releases first encyclical on AI",
    publisher: "EWTN News Nightly",
    kind: "video",
    url: "https://www.youtube.com/watch?v=bTWYkIZsyuI",
    image: "https://img.youtube.com/vi/bTWYkIZsyuI/maxresdefault.jpg",
  },
  {
    id: "full-address",
    label: "FULL ADDRESS: Pope Leo XIV presents Magnifica Humanitas",
    publisher: "YouTube",
    kind: "video",
    url: "https://www.youtube.com/watch?v=c41idPquxrE",
    image: "https://img.youtube.com/vi/c41idPquxrE/maxresdefault.jpg",
  },
  {
    id: "pine-explainer",
    label: "Pope Leo XIV's AI encyclical explained, with Fr. Gregory Pine",
    publisher: "YouTube",
    kind: "video",
    url: "https://www.youtube.com/watch?v=cpptgvohfZc",
    image: "https://img.youtube.com/vi/cpptgvohfZc/maxresdefault.jpg",
  },
  {
    id: "signing",
    label: "Pope Leo XIV signs the encyclical, calling for AI regulation",
    publisher: "YouTube",
    kind: "video",
    url: "https://www.youtube.com/watch?v=tcnbVp_O5yI",
    image: "https://img.youtube.com/vi/tcnbVp_O5yI/maxresdefault.jpg",
  },
  {
    id: "viral",
    label: "Why the first encyclical went viral",
    publisher: "YouTube",
    kind: "video",
    url: "https://www.youtube.com/watch?v=qZ0Tt49KDXk",
    image: "https://img.youtube.com/vi/qZ0Tt49KDXk/maxresdefault.jpg",
  },
];
