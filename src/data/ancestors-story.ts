/**
 * What the reading guide at /sourcelibrary adds on top of the shelf.
 *
 * `library-shelf.ts` stays the curation (books, notes, cross references). This
 * file only frames the five threads: the question each one asks, what the
 * subject is called now, and the year it got that name.
 *
 * `named` is a dated event with a source, not a claim about first use of a
 * word. "Quantum" is ordinary Latin and is all over this shelf, so the physics
 * thread is marked at Planck's 1900 lecture rather than at a coinage.
 */

import type { ShelfCategoryKey } from "./library-shelf";

export interface ThreadStory {
  key: ShelfCategoryKey;
  /** the question a guided run follows, taken from the category blurb */
  question: string;
  /** "Before …" on the masthead */
  modern: string;
  /** three books whose own title pages stand in for the thread on the masthead */
  heralds: { id: string; label: string }[];
  /** `word` is the two or three syllables the marker on the wire has room for */
  named: { year: number; word: string; what: string; source: string; sourceName: string };
  /** book whose first figure heads the thread's section of the reading list */
  plateFrom: string;
}

export const THREAD_STORIES: ThreadStory[] = [
  {
    key: "reasoning",
    question: "Can reasoning be done by a mechanism?",
    modern: "artificial intelligence",
    heralds: [
      { id: "695592c17bd6d2cd1d61afec", label: "Ars magna generalis" },
      { id: "69b6ad67dc00a90e322a9ecd", label: "Ars magna sciendi" },
      { id: "6a0a22e80eca358f15e83e96", label: "The Laws of Thought" },
    ],
    named: {
      year: 1955,
      word: "artificial intelligence",
      what: "The term artificial intelligence first appears, in the proposal for the Dartmouth summer project.",
      source: "https://ojs.aaai.org/index.php/aimagazine/article/view/1904",
      sourceName: "AI Magazine reprint of the proposal",
    },
    plateFrom: "695592c17bd6d2cd1d61afec",
  },
  {
    key: "automata",
    question: "Can something made be said to be alive?",
    modern: "robots",
    heralds: [
      { id: "695aa9a4be4023bd34bd6b7d", label: "De gli automati" },
      { id: "69a5b99dd76b98f272fcec6d", label: "Les raisons des forces mouvantes" },
      { id: "69a5f6b11cf742c360413d42", label: "Theatrum machinarum novum" },
    ],
    named: {
      year: 1920,
      word: "robot",
      what: "Karel Čapek's play R.U.R. is published and gives the word robot to every language.",
      source: "https://www.lindahall.org/about/news/scientist-of-the-day/karel-capek-2",
      sourceName: "Linda Hall Library",
    },
    plateFrom: "695aa9a4be4023bd34bd6b7d",
  },
  {
    key: "physics",
    question: "What is light made of?",
    modern: "quantum physics",
    heralds: [
      { id: "69b221fe08069e96e8431e0a", label: "De rerum natura" },
      { id: "6953e58d77f38f6761bf0cfc", label: "Traité de la lumière" },
      { id: "698fb7976b95eeda7d2d36ac", label: "Beyträge zur Optik" },
    ],
    named: {
      year: 1900,
      word: "quanta",
      what: "Max Planck presents his radiation law to the German Physical Society, with energy arriving in quanta.",
      source: "https://nbarchive.ku.dk/nba_calendar/1999-2011/100years_quanta/",
      sourceName: "Niels Bohr Archive",
    },
    plateFrom: "6953e58d77f38f6761bf0cfc",
  },
  {
    key: "forecast",
    question: "Can the future be worked out in advance?",
    modern: "foresight",
    heralds: [
      { id: "69dbcac31040d1d5e20ae6df", label: "Prognosticatio" },
      { id: "69dbc7d91040d1d5e2094b55", label: "Flores astrologiae" },
      { id: "6985ca711c89f522ebc0db71", label: "Prophetia anglicana" },
    ],
    named: {
      year: 1943,
      word: "futurology",
      what: "Ossip Flechtheim coins futurology for the systematic study of what is coming.",
      source: "https://sf-encyclopedia.com/entry/futurology",
      sourceName: "The Encyclopedia of Science Fiction",
    },
    plateFrom: "69dbcac31040d1d5e20ae6df",
  },
  {
    key: "worlds",
    question: "What could be arranged differently?",
    modern: "speculative design",
    heralds: [
      { id: "69b2ff0ea1a4246ddb45adbb", label: "Utopia" },
      { id: "69d003fc0f4d028b337a0aec", label: "Somnium" },
      { id: "69905cf8aaa7f10ed4cfd202", label: "The Man in the Moone" },
    ],
    named: {
      year: 1516,
      word: "utopia",
      what: "Thomas More's Utopia is first printed, at Louvain, and its title becomes the word. The shelf holds the 1518 edition.",
      source: "https://en.wikipedia.org/wiki/Utopia_(book)",
      sourceName: "Wikipedia, Utopia (book)",
    },
    plateFrom: "69905cf8aaa7f10ed4cfd202",
  },
];

export const THREAD_STORY = Object.fromEntries(THREAD_STORIES.map((t) => [t.key, t])) as Record<
  ShelfCategoryKey,
  ThreadStory
>;
