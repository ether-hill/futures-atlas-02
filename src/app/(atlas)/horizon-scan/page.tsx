import type { Metadata } from "next";
import { getScan } from "@/lib/horizon-scan/cache";
import type { ScanResult } from "@/lib/horizon-scan/types";
import { HorizonScanBrowser } from "./HorizonScanBrowser";

export const metadata: Metadata = {
  title: "Horizon Scan — Futures Atlas",
  description:
    "A standing search across open research: quantum, machine intelligence, compute, power, foresight, society, land, living systems and evidence. Nothing on it is chosen by hand.",
};

/**
 * The page is a thin shell. `getScan()` owns the caching, and the comment at the
 * top of lib/horizon-scan/cache.ts explains why it does rather than the
 * framework: under this app's force-dynamic layout the fetch cache is bypassed,
 * which had every page view firing all 28 upstream queries.
 *
 * A cold run takes some seconds, so give the function room; on Vercel the
 * default would cut it off.
 */
export const maxDuration = 60;
export default async function HorizonScanPage() {
  let result: ScanResult | null = null;
  try {
    result = await getScan();
  } catch {
    result = null;
  }
  return <HorizonScanBrowser result={result} />;
}
