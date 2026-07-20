/**
 * Signed session cookie for the internal /admin area.
 *
 * Uses Web Crypto (HMAC-SHA256) rather than node:crypto so the same helpers run
 * in Edge middleware and in the Node route handler. The cookie carries no
 * secrets — only an expiry, authenticated by the signature — so a tampered or
 * expired value simply fails verification.
 *
 * Format: `<expiryMillis>.<base64url(hmac)>`
 */

export const ADMIN_COOKIE = "fa_admin";
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

/** Mint a cookie value valid for ADMIN_MAX_AGE from now. */
export async function createSession(secret: string, now = Date.now()): Promise<string> {
  const exp = now + ADMIN_MAX_AGE * 1000;
  return `${exp}.${await sign(String(exp), secret)}`;
}

/** True only if the value is well-formed, correctly signed, and unexpired. */
export async function verifySession(
  value: string | undefined,
  secret: string,
  now = Date.now(),
): Promise<boolean> {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot < 1) return false;

  const exp = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!/^\d+$/.test(exp)) return false;
  if (Number(exp) <= now) return false;

  return safeEqual(sig, await sign(exp, secret));
}

/**
 * Only ever redirect back to an internal /admin path — never to an
 * attacker-supplied absolute URL or protocol-relative `//host` path.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return ADMIN_HOME;
  // Encoded separators survive URL normalisation, so reject them outright.
  if (/%2f|%5c|\\/i.test(next)) return ADMIN_HOME;

  // Normalise first: "/admin/../../evil" passes a naive prefix check but
  // resolves to "/evil". Validate what the browser will actually navigate to.
  let path: string;
  try {
    path = new URL(next, "https://x.invalid").pathname;
  } catch {
    return ADMIN_HOME;
  }

  return path.startsWith("/admin/") ? path : ADMIN_HOME;
}

export const ADMIN_HOME = "/admin/presentation/cqs-phase1-phase2";
