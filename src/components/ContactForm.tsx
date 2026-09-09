"use client";

import Link from "next/link";
import { useState } from "react";
import { contactProjects } from "@/data/projects";

// 16px is not a style choice: below it, iOS Safari zooms the whole page in when
// a field takes focus and never zooms back out.
//
// The smaller size is keyed to the POINTER, not the viewport width. It used to
// be `sm:` (640px and up), which meant an iPad in portrait, at 834px, got 13px
// fields and the zoom came back on the one device class most likely to hit it.
// `pointer: fine` is the actual question being asked: a mouse can read 13px
// safely, a finger cannot.
const fieldCls =
  "w-full rounded-[3px] border border-ink/25 bg-surface px-4 py-3 text-[16px] leading-[1.5] text-ink placeholder:text-faint focus:border-accent [@media(pointer:fine)]:text-[13px]";
const labelCls = "font-mono text-[10.5px] uppercase tracking-[0.14em] text-graphite";

/**
 * The projects a visitor can address a message to, derived from the central
 * registry (`src/data/projects.ts`), so adding a project lists it here too.
 */
export const CONTACT_PROJECTS = contactProjects;

/** Public by design: Web3Forms keys are meant to sit in the page. */
const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY || "";

export function ContactForm({
  defaultProject = "Futures Atlas",
}: {
  defaultProject?: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  // Which field the server rejected, so it can be marked invalid. The server
  // decides this, not the browser: it is the one that saw the whole body.
  const [badField, setBadField] = useState<"email" | "message" | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    // The form stays mounted through an error, so what was typed is still there
    // to send again. Nothing is read back out of state.
    const data = new FormData(e.currentTarget);
    setState("sending");
    setError("");
    setBadField(null);
    /*
     * Posted from the BROWSER, straight to Web3Forms, which is how the studio's
     * other site does it and the only way their free plan accepts.
     *
     * This used to POST /api/contact, which validated, rate-limited and then
     * called Web3Forms from the Vercel function. Web3Forms refuses that: their
     * free plan answers a server-side call with 403 "Use our API in client
     * side... (Pro plan is required)", whatever the site or its domain. So the
     * key is public here (NEXT_PUBLIC_), and the honeypot and the checks below
     * are a courtesy rather than a guarantee: anyone can read the key off the
     * page and post directly. That is the same deal the other site lives with,
     * and the exposure is a submission quota rather than money, since nothing
     * on this path calls a paid model. The route is still in the repo for
     * whenever this moves to a provider that welcomes server-side sending.
     */
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setState("error");
      setBadField("email");
      setError("That address doesn't look right.");
      return;
    }
    if (!message || message.length > 5000) {
      setState("error");
      setBadField("message");
      setError("Write a message before sending, up to 5000 characters.");
      return;
    }
    // the honeypot: a field no person sees, so anything in it is a bot. Answer
    // exactly as a success would, and send nothing.
    if (String(data.get("website") ?? "").trim()) {
      setSent(true);
      return;
    }
    if (!ACCESS_KEY) {
      setState("error");
      setError("The contact form is not connected on this deployment.");
      return;
    }

    const project = String(data.get("project") ?? "");
    const subject = String(data.get("subject") ?? "").trim();
    try {
      /*
       * FormData, not JSON, and that is the whole reason this works.
       *
       * A JSON body sets content-type: application/json, which is not a
       * CORS-safelisted value, so the browser sends a preflight OPTIONS first.
       * Web3Forms does not answer that preflight, so the real POST is never
       * sent and fetch rejects with a bare "Failed to fetch". FormData sends
       * multipart/form-data, which IS safelisted, so there is no preflight and
       * the request goes straight out. Do not "tidy" this into JSON.
       */
      const payload = new FormData();
      payload.append("access_key", ACCESS_KEY);
      payload.append("from_name", "Futures Atlas");
      payload.append(
        "subject",
        subject
          ? `Futures Atlas: ${subject}`
          : `Futures Atlas: a message${project ? ` about ${project}` : ""}`,
      );
      payload.append("name", String(data.get("name") ?? ""));
      payload.append("email", email);
      if (project) payload.append("project", project);
      payload.append("message", message);

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: payload,
      });
      const body = (await res.json().catch(() => null)) as { success?: boolean } | null;
      if (res.ok && body?.success) {
        setSent(true);
        return;
      }
      setState("error");
      setError("The message didn't go through. Try again in a moment.");
    } catch {
      setState("error");
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-4 border border-ink bg-panel p-[clamp(28px,4vw,44px)] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-accent-deep bg-accent-soft text-2xl text-accent-deep">
          ✓
        </span>
        <h2 className="text-[clamp(22px,2.6vw,32px)] font-extrabold leading-tight text-ink">
          Thanks, your message is in.
        </h2>
        <p className="max-w-[46ch] text-[13px] leading-[1.7] text-ink-70">
          We read everything that comes in and reply when we can. If you pitched
          a project or a collaboration, expect a slower, more considered answer.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 font-mono text-[12.5px] uppercase tracking-[0.1em] text-accent-deep hover:underline"
        >
          Back to the atlas →
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      aria-describedby={state === "error" ? "contact-error" : undefined}
      className="flex flex-col gap-5 border border-ink bg-panel p-[clamp(28px,4vw,44px)] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]"
    >
      <div>
        <p className="text-[clamp(20px,2.4vw,28px)] font-extrabold leading-tight text-ink">
          Send a message
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={labelCls}>Project</span>
        <select name="project" defaultValue={defaultProject} className={fieldCls}>
          {CONTACT_PROJECTS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelCls}>Name</span>
        <input type="text" name="name" autoComplete="name" className={fieldCls} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelCls}>Email *</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          aria-invalid={badField === "email" || undefined}
          className={fieldCls}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelCls}>Subject</span>
        <input type="text" name="subject" placeholder="A pitch, a question, a collaboration…" className={fieldCls} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelCls}>Your message</span>
        <textarea
          name="message"
          required
          rows={5}
          aria-invalid={badField === "message" || undefined}
          className={`${fieldCls} resize-y`}
        />
      </label>

      {/* The honeypot. Off screen rather than display:none, because a bot that
          skips hidden fields still fills this one. aria-hidden and tabIndex -1
          keep it out of the way of anyone actually using the form. */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* Announced on insertion (role="alert" carries aria-live), so it is not a
          permanent empty box adding a gap the design does not have. */}
      {state === "error" && (
        <p role="alert" id="contact-error" className="text-[12px] leading-[1.6] text-accent-deep">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex items-center justify-center gap-2.5 self-start rounded-[2px] bg-accent px-7 py-3.5 font-mono text-[12.5px] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-accent-press disabled:opacity-60"
      >
        {state === "sending" ? "Sending…" : <>Send <span className="text-[14px]">→</span></>}
      </button>
    </form>
  );
}
