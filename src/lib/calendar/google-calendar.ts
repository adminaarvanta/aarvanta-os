import { getIntegrationRepository } from "@/lib/data/integration-store";
import { isDemoMode } from "@/lib/config/app-mode";
import { crmNow } from "@/lib/data/crm-helpers";
import { getUserCalendarConnection } from "@/lib/calendar/user-calendar";
import type { TenantScope } from "@/types/communication";
import type { IntegrationConnection } from "@/types/integration";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

type StoredTokens = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  email?: string;
};

function clientConfig() {
  const clientId =
    process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim() ||
    process.env.SSO_GOOGLE_CLIENT_ID?.trim();
  const clientSecret =
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim() ||
    process.env.SSO_GOOGLE_CLIENT_SECRET?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!clientId || !clientSecret || !appUrl) {
    throw new Error(
      "Google Calendar OAuth is not configured (GOOGLE_CALENDAR_CLIENT_ID/SECRET and NEXT_PUBLIC_APP_URL)."
    );
  }
  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/integrations/google-calendar/oauth/callback`,
  };
}

export function getGoogleCalendarAuthUrl(state: string) {
  const { clientId, redirectUri } = clientConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
      "openid",
      "email",
    ].join(" "),
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCalendarCode(code: string) {
  const { clientId, clientSecret, redirectUri } = clientConfig();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function fetchGoogleAccountEmail(
  accessToken: string
): Promise<string | undefined> {
  try {
    const res = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { email?: string };
    return data.email?.trim() || undefined;
  } catch {
    return undefined;
  }
}

function tokensFromConnection(conn: IntegrationConnection): StoredTokens | null {
  if (conn.status !== "connected") return null;
  if (!conn.metadata) {
    return { email: conn.accountLabel };
  }
  return {
    accessToken: conn.metadata.accessToken,
    refreshToken: conn.metadata.refreshToken,
    expiresAt: conn.metadata.expiresAt
      ? Number(conn.metadata.expiresAt)
      : undefined,
    email: conn.metadata.email || conn.accountLabel,
  };
}

async function getStoredTokens(
  scope: TenantScope,
  userId?: string
): Promise<StoredTokens | null> {
  const conn = await getUserCalendarConnection(scope, userId);
  if (!conn) return null;
  return tokensFromConnection(conn);
}

async function persistConnection(conn: IntegrationConnection) {
  try {
    const { getAdminFirestore } = await import("@/lib/firebase/admin");
    const { isMemoryDatastore } = await import("@/lib/data/datastore");
    if (!isMemoryDatastore()) {
      const db = getAdminFirestore();
      if (db) {
        await db.collection("integrations").doc(conn.id).set(conn);
        return;
      }
    }
  } catch {
    /* fall through to in-memory patch */
  }
}

async function saveTokens(
  scope: TenantScope,
  tokens: StoredTokens,
  userId?: string
) {
  const repo = getIntegrationRepository();
  const conn = await repo.connect(
    scope.tenantId,
    scope.workspaceId,
    "google_calendar",
    tokens.email ?? "Google Calendar",
    userId
  );
  const metadata = {
    accessToken: tokens.accessToken ?? "",
    refreshToken: tokens.refreshToken ?? conn.metadata?.refreshToken ?? "",
    expiresAt: String(tokens.expiresAt ?? ""),
    email: tokens.email ?? "",
  };
  const updated: IntegrationConnection = {
    ...conn,
    userId: userId ?? conn.userId,
    status: "connected",
    accountLabel: tokens.email ?? conn.accountLabel ?? "Google Calendar",
    metadata,
    lastSyncAt: crmNow(),
    lastSyncError: undefined,
    connectedAt: new Date().toISOString(),
  };

  await persistConnection(updated);
  (conn as IntegrationConnection).metadata = metadata;
  (conn as IntegrationConnection).userId = updated.userId;
  (conn as IntegrationConnection).accountLabel = updated.accountLabel;
  (conn as IntegrationConnection).lastSyncAt = updated.lastSyncAt;
}

export async function storeGoogleCalendarTokens(
  scope: TenantScope,
  tokens: StoredTokens,
  userId?: string
) {
  await saveTokens(scope, tokens, userId);
}

async function refreshAccessToken(
  scope: TenantScope,
  refreshToken: string,
  userId?: string
) {
  const { clientId, clientSecret } = clientConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  const tokens = {
    accessToken: data.access_token,
    refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  await saveTokens(scope, tokens, userId);
  return tokens.accessToken;
}

async function getAccessToken(
  scope: TenantScope,
  userId?: string
): Promise<string | null> {
  const tokens = await getStoredTokens(scope, userId);
  if (!tokens?.accessToken && !tokens?.refreshToken) return null;
  if (
    tokens.accessToken &&
    tokens.expiresAt &&
    tokens.expiresAt > Date.now() + 60_000
  ) {
    return tokens.accessToken;
  }
  if (tokens.refreshToken) {
    return refreshAccessToken(scope, tokens.refreshToken, userId);
  }
  return tokens.accessToken ?? null;
}

export async function hasGoogleCalendarConnection(
  scope: TenantScope,
  userId?: string
): Promise<boolean> {
  const conn = await getUserCalendarConnection(scope, userId);
  return conn?.status === "connected";
}

/** True when we can call the live Google Calendar API for this user. */
export async function hasLiveGoogleCalendar(
  scope: TenantScope,
  userId?: string
): Promise<boolean> {
  if (isDemoMode()) return false;
  if (userId) {
    const tokens = await getStoredTokens(scope, userId);
    return Boolean(tokens?.refreshToken || tokens?.accessToken);
  }
  const connections = await getIntegrationRepository().listConnections(
    scope.tenantId,
    scope.workspaceId
  );
  return connections.some((c) => {
    if (c.provider !== "google_calendar" || c.status !== "connected") {
      return false;
    }
    const tokens = tokensFromConnection(c);
    return Boolean(tokens?.refreshToken || tokens?.accessToken);
  });
}

export async function fetchGoogleFreeBusy(
  scope: TenantScope,
  timeMin: string,
  timeMax: string,
  userId?: string
): Promise<{ start: string; end: string }[]> {
  const accessToken = await getAccessToken(scope, userId);
  if (!accessToken) return [];

  const res = await fetch(`${CALENDAR_API}/freeBusy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: "primary" }],
    }),
  });
  if (!res.ok) {
    throw new Error(`FreeBusy failed: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    calendars?: { primary?: { busy?: { start: string; end: string }[] } };
  };
  return data.calendars?.primary?.busy ?? [];
}

export async function fetchTeamGoogleFreeBusy(
  scope: TenantScope,
  timeMin: string,
  timeMax: string,
  userId?: string
): Promise<{ start: string; end: string }[]> {
  if (userId) {
    return fetchGoogleFreeBusy(scope, timeMin, timeMax, userId);
  }

  const connections = await getIntegrationRepository().listConnections(
    scope.tenantId,
    scope.workspaceId
  );
  const userIds = [
    ...new Set(
      connections
        .filter(
          (c) => c.provider === "google_calendar" && c.status === "connected"
        )
        .map((c) => c.userId)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  if (userIds.length === 0) {
    return fetchGoogleFreeBusy(scope, timeMin, timeMax);
  }

  const chunks = await Promise.all(
    userIds.map((id) =>
      fetchGoogleFreeBusy(scope, timeMin, timeMax, id).catch(() => [])
    )
  );
  return chunks.flat();
}

export async function createGoogleCalendarEvent(
  scope: TenantScope,
  input: {
    title: string;
    description?: string;
    start: string;
    end: string;
    timezone: string;
    attendeeEmail?: string;
  },
  userId?: string
): Promise<{ eventId: string; meetLink?: string; htmlLink?: string }> {
  const accessToken = await getAccessToken(scope, userId);
  if (!accessToken) {
    throw new Error("Google Calendar is not connected");
  }

  const res = await fetch(
    `${CALENDAR_API}/calendars/primary/events?conferenceDataVersion=1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.title,
        description: input.description,
        start: { dateTime: input.start, timeZone: input.timezone },
        end: { dateTime: input.end, timeZone: input.timezone },
        attendees: input.attendeeEmail
          ? [{ email: input.attendeeEmail }]
          : undefined,
        conferenceData: {
          createRequest: {
            requestId: `aarvanta-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Create event failed: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    id: string;
    htmlLink?: string;
    hangoutLink?: string;
    conferenceData?: { entryPoints?: { uri?: string }[] };
  };
  const meetLink =
    data.hangoutLink ||
    data.conferenceData?.entryPoints?.find((e) => e.uri)?.uri;
  return { eventId: data.id, meetLink, htmlLink: data.htmlLink };
}

export async function updateGoogleCalendarEvent(
  scope: TenantScope,
  eventId: string,
  input: {
    start: string;
    end: string;
    timezone: string;
    title?: string;
  },
  userId?: string
) {
  const accessToken = await getAccessToken(scope, userId);
  if (!accessToken) throw new Error("Google Calendar is not connected");

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events/${eventId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: input.title,
      start: { dateTime: input.start, timeZone: input.timezone },
      end: { dateTime: input.end, timeZone: input.timezone },
    }),
  });
  if (!res.ok) {
    throw new Error(`Update event failed: ${await res.text()}`);
  }
  return res.json();
}

export async function deleteGoogleCalendarEvent(
  scope: TenantScope,
  eventId: string,
  userId?: string
) {
  const accessToken = await getAccessToken(scope, userId);
  if (!accessToken) throw new Error("Google Calendar is not connected");

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Delete event failed: ${await res.text()}`);
  }
}

export async function syncUserGoogleCalendar(
  scope: TenantScope,
  userId: string
): Promise<IntegrationConnection | null> {
  const repo = getIntegrationRepository();
  const connection = await repo.sync(
    scope.tenantId,
    scope.workspaceId,
    "google_calendar",
    userId
  );
  if (!connection) return null;

  if (await hasLiveGoogleCalendar(scope, userId)) {
    try {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 7 * 86_400_000).toISOString();
      await fetchGoogleFreeBusy(scope, timeMin, timeMax, userId);
    } catch (error) {
      const lastSyncError =
        error instanceof Error ? error.message : "Calendar sync failed";
      const updated: IntegrationConnection = {
        ...connection,
        lastSyncError,
      };
      await persistConnection(updated);
      connection.lastSyncError = lastSyncError;
      return connection;
    }
  }

  return connection;
}
