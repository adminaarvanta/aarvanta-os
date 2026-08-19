import nodemailer from "nodemailer";

export interface GmailSendResult {
  id: string;
  messageId: string;
}

export type GmailSyncAccess = "ok" | "not_configured" | "error";

/** Canonical mailbox — notifications@aarvanta.co was deleted. */
export const PLATFORM_MAILBOX = "admin@aarvanta.co";

const RETIRED_MAILBOXES = new Set(["notifications@aarvanta.co"]);

let warnedRetiredMailbox = false;

/** Google app passwords are 16 chars; Vercel/env often keep spaces or wrapping quotes. */
function sanitizeAppPassword(value: string): string {
  return value
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, "");
}

export function resolveGmailMailbox(_value?: string | null): string {
  const configured = process.env.GMAIL_USER?.trim() ?? "";
  if (
    configured &&
    RETIRED_MAILBOXES.has(configured.toLowerCase()) &&
    !warnedRetiredMailbox
  ) {
    warnedRetiredMailbox = true;
    console.warn(
      `[gmail] ${configured} is retired; sending as ${PLATFORM_MAILBOX}`
    );
  }
  return PLATFORM_MAILBOX;
}

export function getGmailCredentials(): {
  user: string;
  appPassword: string;
} | null {
  const raw = process.env.GMAIL_APP_PASSWORD;
  const appPassword = raw ? sanitizeAppPassword(raw) : "";
  if (!appPassword) return null;
  resolveGmailMailbox();
  return { user: PLATFORM_MAILBOX, appPassword };
}

/** Stable reason for UI; full SMTP text stays in server logs. */
export function describeGmailSendFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (
    /535|BadCredentials|Username and Password not accepted|Invalid login/i.test(
      message
    )
  ) {
    return "gmail_auth_rejected";
  }
  return "send_failed";
}

export function getEmailFromAddress(): string {
  return PLATFORM_MAILBOX;
}

/** Replies land in the same Gmail inbox and are synced via IMAP. */
export function getEmailReplyToAddress(): string {
  return PLATFORM_MAILBOX;
}

export function isGmailConfigured(): boolean {
  return Boolean(getGmailCredentials());
}

export function getEmailInboundConfig() {
  const from = getEmailFromAddress();
  const replyTo = getEmailReplyToAddress();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? null;

  return {
    from,
    replyTo,
    syncUrl: appUrl ? `${appUrl}/api/cron/sync-email` : null,
    mailbox: PLATFORM_MAILBOX,
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
  if (!creds) throw new Error("Gmail is not configured (GMAIL_APP_PASSWORD for admin@aarvanta.co).");

  const from = getEmailFromAddress();

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
