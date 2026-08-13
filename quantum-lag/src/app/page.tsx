import { Run } from "@/components/Run";

/*
  Guided is the default. A player arriving here never sees the research version
  and is not asked to choose.
*/
export default function GuidedPage() {
  return <Run mode="guided" />;
}
