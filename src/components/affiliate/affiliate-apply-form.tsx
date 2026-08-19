"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";

const COUNTRIES = [
  "United Kingdom",
  "United States",
  "India",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Singapore",
  "United Arab Emirates",
  "Other",
] as const;

export function AffiliateApplyForm() {
  return (
    <Suspense>
      <AffiliateApplyFormInner />
    </Suspense>
  );
}

function AffiliateApplyFormInner() {
  const searchParams = useSearchParams();
  const refFromUrl =
    searchParams.get("ref") ??
    searchParams.get("referralCode") ??
    searchParams.get("parent") ??
    "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [channels, setChannels] = useState("");
  const [parentReferralCode, setParentReferralCode] = useState(refFromUrl);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    code: string;
    status: string;
    emailSent?: boolean;
    alreadyHasPassword?: boolean;
    activationUrl?: string;
  } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/affiliate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          country,
          company: company.trim() || undefined,
          website: website.trim() || undefined,
          marketingChannels: channels.trim() || undefined,
          parentReferralCode: parentReferralCode.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        affiliate?: { referralCode: string; status: string };
        activation?: {
          needed: boolean;
          emailSent: boolean;
          activationUrl?: string;
        };
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(data.error?.message ?? "Application failed.");
        return;
      }
      if (data.affiliate) {
        setDone({
          code: data.affiliate.referralCode,
          status: data.affiliate.status,
          emailSent: data.activation?.emailSent,
          alreadyHasPassword: data.activation?.needed === false,
          activationUrl: data.activation?.activationUrl,
        });
      }
    } catch {
      setError("Application failed.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-surface-elevated p-6 text-sm">
        <p className="font-medium text-foreground">You are in the partner program</p>
        <p className="mt-2 text-muted">
          Status: <span className="text-gold">{done.status}</span>. Your code{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5 text-foreground">
            {done.code}
          </code>{" "}
          is active.
        </p>
        {done.alreadyHasPassword ? (
          <p className="mt-3 text-muted">
            You already have an Aarvanta password. Sign in and open your
            affiliate dashboard.
          </p>
        ) : done.emailSent ? (
          <p className="mt-3 text-muted">
            Check your email for a link to create your password. Then sign in
            and open your affiliate dashboard.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-muted">
              We could not email the set-password link. Use this link to create
              your password:
            </p>
            {done.activationUrl ? (
              <div className="rounded-lg border border-border bg-surface-muted p-3">
                <p className="break-all font-mono text-xs text-foreground">
                  {done.activationUrl}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => {
                    void navigator.clipboard.writeText(done.activationUrl!);
                    setCopied(true);
                  }}
                >
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </div>
            ) : (
              <p className="text-muted">
                Contact Aarvanta to resend a set-password link.
              </p>
            )}
          </div>
        )}
        <p className="mt-3 text-xs text-muted">
          After you set a password, sign in and open{" "}
          <span className="text-foreground">/affiliate/dashboard</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
        <Field label="Country" id="aff-country">
          <select
            id="aff-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className={inputClass}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Company" id="aff-company">
          <input
            id="aff-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Website" id="aff-web">
        <input
          id="aff-web"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://"
          className={inputClass}
        />
      </Field>
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
        {busy ? "Submitting…" : "Apply to partner program"}
      </Button>
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
