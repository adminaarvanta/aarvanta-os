"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  EmailEmptyState,
  EmailSection,
} from "@/components/outreach/email-os-ui";
import { buildEmailPreviewHtml } from "@/lib/email-outreach/html-utils";
import type { EmailStarterTemplate } from "@/lib/email-outreach/starter-templates";
import type { EmailOutreachTemplate } from "@/types/email-outreach";

type Row =
  | (EmailStarterTemplate & { kind: "starter" })
  | (EmailOutreachTemplate & { kind: "saved" });

export function EmailTemplatesLibrary({
  starters,
  templates: initialTemplates,
}: {
  starters: EmailStarterTemplate[];
  templates: EmailOutreachTemplate[];
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedId, setSelectedId] = useState<string | null>(
    starters[0]?.id ?? initialTemplates[0]?.id ?? null
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const rows: Row[] = useMemo(
    () => [
      ...starters.map((s) => ({ ...s, kind: "starter" as const })),
      ...templates.map((t) => ({ ...t, kind: "saved" as const })),
    ],
    [starters, templates]
  );

  const selected = rows.find((r) => r.id === selectedId) ?? rows[0] ?? null;

  const previewHtml = useMemo(() => {
    if (!selected) return "";
    return buildEmailPreviewHtml(selected.htmlBody, selected.textBody);
  }, [selected]);

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/outreach/templates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Could not delete template.");
        return;
      }
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (selectedId === id) {
        setSelectedId(starters[0]?.id ?? null);
      }
      setNotice("Template deleted.");
      router.refresh();
    } catch {
      setError("Could not delete template.");
    } finally {
      setBusyId(null);
    }
  }

  async function copyHtml() {
    if (!selected) return;
    const value = selected.htmlBody.trim() || selected.textBody.trim();
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Copied to clipboard.");
    } catch {
      setError("Could not copy.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <EmailSection title="Library" accent="navy" flush>
        {rows.length === 0 ? (
          <div className="p-4">
            <EmailEmptyState
              title="No templates yet"
              description="Save HTML from a campaign composer, or start from a built-in starter."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border/70">
            {rows.map((row) => {
              const active = selected?.id === row.id;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(row.id);
                      setNotice(null);
                      setError(null);
                    }}
                    className={`w-full px-4 py-3 text-left transition ${
                      active ? "bg-cyan-500/10" : "hover:bg-surface-muted/60"
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {row.name}
                    </p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted">
                      {row.kind === "starter" ? "Starter" : row.source}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </EmailSection>

      <div className="space-y-4">
        {selected ? (
          <>
            <EmailSection title={selected.name} accent="cyan">
              <p className="text-sm text-muted">
                {selected.description || selected.subject}
              </p>
              <p className="mt-2 text-xs text-muted">
                Subject:{" "}
                <span className="text-foreground">{selected.subject}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/outreach/campaigns/new?template=${encodeURIComponent(selected.id)}`
                    )
                  }
                >
                  Use in new campaign
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void copyHtml()}
                >
                  Copy HTML
                </Button>
                {selected.kind === "saved" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busyId === selected.id}
                    onClick={() => void remove(selected.id)}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
              {notice ? (
                <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
                  {notice}
                </p>
              ) : null}
              {error ? (
                <p className="mt-3 text-sm text-[var(--chart-lost)]">{error}</p>
              ) : null}
            </EmailSection>

            <EmailSection title="Preview" accent="gold">
              <div className="overflow-hidden rounded-xl border border-border/80 bg-white">
                <iframe
                  title="Template preview"
                  sandbox=""
                  srcDoc={previewHtml}
                  className="h-[480px] w-full bg-white"
                />
              </div>
            </EmailSection>
          </>
        ) : (
          <EmailEmptyState
            title="Select a template"
            description="Starters ship with Email OS. Your saved templates appear here too."
          />
        )}
      </div>
    </div>
  );
}
