import { OracleExperience } from "@/components/OracleExperience";

/**
 * The home page IS the oracle. First view: the full-screen before/after hero,
 * exactly one viewport, no scroll. "Consult the oracle" opens the consultation
 * in place; a "Home" control returns to the hero.
 */
export default function Home() {
  return <OracleExperience />;
}
