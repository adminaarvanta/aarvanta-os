import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import {
  executeContextCommand,
  planContextCommand,
} from "@/lib/ai-team/context-command";
import { getSessionContext } from "@/lib/tenant/context";

const goalInputSchema = z.object({
  objective: z.enum([
    "close_lead",
    "follow_up",
    "recover_customer",
    "book_meeting",
    "generate_proposal",
    "custom",
  ]),
  customObjective: z.string().optional(),
  instructions: z.string().optional(),
  relatedContactId: z.string().optional(),
  relatedDealId: z.string().optional(),
  relatedConversationId: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  deadlineHours: z.number().positive().optional(),
  expectedOutcome: z.string().optional(),
  moduleHint: z
    .enum([
      "crm",
      "hr",
      "finance",
      "marketing",
      "communications",
      "operations",
    ])
    .optional(),
});

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("plan"),
    module: z.enum([
      "crm",
      "hr",
      "marketing",
      "knowledge",
      "finance",
      "build",
      "operations",
    ]),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    prompt: z.string().min(1),
  }),
  z.object({
    action: z.literal("execute"),
    goalInput: goalInputSchema,
  }),
]);

/** Contextual Ask AI — plan/execute with module + entity context. */
export async function POST(req: Request) {
  try {
    const ctx = await getSessionContext();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid context command", 400);
    }

    if (parsed.data.action === "plan") {
      const { plan } = await planContextCommand(ctx.scope, parsed.data);
      return NextResponse.json({ plan });
    }

    const goalInput = parsed.data.goalInput;
    if (
      goalInput.objective === "custom" &&
      !goalInput.customObjective?.trim()
    ) {
      return apiError(
        "VALIDATION_ERROR",
        "Custom goals require a customObjective",
        400
      );
    }

    const { goal, execution } = await executeContextCommand(
      ctx.scope,
      goalInput
    );
    return NextResponse.json({ goal, execution }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Command failed";
    return apiError(
      "WORKFORCE_ERROR",
      message,
      message === "Unauthorized" ? 401 : 500
    );
  }
}
