/** Lightweight CSV / TSV sheet parsing (RFC4180-ish). */

export type SheetRow = Record<string, string>;

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function detectDelimiter(headerLine: string): string {
  const commas = (headerLine.match(/,/g) ?? []).length;
  const tabs = (headerLine.match(/\t/g) ?? []).length;
  const semis = (headerLine.match(/;/g) ?? []).length;
  if (tabs > commas && tabs > semis) return "\t";
  if (semis > commas) return ";";
  return ",";
}

export function normalizeHeader(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

export function parseDelimitedSheet(text: string): {
  headers: string[];
  rows: SheetRow[];
} {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(lines[0]!);
  const headers = parseCsvLine(lines[0]!, delimiter).map(normalizeHeader);
  const rows: SheetRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]!, delimiter);
    const row: SheetRow = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      row[header] = (cells[idx] ?? "").trim();
    });
    const hasValue = Object.values(row).some((v) => v.length > 0);
    if (hasValue) rows.push(row);
  }

  return { headers, rows };
}

export function getField(row: SheetRow, aliases: string[]): string | undefined {
  for (const alias of aliases) {
    const key = normalizeHeader(alias);
    const value = row[key];
    if (value) return value;
  }
  return undefined;
}
