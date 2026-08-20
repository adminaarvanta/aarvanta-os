"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  AuthAlert,
  AuthField,
  AuthPasswordField,
  AuthSubmitButton,
} from "@/components/auth/auth-fields";
import {
  AuthDivider,
  AuthSplitLayout,
  GoogleAuthButton,
} from "@/components/auth/auth-split-layout";
import { sanitizeNextPath } from "@/lib/auth/cookie-options";
import { cn } from "@/lib/utils";

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

  const [busy, setBusy] = useState(false);

  return (
    <form
      action="/api/auth/login"
      method="POST"
      className="space-y-4"
      onSubmit={() => setBusy(true)}
    >
      <input type="hidden" name="next" value={safeNextPath} />

      {googleEnabled ? (
        <>
          <div className={cn(busy && "pointer-events-none opacity-60")}>
            <GoogleAuthButton
              href={`/api/auth/sso/start?provider=google&next=${encodeURIComponent(safeNextPath)}`}
            />
          </div>
          <AuthDivider />
        </>
      ) : null}

      <AuthField
        id="email"
        name="email"
        type="email"
        label="Email"
        icon="email"
        required
        autoComplete="email"
        placeholder="you@company.com"
      />
      <AuthPasswordField
        id="password"
        name="password"
        label="Password"
        required
        autoComplete="current-password"
        placeholder="Enter your password"
      />

      {error ? <AuthAlert>{error}</AuthAlert> : null}

      <AuthSubmitButton busy={busy}>Sign in to workspace</AuthSubmitButton>

      <p className="pt-1 text-center text-sm text-muted">
        New here?{" "}
        <Link
          href={`/register?next=${encodeURIComponent(safeNextPath)}`}
          className="font-semibold text-gold hover:underline"
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
        <div className="h-56 animate-pulse rounded-2xl bg-surface-muted" />
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
      subtitle="Sign in to your Aarvanta workspace and pick up where you left off."
      panelHeadline="Run your company with AI"
      panelBody="CRM, inbox, voice, and your AI workforce — one modern operating system."
      footer={
        <p className="text-center text-xs text-muted">
          <Link href="/" className="font-medium text-gold hover:underline">
            ← Back to home
          </Link>
        </p>
      }
    >
      <LoginForm nextPath={safeNextPath} googleEnabled={googleEnabled} />
    </AuthSplitLayout>
  );
}
