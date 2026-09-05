"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Download, Link2, Upload } from "lucide-react";
import {
  CrmField,
  CrmFormActions,
  CrmFormBody,
  CrmFormDialog,
  crmInputClass,
} from "@/components/crm/crm-form";
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
  const [sheetUrl, setSheetUrl] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
  }, [busy]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !sheetUrl.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const body = new FormData();
      body.append("entity", entity);
      body.append("updateOnDuplicate", "true");
      if (sheetUrl.trim()) {
        body.append("sheetUrl", sheetUrl.trim());
      } else if (file) {
        body.append("file", file);
      }
      const res = await fetch("/api/crm/import", { method: "POST", body });
      const data = (await res.json()) as {
        error?: string;
        created?: number;
        updated?: number;
        skipped?: number;
        source?: string;
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
      const via =
        data.source === "google_sheets" ? " via Google Sheets" : "";
      setResult(
        `Created ${data.created ?? 0}, updated ${data.updated ?? 0}, skipped ${data.skipped ?? 0}${via}.${errHint}`
      );
      setFile(null);
      setSheetUrl("");
      router.refresh();
    } catch {
      setError("Network error during import");
    } finally {
      setBusy(false);
    }
  }

  const sample = CRM_IMPORT_COLUMNS[entity].description;
  const canSubmit = Boolean(file) || Boolean(sheetUrl.trim());

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="border-[#2f7f92]/25 bg-sky-500/[0.07] text-[#1a2f59] hover:border-[#2f7f92]/45 hover:bg-sky-500/[0.12]"
        onClick={() => setOpen(true)}
      >
        <Upload className="mr-1.5 h-3.5 w-3.5" />
        Import Excel / Sheets
      </Button>
      <CrmFormDialog
        open={open}
        title={`Import ${LABELS[entity]}`}
        description="Upload a spreadsheet or paste a Google Sheet link. Duplicates update when a match is found."
        icon={Upload}
        onClose={close}
      >
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <CrmFormBody>
            <p className="text-sm text-muted">{sample}</p>
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
            <CrmField label="Spreadsheet file">
              <input
                type="file"
                accept=".csv,.tsv,.txt,.xlsx,.xls"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  if (e.target.files?.[0]) setSheetUrl("");
                }}
                className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-[#1a2f59]/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#1a2f59]"
              />
            </CrmField>
            <CrmField
              label="Or link a Google Sheet"
              htmlFor={`import-sheet-${entity}`}
            >
              <div className="relative">
                <Link2
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <input
                  id={`import-sheet-${entity}`}
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => {
                    setSheetUrl(e.target.value);
                    if (e.target.value.trim()) setFile(null);
                  }}
                  placeholder="https://docs.google.com/spreadsheets/d/…"
                  className={`${crmInputClass} pl-10`}
                />
              </div>
            </CrmField>
            {error ? (
              <p className="text-sm text-danger">{error}</p>
            ) : null}
            {result ? (
              <p className="text-sm text-success">{result}</p>
            ) : null}
          </CrmFormBody>
          <CrmFormActions
            busy={busy}
            submitDisabled={!canSubmit}
            onCancel={close}
            submitLabel={
              sheetUrl.trim() ? "Import from Google Sheets" : "Upload & import"
            }
            busyLabel="Importing…"
          />
        </form>
      </CrmFormDialog>
    </>
  );
}
