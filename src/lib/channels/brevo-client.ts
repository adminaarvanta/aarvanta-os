import nodemailer from "nodemailer";

const BREVO_API = "https://api.brevo.com/v3";
const BREVO_SMTP_HOST = "smtp-relay.brevo.com";

export type BrevoAccountStatus = "ok" | "not_configured" | "error";
export type BrevoAuthMode = "api" | "smtp";

export interface BrevoSendInput {
  toEmail: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  tags?: string[];
}

export interface BrevoSendResult {
  messageId: string;
}

export class BrevoApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "BrevoApiError";
  }
}

function firstEnv(...keys: string[]): string | null {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return null;
}

export function getBrevoCredential(): {
  mode: BrevoAuthMode;
  key: string;
} | null {
  const smtpKey = firstEnv("BREVO_SMTP_KEY");
  const apiKey = firstEnv("BREVO_API_KEY");
  const key = smtpKey ?? apiKey;
  if (!key) return null;
  if (smtpKey || key.startsWith("xsmtpsib-")) {
    return { mode: "smtp", key };
  }
  return { mode: "api", key };
}

export function getBrevoApiKey(): string | null {
  const cred = getBrevoCredential();
  return cred?.mode === "api" ? cred.key : firstEnv("BREVO_API_KEY");
}

export function isBrevoConfigured(): boolean {
  return Boolean(getBrevoCredential());
}

export function getBrevoSender(): { email: string; name: string } {
  return {
    email:
      firstEnv("BREVO_SENDER_EMAIL", "EMAIL_FROM") ?? "admin@aarvanta.co",
    name: firstEnv("BREVO_SENDER_NAME") ?? "Aarvanta",
  };
}

export function getBrevoWebhookUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  if (!base) return null;
  const secret = process.env.BREVO_WEBHOOK_SECRET?.trim();
  const path = `${base}/api/webhooks/brevo`;
  return secret ? `${path}?secret=${encodeURIComponent(secret)}` : path;
}

export function getBrevoRuntimeStatus(): {
  configured: boolean;
  mode: BrevoAuthMode | null;
  sender: { email: string; name: string };
  webhookUrl: string | null;
} {
  const cred = getBrevoCredential();
  return {
    configured: Boolean(cred),
    mode: cred?.mode ?? null,
    sender: getBrevoSender(),
    webhookUrl: getBrevoWebhookUrl(),
  };
}

function getSmtpTransporter(key: string) {
  const sender = getBrevoSender();
  const user = firstEnv("BREVO_SMTP_LOGIN") ?? sender.email;
  return nodemailer.createTransport({
    host: BREVO_SMTP_HOST,
    port: 587,
    secure: false,
    auth: { user, pass: key },
  });
}

async function brevoFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const cred = getBrevoCredential();
  if (!cred || cred.mode !== "api") {
    throw new BrevoApiError("Brevo REST API key is not configured.", 503);
  }

  const res = await fetch(`${BREVO_API}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": cred.key,
      ...(init?.headers ?? {}),
    },
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof body === "object" &&
      body &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : `Brevo request failed (${res.status})`;
    throw new BrevoApiError(message, res.status, body);
  }

  return body as T;
}

export async function checkBrevoAccount(): Promise<BrevoAccountStatus> {
  const cred = getBrevoCredential();
  if (!cred) return "not_configured";
  try {
    if (cred.mode === "smtp") {
      await getSmtpTransporter(cred.key).verify();
      return "ok";
    }
    await brevoFetch<{ email?: string }>("/account");
    return "ok";
  } catch {
    return "error";
  }
}

async function sendViaSmtp(
  input: BrevoSendInput,
  key: string
): Promise<BrevoSendResult> {
  const sender = getBrevoSender();
  const fromEmail = input.fromEmail?.trim() || sender.email;
  const fromName = input.fromName?.trim() || sender.name;
  const replyTo = input.replyTo?.trim() || fromEmail;
  const transporter = getSmtpTransporter(key);

  const info = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: input.toName?.trim()
      ? `${input.toName.trim()} <${input.toEmail}>`
      : input.toEmail,
    replyTo,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return { messageId: info.messageId ?? `brevo_${crypto.randomUUID()}` };
}

export async function sendBrevoTransactional(
  input: BrevoSendInput
): Promise<BrevoSendResult> {
  const cred = getBrevoCredential();
  if (!cred) {
    throw new BrevoApiError("Brevo is not configured (BREVO_SMTP_KEY or BREVO_API_KEY).", 503);
  }
  if (cred.mode === "smtp") {
    return sendViaSmtp(input, cred.key);
  }

  const sender = getBrevoSender();
  const fromEmail = input.fromEmail?.trim() || sender.email;
  const fromName = input.fromName?.trim() || sender.name;
  const replyTo = input.replyTo?.trim() || fromEmail;

  const result = await brevoFetch<{ messageId?: string }>("/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [
        {
          email: input.toEmail,
          name: input.toName?.trim() || undefined,
        },
      ],
      replyTo: { email: replyTo },
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text,
      tags: input.tags?.slice(0, 10),
    }),
  });

  return { messageId: result.messageId ?? `brevo_${crypto.randomUUID()}` };
}
