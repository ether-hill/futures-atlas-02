import { ProjectsBrowser } from "./ProjectsBrowser";
import { visibleProjects } from "@/data/projects";
import { getEditor } from "@/lib/editor";

// Full project listing: a 3-column grid (newest first) with category-tag
// filters. Chrome (nav + footer) comes from the (atlas) layout. Drafts are
// filtered out here, on the server — a visitor's page never contains them.
export default async function ProjectsPage() {
  const isEditor = Boolean(await getEditor());
  return <ProjectsBrowser items={visibleProjects(isEditor)} showVisibility={isEditor} />;
}
