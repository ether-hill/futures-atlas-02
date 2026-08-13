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
export const headlineHref = (h: Headline) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${h.artist} ${h.song}`)}`;

export const randomHeadline = () =>
  FEED_HEADLINES[Math.floor(Math.random() * FEED_HEADLINES.length)];
