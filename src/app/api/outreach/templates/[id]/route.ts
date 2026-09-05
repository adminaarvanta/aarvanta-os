import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/api/request";
import { requireEmailOutreachSession } from "@/lib/channels/email-outreach-access";
import { getEmailOutreachRepository } from "@/lib/data/email-outreach-store";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const ctx = await requireEmailOutreachSession();
    const { id } = await params;
    const deleted = await getEmailOutreachRepository().deleteTemplate(
      id,
      ctx.scope
    );
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return (
      authErrorResponse(error) ??
      NextResponse.json(
        { error: { message: "Failed to delete template" } },
        { status: 500 }
      )
    );
  }
}
