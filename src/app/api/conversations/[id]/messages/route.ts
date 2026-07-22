import { NextResponse } from "next/server";
import { z } from "zod";
import { deliverOutbound } from "@/lib/channels/deliver";
import {
  conversationHasEmailThread,
  formatEmailReplySubject,
  generateOutboundMessageId,
} from "@/lib/data/email-threading";
import { getRepository } from "@/lib/data/repository";
import { getTenantScope } from "@/lib/tenant/context";
import { getSessionFromCookies } from "@/lib/auth/session";
import { parseJsonBody, unauthorized } from "@/lib/api/request";
import type { Conversation, TimelineEmail } from "@/types/communication";

function lastEmailSubject(conversation: Conversation): string | undefined {
  const emails = conversation.timeline.filter(
    (e): e is TimelineEmail => e.type === "email"
  );
  const last = emails[emails.length - 1];
  return last?.subject;
}

function lastInboundEmailMessageId(
  conversation: Conversation
): string | undefined {
  const emails = conversation.timeline.filter(
    (e): e is TimelineEmail => e.type === "email" && e.direction === "inbound"
  );
  return emails[emails.length - 1]?.messageId;
}

const schema = z.object({
  content: z.string().min(1),
  channel: z.enum(["whatsapp", "email", "voice", "sms", "website_chat"]),
  subject: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await getSessionFromCookies();
  const author = session ? { name: session.name, id: session.email } : undefined;
  const { id } = await params;
  const repo = getRepository();

  const existing = await repo.getConversation(id, scope);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    let conversation: Conversation | null = null;
    const { channel, content, subject } = parsed.data;
    const hasEmailThread = conversationHasEmailThread(existing);
    const emailSubject =
      channel === "email"
        ? subject?.trim()
          ? hasEmailThread
            ? formatEmailReplySubject(subject)
            : subject.trim()
          : hasEmailThread && lastEmailSubject(existing)
            ? formatEmailReplySubject(lastEmailSubject(existing)!)
            : "Message from Aarvanta"
        : undefined;
    const outboundMessageId =
      channel === "email" ? generateOutboundMessageId(id) : undefined;

    if (channel === "email") {
      conversation = await repo.addOutboundEmail(
        id,
        {
          subject: emailSubject ?? "Message from Aarvanta",
          content,
          messageId: outboundMessageId,
        },
        scope,
        author
      );
    } else if (channel === "voice") {
      conversation = await repo.addOutboundCall(
        id,
        { summary: content },
        scope,
        author
      );
    } else {
      conversation = await repo.addMessage(id, parsed.data, scope, author);
    }

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
      await deliverOutbound({
        channel,
        contact: existing.contact,
        content,
        subject: channel === "email" ? emailSubject : subject,
        emailInReplyTo: lastInboundEmailMessageId(existing),
        emailMessageId: outboundMessageId,
        conversationId: id,
        voiceDirection: channel === "voice" ? "outbound" : undefined,
      });
    } catch (error) {
      return NextResponse.json(
        {
          conversation,
          warning: {
            code: "DELIVERY_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Outbound delivery failed",
          },
        },
        { status: 202 }
      );
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error(`[messages:send] conversation=${id}`, error);
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Failed to send message",
        },
      },
      { status: 500 }
    );
  }
}
