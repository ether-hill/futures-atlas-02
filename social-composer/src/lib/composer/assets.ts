/**
 * IndexedDB-backed store for uploaded library assets (image / video blobs) so
 * the library survives a page refresh. Object URLs are recreated on load —
 * blob: URLs themselves don't persist, but the underlying file does.
 */

const DB_NAME = "social-composer";
const STORE = "assets";
const VERSION = 1;

export type StoredAsset = {
  id: string;
  kind: "gallery" | "video";
  label: string;
  headline: string;
  sub: string;
  ts: number;
  blob: Blob;
};

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    let req: IDBOpenDBRequest;
    try { req = indexedDB.open(DB_NAME, VERSION); } catch { return resolve(null); }
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return openDb().then((db) => {
    if (!db) return null;
    return new Promise<T | null>((resolve) => {
      let result: T | null = null;
      const t = db.transaction(STORE, mode);
      const r = run(t.objectStore(STORE));
      r.onsuccess = () => { result = r.result; };
      t.oncomplete = () => { db.close(); resolve(result); };
      t.onerror = () => { db.close(); resolve(null); };
      t.onabort = () => { db.close(); resolve(null); };
    });
  });
}

export function saveAsset(a: StoredAsset): Promise<unknown> {
  return tx("readwrite", (s) => s.put(a));
}

export function deleteAsset(id: string): Promise<unknown> {
  return tx("readwrite", (s) => s.delete(id));
}

export async function loadAssets(): Promise<StoredAsset[]> {
  const all = (await tx<StoredAsset[]>("readonly", (s) => s.getAll() as IDBRequest<StoredAsset[]>)) ?? [];
  // Newest first, matching the upload prepend order.
  return all.sort((a, b) => b.ts - a.ts);
}
