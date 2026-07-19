"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type MemberRole } from "@/types/tenant";

type InvitePreview = {
  invitation: {
    email: string;
    role: MemberRole;
    status: string;
    expiresAt: string;
    invitedByName: string;
  };
  organization: { id: string; name: string } | null;
  workspace: { id: string; name: string } | null;
};

export function InviteAcceptClient({ token }: { token: string }) {
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ role: MemberRole; org?: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(
        `/api/tenant/invitations/accept?token=${encodeURIComponent(token)}`
      );
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        setError(body.error?.message ?? "Invitation not found.");
        return;
      }
      const data = (await res.json()) as InvitePreview;
      setPreview(data);
      setName(data.invitation.email.split("@")[0] ?? "");
    })();
  }, [token]);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tenant/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: name.trim() || undefined }),
      });
      const body = (await res.json()) as {
        error?: { message?: string };
        invitation?: { role: MemberRole };
        message?: string;
      };
      if (!res.ok) {
        setError(body.error?.message ?? "Could not accept invitation.");
        return;
      }
      setDone({
        role: body.invitation?.role ?? preview!.invitation.role,
        org: preview?.organization?.name,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_rgba(184,150,93,0.16),_transparent_55%)] px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-6 shadow-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
          Aarvanta OS
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Join organization
        </h1>

        {error && !preview ? (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        ) : null}

        {done ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted">
              You’re in{done.org ? ` — ${done.org}` : ""} as{" "}
              <span className="font-semibold text-foreground">
                {ROLE_LABELS[done.role]}
              </span>
              .
            </p>
            <p className="text-xs text-dim">{ROLE_DESCRIPTIONS[done.role]}</p>
            <Link
              href="/dashboard"
              className="inline-flex rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-black"
            >
              Open Command Center
            </Link>
          </div>
        ) : preview ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-border bg-surface-muted p-3 text-sm">
              <p className="text-foreground">
                <span className="font-semibold">
                  {preview.organization?.name ?? "Organization"}
                </span>
                {preview.workspace ? ` · ${preview.workspace.name}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted">
                Invited by {preview.invitation.invitedByName} as{" "}
                <span className="font-medium text-gold-bright">
                  {ROLE_LABELS[preview.invitation.role]}
                </span>
              </p>
              <p className="mt-2 text-xs text-dim">
                {ROLE_DESCRIPTIONS[preview.invitation.role]}
              </p>
              <p className="mt-2 text-xs text-muted">
                Email: {preview.invitation.email}
              </p>
            </div>

            {preview.invitation.status !== "pending" ? (
              <p className="text-sm text-red-400">
                This invitation is {preview.invitation.status}.
              </p>
            ) : (
              <>
                <label className="block text-xs font-medium text-muted">
                  Display name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
                  />
                </label>
                {error ? <p className="text-xs text-red-400">{error}</p> : null}
                <Button
                  type="button"
                  className="w-full"
                  disabled={busy}
                  onClick={() => void accept()}
                >
                  {busy ? "Joining…" : "Accept invitation"}
                </Button>
              </>
            )}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">Loading invitation…</p>
        )}
      </div>
    </div>
  );
}
