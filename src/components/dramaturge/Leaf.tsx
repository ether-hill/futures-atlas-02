/**
 * The scan of one leaf, as the library itself publishes it.
 *
 * The URL is read off the book record at harvest, never assembled from a
 * pattern: a constructed image URL that 404s is a broken picture and a false
 * claim at once. A leaf the library publishes no image for renders as nothing.
 */
export function Leaf({ src, page, caption }: { src?: string; page: number; caption: string }) {
  if (!src) return null;
  return (
    <figure className="dg-leaf">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`Scan of page ${page}`}
        width={900}
        height={1200}
        loading="lazy"
        decoding="async"
      />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
