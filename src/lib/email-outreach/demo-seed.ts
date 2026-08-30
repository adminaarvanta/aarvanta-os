import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import { crmNow } from "@/lib/data/crm-helpers";
import type { EmailCampaign, EmailSendItem } from "@/types/email-outreach";

const now = crmNow();

export const DEMO_EMAIL_CAMPAIGNS: EmailCampaign[] = [
  {
    ...DEMO_TENANT,
    id: "emc_intro",
    name: "Aarvanta intro — consulting leads",
    description: "First-touch outreach for inbound consulting prospects.",
    subject: "{{firstName}}, a quicker way to run {{company}}",
    previewText: "AI employees that handle follow-up, CRM, and voice.",
    htmlBody:
      "<p>Hi {{firstName}},</p><p>I noticed {{company}} is growing and thought you might want a simpler way to keep leads moving — without hiring another coordinator.</p><p>Aarvanta OS gives your team AI employees for CRM, WhatsApp, and calling. Happy to send a 10-minute walkthrough if useful.</p><p>Best,<br/>Pavan</p>",
    textBody:
      "Hi {{firstName}},\n\nI noticed {{company}} is growing and thought you might want a simpler way to keep leads moving — without hiring another coordinator.\n\nAarvanta OS gives your team AI employees for CRM, WhatsApp, and calling. Happy to send a 10-minute walkthrough if useful.\n\nBest,\nPavan",
    fromName: "Pavan at Aarvanta",
    filters: { tags: ["prospect", "hot_lead"] },
    status: "draft",
    dailySendLimit: 50,
    createdAt: now,
    updatedAt: now,
  },
];

export const DEMO_EMAIL_QUEUE: EmailSendItem[] = [];
