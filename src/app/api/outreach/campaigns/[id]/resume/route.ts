import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/api/request";
import { requireEmailOutreachSession } from "@/lib/channels/email-outreach-access";
import { resumeEmailCampaign } from "@/lib/email-outreach/lifecycle";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const ctx = await requireEmailOutreachSession();
    const { id } = await params;
    const campaign = await resumeEmailCampaign(id, ctx.scope);
    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ campaign });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : "Failed to resume";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
