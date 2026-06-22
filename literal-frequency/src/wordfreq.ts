// Turn a book's raw API text into a ranked word-frequency table — the data
// behind the visualisation (Form+Code "Visualize: Loading and Displaying Data").

// Common English stopwords (the API's translations + page annotations are English).
const STOP = new Set(
  ("the of and to a in is it that this for as with on are be by an at from or " +
    "was were which has have had not but they their them his her its our your you " +
    "we he she him i me my mine ours yours theirs who whom whose what when where why how " +
    "all any both each few more most other some such no nor only own same so than too very " +
    "can will just don should now then there here out up down off over under again further " +
    "into through during before after above below between about against because while if " +
    "page original translation note meta warning none lang figure shows shown left right " +
    "upper lower center top bottom side this these those also one two three four five six " +
    "seven eight nine ten first second third part section text book vol volume").split(/\s+/),
);

export interface WordCount {
  word: string;
  count: number;
}

/** Strip API scaffolding (# headers, --- Page --- markers, <tags>, table pipes). */
export function clean(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, " ") // drop <meta>/<note>/<lang>/<warning> tag delimiters
    .replace(/^#.*$/gm, " ") // header lines
    .replace(/^---.*$/gm, " ") // --- Page N --- markers
    .replace(/^\s*\|.*$/gm, " ") // markdown table rows
    .replace(/\[(?:original|translation|meta|note)\]/gi, " ");
}

/** Ranked word counts, stopwords + numbers + short tokens removed. */
export function wordFrequency(raw: string, max = 120): WordCount[] {
  const text = clean(raw).toLowerCase();
  const tokens = text.match(/[a-zà-öø-ÿ][a-zà-öø-ÿ'-]{2,}/gi) ?? [];
  const counts = new Map<string, number>();
  for (const tRaw of tokens) {
    const t = tRaw.replace(/^[-']+|[-']+$/g, "");
    if (t.length < 3 || STOP.has(t)) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, max);
}

export function totalWords(raw: string): number {
  return (clean(raw).match(/[a-zà-öø-ÿ][a-zà-öø-ÿ'-]{2,}/gi) ?? []).length;
}
