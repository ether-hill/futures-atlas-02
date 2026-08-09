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

/** The signed-in editor, or null for the public. */
export async function getEditor(): Promise<Editor | null> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;

  const store = await cookies();
  const id = await readSession(store.get(ADMIN_COOKIE)?.value, secret);
  return id ? { id, name: editorName(id) } : null;
}
