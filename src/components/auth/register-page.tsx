"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  AuthAlert,
  AuthField,
  AuthPasswordField,
  AuthSelect,
  AuthSubmitButton,
} from "@/components/auth/auth-fields";
import {
  AuthDivider,
  AuthSplitLayout,
  GoogleAuthButton,
} from "@/components/auth/auth-split-layout";
import { sanitizeNextPath } from "@/lib/auth/cookie-options";

const REF_STORAGE_KEY = "aarvanta_aff_ref";

const COUNTRY_OPTIONS = [
  "United States",
  "United Kingdom",
  "India",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Singapore",
  "United Arab Emirates",
  "Other",
] as const;

function RegisterFormInner({
  nextPath,
  googleEnabled,
}: {
  nextPath: string;
  googleEnabled: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeNext = sanitizeNextPath(nextPath);
  const referralFromUrl =
    searchParams.get("ref") ?? searchParams.get("referralCode") ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [companyName, setCompanyName] = useState("");
  const [referralCode, setReferralCode] = useState(referralFromUrl);
  const [busy, setBusy] = useState(false);
  const affHint = searchParams.get("aff");
  const errorCode = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    errorCode === "sso_failed"
      ? "Google sign-up failed. Try again or use email."
      : errorCode === "misconfigured"
        ? "Google sign-up is not configured. Create your account with email instead."
        : affHint === "pending"
          ? "That partner link is not active yet. You can still create a free account."
          : affHint === "invalid"
            ? "That referral link was not recognized. You can still create a free account."
            : null
  );

  useEffect(() => {
    if (referralFromUrl) {
      try {
        sessionStorage.setItem(REF_STORAGE_KEY, referralFromUrl);
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      const stored = sessionStorage.getItem(REF_STORAGE_KEY)?.trim() ?? "";
      if (stored) setReferralCode((current) => current || stored);
    } catch {
      /* ignore */
    }
  }, [referralFromUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          country,
          companyName: companyName.trim() || undefined,
          referralCode: referralCode.trim() || undefined,
          next: safeNext,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: { message?: string };
        next?: string;
      } | null;
      if (!res.ok) {
        setError(data?.error?.message ?? "Could not create your account.");
        return;
      }
      router.push(data?.next ?? safeNext);
      router.refresh();
    } catch {
      setError("Could not create your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {googleEnabled ? (
        <>
          <GoogleAuthButton
            href={`/api/auth/sso/start?provider=google&intent=register&next=${encodeURIComponent(safeNext)}${
              referralCode.trim()
                ? `&ref=${encodeURIComponent(referralCode.trim())}`
                : ""
            }`}
            label="Continue with Google"
          />
          <AuthDivider />
        </>
      ) : null}

      <AuthField
        id="name"
        label="Full name"
        icon="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
        placeholder="Alex Morgan"
      />
      <AuthField
        id="email"
        type="email"
        label="Work email"
        icon="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        placeholder="you@company.com"
      />
      <AuthPasswordField
        id="password"
        label="Password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        placeholder="At least 8 characters"
        hint="Use 8+ characters for a stronger password."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          id="phone"
          type="tel"
          label="Phone"
          icon="phone"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+44 7700 900123"
          autoComplete="tel"
        />
        <AuthSelect
          id="country"
          label="Country"
          required
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          options={COUNTRY_OPTIONS}
        />
      </div>
      <AuthField
        id="company"
        label="Company / workspace"
        icon="company"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Optional — we’ll name it for you"
      />
      {referralCode ? (
        <>
          <AuthField
            id="referralCode"
            label="Referral code"
            icon="referral"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
          />
          <p className="text-xs text-muted">
            Joining as a partner under this code?{" "}
            <Link
              href={`/affiliate?ref=${encodeURIComponent(referralCode.trim())}`}
              className="text-gold hover:underline"
            >
              Apply to the partner program
            </Link>
            .
          </p>
        </>
      ) : null}

      {error ? <AuthAlert>{error}</AuthAlert> : null}

      <AuthSubmitButton busy={busy}>Create free account</AuthSubmitButton>

      <p className="pt-1 text-center text-xs text-muted">
        Free forever for getting started · No card required
      </p>
    </form>
  );
}

export function RegisterPageShell({
  nextPath,
  googleEnabled = false,
}: {
  nextPath: string;
  googleEnabled?: boolean;
}) {
  const safeNext = sanitizeNextPath(nextPath);

  return (
    <AuthSplitLayout
      title="Start free"
      subtitle="Create your Aarvanta workspace in under a minute — no card required."
      panelHeadline="Hire your first AI workforce"
      panelBody="Launch a modern operating system for sales, marketing, ops, and support — without stitching tools together."
      footer={
        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(safeNext)}`}
            className="font-semibold text-gold hover:underline"
          >
            Sign in
          </Link>
          {" · "}
          <Link href="/" className="font-medium text-gold hover:underline">
            Home
          </Link>
        </p>
      }
    >
      <Suspense
        fallback={
          <div className="h-72 animate-pulse rounded-2xl bg-surface-muted" />
        }
      >
        <RegisterFormInner nextPath={safeNext} googleEnabled={googleEnabled} />
      </Suspense>
    </AuthSplitLayout>
  );
}
