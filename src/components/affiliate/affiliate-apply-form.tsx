"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpTip } from "@/components/ui/help-tip";
import { COUNTRY_NAMES } from "@/lib/i18n/regions";

export function AffiliateApplyForm() {
  return (
    <Suspense>
      <AffiliateApplyFormInner />
    </Suspense>
  );
}

function AffiliateApplyFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refFromUrl =
    searchParams.get("ref") ??
    searchParams.get("referralCode") ??
    searchParams.get("parent") ??
    "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [city, setCity] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [channels, setChannels] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [parentReferralCode, setParentReferralCode] = useState(refFromUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/affiliate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          country,
          city: city.trim() || undefined,
          company: company.trim() || undefined,
          website: website.trim() || undefined,
          marketingChannels: channels.trim() || undefined,
          password,
          confirmPassword,
          parentReferralCode: parentReferralCode.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        next?: string;
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(data.error?.message ?? "Application failed.");
        return;
      }
      router.push(data.next ?? "/onboarding");
      router.refresh();
    } catch {
      setError("Application failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="rounded-xl border border-border bg-surface-muted/70 px-3 py-2 text-xs text-muted">
        Create your partner password here. We do not email temporary passwords
        or set-password links.
        <HelpTip label="Why no email password" className="ml-1">
          You choose the password now, then we take you into onboarding and
          your partner dashboard.
        </HelpTip>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" id="aff-name">
          <input
            id="aff-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Email" id="aff-email">
          <input
            id="aff-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" id="aff-phone">
          <input
            id="aff-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+44 7700 900123"
            className={inputClass}
          />
        </Field>
        <Field label="Country" id="aff-country">
          <select
            id="aff-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClass}
          >
            {COUNTRY_NAMES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="City / location" id="aff-city">
        <input
          id="aff-city"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="London"
          className={inputClass}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password" id="aff-pass">
          <input
            id="aff-pass"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
        <Field label="Confirm password" id="aff-pass2">
          <input
            id="aff-pass2"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className={inputClass}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" id="aff-company">
          <input
            id="aff-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Website" id="aff-web">
          <input
            id="aff-web"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Marketing channels" id="aff-ch">
        <input
          id="aff-ch"
          value={channels}
          onChange={(e) => setChannels(e.target.value)}
          placeholder="LinkedIn, newsletter, community…"
          className={inputClass}
        />
      </Field>
      <Field label="Parent / sponsor referral code (optional)" id="aff-parent">
        <input
          id="aff-parent"
          value={parentReferralCode}
          onChange={(e) => setParentReferralCode(e.target.value)}
          placeholder="e.g. DEMOREF"
          className={inputClass}
          autoComplete="off"
        />
        {refFromUrl ? (
          <p className="mt-1 text-xs text-muted">
            Filled from the affiliate link you used.
          </p>
        ) : null}
      </Field>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Creating account…" : "Create partner account"}
      </Button>
      <p className="text-xs text-muted">
        Prefer a workspace account instead?{" "}
        <Link href="/register" className="text-gold hover:underline">
          Start free
        </Link>
        .
      </p>
    </form>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30";
