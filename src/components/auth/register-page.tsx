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
import { HelpTip } from "@/components/ui/help-tip";
import { sanitizeNextPath } from "@/lib/auth/cookie-options";
import { COUNTRY_NAMES } from "@/lib/i18n/regions";
import { cn } from "@/lib/utils";

const REF_STORAGE_KEY = "aarvanta_aff_ref";

type AccountType = "workspace" | "affiliate";

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
  const [accountType, setAccountType] = useState<AccountType>(
    searchParams.get("type") === "affiliate" ? "affiliate" : "workspace"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [location, setLocation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [marketingChannels, setMarketingChannels] = useState("");
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
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          phone,
          country,
          location: location.trim() || undefined,
          companyName: companyName.trim() || undefined,
          website: website.trim() || undefined,
          marketingChannels: marketingChannels.trim() || undefined,
          accountType,
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
        <p className="mb-2 inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
          Account type
          <HelpTip label="Account types">
            Workspace is for running your business. Partner is for referring
            teams and earning commissions. You can add the other later.
          </HelpTip>
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              {
                id: "workspace" as const,
                title: "Workspace",
                body: "CRM, inbox, and AI for my business",
              },
              {
                id: "affiliate" as const,
                title: "Partner / affiliate",
                body: "Refer teams and track commissions",
              },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAccountType(item.id)}
              className={cn(
                "rounded-2xl border px-3 py-3 text-left transition-colors",
                accountType === item.id
                  ? "border-gold/70 bg-gold/10"
                  : "border-border/80 bg-surface-muted/60 hover:border-gold/40"
              )}
            >
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-0.5 text-xs text-muted">{item.body}</p>
            </button>
          ))}
        </div>
      </div>

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
        hint="Create it here. We never email a temporary password."
      />
      <AuthPasswordField
        id="confirmPassword"
        label="Confirm password"
        required
        minLength={8}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        placeholder="Type the same password again"
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
          options={COUNTRY_NAMES}
        />
      </div>
      <AuthField
        id="location"
        label="City / location"
        icon="country"
        required
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="London"
        autoComplete="address-level2"
      />
      <AuthField
        id="company"
        label={accountType === "affiliate" ? "Company" : "Company / workspace"}
        icon="company"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Optional — we’ll name it for you"
      />
      {accountType === "affiliate" ? (
        <>
          <AuthField
            id="website"
            label="Website"
            icon="company"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
          />
          <AuthField
            id="channels"
            label="Marketing channels"
            icon="referral"
            value={marketingChannels}
            onChange={(e) => setMarketingChannels(e.target.value)}
            placeholder="LinkedIn, newsletter, community…"
          />
        </>
      ) : null}
      <AuthField
        id="referralCode"
        label="Referral code"
        icon="referral"
        value={referralCode}
        onChange={(e) => setReferralCode(e.target.value)}
        placeholder="Optional"
      />

      {error ? <AuthAlert>{error}</AuthAlert> : null}

      <AuthSubmitButton busy={busy}>
        {accountType === "affiliate"
          ? "Create partner account"
          : "Create free account"}
      </AuthSubmitButton>

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
      subtitle="Choose workspace or partner, then finish signup here — password, phone, and location. No email password links."
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
