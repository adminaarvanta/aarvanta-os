"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { sanitizeNextPath } from "@/lib/auth/cookie-options";

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
  const safeNext = sanitizeNextPath(
    searchParams.get("next") ?? nextPath
  );
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/auth/register/complete");
      const data = (await res.json()) as {
        pending?: boolean;
        email?: string;
        name?: string;
      };
      if (!data.pending) {
        router.replace(`/register?next=${encodeURIComponent(safeNext)}`);
        return;
      }
      setEmail(data.email ?? "");
      setName(data.name ?? "");
      setReady(true);
    })();
  }, [router, safeNext]);

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
    return (
      <div className="mt-8 h-40 animate-pulse rounded-lg bg-surface-muted" />
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <p className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-muted">
        Signed in with Google as <span className="text-foreground">{email}</span>
      </p>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Full name
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
        />
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
          className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30"
        />
      </div>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Finishing…" : "Finish free signup"}
      </Button>
    </form>
  );
}

export function RegisterCompleteShell({ nextPath }: { nextPath: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-gold/5 sm:p-10">
        <div className="flex justify-center px-2">
          <BrandLogo size="xl" fullWidth />
        </div>
        <h1 className="mt-4 text-center text-xl font-semibold text-foreground">
          Almost there
        </h1>
        <p className="mt-1 text-center text-sm text-muted">
          Add your phone and country to activate your free workspace.
        </p>
        <Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-lg bg-surface-muted" />}>
          <CompleteFormInner nextPath={nextPath} />
        </Suspense>
        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/register" className="text-gold hover:underline">
            Start over
          </Link>
        </p>
      </div>
    </div>
  );
}
