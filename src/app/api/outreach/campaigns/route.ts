import { NextResponse } from "next/server";
import { authErrorResponse, parseJsonBody } from "@/lib/api/request";
import { requireEmailOutreachSession } from "@/lib/channels/email-outreach-access";
import { getEmailOutreachRepository } from "@/lib/data/email-outreach-store";
import { createEmailCampaignSchema } from "@/lib/email-outreach/schemas";

export async function GET() {
  try {
    const ctx = await requireEmailOutreachSession();
    const campaigns = await getEmailOutreachRepository().listCampaigns(
      ctx.scope
    );
    return NextResponse.json({ campaigns });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json(
      { error: { message: "Failed to list campaigns" } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireEmailOutreachSession();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = createEmailCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const campaign = await getEmailOutreachRepository().createCampaign(
      { ...parsed.data, createdBy: ctx.userId },
      ctx.scope
    );
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json(
      { error: { message: "Failed to create campaign" } },
      { status: 500 }
    );
  }
}
