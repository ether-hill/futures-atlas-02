/**
 * The Atlas project list for the global header's breadcrumb dropdown — most
 * recent first, capped at 10. This is the one place the menu is defined; adding
 * a new Atlas project means adding a line here (no API, no fetch — it's just a
 * menu). Mirror of the host's src/data/projects.ts order.
 */
export interface FaProject {
  name: string;
  path: string;
}

export const FA_HOME = "/";

export const FA_PROJECTS: FaProject[] = [
  { name: "Social Composer", path: "/social-composer" },
  { name: "Prism", path: "/prism" },
  { name: "Quantum Sandbox", path: "/quantum-sandbox" },
  { name: "The Odds", path: "/odds-of-surviving-ai" },
  { name: "Underground Intelligence", path: "/underground-intelligence" },
  { name: "The Hollow Villages", path: "/hollow-villages" },
].slice(0, 10);

// The project this bundle is.
export const FA_CURRENT_PATH = "/social-composer";
export const FA_CURRENT_NAME = "Social Composer";
