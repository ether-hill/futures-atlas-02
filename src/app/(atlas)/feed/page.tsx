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

// The same posts, in a timeline. Drafts are filtered
// out here, on the server, so a visitor's page never contains them.
export default async function FeedPage() {
  const isEditor = Boolean(await getEditor());
  // A couple of live projects for the right rail — newest first, never drafts.
  // liveProjects is already newest-first (see projects.ts) — this used to sort
  // again here, which is a second copy of the ordering rule and the kind that
  // drifts from the first.
  const picks = liveProjects.slice(0, 3);
  return (
    <FeedTimeline
      benchSeed={Date.now()}
      items={isEditor ? editorPosts : livePosts}
      projects={picks}
      showVisibility={isEditor}
    />
  );
}
