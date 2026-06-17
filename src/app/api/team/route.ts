import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getTeamRepository } from "@/lib/data/team-store";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import { parseMentions } from "@/lib/team/mentions";

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const repo = getTeamRepository();
    const tenantRepo = getTenantRepository();
    const [notes, activity, members] = await Promise.all([
      repo.listNotes(ctx.scope),
      repo.listActivity(ctx.scope),
      tenantRepo.listMembers(ctx.scope),
    ]);
    return NextResponse.json({ notes, activity, members });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("TEAM_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

const noteSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  entityType: z.enum(["contact", "deal", "project", "project_task", "general"]),
  entityId: z.string().optional(),
  pinned: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const ctx = await getSessionContext();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;
    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid note payload", 400);
    }

    const tenantRepo = getTenantRepository();
    const members = await tenantRepo.listMembers(ctx.scope);
    const { mentionIds, mentionNames } = parseMentions(
      parsed.data.body,
      members.map((m) => ({ userId: m.userId, name: m.name }))
    );

    const repo = getTeamRepository();
    const note = await repo.createNote(
      {
        ...parsed.data,
        authorId: ctx.userId,
        authorName: ctx.name,
        mentionIds,
        mentionNames,
      },
      ctx.scope
    );
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return apiError("TEAM_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
