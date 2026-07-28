"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { HrDataTable, HrPanel, HrStatusChip } from "@/components/hr/hr-ui";
import { HrPageHeader } from "@/components/hr/hr-nav";
import type { HrCandidate, HrJob } from "@/types/platform-modules";

export function HrJobsClient({
  initialJobs,
}: {
  initialJobs: HrJob[];
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Sales");
  const [requirements, setRequirements] = useState("");
  const [busy, setBusy] = useState(false);

  async function createJob(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/hr/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, department, requirements }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { job: HrJob };
      setJobs((prev) => [data.job, ...prev]);
      setTitle("");
      setRequirements("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: HrJob["status"]) {
    const res = await fetch(`/api/hr/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { job: HrJob };
    setJobs((prev) => prev.map((j) => (j.id === id ? data.job : j)));
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <HrPageHeader
        title="Jobs"
        description="Post role requirements and manage open positions."
      />
      <HrPanel title="Post a job" description="JD goes live in the Candidates pipeline.">
        <form onSubmit={createJob} className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            placeholder="Job title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            placeholder="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
          />
          <textarea
            className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold sm:col-span-2"
            placeholder="Requirements / job description"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            required
          />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Posting…" : "Post job"}
            </Button>
          </div>
        </form>
      </HrPanel>

      <HrDataTable
        columns={[
          { key: "title", label: "Role" },
          { key: "department", label: "Dept" },
          { key: "status", label: "Status" },
          { key: "actions", label: "" },
        ]}
        rows={jobs.map((job) => ({
          id: job.id,
          cells: {
            title: (
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="text-xs text-muted line-clamp-1">{job.requirements}</p>
              </div>
            ),
            department: job.department,
            status: (
              <HrStatusChip
                label={job.status}
                tone={job.status === "open" ? "open" : job.status === "closed" ? "rejected" : "pending"}
              />
            ),
            actions: (
              <div className="flex gap-2">
                {job.status !== "open" ? (
                  <Button size="sm" variant="secondary" onClick={() => void setStatus(job.id, "open")}>
                    Open
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => void setStatus(job.id, "closed")}>
                    Close
                  </Button>
                )}
              </div>
            ),
          },
        }))}
        empty="No jobs yet — post your first requirement above."
      />
    </div>
  );
}

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
      if (!res.ok) {
        setMessage("Import failed");
        return;
      }
      const data = (await res.json()) as { imported: number };
      setMessage(`Imported ${data.imported} candidates from spreadsheet.`);
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
        description="ATS pipeline with Excel import. Hire creates an employee + onboarding case."
        actions={
          <div className="flex gap-2">
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
          </div>
        }
      />
      {message ? <p className="text-sm text-[color:var(--hr-hired)]">{message}</p> : null}

      <HrPanel title="Add candidate" description="Or sync from a spreadsheet (Name, Email, Role, Status).">
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
        <p className="mt-3 text-xs text-muted">
          Google Sheets: paste export as .xlsx/.csv for Phase 1, or connect Sheet ID later in settings.
        </p>
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
