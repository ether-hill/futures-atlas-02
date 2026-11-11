/**
 * The Doom Score's pages that have been pushed. A deployed build links only to
 * these, so a page on staging never links to one that is not there; on a
 * developer's machine every page is linked. Add a page here when it is pushed.
 */
export const PUSHED = ["/doom-score/play-v02", "/doom-score/chronicle", "/doom-score/response", "/doom-score/play-response"];

export const linkable = (href: string) => !process.env.VERCEL || PUSHED.includes(href.split("#")[0]);
