"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/os/panel";
import { SectionHeader } from "@/components/ui/os/section-header";
import type { WorkspaceSettings } from "@/types/workspace-settings";

type ToggleProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
};

function SettingToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border-subtle py-4 last:border-0 last:pb-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          checked ? "bg-gold/80" : "bg-surface-muted ring-1 ring-border"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-foreground transition-transform ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function WorkspaceSettingsPanel({
  initialSettings,
  canManage,
}: {
  initialSettings: WorkspaceSettings;
  canManage: boolean;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [threshold, setThreshold] = useState(String(initialSettings.crmQualificationThreshold));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function patch(patch: Partial<WorkspaceSettings>) {
    if (!canManage) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        throw new Error(data.error?.message ?? "Save failed");
      }
      const data = (await res.json()) as { settings: WorkspaceSettings };
      setSettings(data.settings);
      setThreshold(String(data.settings.crmQualificationThreshold));
      setMessage("Settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveThreshold() {
    const value = Number.parseInt(threshold, 10);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      setMessage("Threshold must be between 0 and 100.");
      return;
    }
    await patch({ crmQualificationThreshold: value });
  }

  return (
    <Panel>
      <SectionHeader
        title="Workspace automation"
        description="Global toggles for inbox AI, HR document automation, and CRM lead qualification."
      />
      {!canManage && (
        <p className="mb-4 text-xs text-muted">
          You can view these settings. An admin or owner can change them.
        </p>
      )}
      {message && (
        <p className="mb-4 rounded-lg border border-gold/25 bg-gold/10 px-3 py-2 text-xs text-gold-bright">
          {message}
        </p>
      )}
      <SettingToggle
        label="Inbox HR automation"
        description="AI triages support conversations, generates HR documents, and routes high-risk cases for approval."
        checked={settings.inboxAutomationEnabled}
        disabled={!canManage || saving}
        onChange={(value) => patch({ inboxAutomationEnabled: value })}
      />
      <SettingToggle
        label="Auto summarize inbound messages"
        description="After each inbound message, refresh AI summary, sentiment, and intent on the conversation."
        checked={settings.aiAutoSummarize}
        disabled={!canManage || saving}
        onChange={(value) => patch({ aiAutoSummarize: value })}
      />
      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border-subtle pt-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">CRM lead score threshold</p>
          <p className="mt-0.5 text-xs text-muted">
            Minimum qualification score (0–100) before auto-creating a CRM lead from sales intent.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            disabled={!canManage || saving}
            className="w-20 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          />
          <button
            type="button"
            onClick={saveThreshold}
            disabled={!canManage || saving}
            className="rounded-lg bg-gold/15 px-3 py-2 text-xs font-medium text-gold-bright ring-1 ring-gold/25 hover:bg-gold/25 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </Panel>
  );
}
