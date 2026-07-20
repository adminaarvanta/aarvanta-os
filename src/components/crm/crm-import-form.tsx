"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CrmImportForm({
  entity,
}: {
  entity: "contacts" | "companies";
}) {
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
      setResult(
        `Created ${data.created ?? 0}, updated ${data.updated ?? 0}, skipped ${data.skipped ?? 0}.`
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

  const sample =
    entity === "contacts"
      ? "Columns: First Name, Last Name (or Name), Email, Phone, Job Title, Company, Tags, Notes"
      : "Columns: Name, Domain, Website, Industry, Size, Address, Tags, Notes";

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-surface-elevated p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">
            Import {entity === "contacts" ? "contacts" : "companies"}
          </p>
          <p className="mt-1 text-xs text-muted">{sample}</p>
          <p className="mt-1 text-xs text-muted">
            Duplicates matched by email/phone (contacts) or name/domain (companies) are
            updated.
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Close
        </Button>
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
