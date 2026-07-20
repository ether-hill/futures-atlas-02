import type { Metadata } from "next";
import { Footer } from "@/components/Footer";

/** Chrome for the internal area. Carries the hub Footer, but not the injected
 *  Share tool: these pages are private, so offering "post this to X" is wrong.
 *  atlas-nav.js has no opt-out attribute for Share (only data-fa-no-footer), and
 *  it is shared by every project bundle, so it is hidden here with scoped CSS
 *  rather than by touching the global script. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`.fa-share{display:none!important}`}</style>
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
