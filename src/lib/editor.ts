/**
 * "Is an editor looking at this page?", for server components.
 *
 * The pages themselves never decide who may see a draft *URL* (the middleware
 * does that, before anything renders). This is what decides whether a listing
 * includes drafts and whether the editor bar appears.
 */
import { cookies } from "next/headers";
import { ADMIN_COOKIE, readSession } from "./admin-session";
import { editorName } from "./editors";

export interface Editor {
  id: string;
  name: string;
}

/**
 * Do unpublished projects and posts exist on this deployment?
 *
 * Only on staging. On production a draft is not hidden, it is absent: not in
 * any listing, editor or not, and its URL answers as though it was never built
 * (see src/middleware.ts). Production is the launched site and a draft has no
 * business being reachable there, even by someone holding the password.
 */
export function draftsVisible(): boolean {
  return process.env.VERCEL_ENV !== "production";
}

/**
 * Who is looking, for a listing that would include drafts. Null on production
 * even for a signed-in editor, because there are no drafts there to list.
 * Use `getEditor()` directly when the question is "is this person an editor",
 * and this when the question is "should this list show unpublished work".
 */
export async function getListingEditor(): Promise<Editor | null> {
  return draftsVisible() ? getEditor() : null;
}

/** The signed-in editor, or null for the public. */
export async function getEditor(): Promise<Editor | null> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;

  const store = await cookies();
  const id = await readSession(store.get(ADMIN_COOKIE)?.value, secret);
  return id ? { id, name: editorName(id) } : null;
}
