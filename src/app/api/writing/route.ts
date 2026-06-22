import { NextResponse } from "next/server";
import { z } from "zod";
import { getWritingStore } from "@/lib/data/platform-store";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { generateWritingDraft } from "@/lib/writing/generate-draft";
import { getTenantScope } from "@/lib/tenant/context";

const createDraftSchema = z.object({
  type: z.enum(["proposal", "email", "blog", "linkedin", "sop", "meeting_notes"]),
  title: z.string().min(1),
  prompt: z.string().min(1),
  content: z.string().optional(),
});

export async function GET() {
  try {
    const scope = await getTenantScope();
    const drafts = await getWritingStore().list(scope);
    return NextResponse.json({ drafts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("WRITING_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(req: Request) {
  try {
    const scope = await getTenantScope();
    const store = getWritingStore();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = createDraftSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid draft payload", 400);
    }

    const content = await generateWritingDraft({
      type: parsed.data.type,
      title: parsed.data.title,
      prompt: parsed.data.prompt,
      starterContent: parsed.data.content,
    });

    const draft = await store.create({
      ...scope,
      ...parsed.data,
      content,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return apiError("WRITING_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
