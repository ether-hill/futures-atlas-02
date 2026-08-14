import { FOOTER_HTML } from "@/generated/atlas-footer";

/**
 * THE footer. One of them, for every page on the site.
 *
 * The markup is generated once by scripts/gen-footer.mjs from the same
 * projects.ts / posts.ts / glossary.ts the pages use, into two outputs holding
 * the identical string: a module this component imports, and
 * public/atlas-footer.html, which atlas-nav.js fetches and appends on the
 * static sub-app bundles, since those cannot run React. One source, one output,
 * host and sub-app alike.
 *
 * It used to be two implementations — this component, and a second footer typed
 * out as a string inside atlas-nav.js. They drifted, exactly as two copies of
 * one thing always do: different columns, different links, and for a while
 * different colours.
 *
 * IMPORTED, not read off disk. A serverless function's filesystem is not
 * public/, and Next cannot trace a readFileSync built from process.cwd(), so
 * reading the html file here would work in dev and quietly render nothing in
 * production — a missing footer on every page, invisible until someone looked.
 *
 * The HTML is ours, generated from our own data at build time, so it is trusted
 * and injected unescaped. If any of it ever comes from outside this repo, it
 * has to be escaped in the generator first — gen-footer.mjs already escapes
 * every interpolated value for that reason.
 */

export function Footer() {
  return (
    <footer
      className="fa-foot"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: FOOTER_HTML }}
    />
  );
}
