import type {
  Conversation,
  ConversationIdentity,
  IdentitySignal,
} from "@/types/communication";
import type { CrmCompany, CrmContact } from "@/types/crm";

/** Common consumer email domains — strongly suggest individual. */
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "pm.me",
  "mail.com",
  "gmx.com",
  "gmx.net",
  "yandex.com",
  "zoho.com",
  "fastmail.com",
]);

const COMPANY_NAME_PATTERN =
  /\b(ltd|limited|llc|inc|incorporated|corp|corporation|gmbh|plc|pty|pvt|private|co\.|company|group|holdings|solutions|technologies|systems|services|partners|consulting|agency|studio)\b/i;

const COMPANY_MESSAGE_PATTERN =
  /\b(our (company|team|organisation|organization|business|firm)|we are a|on behalf of|procurement|accounts payable|purchase order|vat number|company registration|as a business|our office)\b/i;

const INDIVIDUAL_MESSAGE_PATTERN =
  /\b(i am (looking|interested|an individual)|my personal|just for myself|as a freelancer|i myself)\b/i;

function extractDomain(email?: string): string | null {
  if (!email || !email.includes("@")) return null;
  return email.split("@")[1]?.trim().toLowerCase() ?? null;
}

function layerEmailDomain(email?: string): IdentitySignal | null {
  const domain = extractDomain(email);
  if (!domain) return null;
  if (FREE_EMAIL_DOMAINS.has(domain)) {
    return {
      layer: "email_domain",
      vote: "individual",
      weight: 0.85,
      reason: `Consumer email domain (${domain})`,
    };
  }
  return {
    layer: "email_domain",
    vote: "company",
    weight: 0.75,
    reason: `Corporate-looking domain (${domain})`,
  };
}

function layerDisplayName(name?: string): IdentitySignal | null {
  if (!name?.trim()) return null;
  if (COMPANY_NAME_PATTERN.test(name)) {
    return {
      layer: "display_name",
      vote: "company",
      weight: 0.9,
      reason: `Display name includes a company suffix ("${name}")`,
    };
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts.every((p) => /^[A-Z][a-z'-]+$/.test(p))) {
    return {
      layer: "display_name",
      vote: "individual",
      weight: 0.35,
      reason: "Display name looks like a personal full name",
    };
  }
  return null;
}

function layerMessageLanguage(conversation: Conversation): IdentitySignal | null {
  const texts = conversation.timeline
    .filter((e) => e.type === "message" || e.type === "email")
    .slice(-12)
    .map((e) =>
      e.type === "message"
        ? e.content
        : e.type === "email"
          ? `${e.subject} ${e.bodyPreview}`
          : ""
    )
    .join(" ");

  if (!texts.trim()) return null;

  if (COMPANY_MESSAGE_PATTERN.test(texts)) {
    return {
      layer: "message_language",
      vote: "company",
      weight: 0.65,
      reason: "Message language references a business / procurement context",
    };
  }
  if (INDIVIDUAL_MESSAGE_PATTERN.test(texts)) {
    return {
      layer: "message_language",
      vote: "individual",
      weight: 0.55,
      reason: "Message language suggests a personal enquiry",
    };
  }
  return null;
}

function layerChannelProfile(conversation: Conversation): IdentitySignal | null {
  // WhatsApp business accounts often keep company names in the contact profile.
  if (
    conversation.channels.includes("whatsapp") &&
    COMPANY_NAME_PATTERN.test(conversation.contact.name)
  ) {
    return {
      layer: "channel_profile",
      vote: "company",
      weight: 0.8,
      reason: "WhatsApp profile name matches a company pattern",
    };
  }
  return null;
}

function layerCrmMatch(
  conversation: Conversation,
  contacts: CrmContact[],
  companies: CrmCompany[]
): IdentitySignal | null {
  const email = conversation.contact.email?.toLowerCase();
  const phone = conversation.contact.phone?.replace(/\D/g, "");
  const domain = extractDomain(email ?? undefined);

  const matchedContact = contacts.find((c) => {
    if (email && c.email?.toLowerCase() === email) return true;
    if (phone && c.phone?.replace(/\D/g, "") === phone) return true;
    return conversation.id && c.conversationIds.includes(conversation.id);
  });

  if (matchedContact?.accountId) {
    const company = companies.find((co) => co.id === matchedContact.accountId);
    return {
      layer: "crm_match",
      vote: "company",
      weight: 0.95,
      reason: company
        ? `Linked CRM contact belongs to company "${company.name}"`
        : "Linked CRM contact is tied to a company account",
    };
  }

  if (domain && !FREE_EMAIL_DOMAINS.has(domain)) {
    const company = companies.find(
      (co) =>
        co.domain?.toLowerCase() === domain ||
        co.website?.toLowerCase().includes(domain)
    );
    if (company) {
      return {
        layer: "crm_match",
        vote: "company",
        weight: 0.9,
        reason: `Email domain matches CRM company "${company.name}"`,
      };
    }
  }

  if (matchedContact && !matchedContact.accountId) {
    return {
      layer: "crm_match",
      vote: "individual",
      weight: 0.45,
      reason: "Matched CRM contact has no linked company",
    };
  }

  return null;
}

function resolveIdentity(
  signals: IdentitySignal[],
  override?: "company" | "individual"
): Pick<ConversationIdentity, "type" | "confidence"> {
  if (override) {
    return { type: override, confidence: 1 };
  }
  if (signals.length === 0) {
    return { type: "unknown", confidence: 0 };
  }

  let company = 0;
  let individual = 0;
  for (const s of signals) {
    if (s.vote === "company") company += s.weight;
    else individual += s.weight;
  }
  const total = company + individual;
  if (total === 0) return { type: "unknown", confidence: 0 };

  if (Math.abs(company - individual) < 0.2) {
    return {
      type: "unknown",
      confidence: Math.min(0.55, Math.max(company, individual) / total),
    };
  }

  if (company > individual) {
    return { type: "company", confidence: Math.min(0.99, company / total) };
  }
  return { type: "individual", confidence: Math.min(0.99, individual / total) };
}

function suggestCompany(
  conversation: Conversation,
  companies: CrmCompany[]
): { suggestedCompanyName?: string; suggestedDomain?: string } {
  const domain = extractDomain(conversation.contact.email);
  if (domain && !FREE_EMAIL_DOMAINS.has(domain)) {
    const existing = companies.find((c) => c.domain?.toLowerCase() === domain);
    return {
      suggestedDomain: domain,
      suggestedCompanyName:
        existing?.name ??
        (COMPANY_NAME_PATTERN.test(conversation.contact.name)
          ? conversation.contact.name
          : domain.split(".")[0]
              ? domain.split(".")[0]!.charAt(0).toUpperCase() +
                domain.split(".")[0]!.slice(1)
              : undefined),
    };
  }
  if (COMPANY_NAME_PATTERN.test(conversation.contact.name)) {
    return { suggestedCompanyName: conversation.contact.name };
  }
  return {};
}

/**
 * Multi-layer, explainable company vs individual detection.
 * Manual override always wins when present on the existing identity.
 */
export function detectConversationIdentity(
  conversation: Conversation,
  options?: {
    contacts?: CrmContact[];
    companies?: CrmCompany[];
    aiVote?: IdentitySignal | null;
  }
): ConversationIdentity {
  const signals: IdentitySignal[] = [];

  const emailSignal = layerEmailDomain(conversation.contact.email);
  if (emailSignal) signals.push(emailSignal);

  const nameSignal = layerDisplayName(conversation.contact.name);
  if (nameSignal) signals.push(nameSignal);

  const messageSignal = layerMessageLanguage(conversation);
  if (messageSignal) signals.push(messageSignal);

  const channelSignal = layerChannelProfile(conversation);
  if (channelSignal) signals.push(channelSignal);

  const crmSignal = layerCrmMatch(
    conversation,
    options?.contacts ?? [],
    options?.companies ?? []
  );
  if (crmSignal) signals.push(crmSignal);

  if (options?.aiVote) signals.push(options.aiVote);

  const override = conversation.identity?.override;
  if (override) {
    signals.push({
      layer: "manual_override",
      vote: override,
      weight: 1,
      reason: "Manually set by a teammate",
    });
  }

  const resolved = resolveIdentity(signals, override);
  const suggestions = suggestCompany(conversation, options?.companies ?? []);

  return {
    type: resolved.type,
    confidence: Number(resolved.confidence.toFixed(2)),
    signals,
    override,
    ...suggestions,
    updatedAt: new Date().toISOString(),
  };
}
