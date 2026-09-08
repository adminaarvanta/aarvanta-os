export type ExportDataset =
  | "account"
  | "contacts"
  | "companies"
  | "deals"
  | "members"
  | "affiliate";

export type ExportFormat = "json" | "csv";

export function csvEscape(value: unknown): string {
  if (value == null) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

export function flattenForCsv(
  records: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  return records.map((record) => {
    const flat: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (value == null) {
        flat[key] = "";
      } else if (Array.isArray(value)) {
        flat[key] = value
          .map((item) =>
            typeof item === "object" && item
              ? JSON.stringify(item)
              : String(item)
          )
          .join("; ");
      } else if (typeof value === "object") {
        flat[key] = JSON.stringify(value);
      } else {
        flat[key] = value;
      }
    }
    return flat;
  });
}

export function filenameForExport(
  dataset: ExportDataset,
  format: ExportFormat,
  at = new Date()
): string {
  const stamp = at.toISOString().slice(0, 10);
  return `aarvanta-${dataset}-${stamp}.${format}`;
}

export function permittedDatasets(input: {
  canReadCrm: boolean;
  canManageOrg: boolean;
  isAffiliate: boolean;
}): ExportDataset[] {
  const datasets: ExportDataset[] = ["account"];
  if (input.canReadCrm) {
    datasets.push("contacts", "companies", "deals");
  }
  if (input.canManageOrg) {
    datasets.push("members");
  }
  if (input.isAffiliate) {
    datasets.push("affiliate");
  }
  return datasets;
}
