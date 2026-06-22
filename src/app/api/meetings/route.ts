import { NextResponse } from "next/server";
import { z } from "zod";
import { getMeetingsStore } from "@/lib/data/platform-store";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

const createMeetingSchema = z.object({
  title: z.string().min(1),
  transcript: z.string().min(1),
  source: z.enum(["zoom", "teams", "manual"]),
});

export async function GET() {
  try {
    const scope = await getTenantScope();
    const meetings = await getMeetingsStore().list(scope);
    return NextResponse.json({ meetings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("MEETINGS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(req: Request) {
  try {
    const scope = await getTenantScope();
    const store = getMeetingsStore();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = createMeetingSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid meeting payload", 400);
    }

    const meeting = await store.create({
      ...scope,
      ...parsed.data,
      summary: "Summary pending.",
      actionItems: [],
      followUpEmail: "",
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return apiError("MEETINGS_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
