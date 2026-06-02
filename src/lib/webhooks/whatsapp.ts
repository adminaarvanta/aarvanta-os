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
        const record = msg as {
          id?: string;
          from?: string;
          type?: string;
          text?: { body?: string };
        };
        if (
          record.type === "text" &&
          record.id &&
          record.from &&
          record.text?.body
        ) {
          messages.push({
            messageId: record.id,
            phone: record.from,
            contactName,
            content: record.text.body,
          });
        }
      }
    }
  }

  return messages;
}
