"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/logo";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();

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

    router.push(nextPath);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[#F5E6C8]"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#3d3528] bg-[#141414] px-3 py-2 text-sm text-[#F5E6C8] outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-[#F5E6C8]"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#3d3528] bg-[#141414] px-3 py-2 text-sm text-[#F5E6C8] outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#F9E076] disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function LoginPageShell({ nextPath }: { nextPath: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-black px-4 py-6">
      <div className="w-full max-w-md rounded-2xl border border-[#3d3528] bg-[#0a0a0a] p-6 shadow-lg shadow-[#D4AF37]/5 sm:p-8">
        <div className="flex justify-center">
          <BrandLogo size="md" />
        </div>
        <p className="mt-4 text-center text-sm text-[#A89878]">
          Sign in to access your business operating system.
        </p>

        <LoginForm nextPath={nextPath} />

        <p className="mt-6 text-center text-xs text-[#A89878]">
          <a href="/" className="text-[#D4AF37] hover:underline">
            ← Back to home
          </a>
          {" · "}
          <a href="/chat" className="text-[#D4AF37] hover:underline">
            Try demo without signing in
          </a>
        </p>
      </div>
    </div>
  );
}
