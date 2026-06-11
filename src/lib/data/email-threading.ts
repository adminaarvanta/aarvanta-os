import { normalizeEmail } from "@/lib/data/conversation-helpers";
import { getEmailReplyToAddress } from "@/lib/channels/resend-client";
import type { Conversation, TimelineEmail } from "@/types/communication";

export function normalizeEmailSubject(subject: string): string {
  return subject
    .replace(/^(re|fwd|fw):\s*/gi, "")
    .trim()
    .toLowerCase();
}

export function normalizeMessageId(value: string): string {
  return value.replace(/^<|>$/g, "").trim().toLowerCase();
}

export function parseMessageIdHeader(
  raw: string | string[] | undefined
): string[] {
  if (!raw) return [];
  const values = Array.isArray(raw) ? raw : [raw];
  return values.flatMap((entry) =>
    entry
      .split(/\s+/)
      .map((part) => normalizeMessageId(part))
      .filter(Boolean)
  );
}

function ownEmailAddresses(): Set<string> {
  const addresses = [
    process.env.EMAIL_FROM,
    getEmailReplyToAddress(),
    process.env.EMAIL_INBOUND_ADDRESS,
  ]
    .filter(Boolean)
    .map((email) => normalizeEmail(email!));

  return new Set(addresses);
}

function timelineEmailMessageIds(conversation: Conversation): string[] {
  return conversation.timeline
    .filter((event): event is TimelineEmail => event.type === "email")
    .flatMap((event) =>
      [event.messageId, event.providerId].filter(Boolean) as string[]
    )
    .map(normalizeMessageId);
}

function sortByRecent(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort(
    (a, b) =>
      new Date(b.lastActivityAt).getTime() -
      new Date(a.lastActivityAt).getTime()
  );
}

export function findConversationForInboundEmail(
  conversations: Conversation[],
  input: {
    fromEmail: string;
    subject: string;
    inReplyTo?: string[];
    references?: string[];
    to?: string[];
  }
): Conversation | null {
  const scoped = conversations;
  const from = normalizeEmail(input.fromEmail);
  const own = ownEmailAddresses();
  const replyIds = new Set(
    [...(input.inReplyTo ?? []), ...(input.references ?? [])].map(
      normalizeMessageId
    )
  );

  if (replyIds.size > 0) {
    const byReplyHeader = sortByRecent(scoped).find((conversation) => {
      const storedIds = timelineEmailMessageIds(conversation);
      return storedIds.some((id) => replyIds.has(id));
    });
    if (byReplyHeader) return byReplyHeader;
  }

  const normalizedSubject = normalizeEmailSubject(input.subject);
  if (normalizedSubject) {
    const bySubject = sortByRecent(scoped).find((conversation) =>
      conversation.timeline.some((event) => {
        if (event.type !== "email") return false;
        const sameSubject =
          normalizeEmailSubject(event.subject) === normalizedSubject;
        if (!sameSubject) return false;
        if (!conversation.contact.email) return true;
        return normalizeEmail(conversation.contact.email) === from;
      })
    );
    if (bySubject) return bySubject;
  }

  if (from && !own.has(from)) {
    const byContact = sortByRecent(scoped).find(
      (conversation) =>
        conversation.contact.email &&
        normalizeEmail(conversation.contact.email) === from
    );
    if (byContact) return byContact;
  }

  if (own.has(from) && input.to?.length) {
    for (const recipient of input.to) {
      const normalizedRecipient = normalizeEmail(recipient);
      if (own.has(normalizedRecipient)) continue;

      const byRecipient = sortByRecent(scoped).find(
        (conversation) =>
          conversation.contact.email &&
          normalizeEmail(conversation.contact.email) === normalizedRecipient
      );
      if (byRecipient) return byRecipient;
    }
  }

  return null;
}

export function generateOutboundMessageId(conversationId: string): string {
  const domain =
    process.env.EMAIL_MESSAGE_ID_DOMAIN ??
    process.env.EMAIL_FROM?.split("@")[1] ??
    "aarvanta.co";
  return `<${conversationId}.${crypto.randomUUID().slice(0, 8)}@${domain}>`;
}
