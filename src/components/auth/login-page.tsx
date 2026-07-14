"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BrandLogo } from "@/components/brand/logo";
import { sanitizeNextPath } from "@/lib/auth/cookie-options";

const LOGIN_ERRORS: Record<string, string> = {
  invalid_credentials: "Invalid email or password",
  misconfigured: "Sign-in is not configured on this server. Contact your administrator.",
};

function LoginFormInner({ nextPath }: { nextPath: string }) {
  const searchParams = useSearchParams();
  const safeNextPath = sanitizeNextPath(nextPath);
  const errorCode = searchParams.get("error");
  const error =
    errorCode && LOGIN_ERRORS[errorCode]
      ? LOGIN_ERRORS[errorCode]
      : errorCode
        ? "Sign in failed. Please try again."
        : null;

  return (
    <form action="/api/auth/login" method="POST" className="mt-8 space-y-4">
      <input type="hidden" name="next" value={safeNextPath} />

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-foreground"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-black hover:bg-gold-bright"
      >
        Sign in
      </button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted">or</span>
        </div>
      </div>

      <a
        href={`/api/auth/sso/start?provider=google&next=${encodeURIComponent(safeNextPath)}`}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-muted px-4 py-2.5 text-sm font-medium text-foreground hover:border-gold"
      >
        Sign in with SSO
      </a>
    </form>
  );
}

export function LoginForm({ nextPath }: { nextPath: string }) {
  return (
    <Suspense
      fallback={
        <div className="mt-8 h-48 animate-pulse rounded-lg bg-surface-muted" />
      }
    >
      <LoginFormInner nextPath={nextPath} />
    </Suspense>
  );
}

export function LoginPageShell({ nextPath }: { nextPath: string }) {
  const safeNextPath = sanitizeNextPath(nextPath);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-lg shadow-gold/5 sm:p-10">
        <div className="flex justify-center px-2">
          <BrandLogo size="xl" fullWidth mode="dark" />
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          Sign in to access your business operating system.
        </p>

        <LoginForm nextPath={safeNextPath} />

        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/" className="text-gold hover:underline">
            ← Back to home
          </Link>
          {" · "}
          <a
            href={`/login?next=${encodeURIComponent("/dashboard?help=open")}`}
            className="text-gold hover:underline"
          >
            Tour &amp; demo after sign-in
          </a>
        </p>
      </div>
    </div>
  );
}
