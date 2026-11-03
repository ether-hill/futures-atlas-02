/**
 * Share cards for signed-in pages.
 *
 * A link sent in WhatsApp, Slack, iMessage or X is previewed by that app's own
 * fetcher, which has no editor cookie, so a gated page would always unfurl as
 * the sign-in form. For the paths below, `src/middleware.ts` answers a known
 * preview fetcher with a few lines of HTML carrying ONLY this title,
 * description and image, never the page. Everyone else still gets the sign-in.
 * The page's own metadata reads the same entry, so the card and the page agree.
 *
 * Only list what you are happy to show anyone who has the link: the card is
 * public by design. The image must be a static file (the middleware never sees
 * paths with an extension, so it is served without a sign-in).
 */
export type ShareCard = { title: string; description: string; image: string; width: number; height: number; alt: string };

export const SHARE_CARDS: Record<string, ShareCard> = {
  "/doom-score/play-v02": {
    title: "The AI extinction conversation",
    description:
      "How talk of AI ending humanity grew from a forum footnote to a flood, 2009 to now, played as sound. Every dot is someone's guess at the chance, played as a note.",
    image: "/og/doom-score-play.jpg",
    width: 1200,
    height: 630,
    alt: "The AI extinction conversation: a big title and Play button over a chart of what has been said about AI ending humanity since 2009, rising to the right.",
  },
};

/** Link-preview fetchers, not search crawlers: Googlebot and friends are deliberately absent. */
export const PREVIEW_FETCHER =
  /WhatsApp|facebookexternalhit|Facebot|Slackbot|Slack-ImgProxy|Twitterbot|TelegramBot|LinkedInBot|Discordbot|SkypeUriPreview|Iframely|Embedly|redditbot|Applebot/i;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** The card as a page: head tags only, nothing from the page itself. */
export function shareCardHtml(card: ShareCard, origin: string, path: string): string {
  const img = `${origin}${card.image}`;
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>${esc(card.title)}</title>
<meta name="robots" content="noindex">
<meta name="description" content="${esc(card.description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Futures Atlas">
<meta property="og:url" content="${esc(origin + path)}">
<meta property="og:title" content="${esc(card.title)}">
<meta property="og:description" content="${esc(card.description)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="${card.width}">
<meta property="og:image:height" content="${card.height}">
<meta property="og:image:alt" content="${esc(card.alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(card.title)}">
<meta name="twitter:description" content="${esc(card.description)}">
<meta name="twitter:image" content="${esc(img)}">
</head><body></body></html>`;
}
