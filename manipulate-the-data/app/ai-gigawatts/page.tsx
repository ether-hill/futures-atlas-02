import type { Metadata } from "next";
import Story from "@/components/one/Story";
import "./one.css";

export const metadata: Metadata = {
  title: "One figure: the power",
  description:
    "Global AI data centre power capacity, drawn as the countries it passes, then redrawn under a decision you pick.",
};

export default function Page() {
  return <Story />;
}
