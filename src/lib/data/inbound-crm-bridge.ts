import { CHANNEL_LABELS } from "@/lib/constants";
import {
  isQualifiedForCrmLead,
  type QualificationResult,
} from "@/lib/ai/qualification";
import { normalizeEmail, normalizePhone } from "@/lib/data/conversation-helpers";
import { getCrmRepository } from "@/lib/data/crm-store";
import type { Conversation, TenantScope } from "@/types/communication";
import type { CrmContact } from "@/types/crm";
import { contactDisplayName } from "@/types/crm";

function parseContactName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Unknown", lastName: "Contact" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function inboundPreview(conversation: Conversation): string {
  const last = conversation.timeline.at(-1);
  if (!last) return conversation.aiSummary ?? "New inbound conversation";
  if (last.type === "email") {
    return last.subject || last.bodyPreview.slice(0, 120);
  }
  if (last.type === "message") {
    return last.content.slice(0, 120);
  }
  if (last.type === "call") {
    return last.summary ?? "Inbound call";
  }
  return conversation.aiSummary ?? "Inbound activity";
}

function primaryChannel(conversation: Conversation) {
  return conversation.channels.at(-1) ?? conversation.channels[0] ?? "email";
}

async function findExistingCrmContact(
  conversation: Conversation,
  scope: TenantScope
): Promise<CrmContact | null> {
  const crm = getCrmRepository();
  const contacts = await crm.listContacts(scope);
  const { contact: commContact } = conversation;

  const byConversation = contacts.find((c) =>
    c.conversationIds.includes(conversation.id)
  );
  if (byConversation) return byConversation;

  if (commContact.email) {
    const normalized = normalizeEmail(commContact.email);
    const match = contacts.find(
      (c) => c.email && normalizeEmail(c.email) === normalized
    );
    if (match) return match;
  }

  if (commContact.phone) {
    const normalized = normalizePhone(commContact.phone);
    const match = contacts.find(
      (c) => c.phone && normalizePhone(c.phone) === normalized
    );
    if (match) return match;
  }

  return null;
}

async function linkConversationToContact(
  contact: CrmContact,
  conversation: Conversation,
  scope: TenantScope
): Promise<CrmContact> {
  if (contact.conversationIds.includes(conversation.id)) {
    return contact;
  }

  const crm = getCrmRepository();
  return (
    (await crm.updateContact(
      contact.id,
      { conversationIds: [...contact.conversationIds, conversation.id] },
      scope
    )) ?? contact
  );
}

async function logInboundActivity(
  contact: CrmContact,
  conversation: Conversation,
  scope: TenantScope
) {
  const crm = getCrmRepository();
  const channel = primaryChannel(conversation);

  await crm.createActivity(
    {
      type: "note",
      title: `Inbound ${CHANNEL_LABELS[channel]}`,
      description: inboundPreview(conversation),
      contactId: contact.id,
      occurredAt: conversation.lastActivityAt,
      authorName: conversation.contact.name,
    },
    scope
  );
}

/** Link known CRM contacts and log communication history — no new leads. */
export async function syncInboundToExistingCrmContact(
  conversation: Conversation,
  scope: TenantScope
): Promise<void> {
  try {
    const existing = await findExistingCrmContact(conversation, scope);
    if (!existing) return;

    const linked = await linkConversationToContact(
      existing,
      conversation,
      scope
    );
    await logInboundActivity(linked, conversation, scope);
  } catch (error) {
    console.error(
      `[inbound-crm-bridge:existing] conversation=${conversation.id}`,
      error
    );
  }
}

/** After AI qualification — create CRM lead only when sales intent passes the score gate. */
export async function qualifyAndCreateCrmLead(
  conversation: Conversation,
  scope: TenantScope,
  qualification: QualificationResult
): Promise<void> {
  try {
    if (!isQualifiedForCrmLead(qualification)) return;

    const existing = await findExistingCrmContact(conversation, scope);
    if (existing) return;

    const crm = getCrmRepository();
    const { contact: commContact } = conversation;
    const { firstName, lastName } = parseContactName(commContact.name);
    const preview = inboundPreview(conversation);

    const contact = await crm.createContact(
      {
        firstName,
        lastName,
        email: commContact.email,
        phone: commContact.phone,
        tags: ["prospect"],
        conversationIds: [conversation.id],
        notes: conversation.aiSummary,
      },
      scope
    );

    await crm.createActivity(
      {
        type: "note",
        title: `Qualified inbound lead (${qualification.qualificationScore}/100)`,
        description: preview,
        contactId: contact.id,
        occurredAt: conversation.lastActivityAt,
        authorName: commContact.name,
      },
      scope
    );

    await crm.createTask(
      {
        title: `Follow up: ${contactDisplayName(contact)}`,
        description: conversation.aiSummary ?? preview,
        contactId: contact.id,
        priority: "high",
        source: "ai",
      },
      scope
    );
  } catch (error) {
    console.error(
      `[inbound-crm-bridge:qualify] conversation=${conversation.id}`,
      error
    );
  }
}
