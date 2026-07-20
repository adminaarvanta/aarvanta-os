import { createHmac, timingSafeEqual } from "crypto";

export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  const received = signatureHeader.slice("sha256=".length);

  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(received, "hex")
    );
  } catch {
    return false;
  }
}

type WaMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: {
    type?: string;
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string; description?: string };
  };
  image?: { caption?: string; id?: string };
  audio?: { id?: string };
  video?: { caption?: string; id?: string };
  document?: { caption?: string; filename?: string; id?: string };
  sticker?: { id?: string };
  location?: { latitude?: number; longitude?: number; name?: string; address?: string };
  contacts?: unknown[];
  reaction?: { emoji?: string };
};

function extractWhatsAppContent(msg: WaMessage): string | null {
  switch (msg.type) {
    case "text":
      return msg.text?.body?.trim() || null;
    case "button":
      return (
        msg.button?.text?.trim() ||
        msg.button?.payload?.trim() ||
        "[Button reply]"
      );
    case "interactive": {
      const button = msg.interactive?.button_reply?.title?.trim();
      if (button) return button;
      const list = msg.interactive?.list_reply?.title?.trim();
      if (list) {
        const desc = msg.interactive?.list_reply?.description?.trim();
        return desc ? `${list} — ${desc}` : list;
      }
      return "[Interactive reply]";
    }
    case "image":
      return msg.image?.caption?.trim() || "[Image]";
    case "video":
      return msg.video?.caption?.trim() || "[Video]";
    case "audio":
      return "[Audio message]";
    case "document":
      return (
        msg.document?.caption?.trim() ||
        msg.document?.filename?.trim() ||
        "[Document]"
      );
    case "sticker":
      return "[Sticker]";
    case "location": {
      const name = msg.location?.name?.trim();
      const address = msg.location?.address?.trim();
      const lat = msg.location?.latitude;
      const lng = msg.location?.longitude;
      if (name || address) {
        return [name, address].filter(Boolean).join(" — ");
      }
      if (typeof lat === "number" && typeof lng === "number") {
        return `Location: ${lat}, ${lng}`;
      }
      return "[Location]";
    }
    case "contacts":
      return "[Contact card]";
    case "reaction":
      return msg.reaction?.emoji
        ? `Reacted ${msg.reaction.emoji}`
        : "[Reaction]";
    default:
      return msg.type ? `[Unsupported WhatsApp message: ${msg.type}]` : null;
  }
}

export function parseWhatsAppInbound(payload: unknown): Array<{
  messageId: string;
  phone: string;
  contactName?: string;
  content: string;
}> {
  const messages: Array<{
    messageId: string;
    phone: string;
    contactName?: string;
    content: string;
  }> = [];

  if (!payload || typeof payload !== "object") return messages;

  const entry = (payload as { entry?: unknown[] }).entry;
  if (!Array.isArray(entry)) return messages;

  for (const item of entry) {
    const changes = (item as { changes?: unknown[] }).changes;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      const value = (change as { value?: Record<string, unknown> }).value;
      if (!value) continue;

      const contacts = Array.isArray(value.contacts) ? value.contacts : [];
      const contactName =
        typeof contacts[0] === "object" &&
        contacts[0] &&
        typeof (contacts[0] as { profile?: { name?: string } }).profile
          ?.name === "string"
          ? (contacts[0] as { profile: { name: string } }).profile.name
          : undefined;

      const waMessages = Array.isArray(value.messages) ? value.messages : [];
      for (const msg of waMessages) {
        const record = msg as WaMessage;
        if (!record.id || !record.from) continue;
        const content = extractWhatsAppContent(record);
        if (!content) continue;

        messages.push({
          messageId: record.id,
          phone: record.from,
          contactName,
          content,
        });
      }
    }
  }

  return messages;
}
