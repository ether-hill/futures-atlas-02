import type { Metadata } from "next";

/** Chrome for the internal area. No Footer and no links in from anywhere else —
 *  these pages are reachable only by typing the URL and signing in. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <main className="flex-1">{children}</main>;
}
