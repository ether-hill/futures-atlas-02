/**
 * The line that follows FEED in the masthead — one per visit, set light.
 *
 * These are short Kraftwerk quotations: several are simply song or album
 * titles, the rest are fragments of three to six words. Every one carries its
 * album, its song and a link on the page itself, through the info control
 * beside it. That credit is not decoration — it is the reason these can be
 * here at all, so if the tooltip ever goes, these go with it.
 *
 * `href` is a YouTube search rather than a video id on purpose: an id has to be
 * verified to be right and rots when a channel reorganises, whereas a search
 * for the artist and title always lands somewhere true. Swap in exact official
 * URLs whenever you want to pin them.
 */

export interface Headline {
  /** Shown in the masthead. */
  line: string;
  artist: string;
  album: string;
  song: string;
}

export const FEED_HEADLINES: Headline[] = [
  { line: "It's more fun to compute", artist: "Kraftwerk", album: "Computer World", song: "It's More Fun to Compute" },
  { line: "We are the robots", artist: "Kraftwerk", album: "The Man-Machine", song: "The Robots" },
  { line: "I'm the operator", artist: "Kraftwerk", album: "Computer World", song: "Pocket Calculator" },
  { line: "Computer love", artist: "Kraftwerk", album: "Computer World", song: "Computer Love" },
  { line: "Planet of visions", artist: "Kraftwerk", album: "Expo 2000", song: "Expo 2000" },
  { line: "Musique non stop", artist: "Kraftwerk", album: "Electric Café", song: "Musique Non Stop" },
  { line: "The man-machine", artist: "Kraftwerk", album: "The Man-Machine", song: "The Man-Machine" },
  { line: "Ohm sweet ohm", artist: "Kraftwerk", album: "Radio-Activity", song: "Ohm Sweet Ohm" },
  { line: "I'm controlling and composing", artist: "Kraftwerk", album: "Computer World", song: "Pocket Calculator" },
  { line: "By pressing down a special key", artist: "Kraftwerk", album: "Computer World", song: "Pocket Calculator" },
  { line: "Control the data memory", artist: "Kraftwerk", album: "Computer World", song: "Computer World" },
];

/** Where the info control points. See the note above on why this is a search. */
/**
 * Video ids for the songs we can link directly, keyed by `song`.
 *
 * Every one of these is from "Kraftwerk - Topic" — the channel the label
 * itself supplies — and every id was confirmed through YouTube's oEmbed
 * endpoint, which returns the real title and channel for an id. That check is
 * the point: an id is eleven opaque characters, and a wrong or invented one
 * still looks exactly like a right one until someone clicks it.
 *
 * Songs are absent from this map when no official upload could be verified.
 * Plenty of fan uploads exist for the rest, and they are deliberately not used:
 * they are not the rights holder's, and they disappear. Those fall back to a
 * search, which always lands somewhere useful and never lands somewhere wrong.
 */
const SONG_VIDEO: Record<string, string> = {
  "The Robots": "68d8GRgiec4",
  "Computer Love": "uNBGWenPlGo",
  "Pocket Calculator": "oD7rJ4ufciM",
  "The Man-Machine": "zHIsGqJaXXw",
};

/** True when the credit can point at the track itself rather than a search. */
export const hasDirectVideo = (h: Headline) => Boolean(SONG_VIDEO[h.song]);

export const headlineHref = (h: Headline) => {
  const id = SONG_VIDEO[h.song];
  return id
    ? `https://www.youtube.com/watch?v=${id}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${h.artist} ${h.song}`)}`;
};

export const randomHeadline = () =>
  FEED_HEADLINES[Math.floor(Math.random() * FEED_HEADLINES.length)];
