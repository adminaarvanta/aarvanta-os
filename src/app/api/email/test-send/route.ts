import { NextResponse } from "next/server";
import { z } from "zod";
import { isAffiliatePlatformAdmin } from "@/lib/affiliate/admin";
import { apiError, unauthorized } from "@/lib/api/request";
import {
  describeGmailSendFailure,
  isGmailConfigured,
  sendGmailEmail,
} from "@/lib/channels/gmail-client";
import { getSessionContext } from "@/lib/tenant/context";

export const runtime = "nodejs";

const bodySchema = z.object({
  to: z.string().email().optional(),
});

async function readOptionalJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text.trim()) return {};
  return JSON.parse(text) as unknown;
}

/** Platform-admin SMTP probe after rotating GMAIL_APP_PASSWORD. */
export async function POST(req: Request) {
  let session;
  try {
    session = await getSessionContext();
  } catch {
    return unauthorized();
  }
  if (!isAffiliatePlatformAdmin(session.email)) {
    return apiError("FORBIDDEN", "Platform admin required.", 403);
  }

  if (!isGmailConfigured()) {
    return NextResponse.json(
      { sent: false, reason: "email_not_configured" },
      { status: 503 }
    );
  }

  let raw: unknown;
  try {
    raw = await readOptionalJson(req);
  } catch {
    return apiError("INVALID_JSON", "Invalid JSON body", 400);
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid payload.",
      400
    );
  }

  const to = parsed.data.to?.trim().toLowerCase() || session.email;

  try {
    await sendGmailEmail({
      to,
      subject: "Aarvanta OS email test",
      text: "Gmail SMTP is working. Affiliate set-password and invite emails can send.",
    });
    return NextResponse.json({ sent: true, to });
  } catch (error) {
    console.error("[email] test-send failed", error);
    return NextResponse.json(
      {
        sent: false,
        to,
        reason: describeGmailSendFailure(error),
      },
      { status: 502 }
    );
  }
}
