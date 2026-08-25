import { isDemoMode, isProductionMode } from "@/lib/config/app-mode";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export function getWhatsAppAccessToken(): string | null {
  return process.env.WHATSAPP_ACCESS_TOKEN?.trim() || null;
}

export function getWhatsAppPhoneNumberId(): string | null {
  return process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() || null;
}

/** WhatsApp Business Account ID from env, if set. */
export function getWhatsAppBusinessAccountId(): string | null {
  return (
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim() ||
    process.env.WHATSAPP_WABA_ID?.trim() ||
    null
  );
}

/**
 * Token + phone number are enough to attempt live management. WABA ID can
 * come from env or be resolved from Graph at request time.
 */
export function isWhatsAppManagementConfigured(): boolean {
  return Boolean(getWhatsAppAccessToken() && getWhatsAppPhoneNumberId());
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

async function whatsappGraphTry<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T | null> {
  try {
    return await whatsappGraphFetch<T>(path, init);
  } catch {
    return null;
  }
}

async function wabaOwnsPhone(
  wabaId: string,
  phoneNumberId: string
): Promise<boolean> {
  const phones = await whatsappGraphTry<{ data?: Array<{ id?: string }> }>(
    `/${wabaId}/phone_numbers?fields=id`
  );
  return Boolean(phones?.data?.some((phone) => phone.id === phoneNumberId));
}

async function firstMatchingWaba(
  wabaIds: string[],
  phoneNumberId: string
): Promise<string | null> {
  for (const wabaId of wabaIds) {
    if (!wabaId) continue;
    if (await wabaOwnsPhone(wabaId, phoneNumberId)) return wabaId;
  }
  return wabaIds.length === 1 ? wabaIds[0] : null;
}

let resolvedWabaId: string | null = null;

/**
 * Env WABA ID, or discover it from Graph using the configured phone number
 * and access token (debug_token target IDs, then Business Manager edges).
 */
export async function resolveWhatsAppBusinessAccountId(): Promise<string | null> {
  const fromEnv = getWhatsAppBusinessAccountId();
  if (fromEnv) return fromEnv;
  if (resolvedWabaId) return resolvedWabaId;

  const phoneNumberId = getWhatsAppPhoneNumberId();
  const token = getWhatsAppAccessToken();
  if (!phoneNumberId || !token) return null;

  const fromPhone = await whatsappGraphTry<{
    whatsapp_business_account?: { id?: string };
  }>(`/${phoneNumberId}?fields=whatsapp_business_account`);
  const phoneWaba = fromPhone?.whatsapp_business_account?.id?.trim();
  if (phoneWaba && (await wabaOwnsPhone(phoneWaba, phoneNumberId))) {
    resolvedWabaId = phoneWaba;
    return resolvedWabaId;
  }
  if (phoneWaba) {
    resolvedWabaId = phoneWaba;
    return resolvedWabaId;
  }

  const debug = await whatsappGraphTry<{
    data?: {
      granular_scopes?: Array<{ scope?: string; target_ids?: string[] }>;
    };
  }>(`/debug_token?input_token=${encodeURIComponent(token)}`);
  const debugIds = [
    ...new Set(
      (debug?.data?.granular_scopes ?? []).flatMap((scope) =>
        scope.scope?.startsWith("whatsapp_business_")
          ? scope.target_ids ?? []
          : []
      )
    ),
  ];
  const fromDebug = await firstMatchingWaba(debugIds, phoneNumberId);
  if (fromDebug) {
    resolvedWabaId = fromDebug;
    return resolvedWabaId;
  }

  const assigned = await whatsappGraphTry<{ data?: Array<{ id?: string }> }>(
    "/me/assigned_whatsapp_business_accounts?fields=id"
  );
  const assignedIds = (assigned?.data ?? [])
    .map((row) => row.id)
    .filter((id): id is string => Boolean(id));
  const fromAssigned = await firstMatchingWaba(assignedIds, phoneNumberId);
  if (fromAssigned) {
    resolvedWabaId = fromAssigned;
    return resolvedWabaId;
  }

  const businesses = await whatsappGraphTry<{ data?: Array<{ id?: string }> }>(
    "/me/businesses?fields=id"
  );
  for (const business of businesses?.data ?? []) {
    if (!business.id) continue;
    const owned = await whatsappGraphTry<{ data?: Array<{ id?: string }> }>(
      `/${business.id}/owned_whatsapp_business_accounts?fields=id`
    );
    const ownedIds = (owned?.data ?? [])
      .map((row) => row.id)
      .filter((id): id is string => Boolean(id));
    const match = await firstMatchingWaba(ownedIds, phoneNumberId);
    if (match) {
      resolvedWabaId = match;
      return resolvedWabaId;
    }
  }

  return null;
}
