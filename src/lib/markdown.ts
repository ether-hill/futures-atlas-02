import { marked } from "marked";

/**
 * Post bodies are authored in this repo (`src/data/posts.ts`), never
 * user-supplied, so the rendered HTML is trusted and goes straight into the
 * page. If a body ever comes from outside this repo, sanitise here first.
 */
marked.setOptions({ gfm: true, breaks: false });

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false });
}
