import { NextResponse } from "next/server";
import { buildAnalyticsSnapshot, snapshotToCsv } from "@/lib/analytics/build-analytics";
import { getSessionContext } from "@/lib/tenant/context";
import { apiError } from "@/lib/api/request";
import type { ExportFormat, ReportPeriod } from "@/types/analytics";

export async function GET(req: Request) {
  try {
    const ctx = await getSessionContext();
    const url = new URL(req.url);
    const period = (url.searchParams.get("period") ?? "monthly") as ReportPeriod;
    const format = (url.searchParams.get("format") ?? "csv") as ExportFormat;
    const snapshot = await buildAnalyticsSnapshot(ctx.scope, period);

    if (format === "csv") {
      const csv = snapshotToCsv(snapshot);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="aarvanta-report-${period}.csv"`,
        },
      });
    }

    if (format === "pdf" || format === "excel") {
      return NextResponse.json({
        ok: true,
        format,
        message: `${format.toUpperCase()} export is queued. Demo mode returns CSV — use format=csv for immediate download.`,
        snapshot,
      });
    }

    return apiError("VALIDATION_ERROR", "Unsupported format", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    return apiError("ANALYTICS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
