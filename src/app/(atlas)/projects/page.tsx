import type { Metadata } from "next";
import { ProjectsBrowser } from "./ProjectsBrowser";
import { editorOrdered, liveProjects } from "@/data/projects";
import { getListingEditor } from "@/lib/editor";

// Its own title and description. Without these the page inherited the root
// metadata verbatim, so the full listing and the homepage were the same page as
// far as a share card, a browser tab or a search result was concerned. The
// description names what is in the grid; it used to advertise the two filter
// rows, which a visitor no longer sees at this length (see FILTER_FROM).
export const metadata: Metadata = {
  title: "Projects. Futures Atlas",
  description:
    "Everything the Atlas has built in one grid: visuals, games and tools about compute, quantum computing and AI. Every one of them runs.",
};

// Full project listing: a 3-column grid. Chrome (nav + footer) comes from the
// (atlas) layout. Drafts are filtered out here, on the server, a visitor's page
// never contains them. An editor gets the whole atlas, live first and drafts
// grouped below, and with it the filter rows the longer list earns.
export default async function ProjectsPage() {
  const isEditor = Boolean(await getListingEditor());
  return (
    <ProjectsBrowser items={isEditor ? editorOrdered : liveProjects} showVisibility={isEditor} />
  );
}
