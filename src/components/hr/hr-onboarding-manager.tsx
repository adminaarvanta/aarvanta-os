"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/os/panel";
import { SectionHeader } from "@/components/ui/os/section-header";
import type { OnboardingDashboard } from "@/types/onboarding";

const STATUS_LABEL: Record<string, string> = {
  not_sent: "Not sent",
  awaiting: "Awaiting signature",
  opened: "Opened",
  awaiting_ceo: "Awaiting CEO",
  completed: "Completed",
  declined: "Declined",
};

export function HrOnboardingManager({
  initial,
}: {
  initial: OnboardingDashboard;
}) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("BDM");
  const [startDate, setStartDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/hr/onboarding");
    if (res.ok) {
      setDashboard((await res.json()) as OnboardingDashboard);
    }
    router.refresh();
  }

  async function addCandidate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/hr/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role,
          startDate: startDate || undefined,
        }),
      });
      if (!res.ok) {
        setError("Could not add candidate");
        return;
      }
      setName("");
      setEmail("");
      setStartDate("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function runAction(id: string, action: "send" | "ceo_complete") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/hr/onboarding/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        setError("Action failed");
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const { stats, candidates, ceoQueue, mode, sidecarConfigured } = dashboard;

  return (
    <Panel padding="none">
      <div className="border-b border-border-subtle px-4 py-3 sm:px-5">
        <SectionHeader
          title="HR Manager · Onboarding"
          description="Offer, ICA, NDA & declaration packs — powered by Aarvanta onboarding automation."
          className="mb-0"
        />
        <p className="mt-2 text-xs text-muted">
          Mode:{" "}
          <span className="font-medium text-foreground">
            {mode === "sidecar" ? "Live sidecar" : "Demo (local)"}
          </span>
          {sidecarConfigured
            ? " · ONBOARDING_SIDECAR_URL configured"
            : " · Set ONBOARDING_SIDECAR_URL to connect the Python worker"}
        </p>
      </div>

      <div className="grid gap-3 border-b border-border-subtle p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-5">
        {[
          { label: "Total", value: stats.total },
          { label: "Not sent", value: stats.notSent },
          { label: "Awaiting", value: stats.awaiting },
          { label: "CEO queue", value: stats.awaitingCeo },
          { label: "Completed", value: stats.completed },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2"
          >
            <p className="text-[10px] uppercase tracking-wide text-muted">{item.label}</p>
            <p className="text-lg font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6 p-4 sm:p-5">
        <form
          onSubmit={addCandidate}
          className="grid gap-3 rounded-xl border border-border bg-surface-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <input
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold lg:col-span-1"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option>BDM</option>
            <option>Sales Ex</option>
            <option>Content Creator</option>
            <option>Digital Marketing</option>
          </select>
          <input
            type="date"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Button type="submit" size="sm" disabled={busy}>
            Add candidate
          </Button>
        </form>

        {error && <p className="text-xs text-danger">{error}</p>}

        {ceoQueue.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              CEO countersign queue
            </h3>
            <ul className="space-y-2">
              {ceoQueue.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold/30 bg-gold/5 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted">
                      {item.role} · {item.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.ceoSigningLink && (
                      <a
                        href={item.ceoSigningLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-hover"
                      >
                        Open DocuSeal
                      </a>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => runAction(item.id, "ceo_complete")}
                    >
                      Mark completed
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Onboarding pipeline
          </h3>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border bg-surface-muted text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Candidate</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Start</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {candidates.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2">
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted">{c.email}</p>
                    </td>
                    <td className="px-3 py-2 text-muted">{c.role}</td>
                    <td className="px-3 py-2">
                      <Badge className="bg-surface-muted text-muted ring-border text-[10px]">
                        {STATUS_LABEL[c.status] ?? c.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-muted">{c.startDate ?? "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        {c.status === "not_sent" && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy}
                            onClick={() => runAction(c.id, "send")}
                          >
                            Send pack
                          </Button>
                        )}
                        {c.signingLink && c.status !== "completed" && (
                          <a
                            href={c.signingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-border px-2 py-1 text-xs text-foreground hover:bg-surface-hover"
                          >
                            Signing link
                          </a>
                        )}
                        {c.archivedFiles.length > 0 && (
                          <span className="text-[10px] text-muted">
                            {c.archivedFiles.length} signed file(s)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Panel>
  );
}
