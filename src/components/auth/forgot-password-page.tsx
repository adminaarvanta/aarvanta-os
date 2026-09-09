"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AuthAlert,
  AuthField,
  AuthPasswordField,
  AuthSubmitButton,
} from "@/components/auth/auth-fields";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";

type Step = "email" | "code" | "password";

const RESEND_COOLDOWN_SECONDS = 60;

type ApiErrorBody = {
  error?: { message?: string };
  message?: string;
  next?: string;
};

async function readApiError(res: Response, fallback: string) {
  try {
    const data = (await res.json()) as ApiErrorBody;
    return data.error?.message ?? data.message ?? fallback;
  } catch {
    return fallback;
  }
}

function stepCopy(step: Step, email: string) {
  if (step === "email") {
    return {
      title: "Forgot password",
      subtitle:
        "Enter your email and we’ll send a 6-digit verification code.",
    };
  }
  if (step === "code") {
    return {
      title: "Check your email",
      subtitle: email
        ? `Enter the 6-digit code we sent to ${email}.`
        : "Enter the 6-digit code we sent to your email.",
    };
  }
  return {
    title: "Create a new password",
    subtitle: "Choose a password you have not used before. Then sign in.",
  };
}

export function ForgotPasswordPageShell() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const copy = stepCopy(step, email);

  async function requestCode(nextEmail: string) {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: nextEmail }),
    });
    if (!res.ok) {
      throw new Error(
        await readApiError(res, "Could not send a verification code.")
      );
    }
    setResendIn(RESEND_COOLDOWN_SECONDS);
  }

  async function onEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const nextEmail = email.trim().toLowerCase();
      await requestCode(nextEmail);
      setEmail(nextEmail);
      setStep("code");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send a verification code."
      );
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    if (resendIn > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await requestCode(email);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not resend the code."
      );
    } finally {
      setBusy(false);
    }
  }

  async function onCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res, "Invalid or expired code."));
      }
      setStep("password");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid or expired code."
      );
    } finally {
      setBusy(false);
    }
  }

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
          password,
          confirmPassword,
        }),
      });
      const data = (await res.json()) as ApiErrorBody;
      if (!res.ok) {
        throw new Error(
          data.error?.message ?? "Could not update your password."
        );
      }
      router.push(data.next ?? "/login?reset=success");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update your password."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthSplitLayout
      title={copy.title}
      subtitle={copy.subtitle}
      panelHeadline="Reset access in minutes"
      panelBody="We’ll email a short code so you can create a new password and get back to your workspace."
      footer={
        <p className="text-center text-xs text-muted">
          <Link href="/login" className="font-medium text-gold hover:underline">
            ← Back to sign in
          </Link>
        </p>
      }
    >
      {step === "email" ? (
        <form onSubmit={onEmailSubmit} className="space-y-4">
          <AuthField
            id="reset-email"
            name="email"
            type="email"
            label="Email"
            icon="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {error ? <AuthAlert>{error}</AuthAlert> : null}
          <AuthSubmitButton busy={busy}>Send verification code</AuthSubmitButton>
        </form>
      ) : null}

      {step === "code" ? (
        <form onSubmit={onCodeSubmit} className="space-y-4">
          <AuthField
            id="reset-code"
            name="code"
            type="text"
            label="Verification code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={8}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="text-center font-semibold tracking-[0.35em]"
          />
          {error ? <AuthAlert>{error}</AuthAlert> : null}
          <AuthSubmitButton busy={busy}>Continue</AuthSubmitButton>
          <p className="text-center text-sm text-muted">
            <button
              type="button"
              onClick={onResend}
              disabled={busy || resendIn > 0}
              className="font-semibold text-gold hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline"
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </button>
            {" · "}
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              className="font-semibold text-gold hover:underline"
            >
              Use a different email
            </button>
          </p>
        </form>
      ) : null}

      {step === "password" ? (
        <form onSubmit={onPasswordSubmit} className="space-y-4">
          <AuthPasswordField
            id="reset-password"
            name="password"
            label="New password"
            required
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <AuthPasswordField
            id="reset-confirm"
            name="confirmPassword"
            label="Confirm password"
            required
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {error ? <AuthAlert>{error}</AuthAlert> : null}
          <AuthSubmitButton busy={busy}>Update password</AuthSubmitButton>
        </form>
      ) : null}
    </AuthSplitLayout>
  );
}
