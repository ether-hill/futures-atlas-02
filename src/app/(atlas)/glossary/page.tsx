import type { Metadata } from "next";
import { GlossaryBrowser } from "./GlossaryBrowser";
import { GLOSSARY } from "@/data/glossary";

const GLOSSARY_TITLE = "Glossary, Futures Atlas";
const GLOSSARY_DESC =
  "Plain definitions for the vocabulary of AI, quantum computing, compute infrastructure, and the policy and social questions they raise.";

export const metadata: Metadata = {
  title: GLOSSARY_TITLE,
  description: GLOSSARY_DESC,
  // Without these the page inherits the root layout's Open Graph title and
  // description, so every hub page unfurled as the home page.
  openGraph: { title: GLOSSARY_TITLE, description: GLOSSARY_DESC },
  twitter: { title: GLOSSARY_TITLE, description: GLOSSARY_DESC },
};

export default function GlossaryPage() {
  return <GlossaryBrowser entries={GLOSSARY} />;
}
