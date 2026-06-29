import { deliverOutbound } from "@/lib/channels/deliver";
import {
  conversationHasEmailThread,
  formatEmailReplySubject,
  generateOutboundMessageId,
} from "@/lib/data/email-threading";
import { crmNow } from "@/lib/data/crm-helpers";
import { getHrStore } from "@/lib/data/platform-store";
import { getRepository } from "@/lib/data/repository";
import { publishDomainEvent } from "@/lib/events/publish";
import { resolveHrRecipient } from "@/lib/hr/resolve-recipient";
import type { TenantScope } from "@/types/communication";
import type { HrCase } from "@/types/hr-case";
import type { HrDocument } from "@/types/platform-modules";
import type { TimelineEmail } from "@/types/communication";

function lastEmailSubject(timeline: TimelineEmail[]): string | undefined {
  const last = timeline[timeline.length - 1];
  return last?.subject;
}

function lastInboundEmailMessageId(timeline: TimelineEmail[]): string | undefined {
  const inbound = timeline.filter((e) => e.direction === "inbound");
  return inbound[inbound.length - 1]?.messageId;
}

function markdownToPlainText(content: string): string {
  return content
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^---+$/gm, "")
    .trim();
}

function markdownToHtml(content: string): string {
  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const withHeadings = escaped.replace(/^# (.*)$/gm, "<h1>$1</h1>");
  const withSubheadings = withHeadings.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  const withBold = withSubheadings.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  return `<div style="font-family: Georgia, serif; line-height: 1.6;">${withBold.replace(/\n/g, "<br/>")}</div>`;
}

export async function sendHrDocument(input: {
  scope: TenantScope;
  document: HrDocument;
  hrCase?: HrCase;
  subject?: string;
}): Promise<{ channel: string; conversationId: string }> {
  const { scope, document, hrCase } = input;
  const hrStore = getHrStore();
  const repo = getRepository();

  if (!hrCase?.conversationId) {
    throw new Error("HR document send requires a linked inbox conversation.");
  }

  const conversation = await repo.getConversation(hrCase.conversationId, scope);
  if (!conversation) {
    throw new Error("Linked conversation not found.");
  }

  const recipient = await resolveHrRecipient(scope, conversation, {
    subjectId: document.subjectId,
    subjectKind: document.subjectKind,
  });

  if (!recipient) {
    throw new Error("No email or phone available for the recipient.");
  }

  const plainBody = markdownToPlainText(document.content);
  const htmlBody = markdownToHtml(document.content);
  const emailTimeline = conversation.timeline.filter(
    (event): event is TimelineEmail => event.type === "email"
  );
  const hasEmailThread = conversationHasEmailThread(conversation);
  const emailSubject =
    recipient.channel === "email"
      ? input.subject?.trim() ||
        (hasEmailThread && lastEmailSubject(emailTimeline)
          ? formatEmailReplySubject(lastEmailSubject(emailTimeline)!)
          : document.title)
      : undefined;
  const outboundMessageId =
    recipient.channel === "email" ? generateOutboundMessageId(conversation.id) : undefined;

  if (recipient.channel === "email") {
    await repo.addOutboundEmail(
      conversation.id,
      {
        subject: emailSubject ?? document.title,
        content: plainBody,
        messageId: outboundMessageId,
      },
      scope,
      { name: "HR Automation", id: "hr-automation" }
    );
  } else {
    await repo.addMessage(
      conversation.id,
      { channel: recipient.channel, content: plainBody.slice(0, 4000) },
      scope,
      { name: "HR Automation", id: "hr-automation" }
    );
  }

  await deliverOutbound({
    channel: recipient.channel,
    contact: recipient.contact,
    content: plainBody,
    html: recipient.channel === "email" ? htmlBody : undefined,
    subject: emailSubject,
    emailInReplyTo: lastInboundEmailMessageId(emailTimeline),
    emailMessageId: outboundMessageId,
  });

  const now = crmNow();
  await hrStore.setDocument({
    ...document,
    status: "finalized",
    updatedAt: now,
  });

  if (hrCase) {
    await hrStore.setCase({
      ...hrCase,
      status: "sent",
      resolvedAt: now,
      updatedAt: now,
    });
  }

  await publishDomainEvent({
    scope,
    type: "hr.document.sent",
    actor: { type: "system", id: "hr-automation", name: "HR Automation" },
    entityType: "document",
    entityId: document.id,
    payload: {
      conversationId: conversation.id,
      hrCaseId: hrCase?.id,
      channel: recipient.channel,
      recipient: recipient.email ?? recipient.phone,
    },
    source: "system",
  });

  return { channel: recipient.channel, conversationId: conversation.id };
}

export async function sendHrSupportReply(input: {
  scope: TenantScope;
  hrCase: HrCase;
  content: string;
}): Promise<void> {
  const { scope, hrCase, content } = input;
  const repo = getRepository();
  const conversation = await repo.getConversation(hrCase.conversationId, scope);
  if (!conversation) throw new Error("Conversation not found.");

  const recipient = await resolveHrRecipient(scope, conversation, {
    subjectId: hrCase.subjectId,
    subjectKind: hrCase.subjectKind,
  });
  if (!recipient) throw new Error("No delivery channel for support reply.");

  const emailTimeline = conversation.timeline.filter(
    (event): event is TimelineEmail => event.type === "email"
  );
  const hasEmailThread = conversationHasEmailThread(conversation);
  const emailSubject =
    recipient.channel === "email"
      ? hasEmailThread && lastEmailSubject(emailTimeline)
        ? formatEmailReplySubject(lastEmailSubject(emailTimeline)!)
        : "Re: Your HR enquiry"
      : undefined;
  const outboundMessageId =
    recipient.channel === "email" ? generateOutboundMessageId(conversation.id) : undefined;

  if (recipient.channel === "email") {
    await repo.addOutboundEmail(
      conversation.id,
      { subject: emailSubject ?? "Re: Your HR enquiry", content, messageId: outboundMessageId },
      scope,
      { name: "HR Automation", id: "hr-automation" }
    );
  } else {
    await repo.addMessage(
      conversation.id,
      { channel: recipient.channel, content },
      scope,
      { name: "HR Automation", id: "hr-automation" }
    );
  }

  await deliverOutbound({
    channel: recipient.channel,
    contact: recipient.contact,
    content,
    subject: emailSubject,
    emailInReplyTo: lastInboundEmailMessageId(emailTimeline),
    emailMessageId: outboundMessageId,
  });
}
