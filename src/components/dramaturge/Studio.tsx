"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Asset, BookRef, Clip, Motion, Shot, Storyboard } from "@/lib/dramaturge/types";

/**
 * The studio, in the three steps the work actually has.
 *
 *   1. COLLECT   pick the books, add any image by URL, say what the film is
 *                about. Every page is fetched and verified here.
 *   2. STORYBOARD propose a cut, then edit it by hand: order, timing, camera,
 *                and which verified sentence sits under each leaf.
 *   3. ASSETS    photograph the frames and encode the clip.
 *
 * Steps 1 and 3 run for minutes, so they run locally. The panel says so rather
 * than offering a button that would be killed halfway.
 */

const MOTIONS: Motion[] = ["hold", "push-in", "pull-out", "pan-left", "pan-right", "tilt-down"];

type LineOption = {
  id: string;
  text: string;
  page: number;
  scanned: boolean;
  book: string;
  attribution: string;
  citationLink: string;
  passageId: string;
  pageImageUrl: string | null;
  bookId: string;
};

type CollectionSummary = {
  id: string;
  label: string;
  books: string[];
  lines: number;
  passages: number;
  extraAssets: number;
  createdAt: string;
};

export function Studio() {
  const [local, setLocal] = useState(true);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/dramaturge/studio", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setLocal(Boolean(data.local));
    setCollections(data.collections ?? []);
    setStoryboards(data.storyboards ?? []);
    setClips(data.clips ?? []);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="dg dg-studio">
      {!local && (
        <p className="dg-warn">
          This is the deployed site. Collecting reads a hundred metered pages
          and a minute of film is eighteen hundred screenshots, both far past
          the function limit here, so those two steps are disabled. Run the
          studio locally with <code>npm run dev</code>.
        </p>
      )}
      {error && <p className="dg-warn dg-bad">{error}</p>}

      <Collect local={local} busy={busy} setBusy={setBusy} setError={setError} onDone={refresh} />
      <Storyboarding
        local={local}
        collections={collections}
        storyboards={storyboards}
        busy={busy}
        setBusy={setBusy}
        setError={setError}
        onDone={refresh}
      />
      <Assets
        local={local}
        storyboards={storyboards}
        clips={clips}
        busy={busy}
        setBusy={setBusy}
        setError={setError}
        onDone={refresh}
      />
    </div>
  );
}

/* ── 1. collect ─────────────────────────────────────────────────────────── */

function Collect({
  local,
  busy,
  setBusy,
  setError,
  onDone,
}: {
  local: boolean;
  busy: string | null;
  setBusy: (v: string | null) => void;
  setError: (v: string) => void;
  onDone: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookRef[]>([]);
  const [shelf, setShelf] = useState<BookRef[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [url, setUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((value: string) => {
    setQuery(value);
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    if (q.length < 2) {
      seq.current++;
      return;
    }
    const mine = ++seq.current;
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/dramaturge/books?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (mine === seq.current) setResults(data.books ?? []);
    }, 280);
  }, []);

  async function add() {
    const input = url.trim();
    if (!input) return;
    setError("");
    const res = await fetch("/api/dramaturge/resolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "could not resolve that");
    if (data.kind === "book") {
      setShelf((c) => (c.some((b) => b.bookId === data.book.bookId) ? c : [...c, data.book]));
    } else {
      setAssets((c) => (c.some((a) => a.src === data.asset.src) ? c : [...c, data.asset]));
    }
    setUrl("");
  }

  async function run() {
    setError("");
    setBusy("collect");
    try {
      const res = await fetch("/api/dramaturge/collect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bookIds: shelf.map((b) => b.bookId),
          instructions,
          assets,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "collecting failed");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "collecting failed");
    } finally {
      setBusy(null);
    }
  }

  const visible = query.trim().length < 2 ? [] : results;
  const ready = local && shelf.length >= 1 && instructions.trim().length >= 8 && !busy;

  return (
    <section className="dg-step">
      <h2 className="dg-rule-label">1 · The collection</h2>
      <div className="dg-two">
        <div>
          <input
            type="search"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search the corpus — alchemy, the sun, memory…"
            aria-label="Search the corpus"
          />
          <ul className="dg-results">
            {visible.map((book) => {
              const on = shelf.some((b) => b.bookId === book.bookId);
              return (
                <li key={book.bookId}>
                  <button
                    type="button"
                    onClick={() =>
                      setShelf((c) => (on || c.length >= 6 ? c : [...c, book]))
                    }
                    disabled={on || shelf.length >= 6}
                  >
                    <span className="dg-bk">{book.displayTitle ?? book.title}</span>
                    <span className="dg-bm">
                      {book.author} · {book.published} · {book.language}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <label htmlFor="dg-url">Or paste a URL</label>
          <div className="dg-row">
            <input
              id="dg-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void add();
                }
              }}
              placeholder="a book on sourcelibrary.org, or a direct link to an image"
            />
            <button type="button" onClick={() => void add()} disabled={!url.trim()}>
              Add
            </button>
          </div>
          <p className="dg-hint">
            A Source Library book, slug or citation link becomes a book to
            search. Any other image URL is added to the collection as an asset
            the storyboard may use directly. It has to answer as an image.
          </p>
        </div>

        <div>
          <ul className="dg-shelf">
            {shelf.map((book) => (
              <li key={book.bookId}>
                <span>
                  <span className="dg-bk">{book.displayTitle ?? book.title}</span>
                  <span className="dg-bm">
                    {book.author} · {book.published}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShelf((c) => c.filter((b) => b.bookId !== book.bookId))}
                >
                  Remove
                </button>
              </li>
            ))}
            {assets.map((asset) => (
              <li key={asset.src}>
                <span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.src} alt="" className="dg-thumb" />
                  <span className="dg-bm">{asset.credit}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAssets((c) => c.filter((a) => a.src !== asset.src))}
                >
                  Remove
                </button>
              </li>
            ))}
            {shelf.length === 0 && assets.length === 0 && (
              <li className="dg-empty">Nothing collected yet.</li>
            )}
          </ul>

          <label htmlFor="dg-inst">What is the film about</label>
          <textarea
            id="dg-inst"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Name the theme and the tone. This becomes the search terms used against each book, then goes to the storyboard unaltered."
          />

          <button className="dg-go" type="button" onClick={() => void run()} disabled={!ready}>
            {busy === "collect" ? "COLLECTING…" : "COLLECT MATERIAL"}
          </button>
          {busy === "collect" && (
            <p className="dg-hint">
              Searching each book, then fetching and verifying the pages that
              answer. This takes a few minutes and every page read is cached, so
              running it again on the same shelf costs nothing.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── 2. storyboard ──────────────────────────────────────────────────────── */

function Storyboarding({
  local,
  collections,
  storyboards,
  busy,
  setBusy,
  setError,
  onDone,
}: {
  local: boolean;
  collections: CollectionSummary[];
  storyboards: Storyboard[];
  busy: string | null;
  setBusy: (v: string | null) => void;
  setError: (v: string) => void;
  onDone: () => void;
}) {
  const [collectionId, setCollectionId] = useState("");
  const [seconds, setSeconds] = useState(45);
  const [board, setBoard] = useState<Storyboard | null>(null);
  const [lines, setLines] = useState<LineOption[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!collectionId && collections.length > 0) setCollectionId(collections[0].id);
  }, [collections, collectionId]);

  useEffect(() => {
    if (!collectionId) return;
    void fetch(`/api/dramaturge/lines?collection=${encodeURIComponent(collectionId)}`)
      .then((r) => (r.ok ? r.json() : { lines: [] }))
      .then((d) => setLines(d.lines ?? []));
  }, [collectionId]);

  async function build() {
    setError("");
    setBusy("storyboard");
    try {
      const res = await fetch("/api/dramaturge/storyboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collectionId, index: storyboards.length, seconds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "storyboarding failed");
      setBoard(data.storyboard);
      setDirty(false);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "storyboarding failed");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!board) return;
    setError("");
    setBusy("save");
    try {
      const res = await fetch("/api/dramaturge/storyboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collectionId, storyboard: board }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "the edit was refused");
      setBoard(data.storyboard);
      setDirty(false);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "the edit was refused");
    } finally {
      setBusy(null);
    }
  }

  function patch(shotId: string, next: Partial<Shot>) {
    setBoard((b) =>
      b ? { ...b, shots: b.shots.map((s) => (s.id === shotId ? { ...s, ...next } : s)) } : b,
    );
    setDirty(true);
  }

  function move(shotId: string, by: number) {
    setBoard((b) => {
      if (!b) return b;
      const i = b.shots.findIndex((s) => s.id === shotId);
      const j = i + by;
      if (i < 0 || j < 0 || j >= b.shots.length) return b;
      const shots = [...b.shots];
      [shots[i], shots[j]] = [shots[j], shots[i]];
      return { ...b, shots };
    });
    setDirty(true);
  }

  /**
   * Swapping a caption swaps the picture with it. A quotation shown over a
   * different leaf than the one it is printed on is a false claim, so the two
   * are never edited apart.
   */
  function setCaption(shotId: string, line: LineOption | null) {
    patch(shotId, {
      caption: line
        ? {
            lineId: line.id,
            text: line.text,
            citationLink: line.citationLink,
            attribution: line.attribution,
          }
        : null,
      asset:
        line && line.pageImageUrl
          ? {
              kind: "leaf",
              passageId: line.passageId,
              bookId: line.bookId,
              page: line.page,
              src: line.pageImageUrl,
              credit: line.attribution,
            }
          : { kind: "url", src: "", credit: line?.attribution ?? "" },
    });
    setEditing(null);
  }

  const total = board ? board.shots.reduce((n, s) => n + s.durationMs, 0) : 0;

  return (
    <section className="dg-step">
      <h2 className="dg-rule-label">2 · The storyboard</h2>
      {collections.length === 0 ? (
        <p className="dg-empty">Collect some material first.</p>
      ) : (
        <>
          <div className="dg-row">
            <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} — {c.lines} lines
                </option>
              ))}
            </select>
            <label className="dg-inline">
              about
              <input
                type="number"
                min={15}
                max={180}
                value={seconds}
                onChange={(e) => setSeconds(Number(e.target.value))}
              />
              seconds
            </label>
            <button type="button" onClick={() => void build()} disabled={!local || Boolean(busy)}>
              {busy === "storyboard" ? "BUILDING…" : "BUILD STORYBOARD"}
            </button>
            {board && dirty && (
              <button type="button" className="dg-go dg-inline-go" onClick={() => void save()}>
                {busy === "save" ? "SAVING…" : "SAVE EDIT"}
              </button>
            )}
          </div>

          {board && (
            <>
              <p className="dg-hint">
                {board.title} · {board.shots.length} shots ·{" "}
                {(total / 1000).toFixed(1)}s
                {board.editedAt ? " · edited by hand" : ""}
              </p>
              <ol className="dg-shots">
                {board.shots.map((shot, i) => (
                  <li key={shot.id}>
                    <div className="dg-shot-plate">
                      {shot.asset.src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={shot.asset.src} alt="" />
                      ) : (
                        <span className="dg-noscan">no scan</span>
                      )}
                      <span className="dg-shot-n">{i + 1}</span>
                    </div>
                    <div className="dg-shot-body">
                      {shot.titleCard && <p className="dg-card">{shot.titleCard}</p>}
                      {shot.caption ? (
                        <>
                          <p className="dg-quote">&ldquo;{shot.caption.text}&rdquo;</p>
                          <p className="dg-bm">{shot.caption.attribution}</p>
                        </>
                      ) : (
                        !shot.titleCard && <p className="dg-bm">silent shot</p>
                      )}
                      {shot.note && <p className="dg-bm dg-note">{shot.note}</p>}

                      <div className="dg-controls">
                        <select
                          value={shot.motion}
                          onChange={(e) => patch(shot.id, { motion: e.target.value as Motion })}
                          aria-label="Camera move"
                        >
                          {MOTIONS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1000}
                          max={12000}
                          step={200}
                          value={shot.durationMs}
                          onChange={(e) =>
                            patch(shot.id, { durationMs: Number(e.target.value) })
                          }
                          aria-label="Duration in milliseconds"
                        />
                        <button type="button" onClick={() => move(shot.id, -1)}>
                          ↑
                        </button>
                        <button type="button" onClick={() => move(shot.id, 1)}>
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(editing === shot.id ? null : shot.id)}
                        >
                          {shot.caption ? "change quotation" : "add quotation"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBoard((b) =>
                              b ? { ...b, shots: b.shots.filter((s) => s.id !== shot.id) } : b,
                            );
                            setDirty(true);
                          }}
                        >
                          delete
                        </button>
                      </div>

                      {editing === shot.id && (
                        <div className="dg-picker">
                          <button type="button" onClick={() => setCaption(shot.id, null)}>
                            no quotation
                          </button>
                          <ul>
                            {lines.slice(0, 80).map((line) => (
                              <li key={line.id}>
                                <button type="button" onClick={() => setCaption(shot.id, line)}>
                                  <span className="dg-quote">{line.text}</span>
                                  <span className="dg-bm">
                                    {line.book} · p. {line.page}
                                    {line.scanned ? "" : " · no scan"}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </>
      )}
    </section>
  );
}

/* ── 3. assets ──────────────────────────────────────────────────────────── */

function Assets({
  local,
  storyboards,
  clips,
  busy,
  setBusy,
  setError,
  onDone,
}: {
  local: boolean;
  storyboards: Storyboard[];
  clips: Clip[];
  busy: string | null;
  setBusy: (v: string | null) => void;
  setError: (v: string) => void;
  onDone: () => void;
}) {
  const [scale, setScale] = useState(0.5);

  async function render(board: Storyboard) {
    setError("");
    setBusy(`render:${board.id}`);
    try {
      const res = await fetch("/api/dramaturge/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          storyboardId: board.id,
          collectionId: board.id.replace(/-\d+$/, ""),
          scale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "rendering failed");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "rendering failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="dg-step">
      <h2 className="dg-rule-label">3 · The assets</h2>
      {storyboards.length === 0 ? (
        <p className="dg-empty">Build a storyboard first.</p>
      ) : (
        <>
          <div className="dg-row">
            <label className="dg-inline">
              render at
              <select value={scale} onChange={(e) => setScale(Number(e.target.value))}>
                <option value={0.25}>quarter — a fast proof</option>
                <option value={0.5}>half</option>
                <option value={1}>full 1920×1080</option>
              </select>
            </label>
          </div>
          <ul className="dg-shelf">
            {storyboards.map((board) => {
              const clip = clips.find((c) => c.storyboardId === board.id);
              const seconds =
                board.shots.reduce((n, s) => n + s.durationMs, 0) / 1000;
              return (
                <li key={board.id}>
                  <span>
                    <span className="dg-bk">{board.title}</span>
                    <span className="dg-bm">
                      {board.shots.length} shots · {seconds.toFixed(0)}s ·{" "}
                      {Math.round(seconds * board.fps)} frames to photograph
                      {clip ? ` · rendered ${clip.width}×${clip.height}` : ""}
                    </span>
                    {clip && (
                      <video
                        controls
                        playsInline
                        preload="metadata"
                        className="dg-preview"
                        src={clip.file}
                      />
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => void render(board)}
                    disabled={!local || Boolean(busy)}
                  >
                    {busy === `render:${board.id}`
                      ? "RENDERING…"
                      : clip
                        ? "RE-RENDER"
                        : "CREATE ASSETS"}
                  </button>
                </li>
              );
            })}
          </ul>
          {busy?.startsWith("render") && (
            <p className="dg-hint">
              Photographing the frames one at a time. Nothing advances until a
              frame is taken, so a slow scan cannot drop a frame and two renders
              of the same storyboard produce the same file. Expect a few minutes
              a minute of film.
            </p>
          )}
        </>
      )}
    </section>
  );
}
