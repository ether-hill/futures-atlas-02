import { AtlasNav } from "@/components/AtlasNav";
import { Footer } from "@/components/Footer";

/** Chrome for the Atlas's own pages (index, about, contact, style-guide).
 *  Individual projects under /<slug> supply their own SiteNav instead. */
export default function AtlasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AtlasNav />
      {/* offset for the fixed global nav */}
      <main className="flex-1" style={{ paddingTop: "var(--fa-nav-h, 64px)" }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
