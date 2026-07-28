import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { getHrStore } from "@/lib/data/platform-store";
import { parseHrCandidateWorkbook } from "@/lib/hr/candidate-import";
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
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  const buffer = await file.arrayBuffer();
  const rows = parseHrCandidateWorkbook(buffer);
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
  return NextResponse.json({ imported: created.length, candidates: created });
}
