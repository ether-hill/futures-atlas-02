import type { Metadata } from "next";
import { GlossaryBrowser } from "./GlossaryBrowser";
import { GLOSSARY } from "@/data/glossary";

export const metadata: Metadata = {
  title: "Glossary, Futures Atlas",
  description:
    "Plain definitions for the vocabulary of AI, quantum computing, compute infrastructure, and the policy and social questions they raise.",
};

export default function GlossaryPage() {
  return <GlossaryBrowser entries={GLOSSARY} />;
}
