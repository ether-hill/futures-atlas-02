import type { Metadata } from "next";
import { DispatchesBrowser } from "./DispatchesBrowser";
import { editorPosts, livePosts } from "@/data/posts";
import { getEditor } from "@/lib/editor";

export const metadata: Metadata = {
  title: "Dispatches — Futures Atlas",
  description:
    "A reading log on quantum computing, advanced AI, the compute they run on, and the social weather around all of it. Every dispatch links out to the source.",
};

// The reading log. Chrome (nav + footer) comes from the (atlas) layout. Drafts
// are filtered out here, on the server, so a visitor's page never contains
// them. An editor gets everything, live first and drafts grouped below.
export default async function DispatchesPage() {
  const isEditor = Boolean(await getEditor());
  return (
    <DispatchesBrowser items={isEditor ? editorPosts : livePosts} showVisibility={isEditor} />
  );
}
