import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/api/request";
import { requireEmailOutreachSession } from "@/lib/channels/email-outreach-access";
import { pauseEmailCampaign } from "@/lib/email-outreach/lifecycle";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const ctx = await requireEmailOutreachSession();
    const { id } = await params;
    const campaign = await pauseEmailCampaign(id, ctx.scope);
    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ campaign });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json(
      { error: { message: "Failed to pause" } },
      { status: 400 }
    );
  }
}
