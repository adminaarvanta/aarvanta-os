import { simpleParser } from "mailparser";
import { normalizeEmail } from "@/lib/data/conversation-helpers";
import {
  normalizeMessageId,
  parseMessageIdHeader,
} from "@/lib/data/email-threading";
import { getRepository } from "@/lib/data/repository";
import { getWebhookTenantScope } from "@/lib/tenant/context";
import {
  isWebhookProcessed,
  markWebhookProcessed,
} from "@/lib/webhooks/idempotency";
import {
  getEmailFromAddress,
  getGmailCredentials,
} from "@/lib/channels/gmail-client";

export interface GmailSyncResult {
  processed: number;
  skipped: number;
  errors: string[];
}

function ownMailboxAddresses(): Set<string> {
  const creds = getGmailCredentials();
  const addresses = [
    creds?.user,
    getEmailFromAddress(),
    process.env.EMAIL_REPLY_TO,
  ]
    .filter(Boolean)
    .map((email) => normalizeEmail(email!));

  return new Set(addresses);
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value.join(" ") : value;
}

function parseAddressList(field: unknown): string[] {
  if (!field) return [];
  if (Array.isArray(field)) {
    return field
      .flatMap((entry) => {
        if (entry && typeof entry === "object" && "address" in entry) {
          const address = (entry as { address?: string }).address ?? "";
          return address ? [normalizeEmail(address)] : [];
        }
        if (entry && typeof entry === "object" && "value" in entry) {
          return parseAddressList((entry as { value?: unknown }).value);
        }
        return [];
      })
      .filter(Boolean);
  }
  if (typeof field === "object" && field !== null && "value" in field) {
    return parseAddressList((field as { value?: unknown }).value);
  }
  return [];
}

function parseFromAddress(field: unknown): { email: string; name?: string } {
  const list = parseAddressList(field);
  if (list.length === 0) return { email: "" };

  if (field && typeof field === "object" && !Array.isArray(field) && "value" in field) {
    const first = (field as { value?: Array<{ address?: string; name?: string }> }).value?.[0];
    return {
      email: list[0],
      name: first?.name,
    };
  }

  return { email: list[0] };
}

/** Poll Gmail inbox for unread messages and import into the Communication Hub. */
export async function syncGmailInbox(): Promise<GmailSyncResult> {
  const creds = getGmailCredentials();
  if (!creds) {
    throw new Error("Gmail is not configured (GMAIL_USER + GMAIL_APP_PASSWORD).");
  }

  const { ImapFlow } = await import("imapflow");
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: creds.user, pass: creds.appPassword },
    logger: false,
  });

  const scope = getWebhookTenantScope();
  const repo = getRepository();
  const ownAddresses = ownMailboxAddresses();
  let processed = 0;
  let skipped = 0;
  const errors: string[] = [];

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");

  try {
    for await (const message of client.fetch("UNSEEN", {
      envelope: true,
      source: true,
    })) {
      const uid = message.uid;
      if (!uid || !message.source) continue;

      try {
        const parsed = await simpleParser(message.source);
        const parsedFrom = parseFromAddress(parsed.from);
        const fromEmail = parsedFrom.email;

        if (!fromEmail || ownAddresses.has(fromEmail)) {
          skipped += 1;
          await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
          continue;
        }

        const providerId = `gmail-${uid}`;
        if (await isWebhookProcessed("gmail", providerId)) {
          skipped += 1;
          await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
          continue;
        }

        const body = (parsed.text ?? parsed.textAsHtml ?? "").trim();
        if (!body) {
          errors.push(`UID ${uid}: empty body`);
          continue;
        }

        const messageId = parsed.messageId
          ? normalizeMessageId(parsed.messageId)
          : undefined;

        const inReplyTo = parseMessageIdHeader(
          headerValue(parsed.inReplyTo as string | string[] | undefined)
        );
        const references = parseMessageIdHeader(
          headerValue(parsed.references as string | string[] | undefined)
        );
        const to = [
          ...parseAddressList(parsed.to),
          ...parseAddressList(parsed.cc),
        ];

        await repo.addInboundEmail(
          {
            email: fromEmail,
            contactName: parsedFrom.name ?? fromEmail.split("@")[0],
            subject: parsed.subject ?? "(no subject)",
            body,
            inReplyTo,
            references,
            to,
            providerId,
            messageId,
          },
          scope
        );

        await markWebhookProcessed("gmail", providerId, scope);
        await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
        processed += 1;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`UID ${uid}: ${msg}`);
      }
    }
  } finally {
    lock.release();
  }

  await client.logout();
  return { processed, skipped, errors };
}
