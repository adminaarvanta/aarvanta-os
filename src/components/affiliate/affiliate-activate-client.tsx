"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function AffiliateActivateClient({ token }: { token: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/affiliate/activate?token=${encodeURIComponent(token)}`
        );
        const data = (await res.json()) as {
          name?: string;
          email?: string;
          error?: { message?: string };
        };
        if (!res.ok) {
          if (!cancelled) {
            setError(data.error?.message ?? "Invalid activation link.");
            setLoading(false);
          }
          return;
        }
        if (!cancelled) {
          setName(data.name ?? "");
          setEmail(data.email ?? "");
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load activation link.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/affiliate/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as {
        next?: string;
        error?: { message?: string };
      };
      if (!res.ok) {
        setError(data.error?.message ?? "Could not set password.");
        return;
      }
      router.push(data.next ?? "/affiliate/dashboard");
      router.refresh();
    } catch {
      setError("Could not set password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="mx-auto flex max-w-md items-center justify-between px-4 py-6">
        <BrandLogo size="md" />
        <Link href="/login" className="text-sm text-muted hover:text-foreground">
          Sign in
        </Link>
      </header>
      <main className="mx-auto max-w-md px-4 pb-16">
        <h1 className="text-2xl font-semibold text-foreground">
          Create your partner password
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your application was approved. Set a password to open your affiliate
          dashboard.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-muted">Loading…</p>
        ) : error && !email ? (
          <div className="mt-8 space-y-3 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            <p>{error}</p>
            <p className="text-xs text-muted">
              If you already created a password,{" "}
              <Link href="/login" className="text-gold hover:underline">
                sign in
              </Link>
              . Otherwise ask Aarvanta to open Affiliate Admin → your name →{" "}
              <strong>Send password link</strong> and use the new link only.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Partner
              </p>
              <p className="mt-1 text-sm text-foreground">
                {name} · {email}
              </p>
            </div>
            <div>
              <label
                htmlFor="aff-pass"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="aff-pass"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:border-gold"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label
                htmlFor="aff-pass2"
                className="block text-sm font-medium text-foreground"
              >
                Confirm password
              </label>
              <input
                id="aff-pass2"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm outline-none focus:border-gold"
                autoComplete="new-password"
              />
            </div>
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Saving…" : "Create password & continue"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}
