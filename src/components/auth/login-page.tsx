"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  AuthDivider,
  AuthSplitLayout,
  GoogleAuthButton,
  authFieldClassName,
  authLabelClassName,
} from "@/components/auth/auth-split-layout";
import { sanitizeNextPath } from "@/lib/auth/cookie-options";

const LOGIN_ERRORS: Record<string, string> = {
  invalid_credentials: "Invalid email or password",
  misconfigured:
    "Google sign-in is not configured. Use email and password, or ask your admin to set SSO_GOOGLE_CLIENT_ID.",
};

function LoginFormInner({
  nextPath,
  googleEnabled,
}: {
  nextPath: string;
  googleEnabled: boolean;
}) {
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
    <form action="/api/auth/login" method="POST" className="space-y-4">
      <input type="hidden" name="next" value={safeNextPath} />

      {googleEnabled ? (
        <>
          <GoogleAuthButton
            href={`/api/auth/sso/start?provider=google&next=${encodeURIComponent(safeNextPath)}`}
          />
          <AuthDivider />
        </>
      ) : null}

      <div>
        <label htmlFor="email" className={authLabelClassName}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          className={authFieldClassName}
        />
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className={authLabelClassName}>
            Password
          </label>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          className={authFieldClassName}
        />
      </div>

      {error ? (
        <p
          className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-500"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="mt-1 w-full rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-gold-bright"
      >
        Sign in
      </button>

      <p className="pt-1 text-center text-sm text-muted">
        New here?{" "}
        <Link
          href={`/register?next=${encodeURIComponent(safeNextPath)}`}
          className="font-medium text-gold hover:underline"
        >
          Create a free account
        </Link>
      </p>
    </form>
  );
}

export function LoginForm({
  nextPath,
  googleEnabled,
}: {
  nextPath: string;
  googleEnabled: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div className="h-56 animate-pulse rounded-xl bg-surface-muted" />
      }
    >
      <LoginFormInner nextPath={nextPath} googleEnabled={googleEnabled} />
    </Suspense>
  );
}

export function LoginPageShell({
  nextPath,
  googleEnabled = false,
}: {
  nextPath: string;
  googleEnabled?: boolean;
}) {
  const safeNextPath = sanitizeNextPath(nextPath);

  return (
    <AuthSplitLayout
      title="Welcome back"
      subtitle="Sign in to your Aarvanta workspace."
      panelHeadline="Run your company with AI"
      panelBody="Pick up where you left off — CRM, inbox, voice, and your AI workforce in one place."
      footer={
        <p className="text-center text-xs text-muted">
          <Link href="/" className="text-gold hover:underline">
            ← Back to home
          </Link>
        </p>
      }
    >
      <LoginForm nextPath={safeNextPath} googleEnabled={googleEnabled} />
    </AuthSplitLayout>
  );
}
