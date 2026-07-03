import type { Metadata } from "next";
import { OracleExperience } from "@/components/OracleExperience";

export const metadata: Metadata = {
  title: "Consult the Oracle — The Hollow Villages",
  description:
    "Begin a consultation. The oracle opens a real letter, names the system behind the complaint, and shows you that village in 2050 — with the levers, the precedents, and the real funding to start.",
};

/** Deep-link straight into a consultation; "Home" returns to the hero. */
export default function OraclePage() {
  return <OracleExperience startInOracle />;
}
