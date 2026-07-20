"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CRM_IMPORT_COLUMNS,
  type CrmImportEntity,
} from "@/lib/crm/import-templates";

const LABELS: Record<CrmImportEntity, string> = {
  contacts: "contacts",
  companies: "companies",
  leads: "leads",
  deals: "deals",
  tasks: "tasks",
  pipelines: "pipelines",
};

export function CrmImportForm({ entity }: { entity: CrmImportEntity }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("entity", entity);
      body.append("updateOnDuplicate", "true");
      const res = await fetch("/api/crm/import", { method: "POST", body });
      const data = (await res.json()) as {
        error?: string;
        created?: number;
        updated?: number;
        skipped?: number;
        errors?: string[];
      };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Import failed");
        return;
      }
      const errHint =
        data.errors && data.errors.length > 0
          ? ` First issues: ${data.errors.slice(0, 2).join("; ")}`
          : "";
      setResult(
        `Created ${data.created ?? 0}, updated ${data.updated ?? 0}, skipped ${data.skipped ?? 0}.${errHint}`
      );
      setFile(null);
      router.refresh();
    } catch {
      setError("Network error during import");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
        <Upload className="mr-1.5 h-3.5 w-3.5" />
        Import Excel / CSV
      </Button>
    );
  }

  const sample = CRM_IMPORT_COLUMNS[entity].description;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-surface-elevated p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">
            Import {LABELS[entity]}
          </p>
          <p className="mt-1 text-xs text-muted">{sample}</p>
          <p className="mt-1 text-xs text-muted">
            Download the Excel template, fill your rows, then upload. Duplicates are
            updated when a match is found.
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={`/api/crm/import/template?entity=${entity}&format=xlsx`}>
          <Button type="button" size="sm" variant="secondary">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Excel template
          </Button>
        </a>
        <a href={`/api/crm/import/template?entity=${entity}&format=csv`}>
          <Button type="button" size="sm" variant="ghost">
            CSV template
          </Button>
        </a>
      </div>
      <input
        type="file"
        accept=".csv,.tsv,.txt,.xlsx,.xls"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-gold/15 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gold-bright"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={busy || !file}>
          {busy ? "Importing…" : "Upload & import"}
        </Button>
        {error && <p className="text-xs text-danger">{error}</p>}
        {result && <p className="text-xs text-success">{result}</p>}
      </div>
    </form>
  );
}
