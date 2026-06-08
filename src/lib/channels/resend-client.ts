export interface ResendReceivedEmail {
  text: string;
  html?: string;
  subject: string;
  from: string;
  messageId?: string;
}

export interface ResendSendResult {
  id: string;
}

function getApiKey() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");
  return apiKey;
}

export function getEmailReplyToAddress(): string {
  return (
    process.env.EMAIL_REPLY_TO ??
    process.env.EMAIL_INBOUND_ADDRESS ??
    process.env.EMAIL_FROM ??
    ""
  );
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

  return {
    text: data.text ?? data.html ?? "",
    html: data.html,
    subject: data.subject ?? "(no subject)",
    from: parseEmailAddress(from),
    messageId,
  };
}

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  text: string;
  inReplyTo?: string;
}): Promise<ResendSendResult> {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is not configured.");

  const replyTo = getEmailReplyToAddress();
  const headers: Record<string, string> = {};

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
  return { id: result.id ?? "" };
}

function parseEmailAddress(raw: string): string {
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim().toLowerCase();
}
