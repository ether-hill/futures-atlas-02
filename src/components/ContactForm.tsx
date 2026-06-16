"use client";

import Link from "next/link";
import { useState } from "react";

const fieldCls =
  "w-full rounded-[3px] border border-ink/25 bg-surface px-4 py-3 font-mono text-[13px] leading-[1.5] text-ink placeholder:text-faint focus:border-accent";
const labelCls = "font-mono text-[10.5px] uppercase tracking-[0.14em] text-graphite";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-4 border border-ink bg-panel p-[clamp(28px,4vw,44px)]">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-accent-deep bg-accent-soft text-2xl text-accent-deep">
          ✓
        </span>
        <h2 className="text-[clamp(22px,2.6vw,32px)] font-extrabold leading-tight text-ink">
          Thanks — your message is in.
        </h2>
        <p className="max-w-[46ch] font-mono text-[13px] leading-[1.7] text-ink-70">
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
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="flex flex-col gap-5 border border-ink bg-panel p-[clamp(28px,4vw,44px)]"
    >
      <div>
        <p className="text-[clamp(20px,2.4vw,28px)] font-extrabold leading-tight text-ink">
          Send a message
        </p>
        <p className="mt-2 font-mono text-[12px] leading-[1.6] text-graphite">
          Everything is optional except the message. Tell us what you&rsquo;re
          working on, or what you&rsquo;d like to see in the atlas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Name</span>
          <input type="text" autoComplete="name" className={fieldCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Email</span>
          <input type="email" autoComplete="email" className={fieldCls} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={labelCls}>Subject</span>
        <input type="text" placeholder="A pitch, a question, a collaboration…" className={fieldCls} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelCls}>Your message</span>
        <textarea required rows={5} className={`${fieldCls} resize-y`} />
      </label>

      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2.5 self-start rounded-[2px] bg-accent px-7 py-3.5 font-mono text-[12.5px] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-accent-deep"
      >
        Send <span className="text-[14px]">→</span>
      </button>
    </form>
  );
}
