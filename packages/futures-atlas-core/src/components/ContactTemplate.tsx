"use client";

import { useState, type ReactNode } from "react";
import { Section } from "./Section";
import { Button } from "./Button";

/** Where the form posts when the consumer does not take submission over. Every
 *  page that renders this template is served by the Atlas app, so it is the same
 *  origin as the route and a relative path is all it needs. */
const ENDPOINT = "/api/contact";

/** Data-driven contact page: header + form (-> confirmation) + optional aside.
 *  Posts to /api/contact, which mails the message on. `onSubmit` is still there
 *  for a consumer that wants to handle submission itself; passing it replaces
 *  the request rather than running alongside it. */
export function ContactTemplate({
  eyebrow = "Get in touch",
  heading,
  intro,
  aside,
  onSubmit,
  projects,
  defaultProject,
}: {
  eyebrow?: string;
  heading: string;
  intro?: string;
  aside?: ReactNode;
  onSubmit?: (data: FormData) => void;
  /** When passed, renders a Project dropdown (shared across the Atlas family). */
  projects?: string[];
  /** Which project is pre-selected (the one the visitor is inside). */
  defaultProject?: string;
}) {
  const [sent, setSent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    // Read the form before any await: React may have recycled the event by then.
    // The form stays mounted through an error, so what was typed is still there.
    const data = new FormData(e.currentTarget);
    if (onSubmit) {
      onSubmit(data);
      setSent(true);
      return;
    }
    setState("sending");
    setError("");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project: String(data.get("project") ?? ""),
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          message: String(data.get("message") ?? ""),
          website: String(data.get("website") ?? ""),
        }),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (res.ok && body?.ok) {
        setSent(true);
        return;
      }
      setState("error");
      setError(body?.message || "The message didn't go through. Try again in a moment.");
    } catch {
      setState("error");
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  return (
    <Section variant="header">
      <header style={{ maxWidth: "48rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
          <span className="fa-eyebrow">{eyebrow}</span>
          <span style={{ height: 1, flex: 1, background: "var(--hairline)" }} />
        </div>
        <h1 className="fa-t-display-l">{heading}</h1>
        {intro && (
          <p className="fa-t-body" style={{ marginTop: "var(--space-6)", maxWidth: "40ch" }}>
            {intro}
          </p>
        )}
      </header>

      <div
        style={{
          display: "grid",
          gap: "var(--space-4)",
          marginTop: "var(--space-7)",
          gridTemplateColumns: aside ? "minmax(0, 1.3fr) minmax(0, 1fr)" : "1fr",
          alignItems: "start",
        }}
      >
        {sent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", border: "var(--border-hairline) solid var(--text)", background: "var(--panel)", padding: "var(--space-card-l)" }}>
            <h2 className="fa-t-title">Thanks, your message is in.</h2>
            <p className="fa-t-body">We read everything that comes in and reply when we can.</p>
          </div>
        ) : (
          <form
            onSubmit={submit}
            aria-describedby={state === "error" ? "fa-contact-error" : undefined}
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", border: "var(--border-hairline) solid var(--text)", background: "var(--panel)", padding: "var(--space-card-l)" }}
          >
            {projects && projects.length > 0 && (
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="fa-label">Project</span>
                <select name="project" defaultValue={defaultProject ?? projects[0]} className="fa-field">
                  {projects.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="fa-label">Name</span>
                <input name="name" className="fa-field" autoComplete="name" />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="fa-label">Email</span>
                <input name="email" type="email" required className="fa-field" autoComplete="email" />
              </label>
            </div>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="fa-label">Message</span>
              <textarea name="message" required rows={5} className="fa-field" style={{ resize: "vertical" }} />
            </label>
            {/* Honeypot: nobody sees it, so anything in it came from a bot and the
                route drops the message. Off screen rather than display:none,
                because a bot that skips hidden fields still fills this one. */}
            <div aria-hidden="true" style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden", pointerEvents: "none" }}>
              <label>
                Website
                <input name="website" type="text" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            {state === "error" && (
              <p role="alert" id="fa-contact-error" className="fa-t-body" style={{ color: "var(--accent-deep)" }}>
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" className="">
              {state === "sending" ? "Sending…" : "Send →"}
            </Button>
          </form>
        )}

        {aside && <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>{aside}</div>}
      </div>
    </Section>
  );
}
