"use client";

/*
 * The Style Guide — the canonical control panel for the design system.
 * Renders every editable token with a live control + a showcase of the kit.
 * Edits apply instantly (live CSS var) AND persist to the store via the API,
 * so the change appears across the whole site for everyone on next load.
 *
 * Auth: the consuming app must put /style-guide and POST /api/tokens behind
 * auth (Basic-auth middleware). The browser then auto-attaches credentials to
 * the POSTs below.
 */

import { useEffect, useRef, useState } from "react";
import { GROUPS, TOKENS, tokenById, type TokenDef } from "../tokens";
import { applyOverrides, type Overrides } from "../runtime";

interface VersionMeta {
  id: string;
  label: string;
  ts: number;
}

const ENDPOINT = "/api/tokens";

// numeric default for a px control (clamp -> its max; "1500px" -> 1500)
function numDefault(def: string): number {
  const pxs = [...def.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => parseFloat(m[1]));
  if (pxs.length) return pxs[pxs.length - 1];
  const n = parseFloat(def);
  return isNaN(n) ? 0 : n;
}
const isHex = (v: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim());

export function StyleGuide({ extraShowcase }: { extraShowcase?: React.ReactNode } = {}) {
  const [overrides, setOverrides] = useState<Overrides>({});
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [loaded, setLoaded] = useState(false);
  const [versions, setVersions] = useState<VersionMeta[]>([]);
  const [vLabel, setVLabel] = useState("");
  const hist = useRef<{ stack: Overrides[]; i: number }>({ stack: [{}], i: 0 });
  const replaceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // load saved overrides + versions
  useEffect(() => {
    fetch(ENDPOINT, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { overrides: {}, versions: [] }))
      .then((d) => {
        const o = (d.overrides ?? {}) as Overrides;
        setOverrides(o);
        applyOverrides(o);
        setVersions(d.versions ?? []);
        hist.current = { stack: [o], i: 0 };
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // reflect the colour-mode switch on the real document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  function persistReplace(next: Overrides, immediate = false) {
    clearTimeout(replaceTimer.current);
    const send = () =>
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "replace", overrides: next }),
      }).catch(() => {});
    if (immediate) send();
    else replaceTimer.current = setTimeout(send, 350);
  }

  // apply live + record in the session history + persist the whole set
  function commit(next: Overrides, opts: { persist?: boolean; immediate?: boolean } = {}) {
    applyOverrides(next);
    setOverrides(next);
    const h = hist.current;
    h.stack = h.stack.slice(0, h.i + 1);
    h.stack.push(next);
    h.i = h.stack.length - 1;
    if (opts.persist !== false) persistReplace(next, opts.immediate);
  }

  function setToken(id: string, value: string) {
    commit({ ...overrides, [id]: value });
  }
  function resetToken(id: string) {
    const n = { ...overrides };
    delete n[id];
    commit(n);
  }
  function resetAll() {
    commit({}, { immediate: true });
  }

  function step(dir: -1 | 1) {
    const h = hist.current;
    const ni = h.i + dir;
    if (ni < 0 || ni > h.stack.length - 1) return;
    h.i = ni;
    const ov = h.stack[ni];
    applyOverrides(ov);
    setOverrides(ov);
    persistReplace(ov, true);
  }

  async function saveVersion() {
    const label = vLabel.trim() || `Version ${versions.length + 1}`;
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "snapshot", label }),
    })
      .then((x) => x.json())
      .catch(() => null);
    if (r?.version) setVersions((v) => [r.version, ...v]);
    setVLabel("");
  }
  async function restoreVersion(id: string) {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore", id }),
    })
      .then((x) => x.json())
      .catch(() => null);
    if (r?.overrides != null) commit(r.overrides as Overrides, { persist: false });
  }
  async function removeVersion(id: string) {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteVersion", id }),
    }).catch(() => {});
    setVersions((v) => v.filter((x) => x.id !== id));
  }

  const colourGroup = TOKENS.filter((t) => t.group === "Colour");
  const visibleColours = colourGroup.filter((t) => (t.mode ?? mode) === mode);
  const changeCount = Object.keys(overrides).length;
  const canUndo = hist.current.i > 0;
  const canRedo = hist.current.i < hist.current.stack.length - 1;

  return (
    <div style={{ display: "grid", gap: "var(--space-gap-l)", gridTemplateColumns: "minmax(0, 360px) minmax(0, 1fr)", alignItems: "start" }} className="fa-sg">
      {/* ---------- controls ---------- */}
      <aside style={{ position: "sticky", top: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-6)", maxHeight: "calc(100vh - 40px)", overflowY: "auto", paddingRight: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
          <span className="fa-eyebrow">Style panel</span>
          <button className="fa-btn fa-btn--ghost" style={{ padding: "8px 12px" }} onClick={resetAll}>
            Reset all
          </button>
        </div>
        {!loaded && <p className="fa-t-label">Loading…</p>}

        {/* ---------- history + versions ---------- */}
        <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", borderTop: "var(--border-hairline) solid var(--hairline)", paddingTop: "var(--space-4)" }}>
          <h3 className="fa-t-label" style={{ color: "var(--accent-deep)" }}>History</h3>

          <div style={{ display: "flex", gap: 6 }}>
            <button className="fa-btn fa-btn--ghost" disabled={!canUndo} onClick={() => step(-1)} style={{ padding: "8px 12px", opacity: canUndo ? 1 : 0.4 }}>
              ↶ Undo
            </button>
            <button className="fa-btn fa-btn--ghost" disabled={!canRedo} onClick={() => step(1)} style={{ padding: "8px 12px", opacity: canRedo ? 1 : 0.4 }}>
              Redo ↷
            </button>
          </div>

          <span className="fa-t-label" style={{ color: "var(--muted)" }}>
            {changeCount} change{changeCount === 1 ? "" : "s"} from default
          </span>
          {changeCount > 0 && (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 3, maxHeight: 150, overflowY: "auto" }}>
              {Object.entries(overrides).map(([id, val]) => {
                const def = tokenById(id);
                return (
                  <li key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)" }}>
                    <span style={{ minWidth: 0, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {def?.label ?? id}
                      {def?.mode === "dark" ? " (dark)" : ""}: <span style={{ color: "var(--muted)" }}>{val}</span>
                    </span>
                    <button onClick={() => resetToken(id)} title="reset this token" style={{ flex: "0 0 auto", background: "none", border: "none", color: "var(--faint)", cursor: "pointer" }}>
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <span className="fa-t-label" style={{ color: "var(--muted)", marginTop: "var(--space-2)" }}>Saved versions</span>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={vLabel} onChange={(e) => setVLabel(e.target.value)} placeholder="name this version" className="fa-field" style={{ padding: "6px 8px", fontSize: "var(--text-micro)" }} />
            <button className="fa-btn fa-btn--primary" onClick={saveVersion} style={{ padding: "8px 12px", boxShadow: "none", flex: "0 0 auto" }}>
              Save
            </button>
          </div>
          {versions.length > 0 && (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              {versions.map((v) => (
                <li key={v.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, border: "var(--border-hairline) solid var(--hairline)", borderRadius: "var(--radius)", padding: "6px 8px" }}>
                  <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--faint)" }}>{new Date(v.ts).toLocaleString()}</span>
                  </span>
                  <span style={{ display: "flex", gap: 6, flex: "0 0 auto" }}>
                    <button onClick={() => restoreVersion(v.id)} className="fa-t-label" style={{ background: "none", border: "none", color: "var(--accent-deep)", cursor: "pointer" }}>
                      restore
                    </button>
                    <button onClick={() => removeVersion(v.id)} title="delete" style={{ background: "none", border: "none", color: "var(--faint)", cursor: "pointer" }}>
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {GROUPS.map((g) => {
          if (g === "Colour") {
            return (
              <Group key={g} title="Colour">
                <div style={{ display: "inline-flex", border: "var(--border-hairline) solid var(--text)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: "var(--space-3)" }}>
                  {(["light", "dark"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className="fa-t-label"
                      style={{ padding: "6px 12px", background: mode === m ? "var(--accent)" : "transparent", color: mode === m ? "var(--paper)" : "var(--muted)", border: "none", cursor: "pointer" }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                {visibleColours.map((t) => (
                  <ColorControl key={t.id} t={t} value={overrides[t.id]} onSet={setToken} onReset={resetToken} />
                ))}
              </Group>
            );
          }
          const items = TOKENS.filter((t) => t.group === g);
          if (!items.length) return null;
          return (
            <Group key={g} title={g}>
              {items.map((t) =>
                t.control === "font" ? (
                  <FontControl key={t.id} t={t} value={overrides[t.id]} onSet={setToken} onReset={resetToken} />
                ) : (
                  <PxControl key={t.id} t={t} value={overrides[t.id]} onSet={setToken} onReset={resetToken} />
                ),
              )}
            </Group>
          );
        })}
      </aside>

      {/* ---------- live showcase ---------- */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-gap-l)", minWidth: 0 }}>
        {extraShowcase && (
          <div>
            <span className="fa-eyebrow">This site&rsquo;s components</span>
            <div style={{ marginTop: "var(--space-4)" }}>{extraShowcase}</div>
          </div>
        )}
        <Showcase />
      </div>
    </div>
  );
}

/* ---------- controls ---------- */

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", borderTop: "var(--border-hairline) solid var(--hairline)", paddingTop: "var(--space-4)" }}>
      <h3 className="fa-t-label" style={{ color: "var(--accent-deep)" }}>{title}</h3>
      {children}
    </section>
  );
}

function Row({ t, onReset, edited, children }: { t: TokenDef; onReset: (id: string) => void; edited: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span className="fa-t-label" style={{ color: edited ? "var(--accent-deep)" : "var(--muted)" }}>
          {t.label}
          {edited ? " •" : ""}
        </span>
        {edited && (
          <button onClick={() => onReset(t.id)} className="fa-t-label" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--faint)", textTransform: "none", letterSpacing: 0 }}>
            reset
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function ColorControl({ t, value, onSet, onReset }: { t: TokenDef; value?: string; onSet: (id: string, v: string) => void; onReset: (id: string) => void }) {
  const current = value ?? t.default;
  return (
    <Row t={t} onReset={onReset} edited={value != null}>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {/* swatch shows the REAL colour (oklch/hex/any css colour) + opens the picker */}
        <label
          style={{
            position: "relative",
            width: 34,
            height: 30,
            flex: "0 0 auto",
            borderRadius: "var(--radius)",
            border: "var(--border-hairline) solid var(--hairline)",
            background: current,
            cursor: "pointer",
            overflow: "hidden",
          }}
          title="Pick a colour"
        >
          <input
            type="color"
            value={isHex(current) ? current : "#000000"}
            onChange={(e) => onSet(t.id, e.target.value)}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", border: "none" }}
          />
        </label>
        <input
          type="text"
          value={current}
          onChange={(e) => onSet(t.id, e.target.value)}
          className="fa-field"
          style={{ padding: "6px 8px", fontSize: "var(--text-micro)" }}
        />
      </div>
    </Row>
  );
}

function FontControl({ t, value, onSet, onReset }: { t: TokenDef; value?: string; onSet: (id: string, v: string) => void; onReset: (id: string) => void }) {
  const current = value ?? t.default;
  return (
    <Row t={t} onReset={onReset} edited={value != null}>
      <select value={current} onChange={(e) => onSet(t.id, e.target.value)} className="fa-field" style={{ padding: "7px 8px" }}>
        {t.options?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Row>
  );
}

function PxControl({ t, value, onSet, onReset }: { t: TokenDef; value?: string; onSet: (id: string, v: string) => void; onReset: (id: string) => void }) {
  const n = value != null ? parseFloat(value) : numDefault(t.default);
  return (
    <Row t={t} onReset={onReset} edited={value != null}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="range"
          min={t.min}
          max={t.max}
          step={t.step ?? 1}
          value={n}
          onChange={(e) => onSet(t.id, `${e.target.value}px`)}
          style={{ flex: 1, accentColor: "var(--accent)" }}
        />
        <input
          type="number"
          min={t.min}
          max={t.max}
          step={t.step ?? 1}
          value={n}
          onChange={(e) => onSet(t.id, `${e.target.value}px`)}
          className="fa-field"
          style={{ width: 64, padding: "5px 7px", fontSize: "var(--text-micro)" }}
        />
      </div>
    </Row>
  );
}

/* ---------- showcase ---------- */

function Showcase() {
  const sizes = [
    ["fa-t-display-xl", "Display XL"],
    ["fa-t-display-l", "Display L"],
    ["fa-t-display-m", "Display M"],
    ["fa-t-display-s", "Display S"],
    ["fa-t-title", "Title"],
    ["fa-t-title-s", "Title S"],
    ["fa-t-lead", "Lead — the quieter intro voice"],
    ["fa-t-body", "Body — running paragraph text in the mono register, the default the site reads in."],
  ];
  return (
    <>
      <div>
        <span className="fa-eyebrow">Type scale</span>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
          {sizes.map(([cls, label]) => (
            <div key={cls} className={cls} style={{ borderBottom: "var(--border-hairline) solid var(--hairline)", paddingBottom: "var(--space-2)" }}>
              {label}
            </div>
          ))}
          <div className="fa-t-stat">123</div>
          <p className="fa-voice" style={{ fontSize: "var(--text-title)" }}>“The correspondence voice, in serif italic.”</p>
        </div>
      </div>

      <div>
        <span className="fa-eyebrow">Buttons</span>
        <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)", flexWrap: "wrap" }}>
          <span className="fa-btn fa-btn--primary">Primary →</span>
          <span className="fa-btn fa-btn--ghost">Ghost</span>
        </div>
      </div>

      <div>
        <span className="fa-eyebrow">Cards</span>
        <div style={{ display: "grid", gap: "var(--space-5)", marginTop: "var(--space-4)", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%,260px),1fr))" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="fa-card">
              <div className="fa-hatch" style={{ aspectRatio: "16/10", borderBottom: "var(--border-hairline) solid var(--text)" }} />
              <div className="fa-card__body">
                <span className="fa-card__meta" style={{ marginBottom: "var(--space-3)" }}>Source · 2026</span>
                <h3 className="fa-card__title">A sample card title</h3>
                <p className="fa-t-body" style={{ marginTop: "var(--space-3)" }}>How the card body reads at the current tokens.</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fa-section--band" style={{ padding: "var(--space-card-l)" }}>
        <span className="fa-eyebrow" style={{ color: "var(--paper)" }}>Band</span>
        <p className="fa-t-title" style={{ color: "var(--paper)", marginTop: "var(--space-3)" }}>
          A dark feature band — light text on the band colour.
        </p>
      </div>
    </>
  );
}
