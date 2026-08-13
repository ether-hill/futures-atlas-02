import { redirect } from "next/navigation";

/**
 * The blog index is gone — the feed replaced it. Individual posts keep living
 * at /blog/<slug> because those URLs are already out in the world and every
 * card links to them; only the listing is retired.
 */
export default function BlogIndex() {
  redirect("/feed");
}
