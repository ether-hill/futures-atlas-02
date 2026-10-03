import { Footer } from "@/components/Footer";
import { PageIn } from "@/components/PageIn";

/** Chrome for the Atlas's own pages (index, about, contact, style-guide).
 *  The global nav (the sticky fa-shell bar) is the one shared component injected
 *  by /atlas-nav.js (loaded in the root layout), identical to every project
 *  bundle. Individual projects under /<slug> supply their own SiteNav sub-nav. */
export default function AtlasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* id + tabindex: the target of the root layout's skip link. tabindex="-1"
          is what lets the fragment jump move FOCUS here, not just the scroll. */}
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <PageIn>{children}</PageIn>
      </main>
      <Footer />
    </>
  );
}
