/**
 * Commons serves thumbnails at fixed widths by rewriting the "NNNpx-" segment
 * of a /thumb/ URL. A phone gets the 500px one; the 960px one (PDF pages stop
 * there) covers a desktop card and the lightbox. Originals (no /thumb/) are
 * served as they are.
 */
export function commonsSrcSet(src: string): string | undefined {
  if (!src.includes("/thumb/")) return undefined;
  const at = (w: number) => src.replace(/(^|\/|page\d+-)\d+px-/, (_m, pre: string) => `${pre}${w}px-`);
  return `${at(500)} 500w, ${at(960)} 960w`;
}
