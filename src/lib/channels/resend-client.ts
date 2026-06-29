export interface ResendReceivedEmail {
  text: string;
  html?: string;
  subject: string;
  from: string;
  messageId?: string;
  inReplyTo: string[];
  references: string[];
  to: string[];
}

export interface ResendSendResult {
  id: string;
  messageId: string;
}

export type ResendReceivingAccess = "ok" | "restricted" | "not_configured";

function getApiKey() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");
  return apiKey;
}

function getEmailFromDomain(): string {
  const from = process.env.EMAIL_FROM ?? "";
  return from.split("@")[1] ?? "";
}

/** Reply-to / inbound address for threading. Must be on a domain with Resend receiving enabled. */
export function getEmailReplyToAddress(): string {
  if (process.env.EMAIL_REPLY_TO) return process.env.EMAIL_REPLY_TO;
  if (process.env.EMAIL_INBOUND_ADDRESS) return process.env.EMAIL_INBOUND_ADDRESS;

  const domain = getEmailFromDomain();
  if (domain) return `reply@${domain}`;

  return process.env.EMAIL_FROM ?? "";
}

export function getEmailInboundConfig() {
  const from = process.env.EMAIL_FROM ?? null;
  const replyTo = getEmailReplyToAddress() || null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? null;

  return {
    from,
    replyTo,
    webhookUrl: appUrl ? `${appUrl}/api/webhooks/email` : null,
  };
}

/** Verify the API key can call the Receiving API (required for inbound email body). */
export async function checkResendReceivingAccess(): Promise<ResendReceivingAccess> {
  if (!process.env.RESEND_API_KEY) return "not_configured";

  try {
    const response = await fetch("https://api.resend.com/emails/receiving", {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });

    if (response.ok) return "ok";

    const text = await response.text();
    if (response.status === 401 && text.includes("restricted")) {
      return "restricted";
    }

    return "restricted";
  } catch {
    return "restricted";
  }
}

/** Fetch full body + headers — Resend webhooks only send metadata. */
export async function fetchResendReceivedEmail(
  emailId: string
): Promise<ResendReceivedEmail> {
  const response = await fetch(
    `https://api.resend.com/emails/receiving/${emailId}`,
    {
      headers: { Authorization: `Bearer ${getApiKey()}` },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch received email (${response.status}): ${await response.text()}`
    );
  }

  const data = (await response.json()) as {
    text?: string;
    html?: string;
    subject?: string;
    from?: string;
    to?: string | string[];
    headers?: Record<string, string | string[]>;
  };

  const fromHeader = data.headers?.from;
  const from =
    data.from ??
    (typeof fromHeader === "string" ? fromHeader : fromHeader?.[0]) ??
    "";

  const messageIdHeader = data.headers?.["message-id"] ?? data.headers?.["Message-ID"];
  const messageId =
    typeof messageIdHeader === "string"
      ? messageIdHeader
      : messageIdHeader?.[0];

  const inReplyTo = parseMessageIdHeader(
    data.headers?.["in-reply-to"] ?? data.headers?.["In-Reply-To"]
  );
  const references = parseMessageIdHeader(
    data.headers?.references ?? data.headers?.References
  );

  const toHeader = data.headers?.to ?? data.headers?.To ?? data.to;
  const toValues = Array.isArray(toHeader)
    ? toHeader
    : toHeader
      ? [toHeader]
      : [];
  const to = toValues.flatMap((entry) => parseEmailList(String(entry)));

  return {
    text: data.text ?? data.html ?? "",
    html: data.html,
    subject: data.subject ?? "(no subject)",
    from: parseEmailAddress(from),
    messageId,
    inReplyTo,
    references,
    to,
  };
}

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  inReplyTo?: string;
  messageId?: string;
}): Promise<ResendSendResult> {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is not configured.");

  const replyTo = getEmailReplyToAddress();
  const headers: Record<string, string> = {};
  const domain = from.split("@")[1] ?? "aarvanta.co";
  const messageId =
    input.messageId ?? `<${crypto.randomUUID()}@${domain}>`;

  headers["Message-ID"] = messageId;

  if (input.inReplyTo) {
    headers["In-Reply-To"] = input.inReplyTo;
    headers.References = input.inReplyTo;
  }

  const body: Record<string, unknown> = {
    from,
    to: [input.to],
    subject: input.subject,
    text: input.text,
  };

  if (input.html) body.html = input.html;

  if (replyTo) body.reply_to = replyTo;
  if (Object.keys(headers).length > 0) body.headers = headers;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Email send failed (${response.status}): ${await response.text()}`);
  }

  const result = (await response.json()) as { id?: string };
  return { id: result.id ?? "", messageId };
}

function parseMessageIdHeader(
  raw: string | string[] | undefined
): string[] {
  if (!raw) return [];
  const values = Array.isArray(raw) ? raw : [raw];
  return values.flatMap((entry) =>
    entry
      .split(/\s+/)
      .map((part) => part.replace(/^<|>$/g, "").trim())
      .filter(Boolean)
  );
}

function parseEmailList(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => parseEmailAddress(part))
    .filter(Boolean);
}

function parseEmailAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim().toLowerCase();
}
