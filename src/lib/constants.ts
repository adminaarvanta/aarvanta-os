import type { Channel, ConversationTag, Sentiment } from "@/types/communication";

export const CHANNEL_LABELS: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  voice: "Voice",
  sms: "SMS",
  website_chat: "Website chat",
};

export const TAG_LABELS: Record<ConversationTag, string> = {
  hot_lead: "Hot Lead",
  vip: "VIP",
  follow_up: "Follow Up",
  support: "Support",
  lost: "Lost",
};

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  positive: "Positive",
  neutral: "Neutral",
  frustrated: "Frustrated",
  urgent: "Urgent",
};

export const ALL_TAGS = Object.keys(TAG_LABELS) as ConversationTag[];
