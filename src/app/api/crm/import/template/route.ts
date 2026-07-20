import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import {
  CRM_IMPORT_COLUMNS,
  type CrmImportEntity,
} from "@/lib/crm/import-templates";
import { getSessionContext } from "@/lib/tenant/context";
import { unauthorized } from "@/lib/api/request";

export const runtime = "nodejs";

const ENTITIES = new Set<CrmImportEntity>([
  "contacts",
  "companies",
  "leads",
  "deals",
  "tasks",
  "pipelines",
]);

export async function GET(req: Request) {
  try {
    await getSessionContext();
  } catch {
    return unauthorized();
  }

  const url = new URL(req.url);
  const entityRaw = (url.searchParams.get("entity") ?? "contacts").toLowerCase();
  const format = (url.searchParams.get("format") ?? "xlsx").toLowerCase();

  if (!ENTITIES.has(entityRaw as CrmImportEntity)) {
    return NextResponse.json({ error: "Unknown entity" }, { status: 400 });
  }

  const entity = entityRaw as CrmImportEntity;
  const def = CRM_IMPORT_COLUMNS[entity];
  const rows = [def.headers, ...def.sample];

  if (format === "csv") {
    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");
            if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
            return value;
          })
          .join(",")
      )
      .join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="aarvanta-${entity}-template.csv"`,
      },
    });
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Import");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="aarvanta-${entity}-template.xlsx"`,
    },
  });
}
