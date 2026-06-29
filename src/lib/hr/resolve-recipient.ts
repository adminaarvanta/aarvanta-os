import { getCrmRepository } from "@/lib/data/crm-store";
import { getHrStore } from "@/lib/data/platform-store";
import type { Channel, ContactRef, Conversation, TenantScope } from "@/types/communication";

export type ResolvedRecipient = {
  contact: ContactRef;
  channel: Channel;
  email?: string;
  phone?: string;
};

export async function resolveHrRecipient(
  scope: TenantScope,
  conversation: Conversation,
  options?: {
    subjectId?: string;
    subjectKind?: "employee" | "candidate" | "vendor" | "other";
  }
): Promise<ResolvedRecipient | null> {
  const contact: ContactRef = { ...conversation.contact };
  let email = contact.email;
  let phone = contact.phone;

  const hrStore = getHrStore();

  if (options?.subjectId && options.subjectKind === "employee") {
    const employee = await hrStore.getEmployee(options.subjectId, scope);
    if (employee?.email) email = employee.email;
  }

  if (options?.subjectId && options.subjectKind === "candidate") {
    const candidate = await hrStore.get(options.subjectId, scope);
    if (candidate?.email) email = candidate.email;
  }

  if (!email && !phone && conversation.contact.id) {
    const crm = getCrmRepository();
    const crmContact = await crm.getContact(conversation.contact.id, scope);
    if (crmContact?.email) email = crmContact.email;
    if (crmContact?.phone) phone = crmContact.phone;
  }

  if (!email && !phone) return null;

  const channel: Channel = email
    ? "email"
    : phone
      ? conversation.channels.includes("whatsapp")
        ? "whatsapp"
        : "sms"
      : conversation.channels[0] ?? "email";

  return {
    contact: {
      ...contact,
      email: email ?? contact.email,
      phone: phone ?? contact.phone,
    },
    channel,
    email,
    phone,
  };
}
