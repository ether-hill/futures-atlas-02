import Link from "next/link";

/**
 * v1 / v2, both live at their own URLs.
 *
 * Same idea as Magnifica's `.x-versions` pill: two designs of the same report
 * exist at the same time so they can be compared directly rather than from
 * memory. This one is React and Tailwind rather than a string of HTML and a
 * stylesheet, so it takes its colours from the tokens instead of naming them.
 *
 * Sits clear of the Atlas nav (which publishes its own height as --fa-nav-h)
 * and, on a phone, moves out of the way of the fixed share button at the foot.
 */

const VERSIONS = [
  { id: "v1", href: "/feed/ai-hegemony", label: "v1" },
  { id: "v2", href: "/feed/ai-hegemony/v2", label: "v2" },
] as const;

export function VersionSwitch({ current }: { current: "v1" | "v2" }) {
  return (
    <nav
      aria-label="Design version"
      className="fixed right-3 top-[calc(var(--fa-nav-h,56px)+62px)] z-40 flex gap-0.5 rounded-full border border-paper/15 bg-band/85 p-[3px] backdrop-blur-md max-[680px]:bottom-[150px] max-[680px]:top-auto min-[680px]:right-4"
    >
      {VERSIONS.map((v) => {
        const on = v.id === current;
        return (
          <Link
            key={v.id}
            href={v.href}
            aria-current={on ? "page" : undefined}
            className={`rounded-full px-[11px] py-[5px] font-mono text-[9px] font-bold uppercase tracking-[0.16em] transition-colors ${
              on ? "bg-accent text-band" : "text-paper/65 hover:text-paper"
            }`}
          >
            {v.label}
          </Link>
        );
      })}
    </nav>
  );
}
