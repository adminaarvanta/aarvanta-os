"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { HrPageHeader } from "@/components/hr/hr-nav";
import { HrDataTable, HrPanel, HrStatusChip } from "@/components/hr/hr-ui";
import type {
  HrEmployee,
  HrExitCase,
  HrLeaveRequest,
  HrPunch,
} from "@/types/platform-modules";

export function HrEmployeesClient({
  initialEmployees,
}: {
  initialEmployees: HrEmployee[];
}) {
  const active = initialEmployees.filter((e) => e.status !== "exited");
  return (
    <div className="space-y-5">
      <HrPageHeader
        title="Employees"
        description="Active roster linked to payroll, leave, punch, and exit."
      />
      <HrDataTable
        columns={[
          { key: "name", label: "Employee" },
          { key: "role", label: "Role" },
          { key: "start", label: "Start" },
          { key: "leave", label: "Leave bal." },
          { key: "status", label: "Status" },
        ]}
        rows={active.map((e) => ({
          id: e.id,
          cells: {
            name: (
              <div>
                <p className="font-medium">{e.name}</p>
                <p className="text-xs text-muted">{e.email ?? e.department}</p>
              </div>
            ),
            role: `${e.role} · ${e.department}`,
            start: e.startDate,
            leave: e.leaveBalance,
            status: (
              <HrStatusChip
                label={e.status ?? "active"}
                tone={e.status === "exited" ? "exit" : "active"}
              />
            ),
          },
        }))}
        empty="No employees on the roster."
      />
    </div>
  );
}

export function HrPunchClient({
  employees,
  initialPunches,
}: {
  employees: HrEmployee[];
  initialPunches: HrPunch[];
}) {
  const router = useRouter();
  const [punches, setPunches] = useState(initialPunches);
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  async function punch(type: "in" | "out") {
    if (!employeeId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/hr/punches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, type }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { punch: HrPunch };
      setPunches((prev) => [data.punch, ...prev]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 500);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const sorted = [...punches].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <div className="space-y-5">
      <HrPageHeader
        title="Punch"
        description="Clock in and out for the roster. Attendance builds from these events."
      />
      <HrPanel title="Clock control">
        <div className="flex flex-col items-center gap-4 py-4">
          <select
            className="w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            {employees
              .filter((e) => e.status !== "exited")
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
          </select>
          <div
            className={`flex h-36 w-36 flex-col items-center justify-center rounded-full border-4 border-[color:var(--hr-punch)] bg-[color:var(--hr-punch-soft)] text-[color:var(--hr-punch)] ${
              success ? "hr-punch-success" : ""
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-wide">Now</span>
            <span className="text-2xl font-semibold tabular-nums">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex gap-3">
            <Button disabled={busy || !employeeId} onClick={() => void punch("in")}>
              Punch in
            </Button>
            <Button
              variant="secondary"
              disabled={busy || !employeeId}
              onClick={() => void punch("out")}
            >
              Punch out
            </Button>
          </div>
        </div>
      </HrPanel>
      <HrDataTable
        columns={[
          { key: "who", label: "Employee" },
          { key: "type", label: "Type" },
          { key: "at", label: "When" },
        ]}
        rows={sorted.slice(0, 40).map((p) => ({
          id: p.id,
          cells: {
            who: p.employeeName,
            type: <HrStatusChip label={p.type === "in" ? "In" : "Out"} tone="active" />,
            at: new Date(p.at).toLocaleString(),
          },
        }))}
        empty="No punches yet."
      />
    </div>
  );
}

export function HrAttendanceClient({
  employees,
  punches,
  leaveRequests,
}: {
  employees: HrEmployee[];
  punches: HrPunch[];
  leaveRequests: HrLeaveRequest[];
}) {
  const days = useMemo(() => {
    const out: string[] = [];
    const start = new Date();
    start.setDate(1);
    const month = start.getMonth();
    while (start.getMonth() === month) {
      out.push(start.toISOString().slice(0, 10));
      start.setDate(start.getDate() + 1);
    }
    return out;
  }, []);

  const active = employees.filter((e) => e.status !== "exited");

  function dayStatus(employeeId: string, day: string): "present" | "leave" | "absent" | "empty" {
    const onLeave = leaveRequests.some(
      (l) =>
        l.employeeId === employeeId &&
        l.status === "approved" &&
        l.startDate <= day &&
        l.endDate >= day
    );
    if (onLeave) return "leave";
    const hasPunch = punches.some(
      (p) => p.employeeId === employeeId && p.at.slice(0, 10) === day && p.type === "in"
    );
    if (hasPunch) return "present";
    const today = new Date().toISOString().slice(0, 10);
    if (day > today) return "empty";
    return "absent";
  }

  const color = {
    present: "bg-[color:var(--hr-hired)]",
    leave: "bg-[color:var(--hr-leave)]",
    absent: "bg-[color:var(--hr-late)]/70",
    empty: "bg-surface-muted",
  };

  return (
    <div className="space-y-5">
      <HrPageHeader
        title="Attendance"
        description="Month grid from punches and approved leave."
      />
      <HrPanel title="This month">
        <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <i className={`h-2.5 w-2.5 rounded-sm ${color.present}`} /> Present
          </span>
          <span className="flex items-center gap-1.5">
            <i className={`h-2.5 w-2.5 rounded-sm ${color.leave}`} /> Leave
          </span>
          <span className="flex items-center gap-1.5">
            <i className={`h-2.5 w-2.5 rounded-sm ${color.absent}`} /> Absent / no punch
          </span>
        </div>
        <div className="space-y-3 overflow-x-auto">
          {active.map((emp) => (
            <div key={emp.id} className="min-w-[640px]">
              <p className="mb-1 text-sm font-medium text-foreground">{emp.name}</p>
              <div className="flex flex-wrap gap-0.5">
                {days.map((day) => {
                  const st = dayStatus(emp.id, day);
                  return (
                    <span
                      key={day}
                      title={`${day}: ${st}`}
                      className={`h-3 w-3 rounded-sm ${color[st]}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </HrPanel>
    </div>
  );
}

export function HrLeaveClient({
  employees,
  initialLeave,
}: {
  employees: HrEmployee[];
  initialLeave: HrLeaveRequest[];
}) {
  const router = useRouter();
  const [leave, setLeave] = useState(initialLeave);
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [leaveType, setLeaveType] = useState<"annual" | "sick" | "unpaid" | "other">("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState(1);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/hr/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, leaveType, startDate, endDate, days, reason }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { leaveRequest: HrLeaveRequest };
      setLeave((prev) => [data.leaveRequest, ...prev]);
      setReason("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function decide(id: string, action: "approve" | "reject") {
    setBusy(true);
    try {
      const res = await fetch("/api/hr/leave", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { leaveRequest: HrLeaveRequest };
      setLeave((prev) => prev.map((l) => (l.id === id ? data.leaveRequest : l)));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <HrPageHeader title="Leave" description="Request, approve, and track balances." />
      <HrPanel title="New leave request">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            {employees
              .filter((e) => e.status !== "exited")
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.leaveBalance} days)
                </option>
              ))}
          </select>
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as typeof leaveType)}
          >
            <option value="annual">Annual</option>
            <option value="sick">Sick</option>
            <option value="unpaid">Unpaid</option>
            <option value="other">Other</option>
          </select>
          <input
            type="number"
            min={0.5}
            step={0.5}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
          <input
            type="date"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <input
            type="date"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <Button type="submit" disabled={busy} className="w-fit">
            Submit request
          </Button>
        </form>
      </HrPanel>
      <HrDataTable
        columns={[
          { key: "who", label: "Employee" },
          { key: "range", label: "Dates" },
          { key: "status", label: "Status" },
          { key: "actions", label: "" },
        ]}
        rows={leave.map((l) => ({
          id: l.id,
          cells: {
            who: (
              <div>
                <p className="font-medium">{l.employeeName}</p>
                <p className="text-xs text-muted">
                  {l.leaveType} · {l.days}d
                </p>
              </div>
            ),
            range: `${l.startDate} → ${l.endDate}`,
            status: (
              <HrStatusChip
                label={l.status}
                tone={
                  l.status === "approved"
                    ? "approved"
                    : l.status === "rejected"
                      ? "rejected"
                      : "pending"
                }
              />
            ),
            actions:
              l.status === "pending" ? (
                <div className="flex gap-1.5">
                  <Button size="sm" disabled={busy} onClick={() => void decide(l.id, "approve")}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void decide(l.id, "reject")}
                  >
                    Reject
                  </Button>
                </div>
              ) : null,
          },
        }))}
        empty="No leave requests."
      />
    </div>
  );
}

export function HrExitClient({
  employees,
  initialExits,
}: {
  employees: HrEmployee[];
  initialExits: HrExitCase[];
}) {
  const router = useRouter();
  const [exits, setExits] = useState(initialExits);
  const [employeeId, setEmployeeId] = useState(
    employees.find((e) => e.status !== "exited")?.id ?? ""
  );
  const [lastDay, setLastDay] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/hr/exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, lastDay, reason }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { exitCase: HrExitCase };
      setExits((prev) => [data.exitCase, ...prev]);
      setReason("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <HrPageHeader
        title="Exit"
        description="Resignation or termination — generates relieving and experience letters."
      />
      <HrPanel title="Start exit case" description="Marks the employee exited and finalises leaving documents.">
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <select
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            {employees
              .filter((e) => e.status !== "exited")
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
          </select>
          <input
            type="date"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            value={lastDay}
            onChange={(e) => setLastDay(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold sm:col-span-2"
            placeholder="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          <Button type="submit" disabled={busy || !employeeId} className="w-fit">
            Complete exit + generate docs
          </Button>
        </form>
      </HrPanel>
      <HrDataTable
        columns={[
          { key: "who", label: "Employee" },
          { key: "last", label: "Last day" },
          { key: "status", label: "Status" },
        ]}
        rows={exits.map((x) => ({
          id: x.id,
          cells: {
            who: (
              <div>
                <p className="font-medium">{x.employeeName}</p>
                <p className="text-xs text-muted">{x.reason}</p>
              </div>
            ),
            last: x.lastDay,
            status: <HrStatusChip label={x.status} tone="exit" />,
          },
        }))}
        empty="No exit cases yet."
      />
    </div>
  );
}
