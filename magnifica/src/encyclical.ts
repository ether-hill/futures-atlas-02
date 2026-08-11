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

export const SOURCES: { label: string; url: string }[] = [
  { label: "Magnifica humanitas — Wikipedia", url: "https://en.wikipedia.org/wiki/Magnifica_humanitas" },
  { label: "Vatican News — 'AI must serve humanity'", url: "https://www.vaticannews.va/en/pope/news/2026-05/pope-leo-xiv-encyclical-magnifica-humanitas-ai.html" },
  { label: "TIME — Pope Leo warns about dangers of AI", url: "https://time.com/article/2026/05/25/pope-leo-encyclical-ai-magnifica-humanitas/" },
  { label: "Full text (EWTN)", url: "https://www.ewtnnews.com/vatican/full-text-of-magnifica-humanitas-read-pope-leo-xiv-s-first-encyclical" },
  { label: "Georgetown — Leo XIV's vision for AI", url: "https://www.georgetown.edu/news/pope-leo-xiv-laid-out-his-vision-for-ai-what-is-it-and-what-happens-next/" },
];
