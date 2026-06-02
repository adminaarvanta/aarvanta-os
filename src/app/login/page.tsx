"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/inbox";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error?.message ?? "Login failed");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[#2A2418]"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#EDE6D6] px-3 py-2 text-sm outline-none focus:border-[#C29B40]"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-[#2A2418]"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#EDE6D6] px-3 py-2 text-sm outline-none focus:border-[#C29B40]"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#C29B40] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#9A7A32] disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FCF9F2] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#EDE6D6] bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C29B40]">
          Aarvanta OS
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#2A2418]">
          Communication Hub
        </h1>
        <p className="mt-1 text-sm text-[#6B6356]">
          Sign in to access Module 1 in production mode.
        </p>

        <Suspense fallback={<p className="mt-8 text-sm text-[#6B6356]">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
