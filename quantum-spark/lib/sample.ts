/**
 * The sample fallback (brief §11) — the demo safety net and the reference for
 * what "grounded hype" reads like. Rendered with a quiet toast whenever the
 * live call fails; never dead-end in front of an audience.
 */

import type { SparkResult } from "./types";

export const SAMPLE_SPARK: SparkResult = {
  business_display: "Logistics",
  generatedAt: "2026-07-03T09:00:00.000Z",
  promptVersion: "1.0.0",
  insights: [
    {
      tag: "Route Optimization",
      headline: "Every delivery route, solved at once",
      insight:
        "Quantum optimization can weigh millions of routing permutations simultaneously — turning fleet planning from an educated guess into a near-perfect answer that cuts fuel, time, and emissions in a single sweep.",
    },
    {
      tag: "Live Rerouting",
      headline: "A supply chain that reroutes itself",
      insight:
        "Pair quantum solvers with real-time AI and your network becomes self-healing — sensing a port delay or storm and rebalancing thousands of shipments before a human even sees the alert.",
    },
    {
      tag: "Materials",
      headline: "Packaging invented atom by atom",
      insight:
        "Quantum simulation of molecules lets chemists design lighter, stronger, fully recyclable materials from first principles — reinventing the box before it's ever manufactured.",
    },
    {
      tag: "Security",
      headline: "Unbreakable trust across the network",
      insight:
        "Quantum key distribution promises cargo and customs data that is physically impossible to intercept unnoticed — a new gold standard of trust for global trade.",
    },
    {
      tag: "Demand Sensing",
      headline: "Stock that arrives before the order",
      insight:
        "Quantum-enhanced machine learning finds demand patterns classical models miss, so inventory flows toward need in near real time — emptier warehouses, fuller shelves.",
    },
  ],
};
