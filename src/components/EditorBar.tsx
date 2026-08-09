/**
 * The one piece of chrome that says "you are not seeing the public site".
 *
 * Renders nothing for the public. For a signed-in editor it sits above the nav
 * on every Atlas-rendered page: who you are, how many drafts you're seeing that
 * a visitor isn't, a link to the overview, and sign out.
 */
import Link from "next/link";
import { draftProjects, liveProjects } from "@/data/projects";
import { getEditor } from "@/lib/editor";

export async function EditorBar() {
  const editor = await getEditor();
  if (!editor) return null;

  return (
    <div
      // The global Share pill is fixed just under the nav, i.e. on top of this
      // bar, the extra right padding keeps Sign out clear of it.
      className="relative z-[60] flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-ink/20 bg-band py-2.5 pl-[clamp(16px,4vw,40px)] pr-[132px]"
      style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-label)" }}
    >
      <span className="inline-flex items-center gap-2 uppercase tracking-[0.14em] text-paper">
        <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        Editor mode
      </span>
      <span className="uppercase tracking-[0.14em] text-paper/55">{editor.name}</span>
      <span className="uppercase tracking-[0.14em] text-paper/55">
        {liveProjects.length} live · {draftProjects.length} draft
      </span>

      <span className="ml-auto flex items-center gap-4">
        <Link
          href="/editor"
          className="uppercase tracking-[0.14em] text-paper/75 underline-offset-4 hover:text-paper hover:underline"
        >
          Overview
        </Link>
        <form method="POST" action="/api/admin/logout">
          <button
            type="submit"
            className="uppercase tracking-[0.14em] text-paper/75 underline-offset-4 hover:text-paper hover:underline"
          >
            Sign out
          </button>
        </form>
      </span>
    </div>
  );
}
