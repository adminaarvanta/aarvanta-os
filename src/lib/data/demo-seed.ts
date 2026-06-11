import type { Conversation } from "@/types/communication";
import { DEMO_TENANT } from "@/lib/tenant/demo-context";

const AGENT_EMAIL = "admin@aarvanta.co";
const CONTACT_EMAIL = "sidhakverma.mgf@gmail.com";
const CONTACT_NAME = "Sidhak Verma";

const base = { ...DEMO_TENANT, createdAt: "2026-06-08T08:00:00Z" };

/** Single email thread for demo — admin@aarvanta.co ↔ sidhakverma.mgf@gmail.com */
export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    ...base,
    id: "conv_email_aarvanta_sidhak",
    contact: {
      id: "contact_sidhak",
      name: CONTACT_NAME,
      email: CONTACT_EMAIL,
    },
    channels: ["email"],
    tags: ["follow_up"],
    sentiment: "neutral",
    aiSummary:
      "Email thread between Aarvanta (admin@aarvanta.co) and Sidhak Verma for inbox testing.",
    aiSummaryUpdatedAt: "2026-06-10T12:00:00Z",
    unreadCount: 0,
    lastActivityAt: "2026-06-10T12:00:00Z",
    assignedTo: "admin",
    updatedAt: "2026-06-10T12:00:00Z",
    timeline: [
      {
        id: "evt_email_1",
        type: "email",
        direction: "inbound",
        subject: "Aarvanta OS — inbox test",
        bodyPreview:
          "Hi team, I'd like to test the unified inbox email channel between my Gmail and admin@aarvanta.co.",
        occurredAt: "2026-06-08T09:30:00Z",
        authorName: CONTACT_NAME,
      },
      {
        id: "evt_email_2",
        type: "email",
        direction: "outbound",
        subject: "Re: Aarvanta OS — inbox test",
        bodyPreview:
          `Hi Sidhak — reply received. You can continue this thread via email or from the Aarvanta inbox (${AGENT_EMAIL}).`,
        occurredAt: "2026-06-09T10:15:00Z",
        authorName: "Aarvanta",
      },
      {
        id: "evt_email_3",
        type: "email",
        direction: "inbound",
        subject: "Re: Aarvanta OS — inbox test",
        bodyPreview:
          "Thanks — please confirm replies from sidhakverma.mgf@gmail.com are working.",
        occurredAt: "2026-06-10T12:00:00Z",
        authorName: CONTACT_NAME,
      },
    ],
  },
];
