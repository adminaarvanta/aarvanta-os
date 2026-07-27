import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJsonBody } from "@/lib/api/request";
import { getSessionContext } from "@/lib/tenant/context";
import { startGoalPipeline } from "@/lib/workforce/pipeline/orchestrator";
import { getWorkforceGoalsStore } from "@/lib/data/workforce-pipeline-store";

const createGoalSchema = z.object({
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

export async function GET() {
  try {
    const ctx = await getSessionContext();
    const goals = await getWorkforceGoalsStore().list(ctx.scope);
    goals.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return NextResponse.json({ goals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("WORKFORCE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await getSessionContext();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid goal payload", 400);
    }

    if (
      parsed.data.objective === "custom" &&
      !parsed.data.customObjective?.trim()
    ) {
      return apiError(
        "VALIDATION_ERROR",
        "Custom goals require a customObjective",
        400
      );
    }

    const { goal, execution } = await startGoalPipeline({
      scope: ctx.scope,
      goalInput: parsed.data,
    });

    return NextResponse.json({ goal, execution }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Start failed";
    return apiError("WORKFORCE_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
