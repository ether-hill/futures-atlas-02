/**
 * The Doom Score's pages that have been pushed. A deployed build links only to
 * these, so a page on staging never links to one that is not there; on a
 * developer's machine every page is linked. Add a page here when it is pushed.
 */
export const PUSHED = ["/doom-score", "/doom-score/play-v02", "/doom-score/play-v03", "/doom-score/chronicle", "/doom-score/response", "/doom-score/play-response"];

/** The pages that are public on production. Everything else in PUSHED is on staging only. */
export const PUBLIC = ["/doom-score", "/doom-score/chronicle"];

export const linkable = (href: string) => {
  if (!process.env.VERCEL) return true;
  const path = href.split("#")[0];
  return (process.env.VERCEL_ENV === "production" ? PUBLIC : PUSHED).includes(path);
};
