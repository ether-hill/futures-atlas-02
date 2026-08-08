import { ProjectsBrowser } from "./ProjectsBrowser";
import { editorOrdered, liveProjects } from "@/data/projects";
import { getEditor } from "@/lib/editor";

// Full project listing: a 3-column grid with category-tag filters. Chrome (nav
// + footer) comes from the (atlas) layout. Drafts are filtered out here, on the
// server — a visitor's page never contains them. An editor gets the whole
// atlas, live first and drafts grouped below.
export default async function ProjectsPage() {
  const isEditor = Boolean(await getEditor());
  return (
    <ProjectsBrowser items={isEditor ? editorOrdered : liveProjects} showVisibility={isEditor} />
  );
}
