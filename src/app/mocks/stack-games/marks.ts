/**
 * Server-side: inline the brand marks.
 *
 * Every file in public/logos is authored `fill="currentColor"`, so as an <img>
 * each one renders black — which, on this ground, is nothing at all. Inlined,
 * `color` reaches them and each brick carries its own brand colour.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ITEMS, type Marks } from "./stack";

export function loadMarks(): Marks {
  const out: Marks = {};
  for (const { slug } of ITEMS) {
    if (out[slug]) continue;
    try {
      out[slug] = readFileSync(join(process.cwd(), "public/logos", `${slug}.svg`), "utf8")
        .replace(/<\?xml[^>]*\?>/g, "")
        .replace(/<title>.*?<\/title>/g, "")
        .replace(/<svg /, '<svg aria-hidden="true" focusable="false" ');
    } catch {
      out[slug] = "";
    }
  }
  return out;
}
