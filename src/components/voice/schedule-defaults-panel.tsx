"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_AFTERNOON_HOUR,
  DEFAULT_CALLBACK_TIMEZONE,
  DEFAULT_MORNING_HOUR,
  DEFAULT_SCHEDULE_SLOTS,
  type DefaultScheduleSlotId,
} from "@/types/calling-agent";
import type { WorkspaceSettings } from "@/types/workspace-settings";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold";

type SchedulePrefs = {
  voiceCallbackTimezone: string;
  voiceMorningHour: number;
  voiceAfternoonHour: number;
  voiceScheduleSlotIds: DefaultScheduleSlotId[];
};

function prefsFromSettings(s: Partial<WorkspaceSettings> | null): SchedulePrefs {
  const enabled =
    s?.voiceScheduleSlotIds?.length
      ? s.voiceScheduleSlotIds
      : DEFAULT_SCHEDULE_SLOTS.filter((slot) => slot.enabled).map((slot) => slot.id);
  return {
    voiceCallbackTimezone: s?.voiceCallbackTimezone?.trim() || DEFAULT_CALLBACK_TIMEZONE,
    voiceMorningHour: s?.voiceMorningHour ?? DEFAULT_MORNING_HOUR,
    voiceAfternoonHour: s?.voiceAfternoonHour ?? DEFAULT_AFTERNOON_HOUR,
    voiceScheduleSlotIds: enabled,
  };
}

export function ScheduleDefaultsPanel() {
  const [prefs, setPrefs] = useState<SchedulePrefs>(() => prefsFromSettings(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/voice/config");
        if (!res.ok) return;
        const data = (await res.json()) as { settings: WorkspaceSettings };
        if (!cancelled) setPrefs(prefsFromSettings(data.settings));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(next: SchedulePrefs) {
    setPrefs(next);
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/voice/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        throw new Error(data.error?.message ?? "Save failed");
      }
      const data = (await res.json()) as { settings: WorkspaceSettings };
      setPrefs(prefsFromSettings(data.settings));
      setMessage("Saved");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function toggleSlot(id: DefaultScheduleSlotId) {
    const has = prefs.voiceScheduleSlotIds.includes(id);
    const nextIds = has
      ? prefs.voiceScheduleSlotIds.filter((slot) => slot !== id)
      : [...prefs.voiceScheduleSlotIds, id];
    void save({
      ...prefs,
      voiceScheduleSlotIds: nextIds.length ? nextIds : ["next_morning"],
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Default call times</p>
          <p className="mt-0.5 text-xs text-muted">
            Used when a customer says “call me later” without a clock time. Named times
            on the call still win.
          </p>
        </div>
        {saving ? (
          <span className="text-[10px] text-dim">Saving…</span>
        ) : message ? (
          <span className="text-[10px] text-muted">{message}</span>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-muted">Loading schedule defaults…</p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block text-xs text-muted sm:col-span-3">
            Timezone
            <input
              className={`${inputClass} mt-1`}
              value={prefs.voiceCallbackTimezone}
              onChange={(e) =>
                setPrefs((prev) => ({
                  ...prev,
                  voiceCallbackTimezone: e.target.value,
                }))
              }
              onBlur={() => void save(prefs)}
            />
          </label>
          <label className="block text-xs text-muted">
            Morning hour
            <input
              type="number"
              min={0}
              max={23}
              className={`${inputClass} mt-1`}
              value={prefs.voiceMorningHour}
              onChange={(e) =>
                setPrefs((prev) => ({
                  ...prev,
                  voiceMorningHour: Number(e.target.value),
                }))
              }
              onBlur={() => void save(prefs)}
            />
          </label>
          <label className="block text-xs text-muted">
            Afternoon hour
            <input
              type="number"
              min={0}
              max={23}
              className={`${inputClass} mt-1`}
              value={prefs.voiceAfternoonHour}
              onChange={(e) =>
                setPrefs((prev) => ({
                  ...prev,
                  voiceAfternoonHour: Number(e.target.value),
                }))
              }
              onBlur={() => void save(prefs)}
            />
          </label>
          <div className="sm:col-span-3">
            <p className="text-xs text-muted">Enabled slots</p>
            <ul className="mt-2 space-y-2">
              {DEFAULT_SCHEDULE_SLOTS.map((slot) => (
                <li key={slot.id}>
                  <label className="flex items-start gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={prefs.voiceScheduleSlotIds.includes(slot.id)}
                      onChange={() => toggleSlot(slot.id)}
                    />
                    <span>{slot.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
