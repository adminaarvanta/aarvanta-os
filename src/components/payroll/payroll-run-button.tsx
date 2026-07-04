"use client";

import { useState } from "react";
import { Banknote } from "lucide-react";

export function PayrollRunButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runPayroll() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/payroll", { method: "POST", body: "{}" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message ?? "Payroll failed");
      }
      setMessage(
        `Processed ${data.payRun.employeeCount} employees — gross £${data.payRun.grossTotal.toLocaleString()}`
      );
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Payroll failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={runPayroll}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#F9E076] disabled:opacity-50"
      >
        <Banknote className="h-4 w-4" />
        {loading ? "Running…" : "Run UK payroll"}
      </button>
      {message ? <p className="text-xs text-[#A89878]">{message}</p> : null}
    </div>
  );
}
