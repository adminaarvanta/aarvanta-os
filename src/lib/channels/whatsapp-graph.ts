import { isDemoMode, isProductionMode } from "@/lib/config/app-mode";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export function getWhatsAppAccessToken(): string | null {
  return process.env.WHATSAPP_ACCESS_TOKEN?.trim() || null;
}

export function getWhatsAppPhoneNumberId(): string | null {
  return process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || null;
}

/** WhatsApp Business Account ID — required for template management. */
export function getWhatsAppBusinessAccountId(): string | null {
  return (
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim() ||
    process.env.WHATSAPP_WABA_ID?.trim() ||
    null
  );
}

export function isWhatsAppManagementConfigured(): boolean {
  return Boolean(
    getWhatsAppAccessToken() &&
      getWhatsAppPhoneNumberId() &&
      getWhatsAppBusinessAccountId()
  );
}

/** Live Graph calls only outside demo / CHANNELS_SIMULATE. */
export function shouldUseLiveWhatsAppManagement(): boolean {
  if (process.env.CHANNELS_SIMULATE === "true") return false;
  if (isDemoMode()) return false;
  return isWhatsAppManagementConfigured();
}

export function getWhatsAppManagementStatus():
  | "live"
  | "simulate"
  | "not_configured" {
  if (!isWhatsAppManagementConfigured() && isProductionMode()) {
    return "not_configured";
  }
  if (shouldUseLiveWhatsAppManagement()) return "live";
  if (isDemoMode() || process.env.CHANNELS_SIMULATE === "true") {
    return "simulate";
  }
  return isWhatsAppManagementConfigured() ? "live" : "not_configured";
}

export class WhatsAppGraphError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`WhatsApp Graph error (${status}): ${body}`);
    this.status = status;
    this.body = body;
  }
}

export async function whatsappGraphFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = getWhatsAppAccessToken();
  if (!token) {
    throw new Error("WhatsApp access token is not configured.");
  }

  const url = path.startsWith("http")
    ? path
    : `${GRAPH_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, { ...init, headers });
  const text = await response.text();
  if (!response.ok) {
    throw new WhatsAppGraphError(response.status, text);
  }
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
