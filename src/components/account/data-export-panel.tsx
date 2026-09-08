"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { HelpTip } from "@/components/ui/help-tip";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/os/panel";
import { SectionHeader } from "@/components/ui/os/section-header";
import type { ExportDataset, ExportFormat } from "@/lib/account/export";

const DATASETS: { id: ExportDataset; label: string; hint: string }[] = [
  { id: "account", label: "Account profile", hint: "Your name, email, role, and workspace." },
  { id: "contacts", label: "CRM contacts", hint: "People you have permission to see." },
  { id: "companies", label: "Companies", hint: "Accounts in this workspace." },
  { id: "deals", label: "Deals", hint: "Pipeline records you can access." },
  { id: "members", label: "Team members", hint: "Owners and admins only." },
  { id: "affiliate", label: "Partner data", hint: "Your leads, earnings, and payouts." },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function DataExportPanel() {
  const [dataset, setDataset] = useState<ExportDataset>("account");
  const [format, setFormat] = useState<ExportFormat>("json");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/account/export?dataset=${dataset}&format=${format}`
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        throw new Error(data.error?.message ?? "Download failed.");
      }
      const blob = await res.blob();
      const filename =
        res.headers
          .get("Content-Disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ??
        `aarvanta-${dataset}.${format}`;
      downloadBlob(blob, filename);
      setMessage("Download started.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel id="data-export">
      <SectionHeader
        title="Download your data"
        description="Export the records you are allowed to see. Affiliates can also download partner leads and earnings from Partners."
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            Dataset
            <HelpTip label="What a dataset is">
              Each file contains only the records your role can access. Partner
              data appears if you have an affiliate profile.
            </HelpTip>
          </span>
          <select
            value={dataset}
            onChange={(e) => setDataset(e.target.value as ExportDataset)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          >
            {DATASETS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted">
          Format
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          >
            <option value="json">JSON (full record)</option>
            <option value="csv">CSV (spreadsheet)</option>
          </select>
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">
        {DATASETS.find((item) => item.id === dataset)?.hint}
      </p>
      <div className="mt-4">
        <Button type="button" disabled={busy} onClick={() => void download()}>
          <Download className="mr-2 h-4 w-4" aria-hidden />
          {busy ? "Preparing…" : "Download"}
        </Button>
      </div>
      {message ? <p className="mt-3 text-xs text-muted">{message}</p> : null}
    </Panel>
  );
}
