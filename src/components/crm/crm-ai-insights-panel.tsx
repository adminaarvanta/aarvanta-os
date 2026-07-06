"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CrmContactInsights } from "@/lib/ai/crm-insights";

export function CrmAiInsightsPanel({ contactId }: { contactId: string }) {
  const [insights, setInsights] = useState<CrmContactInsights | null>(null);
  const [loading, setLoading] = useState(true);

  const loadInsights = useCallback(async () => {
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
  }, [contactId]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return (
    <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[#D4AF37]/15 p-2 ring-1 ring-[#D4AF37]/30">
            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F5E6C8]">AI insights</h3>
            <p className="text-xs text-[#A89878]">Lead summary and suggested actions</p>
          </div>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={loadInsights} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {loading && !insights ? (
        <p className="mt-4 text-sm text-[#A89878]">Generating insights…</p>
      ) : insights ? (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-[#A89878]">Lead summary</p>
            <p className="mt-1 text-sm text-[#F5E6C8]">{insights.summary}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#A89878]">Suggested actions</p>
            <ul className="mt-2 space-y-2">
              {insights.suggestedActions.map((action) => (
                <li key={action} className="flex gap-2 text-sm text-[#A89878]">
                  <span className="text-[#D4AF37]">→</span>
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
