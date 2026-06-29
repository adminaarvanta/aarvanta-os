"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/os/panel";
import { SectionHeader } from "@/components/ui/os/section-header";

export function HrAutomationToggle({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    try {
      const res = await fetch("/api/hr/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inboxAutomationEnabled: !enabled }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          settings: { inboxAutomationEnabled: boolean };
        };
        setEnabled(data.settings.inboxAutomationEnabled);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeader
          title="Inbox HR automation"
          description="AI triages support conversations, generates documents, and auto-sends low-risk cases."
          className="mb-0"
        />
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={saving}
          onClick={toggle}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-gold/80" : "bg-surface-muted ring-1 ring-border"
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-foreground transition-transform ${
              enabled ? "left-[22px]" : "left-0.5"
            }`}
          />
          <span className="sr-only">Toggle inbox HR automation</span>
        </button>
      </div>
    </Panel>
  );
}
