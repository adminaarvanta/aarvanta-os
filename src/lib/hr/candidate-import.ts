import * as XLSX from "xlsx";
import type { HrCandidateStatus, HrCandidateSource } from "@/types/platform-modules";

export type ImportedCandidateRow = {
  name: string;
  email?: string;
  role: string;
  status: HrCandidateStatus;
  score: number;
  resumeSummary: string;
  source: HrCandidateSource;
  phone?: string;
};

const STATUS_MAP: Record<string, HrCandidateStatus> = {
  pending: "applied",
  applied: "applied",
  screening: "screening",
  interview: "interview",
  offer: "offer",
  hired: "hired",
  rejected: "rejected",
  sent: "offer",
  not_sent: "applied",
};

function cell(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const found = Object.entries(row).find(
      ([k]) => k.trim().toLowerCase().replace(/[\s_]+/g, " ") === key
    );
    if (found && found[1] != null && String(found[1]).trim()) {
      return String(found[1]).trim();
    }
  }
  return "";
}

function mapStatus(raw: string): HrCandidateStatus {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  return STATUS_MAP[key] ?? "applied";
}

/** Parse Excel/CSV buffer into candidate rows (Name, Email, Role, Status). */
export function parseHrCandidateWorkbook(buffer: ArrayBuffer): ImportedCandidateRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const rows: ImportedCandidateRow[] = [];
  for (const raw of json) {
    const name = cell(raw, ["name", "full name", "candidate", "candidate name"]);
    if (!name) continue;
    const email = cell(raw, ["email", "email id", "email address"]) || undefined;
    const role =
      cell(raw, ["role", "position", "job", "title"]) || "General";
    const status = mapStatus(
      cell(raw, ["status", "onboarding status", "pipeline", "stage"])
    );
    const phone = cell(raw, ["phone", "mobile", "telephone"]) || undefined;
    rows.push({
      name,
      email,
      role,
      status,
      score: 70,
      resumeSummary: `Imported from spreadsheet (${role}).`,
      source: "excel",
      phone,
    });
  }
  return rows;
}
