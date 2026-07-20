import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { ADMIN_HOME, safeNext } from "@/lib/admin-session";

export const metadata: Metadata = {
  title: "Sign in — Futures Atlas",
  robots: { index: false, follow: false },
};

const fieldCls =
  "w-full rounded-[3px] border border-ink/25 bg-surface px-4 py-3 font-mono text-[13px] leading-[1.5] text-ink placeholder:text-faint focus:border-accent";
const labelCls = "font-mono text-[10.5px] uppercase tracking-[0.14em] text-graphite";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const target = safeNext(next ?? ADMIN_HOME);

  return (
    <section className="flex min-h-[70svh] items-center py-[clamp(48px,8vw,110px)]">
      <Container>
        <form
          method="POST"
          action="/api/admin/login"
          className="mx-auto flex w-full max-w-[440px] flex-col gap-5 border border-ink bg-panel p-[clamp(28px,4vw,44px)]"
        >
          <div>
            <p className="eyebrow tick mb-4">Internal</p>
            <p className="text-[clamp(20px,2.4vw,28px)] font-extrabold leading-tight text-ink">
              This page is private
            </p>
            <p className="mt-2 font-mono text-[12px] leading-[1.6] text-graphite">
              Enter the password to continue.
            </p>
          </div>

          <input type="hidden" name="next" value={target} />

          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Password</span>
            <input
              type="password"
              name="password"
              required
              autoFocus
              autoComplete="current-password"
              className={fieldCls}
            />
          </label>

          {error && (
            <p
              role="alert"
              className="font-mono text-[12px] leading-[1.6] text-accent-deep"
            >
              Incorrect password.
            </p>
          )}

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2.5 self-start rounded-[2px] bg-accent px-7 py-3.5 font-mono text-[12.5px] uppercase tracking-[0.1em] text-paper transition-colors hover:bg-accent-deep"
          >
            Sign in <span className="text-[14px]">→</span>
          </button>
        </form>
      </Container>
    </section>
  );
}
