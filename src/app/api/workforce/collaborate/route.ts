import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { runAgentCollaboration } from "@/lib/workforce/collaboration";
import { agentTypeSchema } from "@/lib/workforce/agent-schema";
import { getSessionContext } from "@/lib/tenant/context";

const schema = z.object({
  title: z.string().min(1),
  leadAgent: agentTypeSchema,
  participantAgents: z.array(agentTypeSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const ctx = await getSessionContext();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid collaboration payload", 400);
    }

    const result = await runAgentCollaboration(ctx.scope, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collaboration failed";
    return apiError("WORKFORCE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
