import { NextResponse } from "next/server";
import { z } from "zod";
import { authErrorResponse, parseJsonBody } from "@/lib/api/request";
import {
  isBrevoConfigured,
  sendBrevoTransactional,
} from "@/lib/channels/brevo-client";
import { requireEmailOutreachSession } from "@/lib/channels/email-outreach-access";
import { wrapEmailHtml } from "@/lib/email-outreach/personalize";

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  text: z.string().min(1).max(20_000),
  html: z.string().max(50_000).optional(),
  fromName: z.string().max(120).optional(),
});

export async function POST(req: Request) {
  try {
    await requireEmailOutreachSession();
    const body = await parseJsonBody<unknown>(req);
    if (body instanceof NextResponse) return body;

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const simulate = !isBrevoConfigured();
    if (simulate) {
      return NextResponse.json({
        ok: true,
        simulated: true,
        messageId: `sim_test_${crypto.randomUUID()}`,
      });
    }

    const sent = await sendBrevoTransactional({
      toEmail: parsed.data.to,
      subject: parsed.data.subject,
      text: parsed.data.text,
      html: wrapEmailHtml(parsed.data.html ?? parsed.data.text),
      fromName: parsed.data.fromName,
      tags: ["aarvanta-outreach", "test-send"],
    });
    return NextResponse.json({ ok: true, simulated: false, ...sent });
  } catch (error) {
    const auth = authErrorResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : "Test send failed";
    return NextResponse.json({ error: { message } }, { status: 502 });
  }
}
