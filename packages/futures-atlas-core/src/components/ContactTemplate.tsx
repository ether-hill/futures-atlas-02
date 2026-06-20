"use client";

import { useState, type ReactNode } from "react";
import { Section } from "./Section";
import { Button } from "./Button";

/** Data-driven contact page: header + form (-> confirmation) + optional aside.
 *  Submission is local-only (no backend) — wire `onSubmit` in the consumer. */
export function ContactTemplate({
  eyebrow = "Get in touch",
  heading,
  intro,
  aside,
  onSubmit,
}: {
  eyebrow?: string;
  heading: string;
  intro?: string;
  aside?: ReactNode;
  onSubmit?: (data: FormData) => void;
}) {
  const [sent, setSent] = useState(false);

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
            <h2 className="fa-t-title">Thanks — your message is in.</h2>
            <p className="fa-t-body">We read everything that comes in and reply when we can.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit?.(new FormData(e.currentTarget));
              setSent(true);
            }}
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", border: "var(--border-hairline) solid var(--text)", background: "var(--panel)", padding: "var(--space-card-l)" }}
          >
            <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="fa-label">Name</span>
                <input name="name" className="fa-field" autoComplete="name" />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="fa-label">Email</span>
                <input name="email" type="email" className="fa-field" autoComplete="email" />
              </label>
            </div>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="fa-label">Message</span>
              <textarea name="message" required rows={5} className="fa-field" style={{ resize: "vertical" }} />
            </label>
            <Button type="submit" variant="primary" className="">
              Send →
            </Button>
          </form>
        )}

        {aside && <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>{aside}</div>}
      </div>
    </Section>
  );
}
