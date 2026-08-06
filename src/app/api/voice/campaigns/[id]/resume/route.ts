import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import { resumeCampaign } from "@/lib/calling/campaign-lifecycle";
import { getSessionContext } from "@/lib/tenant/context";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  let ctx;
  try {
    ctx = await getSessionContext();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  try {
    const campaign = await resumeCampaign(id, ctx.scope);
    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resume";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
