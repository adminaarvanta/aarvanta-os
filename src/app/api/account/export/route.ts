import { NextResponse } from "next/server";
import { buildAccountExport, datasetRows } from "@/lib/account/build-export";
import {
  filenameForExport,
  flattenForCsv,
  toCsv,
  type ExportDataset,
  type ExportFormat,
} from "@/lib/account/export";
import { apiError, unauthorized } from "@/lib/api/request";
import { getSessionContext } from "@/lib/tenant/context";

export const runtime = "nodejs";

const DATASETS = new Set<ExportDataset>([
  "account",
  "contacts",
  "companies",
  "deals",
  "members",
  "affiliate",
]);

export async function GET(req: Request) {
  try {
    const ctx = await getSessionContext();
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") ?? "json") as ExportFormat;
    const dataset = (url.searchParams.get("dataset") ?? "account") as ExportDataset;

    if (format !== "json" && format !== "csv") {
      return apiError("VALIDATION_ERROR", "Format must be json or csv.", 400);
    }
    if (!DATASETS.has(dataset)) {
      return apiError("VALIDATION_ERROR", "Unknown export dataset.", 400);
    }

    const payload = await buildAccountExport(ctx);
    if (!payload.datasets.includes(dataset)) {
      return apiError(
        "FORBIDDEN",
        "You do not have permission to download that dataset.",
        403
      );
    }

    if (format === "json") {
      if (dataset === "account") {
        return NextResponse.json(payload);
      }
      return NextResponse.json({
        exportedAt: payload.exportedAt,
        dataset,
        rows: datasetRows(payload, dataset),
      });
    }

    const csv = toCsv(flattenForCsv(datasetRows(payload, dataset)));
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameForExport(dataset, "csv")}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed.";
    if (message === "Unauthorized") return unauthorized();
    return apiError("EXPORT_ERROR", message, 500);
  }
}
