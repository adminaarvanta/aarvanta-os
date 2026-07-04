import nodemailer from "nodemailer";

export interface GmailSendResult {
  id: string;
  messageId: string;
}

export type GmailSyncAccess = "ok" | "not_configured" | "error";

export function getGmailCredentials(): {
  user: string;
  appPassword: string;
} | null {
  const user = process.env.GMAIL_USER?.trim();
  const appPassword = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!user || !appPassword) return null;
  return { user, appPassword };
}

export function getEmailFromAddress(): string | null {
  return process.env.EMAIL_FROM?.trim() || process.env.GMAIL_USER?.trim() || null;
}

/** Replies land in the same Gmail inbox and are synced via IMAP. */
export function getEmailReplyToAddress(): string {
  return (
    process.env.EMAIL_REPLY_TO?.trim() ||
    getEmailFromAddress() ||
    process.env.GMAIL_USER?.trim() ||
    ""
  );
}

export function isGmailConfigured(): boolean {
  return Boolean(getGmailCredentials() && getEmailFromAddress());
}

export function getEmailInboundConfig() {
  const from = getEmailFromAddress();
  const replyTo = getEmailReplyToAddress() || null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? null;

  return {
    from,
    replyTo,
    syncUrl: appUrl ? `${appUrl}/api/cron/sync-email` : null,
    mailbox: process.env.GMAIL_USER?.trim() ?? null,
  };
}

/** Verify Gmail IMAP credentials (inbound sync). */
export async function checkGmailSyncAccess(): Promise<GmailSyncAccess> {
  const creds = getGmailCredentials();
  if (!creds) return "not_configured";

  const { ImapFlow } = await import("imapflow");
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: creds.user, pass: creds.appPassword },
    logger: false,
  });

  try {
    await client.connect();
    await client.logout();
    return "ok";
  } catch {
    return "error";
  }
}

export async function sendGmailEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  inReplyTo?: string;
  messageId?: string;
}): Promise<GmailSendResult> {
  const creds = getGmailCredentials();
  if (!creds) throw new Error("Gmail is not configured (GMAIL_USER + GMAIL_APP_PASSWORD).");

  const from = getEmailFromAddress();
  if (!from) throw new Error("EMAIL_FROM is not configured.");

  const domain = from.split("@")[1] ?? "localhost";
  const messageId = input.messageId ?? `<${crypto.randomUUID()}@${domain}>`;
  const replyTo = getEmailReplyToAddress();

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: creds.user, pass: creds.appPassword },
  });

  const headers: Record<string, string> = { "Message-ID": messageId };
  if (input.inReplyTo) {
    headers["In-Reply-To"] = input.inReplyTo.startsWith("<")
      ? input.inReplyTo
      : `<${input.inReplyTo}>`;
    headers.References = headers["In-Reply-To"];
  }

  const info = await transporter.sendMail({
    from,
    to: input.to,
    replyTo: replyTo || undefined,
    subject: input.subject,
    text: input.text,
    html: input.html,
    headers,
  });

  return { id: info.messageId ?? messageId, messageId };
}
