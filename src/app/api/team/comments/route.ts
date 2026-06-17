import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getTeamRepository } from "@/lib/data/team-store";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import { parseMentions } from "@/lib/team/mentions";

const schema = z.object({
  body: z.string().min(1),
  entityType: z.enum(["contact", "deal", "project", "project_task", "general"]),
  entityId: z.string().optional(),
  noteId: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const ctx = await getSessionContext();
    const noteId = new URL(req.url).searchParams.get("noteId") ?? undefined;
    const repo = getTeamRepository();
    const comments = await repo.listComments(ctx.scope, noteId);
    return NextResponse.json(comments);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("TEAM_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getSessionContext();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid comment payload", 400);
    }

    const tenantRepo = getTenantRepository();
    const members = await tenantRepo.listMembers(ctx.scope);
    const { mentionIds, mentionNames } = parseMentions(
      parsed.data.body,
      members.map((m) => ({ userId: m.userId, name: m.name }))
    );

    const repo = getTeamRepository();
    const comment = await repo.createComment(
      {
        ...parsed.data,
        authorId: ctx.userId,
        authorName: ctx.name,
        mentionIds,
        mentionNames,
      },
      ctx.scope
    );
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create failed";
    return apiError("TEAM_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
