import type { Metadata } from "next";
import { FeedTimeline } from "./FeedTimeline";
import { editorPosts, livePosts } from "@/data/posts";
import { getEditor } from "@/lib/editor";
import { liveProjects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Feed — Futures Atlas",
  description:
    "The reading log as a timeline: quantum, advanced AI, compute and the social weather around all of it, posted as it comes.",
};

// The same posts as /blog, in a timeline instead of a grid. Drafts are filtered
// out here, on the server, so a visitor's page never contains them.
export default async function FeedPage() {
  const isEditor = Boolean(await getEditor());
  // A couple of live projects for the right rail — newest first, never drafts.
  const picks = [...liveProjects].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  return (
    <FeedTimeline
      items={isEditor ? editorPosts : livePosts}
      projects={picks}
      showVisibility={isEditor}
    />
  );
}
