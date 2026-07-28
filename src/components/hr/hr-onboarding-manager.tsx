"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HrPageHeader } from "@/components/hr/hr-nav";
import { HrDataTable, HrPanel, HrStatStrip, HrStatusChip } from "@/components/hr/hr-ui";
import type { OnboardingDashboard } from "@/types/onboarding";

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

  async function runAction(
    id: string,
    action: "send" | "mark_signed" | "ceo_complete"
  ) {
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

  const { stats, candidates, ceoQueue } = dashboard;

  return (
    <div className="space-y-5">
      <HrPageHeader
        title="Onboarding"
        description="Offer, ICA, NDA and declaration packs — native HR workflow in Aarvanta OS."
      />

      <HrStatStrip
        items={[
          { label: "Total", value: stats.total, tone: "cyan" },
          { label: "Not sent", value: stats.notSent, tone: "amber" },
          { label: "Awaiting", value: stats.awaiting, tone: "gold" },
          { label: "CEO queue", value: stats.awaitingCeo, tone: "cyan" },
          { label: "Completed", value: stats.completed, tone: "teal" },
        ]}
      />

      <HrPanel title="Add onboarding candidate" description="Creates a pack-ready profile in the native store.">
        <form onSubmit={addCandidate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
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
        {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
      </HrPanel>

      {ceoQueue.length > 0 ? (
        <HrPanel title="CEO countersign queue" description="After candidate signature, complete onboarding.">
          <ul className="space-y-2">
            {ceoQueue.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[color:var(--hr-offer)]/30 bg-[color:var(--hr-offer-soft)] px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.role} · {item.email}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => void runAction(item.id, "ceo_complete")}
                >
                  Mark completed
                </Button>
              </li>
            ))}
          </ul>
        </HrPanel>
      ) : null}

      <HrDataTable
        columns={[
          { key: "candidate", label: "Candidate" },
          { key: "role", label: "Role" },
          { key: "status", label: "Status" },
          { key: "start", label: "Start" },
          { key: "actions", label: "" },
        ]}
        rows={candidates.map((c) => ({
          id: c.id,
          cells: {
            candidate: (
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted">{c.email}</p>
              </div>
            ),
            role: c.role,
            status: <HrStatusChip label={c.status} tone="pending" />,
            start: c.startDate ?? "—",
            actions: (
              <div className="flex flex-wrap gap-1.5">
                {c.status === "not_sent" ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => void runAction(c.id, "send")}
                  >
                    Send pack
                  </Button>
                ) : null}
                {c.status === "awaiting" || c.status === "opened" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void runAction(c.id, "mark_signed")}
                  >
                    Mark signed
                  </Button>
                ) : null}
                {c.status === "awaiting_ceo" ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => void runAction(c.id, "ceo_complete")}
                  >
                    CEO complete
                  </Button>
                ) : null}
                {c.archivedFiles.length > 0 ? (
                  <span className="self-center text-[10px] text-muted">
                    {c.archivedFiles.length} file(s)
                  </span>
                ) : null}
              </div>
            ),
          },
        }))}
        empty="No onboarding candidates yet."
      />
    </div>
  );
}
