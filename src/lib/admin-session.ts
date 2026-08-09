/**
 * Signed session cookie for signed-in editors (the /admin area, the /editor
 * overview, and the draft projects).
 *
 * Uses Web Crypto (HMAC-SHA256) rather than node:crypto so the same helpers run
 * in Edge middleware and in the Node route handler. The cookie carries no
 * secrets, only an expiry and the editor's id, authenticated by the signature, * so a tampered, expired or renamed value simply fails verification.
 *
 * Format: `<expiryMillis>.<editorId>.<base64url(hmac)>`
 */

export const ADMIN_COOKIE = "fa_admin";
/** Readable (non-httpOnly) companion flag: lets the static nav bundle know an
 *  editor is signed in so it can list drafts. It grants nothing on its own, *  every draft URL is still checked against the signed cookie above. */
export const EDITOR_FLAG_COOKIE = "fa_editor";
export const ADMIN_MAX_AGE = 12 * 60 * 60; // 12 hours, in seconds

function b64url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

/** Constant-time string compare (both are hex/base64 digests of equal length). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Mint a cookie value for `editorId`, valid for ADMIN_MAX_AGE from now. */
export async function createSession(
  editorId: string,
  secret: string,
  now = Date.now(),
): Promise<string> {
  const exp = now + ADMIN_MAX_AGE * 1000;
  const payload = `${exp}.${editorId}`;
  return `${payload}.${await sign(payload, secret)}`;
}

/**
 * The signed-in editor's id, or null if the value is missing, malformed,
 * expired or not correctly signed.
 */
export async function readSession(
  value: string | undefined,
  secret: string,
  now = Date.now(),
): Promise<string | null> {
  if (!value) return null;

  const lastDot = value.lastIndexOf(".");
  if (lastDot < 1) return null;

  const payload = value.slice(0, lastDot);
  const sig = value.slice(lastDot + 1);

  const firstDot = payload.indexOf(".");
  if (firstDot < 1) return null;

  const exp = payload.slice(0, firstDot);
  const editorId = payload.slice(firstDot + 1);
  if (!/^\d+$/.test(exp) || !editorId) return null;
  if (Number(exp) <= now) return null;

  return safeEqual(sig, await sign(payload, secret)) ? editorId : null;
}

/**
 * Only ever redirect back to a path on this site, never to an
 * attacker-supplied absolute URL or protocol-relative `//host` path. Any
 * internal path is allowed (an editor may be sent back to a draft project as
 * well as to /admin), so this normalises rather than prefix-matches.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return ADMIN_HOME;
  // Encoded separators survive URL normalisation, so reject them outright.
  if (/%2f|%5c|\\/i.test(next)) return ADMIN_HOME;

  // Normalise first: "/admin/../../evil" passes a naive check but resolves
  // elsewhere. Validate what the browser will actually navigate to.
  let url: URL;
  try {
    url = new URL(next, "https://x.invalid");
  } catch {
    return ADMIN_HOME;
  }

  // Same-origin by construction after normalisation; keep the query string so a
  // deep link survives the sign-in round trip.
  return url.pathname.startsWith("/") && !url.pathname.startsWith("//")
    ? `${url.pathname}${url.search}`
    : ADMIN_HOME;
}

/** Where a bare sign-in lands: the editor's own overview of the atlas. */
export const ADMIN_HOME = "/editor";
