"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  AuthAlert,
  AuthField,
  AuthSelect,
  AuthSubmitButton,
} from "@/components/auth/auth-fields";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
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

function CompleteFormInner({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeNext = sanitizeNextPath(searchParams.get("next") ?? nextPath);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [companyName, setCompanyName] = useState("");
  const [referralCode, setReferralCode] = useState(
    searchParams.get("ref") ?? searchParams.get("referralCode") ?? ""
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fromUrl =
      searchParams.get("ref") ?? searchParams.get("referralCode") ?? "";
    if (fromUrl) {
      setReferralCode(fromUrl);
      try {
        sessionStorage.setItem(REF_STORAGE_KEY, fromUrl);
      } catch {
        /* ignore */
      }
    } else {
      try {
        const stored = sessionStorage.getItem(REF_STORAGE_KEY)?.trim() ?? "";
        if (stored) setReferralCode(stored);
      } catch {
        /* ignore */
      }
    }

    void (async () => {
      const res = await fetch("/api/auth/register/complete");
      const data = (await res.json()) as {
        pending?: boolean;
        email?: string;
        name?: string;
        referralCode?: string;
      };
      if (!data.pending) {
        router.replace(`/register?next=${encodeURIComponent(safeNext)}`);
        return;
      }
      setEmail(data.email ?? "");
      setName(data.name ?? "");
      if (data.referralCode?.trim()) {
        setReferralCode(data.referralCode.trim());
        try {
          sessionStorage.setItem(REF_STORAGE_KEY, data.referralCode.trim());
        } catch {
          /* ignore */
        }
      }
      setReady(true);
    })();
  }, [router, safeNext, searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
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
        setError(data?.error?.message ?? "Could not finish signup.");
        return;
      }
      router.push(data?.next ?? safeNext);
      router.refresh();
    } catch {
      setError("Could not finish signup.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <div className="h-48 animate-pulse rounded-2xl bg-surface-muted" />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="rounded-2xl border border-border/70 bg-surface-muted/80 px-3.5 py-3 text-xs text-muted">
        Signed in with Google as{" "}
        <span className="font-semibold text-foreground">{email}</span>
      </p>
      <AuthField
        id="name"
        label="Full name"
        icon="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
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
        placeholder="Optional"
      />

      {error ? <AuthAlert>{error}</AuthAlert> : null}

      <AuthSubmitButton busy={busy}>Finish free signup</AuthSubmitButton>
    </form>
  );
}

export function RegisterCompleteShell({ nextPath }: { nextPath: string }) {
  return (
    <AuthSplitLayout
      title="Almost there"
      subtitle="Add your phone and country to activate your free workspace."
      panelHeadline="One more step"
      panelBody="Confirm a few details and your Aarvanta workspace will be ready."
      footer={
        <p className="text-center text-xs text-muted">
          <Link href="/register" className="font-medium text-gold hover:underline">
            Start over
          </Link>
        </p>
      }
    >
      <Suspense
        fallback={
          <div className="h-48 animate-pulse rounded-2xl bg-surface-muted" />
        }
      >
        <CompleteFormInner nextPath={nextPath} />
      </Suspense>
    </AuthSplitLayout>
  );
}
