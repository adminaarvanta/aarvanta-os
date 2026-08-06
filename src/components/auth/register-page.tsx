"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/logo";
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
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Full name
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
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
          className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
        />
        <p className="mt-1 text-[11px] text-dim">At least 8 characters.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground">
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
            className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
          />
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-foreground">
            Country
          </label>
          <select
            id="country"
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
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
        <label htmlFor="company" className="block text-sm font-medium text-foreground">
          Company / workspace name{" "}
          <span className="font-normal text-dim">(optional)</span>
        </label>
        <input
          id="company"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Leave blank — we’ll name it for you"
          className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
        />
      </div>
      {referralCode ? (
        <div>
          <label
            htmlFor="referralCode"
            className="block text-sm font-medium text-foreground"
          >
            Referral code
          </label>
          <input
            id="referralCode"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
          />
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Creating free account…" : "Create free account"}
      </Button>

      {googleEnabled ? (
        <>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted">or</span>
            </div>
          </div>

          <a
            href={`/api/auth/sso/start?provider=google&intent=register&next=${encodeURIComponent(safeNext)}${
              referralCode.trim()
                ? `&ref=${encodeURIComponent(referralCode.trim())}`
                : ""
            }`}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-muted px-4 py-2.5 text-sm font-medium text-foreground hover:border-gold"
          >
            Continue with Google
          </a>
        </>
      ) : null}

      <p className="text-center text-xs text-muted">
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
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-gold/5 sm:p-10">
        <div className="flex justify-center px-2">
          <BrandLogo size="xl" fullWidth />
        </div>
        <h1 className="mt-4 text-center text-xl font-semibold text-foreground">
          Start free
        </h1>
        <p className="mt-1 text-center text-sm text-muted">
          Create your Aarvanta workspace in under a minute.
        </p>

        <Suspense
          fallback={
            <div className="mt-8 h-64 animate-pulse rounded-lg bg-surface-muted" />
          }
        >
          <RegisterFormInner
            nextPath={safeNext}
            googleEnabled={googleEnabled}
          />
        </Suspense>

        <p className="mt-6 text-center text-xs text-muted">
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(safeNext)}`}
            className="text-gold hover:underline"
          >
            Sign in
          </Link>
          {" · "}
          <Link href="/" className="text-gold hover:underline">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
