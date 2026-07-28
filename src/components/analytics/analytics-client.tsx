"use client";

import { useState } from "react";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import {
  AnalyticsDetailLists,
  AnalyticsSecondaryStats,
} from "@/components/analytics/analytics-detail-lists";
import { AnalyticsKpiBand } from "@/components/analytics/analytics-kpi-band";
import { Button } from "@/components/ui/button";
import type { AnalyticsSnapshot, ReportPeriod } from "@/types/analytics";

export function AnalyticsClient({
  initialSnapshot,
}: {
  initialSnapshot: AnalyticsSnapshot;
}) {
  const [period, setPeriod] = useState<ReportPeriod>(initialSnapshot.period);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [loading, setLoading] = useState(false);

  async function loadPeriod(p: ReportPeriod) {
    setLoading(true);
    setPeriod(p);
    try {
      const res = await fetch(`/api/analytics?period=${p}`);
      if (res.ok) setSnapshot(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function exportReport(format: "csv" | "pdf" | "excel") {
    window.open(`/api/analytics/export?period=${period}&format=${format}`, "_blank");
  }

  return (
    <div className={`space-y-6 ${loading ? "opacity-70 transition-opacity" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 rounded-xl border border-border bg-surface-muted p-1">
          {(["daily", "weekly", "monthly"] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => loadPeriod(p)}
              disabled={loading}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
                period === p
                  ? "bg-gold/20 font-medium text-gold-bright shadow-sm ring-1 ring-gold/35"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => exportReport("csv")}>
            Export CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={() => exportReport("pdf")}>
            PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={() => exportReport("excel")}>
            Excel
          </Button>
        </div>
      </div>

      <AnalyticsKpiBand snapshot={snapshot} />

      <AnalyticsCharts snapshot={snapshot} />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Operations snapshot</h3>
        <AnalyticsSecondaryStats snapshot={snapshot} />
      </div>

      <AnalyticsDetailLists snapshot={snapshot} />
    </div>
  );
}
