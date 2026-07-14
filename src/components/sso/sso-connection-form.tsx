"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PROVIDERS = [
  { id: "google", label: "Google Workspace" },
  { id: "okta", label: "Okta" },
  { id: "entra", label: "Microsoft Entra ID" },
  { id: "onelogin", label: "OneLogin" },
] as const;

export function SsoConnectionForm() {
  const router = useRouter();
  const [provider, setProvider] = useState<string>("google");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, domain, protocol: "oidc" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message ?? "Failed to add connection");
      }
      setDomain("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface-muted p-4 space-y-3"
    >
      <h3 className="text-sm font-semibold text-foreground">Add OIDC connection</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-muted">
          Provider
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          Email domain
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="company.com"
            required
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-gold-bright disabled:opacity-50"
      >
        {loading ? "Saving…" : "Add connection"}
      </button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <p className="text-[10px] text-muted">
        Set <code className="text-gold">SSO_GOOGLE_ISSUER</code> and{" "}
        <code className="text-gold">SSO_GOOGLE_CLIENT_ID</code> env vars to enable live OIDC sign-in.
      </p>
    </form>
  );
}
