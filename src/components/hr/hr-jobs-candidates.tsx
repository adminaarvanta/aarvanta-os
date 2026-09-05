"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { HrDataTable, HrPanel, HrStatusChip } from "@/components/hr/hr-ui";
import { HrPageHeader } from "@/components/hr/hr-nav";
import type { HrCandidate, HrJob } from "@/types/platform-modules";

export function HrCandidatesClient({
  initialCandidates,
  jobs,
}: {
  initialCandidates: HrCandidate[];
  jobs: HrJob[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [candidates, setCandidates] = useState(initialCandidates);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [showSheet, setShowSheet] = useState(false);

  async function refreshList() {
    const res = await fetch("/api/hr/candidates");
    if (res.ok) {
      const data = (await res.json()) as { candidates: HrCandidate[] };
      setCandidates(data.candidates);
    }
    router.refresh();
  }

  async function addCandidate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/hr/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email || undefined, role, jobId: jobId || undefined }),
      });
      if (!res.ok) {
        setMessage("Could not add candidate");
        return;
      }
      setName("");
      setEmail("");
      setRole("");
      await refreshList();
    } finally {
      setBusy(false);
    }
  }

  async function runAction(id: string, action: "advance" | "reject" | "hire") {
    setBusy(true);
    try {
      const res = await fetch("/api/hr/candidates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) return;
      await refreshList();
      if (action === "hire") setMessage("Hired — onboarding pack created when email present.");
    } finally {
      setBusy(false);
    }
  }

  async function importFile(file: File) {
    setBusy(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/hr/candidates/import", { method: "POST", body: form });
      const data = (await res.json()) as { imported?: number; error?: string };
      if (!res.ok) {
        setMessage(typeof data.error === "string" ? data.error : "Import failed");
        return;
      }
      setMessage(`Imported ${data.imported ?? 0} candidates from spreadsheet.`);
      await refreshList();
    } finally {
      setBusy(false);
    }
  }

  async function importSheet(e: React.FormEvent) {
    e.preventDefault();
    if (!sheetUrl.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("sheetUrl", sheetUrl.trim());
      const res = await fetch("/api/hr/candidates/import", { method: "POST", body: form });
      const data = (await res.json()) as {
        imported?: number;
        error?: string;
        source?: string;
      };
      if (!res.ok) {
        setMessage(typeof data.error === "string" ? data.error : "Sheet import failed");
        return;
      }
      setMessage(
        `Imported ${data.imported ?? 0} candidates from Google Sheets.`
      );
      setSheetUrl("");
      setShowSheet(false);
      await refreshList();
    } finally {
      setBusy(false);
    }
  }

  const jobTitle = (id?: string) => jobs.find((j) => j.id === id)?.title ?? "—";

  return (
    <div className="space-y-5">
      <HrPageHeader
        title="Candidates"
        description="ATS pipeline with Excel or Google Sheets import. Hire creates an employee + onboarding case."
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importFile(f);
              }}
            />
            <Button variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
              Import Excel
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setShowSheet((v) => !v)}
            >
              Link Google Sheet
            </Button>
          </div>
        }
      />
      {message ? <p className="text-sm text-[color:var(--hr-hired)]">{message}</p> : null}

      {showSheet ? (
        <HrPanel
          title="Google Sheets"
          description="Paste a sheet link shared as Anyone with the link → Viewer. Columns: Name, Email, Role, Status."
        >
          <form onSubmit={importSheet} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
              required
            />
            <Button type="submit" disabled={busy || !sheetUrl.trim()}>
              {busy ? "Importing…" : "Import sheet"}
            </Button>
          </form>
        </HrPanel>
      ) : null}

      <HrPanel title="Add candidate" description="Or sync from Excel / Google Sheets (Name, Email, Role, Status).">
        <form onSubmit={addCandidate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          />
          <input
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            placeholder="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          />
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
          >
            <option value="">No job link</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={busy} className="sm:col-span-2 lg:col-span-4 w-fit">
            Add to pipeline
          </Button>
        </form>
      </HrPanel>

      <HrDataTable
        columns={[
          { key: "name", label: "Candidate" },
          { key: "job", label: "Job" },
          { key: "score", label: "Score" },
          { key: "status", label: "Stage" },
          { key: "actions", label: "" },
        ]}
        rows={candidates.map((c) => ({
          id: c.id,
          cells: {
            name: (
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted">{c.email ?? c.role}</p>
              </div>
            ),
            job: jobTitle(c.jobId),
            score: c.score,
            status: <HrStatusChip label={c.status} tone={c.status} />,
            actions: (
              <div className="flex flex-wrap gap-1.5">
                {c.status !== "hired" && c.status !== "rejected" ? (
                  <>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => void runAction(c.id, "advance")}>
                      Advance
                    </Button>
                    <Button size="sm" disabled={busy} onClick={() => void runAction(c.id, "hire")}>
                      Hire
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => void runAction(c.id, "reject")}>
                      Reject
                    </Button>
                  </>
                ) : null}
              </div>
            ),
          },
        }))}
        empty="No candidates yet."
      />
    </div>
  );
}
