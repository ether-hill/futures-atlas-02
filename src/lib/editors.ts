/**
 * Who may sign in.
 *
 * Accounts come from one env var so adding or removing an editor never needs a
 * code change:
 *
 *   EDITOR_USERS="laura:futurelaura,mike:futuremike"
 *
 * Each entry is `id:password` (optionally `id:password:Display Name`). The id is
 * what the session cookie carries and what the editor bar shows; the password is
 * all anyone types, it identifies the person as well as authenticating them, so
 * there is no username field to remember.
 *
 * Fail-closed: with no accounts configured, nothing unlocks. `ADMIN_PASSWORD`
 * still works as a single "admin" account so the existing /admin deployment keeps
 * running if EDITOR_USERS is not set.
 *
 * Edge-safe, plain string work, no node: imports (the middleware reads names
 * from here too).
 */

export interface EditorAccount {
  id: string;
  name: string;
  password: string;
}

function titleCase(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

/** Parse the env format above. Malformed or empty entries are skipped, not guessed at. */
export function parseEditors(raw: string | undefined): EditorAccount[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const [id, password, name] = entry.split(":").map((s) => s.trim());
      if (!id || !password) return [];
      return [{ id, name: name || titleCase(id), password }];
    });
}

/** The configured accounts, EDITOR_USERS first, ADMIN_PASSWORD as the fallback. */
export function editorAccounts(): EditorAccount[] {
  const configured = parseEditors(process.env.EDITOR_USERS);
  if (configured.length) return configured;

  const legacy = process.env.ADMIN_PASSWORD;
  return legacy ? [{ id: "admin", name: "Admin", password: legacy }] : [];
}

/** Display name for a session's user id (falls back to the id itself). */
export function editorName(id: string): string {
  return editorAccounts().find((e) => e.id === id)?.name ?? titleCase(id);
}
