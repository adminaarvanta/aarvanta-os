"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  AuthDivider,
  AuthSplitLayout,
  GoogleAuthButton,
  authFieldClassName,
  authLabelClassName,
} from "@/components/auth/auth-split-layout";
import { Button } from "@/components/ui/button";
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

      <div>
        <label htmlFor="name" className={authLabelClassName}>
          Full name
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Alex Morgan"
          className={authFieldClassName}
        />
      </div>
      <div>
        <label htmlFor="email" className={authLabelClassName}>
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@company.com"
          className={authFieldClassName}
        />
      </div>
      <div>
        <label htmlFor="password" className={authLabelClassName}>
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className={authFieldClassName}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={authLabelClassName}>
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+44 7700 900123"
            autoComplete="tel"
            className={authFieldClassName}
          />
        </div>
        <div>
          <label htmlFor="country" className={authLabelClassName}>
            Country
          </label>
          <select
            id="country"
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={authFieldClassName}
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="company" className={authLabelClassName}>
          Company / workspace{" "}
          <span className="font-normal text-dim">(optional)</span>
        </label>
        <input
          id="company"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Leave blank — we’ll name it for you"
          className={authFieldClassName}
        />
      </div>
      {referralCode ? (
        <div>
          <label htmlFor="referralCode" className={authLabelClassName}>
            Referral code
          </label>
          <input
            id="referralCode"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            className={authFieldClassName}
          />
        </div>
      ) : null}

      {error ? (
        <p
          className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-500"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="mt-1 h-11 w-full rounded-xl text-sm font-semibold"
        disabled={busy}
      >
        {busy ? "Creating free account…" : "Create free account"}
      </Button>

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
      subtitle="Create your Aarvanta workspace in under a minute."
      panelHeadline="Hire your first AI workforce"
      panelBody="Launch a modern operating system for sales, marketing, ops, and support — without stitching tools together."
      footer={
        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(safeNext)}`}
            className="font-medium text-gold hover:underline"
          >
            Sign in
          </Link>
          {" · "}
          <Link href="/" className="text-gold hover:underline">
            Home
          </Link>
        </p>
      }
    >
      <Suspense
        fallback={
          <div className="h-72 animate-pulse rounded-xl bg-surface-muted" />
        }
      >
        <RegisterFormInner nextPath={safeNext} googleEnabled={googleEnabled} />
      </Suspense>
    </AuthSplitLayout>
  );
}
