import { NextResponse } from "next/server";
import { z } from "zod";
import { getSopStore } from "@/lib/data/platform-store";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

const createSopSchema = z.object({
  title: z.string().min(1),
  question: z.string().min(1),
  content: z.string().optional(),
});

function buildPlaceholderContent(payload: z.infer<typeof createSopSchema>) {
  return `# ${payload.title}\n\nQuestion:\n${payload.question}\n\nDraft SOP content pending.`;
}

export async function GET() {
  try {
    const scope = await getTenantScope();
    const sops = await getSopStore().list(scope);
    return NextResponse.json({ sops });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("SOPS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(req: Request) {
  try {
    const scope = await getTenantScope();
    const store = getSopStore();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = createSopSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid SOP payload", 400);
    }

    const now = new Date().toISOString();
    const sop = await store.create({
      ...scope,
      ...parsed.data,
      content: parsed.data.content?.trim() || buildPlaceholderContent(parsed.data),
      version: 1,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ sop }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return apiError("SOPS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
