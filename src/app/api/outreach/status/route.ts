import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/api/request";
import {
  checkBrevoAccount,
  getBrevoRuntimeStatus,
} from "@/lib/channels/brevo-client";
import { requireEmailOutreachSession } from "@/lib/channels/email-outreach-access";

export async function GET() {
  try {
    await requireEmailOutreachSession();
    const [account, runtime] = await Promise.all([
      checkBrevoAccount(),
      Promise.resolve(getBrevoRuntimeStatus()),
    ]);
    return NextResponse.json({ account, ...runtime });
  } catch (error) {
    return authErrorResponse(error) ?? NextResponse.json(
      { error: { message: "Failed to load Brevo status" } },
      { status: 500 }
    );
  }
}
