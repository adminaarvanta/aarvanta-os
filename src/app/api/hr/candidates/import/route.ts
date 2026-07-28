import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getHrStore } from "@/lib/data/platform-store";
import {
  parseHrCandidateCsv,
  parseHrCandidateWorkbook,
} from "@/lib/hr/candidate-import";
import { fetchGoogleSheetCsv } from "@/lib/integrations/google-sheets";
import { getTenantScope } from "@/lib/tenant/context";

export async function POST(req: Request) {
  try {
    await getTenantScope();
  } catch {
    return unauthorized();
  }
  const scope = await getTenantScope();
  const form = await req.formData();
  const file = form.get("file");
  const sheetUrl = String(form.get("sheetUrl") ?? "").trim();

  let rows;
  let source: "excel" | "sheets" = "excel";

  if (sheetUrl) {
    try {
      const { csv } = await fetchGoogleSheetCsv(sheetUrl);
      rows = parseHrCandidateCsv(csv, "sheets");
      source = "sheets";
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Failed to fetch Google Sheet",
        },
        { status: 400 }
      );
    }
  } else if (file instanceof File) {
    const buffer = await file.arrayBuffer();
    rows = parseHrCandidateWorkbook(buffer);
  } else {
    return NextResponse.json(
      { error: "Upload a file or paste a Google Sheet link" },
      { status: 400 }
    );
  }

  if (!rows.length) {
    return NextResponse.json({ error: "No candidate rows found" }, { status: 400 });
  }

  const store = getHrStore();
  const created = [];
  for (const row of rows) {
    const candidate = await store.create({
      ...scope,
      name: row.name,
      email: row.email,
      role: row.role,
      score: row.score,
      status: row.status,
      source: row.source,
      phone: row.phone,
      resumeSummary: row.resumeSummary,
    });
    created.push(candidate);
  }
  return NextResponse.json({
    imported: created.length,
    source,
    candidates: created,
  });
}
