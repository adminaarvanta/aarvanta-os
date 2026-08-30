import { NextResponse } from "next/server";
import { crmNow } from "@/lib/data/crm-helpers";
import { getEmailOutreachRepository } from "@/lib/data/email-outreach-store";
import type { EmailSendStatus } from "@/types/email-outreach";

export const runtime = "nodejs";

type BrevoEvent = {
  event?: string;
  email?: string;
  "message-id"?: string;
  messageId?: string;
  date?: string;
};

function authorized(req: Request) {
  const secret = process.env.BREVO_WEBHOOK_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const header =
    req.headers.get("x-brevo-secret") ?? req.headers.get("x-sib-secret");
  if (header === secret) return true;
  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

function mapEvent(event: string | undefined): {
  status: EmailSendStatus;
  field?: "deliveredAt" | "openedAt" | "clickedAt";
} | null {
  switch (event) {
    case "request":
    case "delivered":
      return { status: "delivered", field: "deliveredAt" };
    case "unique_opened":
    case "opened":
      return { status: "opened", field: "openedAt" };
    case "click":
    case "unique_click":
      return { status: "clicked", field: "clickedAt" };
    case "hard_bounce":
    case "soft_bounce":
    case "invalid_email":
      return { status: "bounced" };
    case "blocked":
      return { status: "blocked" };
    case "spam":
      return { status: "spam" };
    case "unsubscribed":
      return { status: "unsubscribed" };
    case "error":
      return { status: "failed" };
    default:
      return null;
  }
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const events: BrevoEvent[] = Array.isArray(payload)
    ? (payload as BrevoEvent[])
    : [payload as BrevoEvent];

  const repo = getEmailOutreachRepository();
  let updated = 0;

  for (const event of events) {
    const mapped = mapEvent(event.event);
    const messageId = event["message-id"] ?? event.messageId;
    if (!mapped || !messageId) continue;

    const item = await repo.getQueueItemByMessageId(messageId);
    if (!item) continue;

    const now = event.date ?? crmNow();
    const patch: {
      status: EmailSendStatus;
      deliveredAt?: string;
      openedAt?: string;
      clickedAt?: string;
    } = { status: mapped.status };
    if (mapped.field) patch[mapped.field] = now;

    await repo.updateQueueItem(item.id, patch);
    updated += 1;
  }

  return NextResponse.json({ ok: true, updated });
}
