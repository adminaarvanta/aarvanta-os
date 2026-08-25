import {
  getWhatsAppPhoneNumberId,
  resolveWhatsAppBusinessAccountId,
  shouldUseLiveWhatsAppManagement,
  whatsappGraphFetch,
} from "@/lib/channels/whatsapp-graph";

export type WhatsAppTemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";

export type WhatsAppTemplateStatus =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "PAUSED"
  | "DISABLED"
  | "IN_APPEAL"
  | string;

export type WhatsAppTemplateComponent = {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS" | string;
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  text?: string;
  example?: {
    body_text?: string[][];
    header_text?: string[];
  };
  buttons?: Array<{
    type: string;
    text?: string;
    url?: string;
    phone_number?: string;
  }>;
};

export type WhatsAppMessageTemplate = {
  id: string;
  name: string;
  status: WhatsAppTemplateStatus;
  category: string;
  language: string;
  components?: WhatsAppTemplateComponent[];
};

export type WhatsAppBusinessProfile = {
  about?: string;
  address?: string;
  description?: string;
  email?: string;
  profile_picture_url?: string;
  websites?: string[];
  vertical?: string;
  messaging_product?: string;
};

export type WhatsAppPhoneNumber = {
  id: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  code_verification_status?: string;
  platform_type?: string;
  throughput?: { level?: string };
};

const DEMO_TEMPLATES: WhatsAppMessageTemplate[] = [
  {
    id: "demo_tpl_hello",
    name: "hello_aarvanta",
    status: "APPROVED",
    category: "UTILITY",
    language: "en_US",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}}, thanks for contacting {{2}}. How can we help?",
        example: { body_text: [["Alex", "Aarvanta"]] },
      },
      { type: "FOOTER", text: "Sent via Aarvanta OS" },
    ],
  },
  {
    id: "demo_tpl_followup",
    name: "lead_followup",
    status: "PENDING",
    category: "MARKETING",
    language: "en_US",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}}, just following up on your interest in Aarvanta OS.",
        example: { body_text: [["Sam"]] },
      },
    ],
  },
];

const DEMO_PROFILE: WhatsAppBusinessProfile = {
  about: "Aarvanta OS — connected operations for growing teams",
  address: "Demo address",
  description:
    "Business WhatsApp for customer support and follow-ups inside Aarvanta OS.",
  email: "support@aarvanta.com",
  websites: ["https://aarvanta.com"],
  vertical: "OTHER",
  messaging_product: "whatsapp",
};

const DEMO_PHONES: WhatsAppPhoneNumber[] = [
  {
    id: "demo_phone",
    display_phone_number: "+1 555 0100",
    verified_name: "Aarvanta Demo",
    quality_rating: "GREEN",
    code_verification_status: "VERIFIED",
    platform_type: "CLOUD_API",
  },
];

let demoTemplates = [...DEMO_TEMPLATES];
let demoProfile: WhatsAppBusinessProfile = { ...DEMO_PROFILE };

async function requireWhatsAppBusinessAccountId(): Promise<string> {
  const wabaId = await resolveWhatsAppBusinessAccountId();
  if (!wabaId) {
    throw new Error(
      "Could not resolve WhatsApp Business Account ID. Set WHATSAPP_BUSINESS_ACCOUNT_ID, or grant the access token whatsapp_business_management on the WABA that owns WHATSAPP_PHONE_NUMBER_ID."
    );
  }
  return wabaId;
}

export async function listMessageTemplates(): Promise<WhatsAppMessageTemplate[]> {
  if (!shouldUseLiveWhatsAppManagement()) {
    return demoTemplates;
  }
  const wabaId = await requireWhatsAppBusinessAccountId();

  const data = await whatsappGraphFetch<{
    data?: WhatsAppMessageTemplate[];
  }>(
    `/${wabaId}/message_templates?limit=100&fields=id,name,status,category,language,components`
  );
  return data.data ?? [];
}

export async function createMessageTemplate(input: {
  name: string;
  category: WhatsAppTemplateCategory;
  language: string;
  bodyText: string;
  footerText?: string;
  headerText?: string;
  exampleParams?: string[];
}): Promise<WhatsAppMessageTemplate> {
  const name = input.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 512);
  if (!name) throw new Error("Template name is required.");

  const bodyText = input.bodyText.trim();
  if (!bodyText) throw new Error("Template body is required.");

  const placeholders = Array.from(bodyText.matchAll(/\{\{(\d+)\}\}/g)).map(
    (m) => Number(m[1])
  );
  const maxParam = placeholders.length ? Math.max(...placeholders) : 0;
  const examples =
    input.exampleParams && input.exampleParams.length >= maxParam
      ? input.exampleParams.slice(0, maxParam)
      : Array.from({ length: maxParam }, (_, i) => `Example${i + 1}`);

  const components: WhatsAppTemplateComponent[] = [];
  if (input.headerText?.trim()) {
    components.push({
      type: "HEADER",
      format: "TEXT",
      text: input.headerText.trim(),
    });
  }
  components.push({
    type: "BODY",
    text: bodyText,
    ...(maxParam > 0
      ? { example: { body_text: [examples] } }
      : {}),
  });
  if (input.footerText?.trim()) {
    components.push({ type: "FOOTER", text: input.footerText.trim() });
  }

  if (!shouldUseLiveWhatsAppManagement()) {
    const created: WhatsAppMessageTemplate = {
      id: `demo_tpl_${Date.now()}`,
      name,
      status: "PENDING",
      category: input.category,
      language: input.language || "en_US",
      components,
    };
    demoTemplates = [created, ...demoTemplates];
    return created;
  }

  const wabaId = await requireWhatsAppBusinessAccountId();

  const created = await whatsappGraphFetch<{
    id: string;
    status?: string;
    category?: string;
  }>(`/${wabaId}/message_templates`, {
    method: "POST",
    body: JSON.stringify({
      name,
      category: input.category,
      language: input.language || "en_US",
      parameter_format: "positional",
      components,
    }),
  });

  return {
    id: created.id,
    name,
    status: (created.status as WhatsAppTemplateStatus) ?? "PENDING",
    category: created.category ?? input.category,
    language: input.language || "en_US",
    components,
  };
}

export async function deleteMessageTemplate(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Template name is required.");

  if (!shouldUseLiveWhatsAppManagement()) {
    demoTemplates = demoTemplates.filter((t) => t.name !== trimmed);
    return;
  }

  const wabaId = await requireWhatsAppBusinessAccountId();

  await whatsappGraphFetch(`/${wabaId}/message_templates?name=${encodeURIComponent(trimmed)}`, {
    method: "DELETE",
  });
}

export async function getBusinessProfile(): Promise<WhatsAppBusinessProfile> {
  if (!shouldUseLiveWhatsAppManagement()) {
    return { ...demoProfile };
  }
  const phoneNumberId = getWhatsAppPhoneNumberId();
  if (!phoneNumberId) throw new Error("WHATSAPP_PHONE_NUMBER_ID is not set.");

  const data = await whatsappGraphFetch<{
    data?: WhatsAppBusinessProfile[];
  }>(
    `/${phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`
  );
  return data.data?.[0] ?? {};
}

export async function updateBusinessProfile(
  patch: WhatsAppBusinessProfile
): Promise<WhatsAppBusinessProfile> {
  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
  };
  if (patch.about !== undefined) payload.about = patch.about;
  if (patch.address !== undefined) payload.address = patch.address;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.email !== undefined) payload.email = patch.email;
  if (patch.vertical !== undefined) payload.vertical = patch.vertical;
  if (patch.websites !== undefined) payload.websites = patch.websites;

  if (!shouldUseLiveWhatsAppManagement()) {
    demoProfile = { ...demoProfile, ...patch, messaging_product: "whatsapp" };
    return { ...demoProfile };
  }

  const phoneNumberId = getWhatsAppPhoneNumberId();
  if (!phoneNumberId) throw new Error("WHATSAPP_PHONE_NUMBER_ID is not set.");

  await whatsappGraphFetch(`/${phoneNumberId}/whatsapp_business_profile`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return getBusinessProfile();
}

export async function listPhoneNumbers(): Promise<WhatsAppPhoneNumber[]> {
  if (!shouldUseLiveWhatsAppManagement()) {
    return DEMO_PHONES;
  }
  const wabaId = await requireWhatsAppBusinessAccountId();

  const data = await whatsappGraphFetch<{ data?: WhatsAppPhoneNumber[] }>(
    `/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,platform_type,throughput`
  );
  return data.data ?? [];
}

export async function getWhatsAppManagementSnapshot() {
  const [templates, profile, phones] = await Promise.all([
    listMessageTemplates(),
    getBusinessProfile(),
    listPhoneNumbers(),
  ]);
  return { templates, profile, phones };
}
