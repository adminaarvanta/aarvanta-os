import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { executeCommand, planCommand } from "@/lib/ai-team/orchestrate";
import { getSessionContext } from "@/lib/tenant/context";

const relatedSchema = {
  relatedContactId: z.string().optional(),
  relatedDealId: z.string().optional(),
  relatedConversationId: z.string().optional(),
};

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
  ...relatedSchema,
});

const commandSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("plan"),
    prompt: z.string().min(1),
    ...relatedSchema,
  }),
  z.object({
    action: z.literal("execute"),
    goalInput: goalInputSchema,
  }),
]);

/**
 * AI Team command gateway — plan-before-act, then start the existing goal pipeline.
 * Does not replace POST /api/workforce/goals.
 */
export async function POST(req: Request) {
  try {
    const ctx = await getSessionContext();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = commandSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid command payload", 400);
    }

    if (parsed.data.action === "plan") {
      const { plan } = planCommand(parsed.data.prompt, {
        relatedContactId: parsed.data.relatedContactId,
        relatedDealId: parsed.data.relatedDealId,
        relatedConversationId: parsed.data.relatedConversationId,
      });
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

    const { goal, execution } = await executeCommand(ctx.scope, goalInput);
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
