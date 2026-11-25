/**
 * The AI extinction conversation's pages that have been pushed. A deployed build links only to
 * these, so a page on staging never links to one that is not there; on a
 * developer's machine every page is linked. Add a page here when it is pushed.
 */
export const PUSHED = ["/ai-extinction-conversation", "/ai-extinction-conversation/play-v02", "/ai-extinction-conversation/play-v03", "/ai-extinction-conversation/chronicle", "/ai-extinction-conversation/response", "/ai-extinction-conversation/play-response"];

/** The pages that are public on production. Everything else in PUSHED is on staging only. */
export const PUBLIC = ["/ai-extinction-conversation", "/ai-extinction-conversation/chronicle"];

export const linkable = (href: string) => {
  if (!process.env.VERCEL) return true;
  const path = href.split("#")[0];
  return (process.env.VERCEL_ENV === "production" ? PUBLIC : PUSHED).includes(path);
};
