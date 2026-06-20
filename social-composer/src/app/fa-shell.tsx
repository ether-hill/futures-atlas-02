"use client";

/**
 * The one standard global nav (black bar), shared with the Atlas home and every
 * project. Left: white brand mark + "Futures Atlas" + the project breadcrumb
 * dropdown. Right: Home / Projects / About / Contact + the theme toggle. All
 * links are raw <a> so they ignore basePath and resolve against the Atlas root.
 */
import { useEffect, useRef, useState } from "react";
import { FA_HOME, FA_PROJECTS, FA_CURRENT_PATH, FA_CURRENT_NAME } from "./fa-projects";

const LINKS = [
  { name: "Home", path: "/" },
  { name: "Projects", path: "/#projects" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

export function FaShell() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      setDark(document.documentElement.classList.contains("dark"));
    } catch {}
    let lastY = window.scrollY;
    const onScroll = () => {
      const el = headerRef.current;
      if (!el) return;
      const y = window.scrollY;
      if (y > lastY && y > 90) el.classList.add("is-hidden");
      else el.classList.remove("is-hidden");
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  };

  return (
    <header className="fa-shell" ref={headerRef}>
      <div className="fa-shell__left">
        <a className="fa-shell__home" href={FA_HOME} aria-label="Futures Atlas home">
          <span className="fa-shell__mark" aria-hidden="true"><FaMark /></span>
          <span className="fa-shell__word">Futures Atlas</span>
        </a>

        <span className="fa-shell__sep" aria-hidden="true">/</span>

        <div className="fa-shell__crumb" ref={wrap}>
          <button
            type="button"
            className="fa-shell__current"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`Current project: ${FA_CURRENT_NAME}. Switch project`}
            onClick={() => setOpen((o) => !o)}
          >
            <span>{FA_CURRENT_NAME}</span>
            <span className="fa-shell__chev" aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </span>
          </button>

          {open && (
            <div className="fa-shell__menu" role="menu" aria-label="Switch project">
              {FA_PROJECTS.map((p) => {
                const current = p.path === FA_CURRENT_PATH;
                return (
                  <a
                    key={p.path}
                    role="menuitem"
                    href={p.path}
                    className={`fa-shell__item${current ? " is-current" : ""}`}
                    aria-current={current ? "true" : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {p.name}
                  </a>
                );
              })}
              <span className="fa-shell__menusep" />
              <a role="menuitem" href={FA_HOME} className="fa-shell__item fa-shell__item--accent" onClick={() => setOpen(false)}>
                View all projects →
              </a>
            </div>
          )}
        </div>
      </div>

      <nav className="fa-shell__right" aria-label="Primary">
        <div className="fa-shell__nav">
          {LINKS.map((l) => (
            <a key={l.path} className="fa-shell__navlink" href={l.path}>{l.name}</a>
          ))}
        </div>
        <button type="button" className="fa-shell__toggle" aria-label="Toggle theme" onClick={toggleTheme}>
          {!dark ? (
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M16 11.2A6.2 6.2 0 1 1 8.8 4a4.8 4.8 0 0 0 7.2 7.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3.6" stroke="currentColor" strokeWidth="1.5" /><path d="M10 2.2v2M10 15.8v2M2.2 10h2M15.8 10h2M4.6 4.6l1.4 1.4M14 14l1.4 1.4M15.4 4.6L14 6M6 14l-1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          )}
        </button>
      </nav>
    </header>
  );
}

/** Futures Atlas brand mark (public/fa.svg). Black artwork on transparent;
 *  invert(1) → white on the black bar. ~1em tall to match the wordmark. */
function FaMark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/social-composer/fa.svg"
      alt=""
      aria-hidden="true"
      style={{ display: "block", height: "20px", width: "auto" }}
    />
  );
}
