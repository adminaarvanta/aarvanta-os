"use client";

import { useState } from "react";
import { HelpTip } from "@/components/ui/help-tip";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/os/panel";
import { SectionHeader } from "@/components/ui/os/section-header";
import {
  COMMON_TIMEZONES,
  COUNTRY_NAMES,
  CURRENCIES,
  DATE_FORMATS,
  LOCALES,
  TIME_FORMATS,
  countryByName,
  defaultsForCountry,
} from "@/lib/i18n/regions";
import type { WorkspaceSettings } from "@/types/workspace-settings";

export function RegionalSettingsPanel({
  initialSettings,
  canManage,
}: {
  initialSettings: WorkspaceSettings;
  canManage: boolean;
}) {
  const inferred = defaultsForCountry(
    COUNTRY_NAMES.find((name) => countryByName(name)?.code === initialSettings.countryCode)
      ?? "United Kingdom"
  );
  const [country, setCountry] = useState(
    COUNTRY_NAMES.find((name) => countryByName(name)?.code === initialSettings.countryCode)
      ?? "United Kingdom"
  );
  const [city, setCity] = useState(initialSettings.city ?? "");
  const [locale, setLocale] = useState(initialSettings.locale ?? inferred.locale);
  const [timezone, setTimezone] = useState(
    initialSettings.timezone ?? inferred.timezone
  );
  const [currency, setCurrency] = useState(
    initialSettings.defaultCurrency ?? inferred.currency
  );
  const [dateFormat, setDateFormat] = useState(
    initialSettings.dateFormat ?? "day_month_year"
  );
  const [timeFormat, setTimeFormat] = useState(initialSettings.timeFormat ?? "24h");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function applyCountry(next: string) {
    setCountry(next);
    const defaults = defaultsForCountry(next);
    setLocale(defaults.locale);
    setTimezone(defaults.timezone);
    setCurrency(defaults.currency);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: defaultsForCountry(country).code,
          city: city.trim() || undefined,
          locale,
          timezone,
          defaultCurrency: currency,
          dateFormat,
          timeFormat,
        }),
      });
      const data = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        throw new Error(data.error?.message ?? "Could not save regional settings.");
      }
      setMessage("Regional settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel>
      <SectionHeader
        title="Country & regional settings"
        description="Used for currency, dates, time, and which privacy terms apply to this workspace."
      />
      {!canManage ? (
        <p className="mt-2 text-xs text-muted">
          An owner or admin can change these. You can still see the current values.
        </p>
      ) : null}
      <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-muted">
          Country
          <select
            value={country}
            disabled={!canManage}
            onChange={(e) => applyCountry(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          >
            {COUNTRY_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          City / location
          <input
            value={city}
            disabled={!canManage}
            onChange={(e) => setCity(e.target.value)}
            placeholder="London"
            className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="block text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            Language / locale
            <HelpTip label="What locale controls">
              Locale sets number, date, and currency display. The language
              switcher still translates the rest of the app.
            </HelpTip>
          </span>
          <select
            value={locale}
            disabled={!canManage}
            onChange={(e) => setLocale(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          >
            {LOCALES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          Timezone
          <select
            value={timezone}
            disabled={!canManage}
            onChange={(e) => setTimezone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          >
            {COMMON_TIMEZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          Currency
          <select
            value={currency}
            disabled={!canManage}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          Date format
          <select
            value={dateFormat}
            disabled={!canManage}
            onChange={(e) =>
              setDateFormat(e.target.value as WorkspaceSettings["dateFormat"] & string)
            }
            className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          >
            {DATE_FORMATS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          Time format
          <select
            value={timeFormat}
            disabled={!canManage}
            onChange={(e) =>
              setTimeFormat(e.target.value as WorkspaceSettings["timeFormat"] & string)
            }
            className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          >
            {TIME_FORMATS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {canManage ? (
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save regional settings"}
            </Button>
          </div>
        ) : null}
      </form>
      {message ? <p className="mt-3 text-xs text-muted">{message}</p> : null}
    </Panel>
  );
}
