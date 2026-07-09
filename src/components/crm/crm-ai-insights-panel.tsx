"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CrmContactInsights } from "@/lib/ai/crm-insights";

export function CrmAiInsightsPanel({ contactId }: { contactId: string }) {
  const [insights, setInsights] = useState<CrmContactInsights | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadInsights() {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/insights`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) setInsights(data.insights);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInsights();
  }, [contactId]);

  return (
    <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[#B8965D]/15 p-2 ring-1 ring-[#B8965D]/30">
            <Sparkles className="h-4 w-4 text-[#B8965D]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#FFFFFF]">AI insights</h3>
            <p className="text-xs text-[#9AABC4]">Lead summary and suggested actions</p>
          </div>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={loadInsights} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {loading && !insights ? (
        <p className="mt-4 text-sm text-[#9AABC4]">Generating insights…</p>
      ) : insights ? (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-[#9AABC4]">Lead summary</p>
            <p className="mt-1 text-sm text-[#FFFFFF]">{insights.summary}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#9AABC4]">Suggested actions</p>
            <ul className="mt-2 space-y-2">
              {insights.suggestedActions.map((action) => (
                <li key={action} className="flex gap-2 text-sm text-[#9AABC4]">
                  <span className="text-[#B8965D]">→</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
