"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CrmContactInsights } from "@/lib/ai/crm-insights";

export function CrmAiInsightsPanel({ contactId }: { contactId: string }) {
  const [insights, setInsights] = useState<CrmContactInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [dispatched, setDispatched] = useState(0);

  async function loadInsights() {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/insights`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setInsights(data.insights);
        setDispatched(0);
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendToAiTeam() {
    setDispatching(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dispatch: true }),
      });
      const data = (await res.json()) as {
        insights?: CrmContactInsights;
        dispatched?: string[];
      };
      if (res.ok) {
        if (data.insights) setInsights(data.insights);
        setDispatched(data.dispatched?.length ?? 0);
      }
    } finally {
      setDispatching(false);
    }
  }

  useEffect(() => {
    void loadInsights();
    // Refresh when the person record changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  return (
    <section className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/10 via-surface-elevated to-surface-elevated p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-gold/15 p-2 ring-1 ring-gold/30">
            <Sparkles className="h-4 w-4 text-gold" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI insights</h3>
            <p className="text-xs text-muted">
              Lead summary — send actions to AI Team to run them
            </p>
          </div>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => void loadInsights()} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {loading && !insights ? (
        <p className="mt-4 text-sm text-muted">Generating insights…</p>
      ) : insights ? (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-muted">Lead summary</p>
            <p className="mt-1 text-sm text-foreground">{insights.summary}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted">Suggested actions</p>
            <ul className="mt-2 space-y-2">
              {insights.suggestedActions.map((action) => (
                <li key={action} className="flex gap-2 text-sm text-muted">
                  <span className="text-gold">→</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={dispatching || insights.suggestedActions.length === 0}
              onClick={() => void sendToAiTeam()}
            >
              {dispatching ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Workflow className="mr-1.5 h-3.5 w-3.5" />
              )}
              Send to AI Team
            </Button>
            {dispatched > 0 ? (
              <p className="text-xs text-gold">
                {dispatched} action{dispatched === 1 ? "" : "s"} queued for AI Sales Manager.
              </p>
            ) : (
              <p className="text-xs text-muted">
                CRM stays read-only until you send work, or the brain picks it up.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
