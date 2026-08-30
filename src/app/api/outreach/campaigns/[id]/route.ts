import { NextResponse } from "next/server";
import { authErrorResponse, parseJsonBody } from "@/lib/api/request";
import { requireEmailOutreachSession } from "@/lib/channels/email-outreach-access";
import { getEmailOutreachRepository } from "@/lib/data/email-outreach-store";
import { updateEmailCampaignSchema } from "@/lib/email-outreach/schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const ctx = await requireEmailOutreachSession();
    const { id } = await params;
    const repo = getEmailOutreachRepository();
    const campaign = await repo.getCampaign(id, ctx.scope);
    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const queue = await repo.listQueue(ctx.scope, { campaignId: id });
    return NextResponse.json({ campaign, queue });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json(
      { error: { message: "Failed to load campaign" } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const ctx = await requireEmailOutreachSession();
    const { id } = await params;
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = updateEmailCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const campaign = await getEmailOutreachRepository().updateCampaign(
      id,
      parsed.data,
      ctx.scope
    );
    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ campaign });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json(
      { error: { message: "Failed to update campaign" } },
      { status: 500 }
    );
  }
}
