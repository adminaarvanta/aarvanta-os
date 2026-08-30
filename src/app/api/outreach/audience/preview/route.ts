import { NextResponse } from "next/server";
import { authErrorResponse, parseJsonBody } from "@/lib/api/request";
import { requireEmailOutreachSession } from "@/lib/channels/email-outreach-access";
import { previewEmailAudienceCount } from "@/lib/email-outreach/audience";
import { emailFiltersSchema } from "@/lib/email-outreach/schemas";

export async function POST(req: Request) {
  try {
    const ctx = await requireEmailOutreachSession();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = emailFiltersSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const count = await previewEmailAudienceCount(parsed.data, ctx.scope);
    return NextResponse.json({ count });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json(
      { error: { message: "Failed to preview audience" } },
      { status: 500 }
    );
  }
}
