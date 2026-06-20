import { Footer } from "@/components/Footer";

/** Chrome for the Atlas's own pages (index, about, contact, style-guide).
 *  The global nav (the sticky fa-shell bar) is the one shared component injected
 *  by /atlas-nav.js (loaded in the root layout) — identical to every project
 *  bundle. Individual projects under /<slug> supply their own SiteNav sub-nav. */
export default function AtlasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
