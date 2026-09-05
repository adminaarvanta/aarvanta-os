import { isDemoMode } from "@/lib/config/app-mode";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getIntegrationRepository } from "@/lib/data/integration-store";
import { getTenantRepository } from "@/lib/data/tenant-store";
import type { SessionContext } from "@/lib/tenant/context";
import type { TenantScope } from "@/types/communication";
import type { IntegrationConnection } from "@/types/integration";
import type { MemberRole } from "@/types/tenant";

export type TeamCalendarRow = {
  userId: string;
  name: string;
  email: string;
  role: MemberRole;
  connected: boolean;
  accountLabel?: string;
  lastSyncAt?: string;
  lastSyncError?: string;
  isCurrentUser: boolean;
};

export function isGoogleCalendarOAuthConfigured(): boolean {
  const clientId =
    process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim() ||
    process.env.SSO_GOOGLE_CLIENT_ID?.trim();
  const clientSecret =
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim() ||
    process.env.SSO_GOOGLE_CLIENT_SECRET?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return Boolean(clientId && clientSecret && appUrl);
}

export function assertActiveMember(ctx: SessionContext) {
  if (ctx.member?.status === "suspended") {
    throw new Error("Forbidden");
  }
  if (!isDemoMode() && ctx.member?.status !== "active") {
    throw new Error("Forbidden");
  }
}

export function pickCalendarConnection(
  connections: IntegrationConnection[],
  userId?: string
): IntegrationConnection | null {
  const calendars = connections.filter((c) => c.provider === "google_calendar");
  if (userId) {
    return calendars.find((c) => c.userId === userId) ?? null;
  }
  return calendars.find((c) => !c.userId) ?? calendars[0] ?? null;
}

export async function getUserCalendarConnection(
  scope: TenantScope,
  userId?: string
): Promise<IntegrationConnection | null> {
  const repo = getIntegrationRepository();
  if (userId) {
    const owned = await repo.getConnection(
      scope.tenantId,
      scope.workspaceId,
      "google_calendar",
      userId
    );
    if (owned) return owned;
    const legacy = await repo.getConnection(
      scope.tenantId,
      scope.workspaceId,
      "google_calendar"
    );
    return legacy && !legacy.userId ? legacy : null;
  }
  return repo.getConnection(
    scope.tenantId,
    scope.workspaceId,
    "google_calendar"
  );
}

export async function listTeamCalendars(
  scope: TenantScope,
  currentUserId: string
): Promise<TeamCalendarRow[]> {
  const [members, connections] = await Promise.all([
    getTenantRepository().listMembers(scope),
    getIntegrationRepository().listConnections(
      scope.tenantId,
      scope.workspaceId
    ),
  ]);

  return members
    .filter((m) => m.status === "active")
    .map((m) => {
      const conn = pickCalendarConnection(connections, m.userId);
      return {
        userId: m.userId,
        name: m.name,
        email: m.email,
        role: m.role,
        connected: conn?.status === "connected",
        accountLabel: conn?.accountLabel,
        lastSyncAt: conn?.lastSyncAt,
        lastSyncError: conn?.lastSyncError,
        isCurrentUser: m.userId === currentUserId,
      };
    });
}

export async function resolveCalendarUserId(
  scope: TenantScope,
  hints: {
    userId?: string;
    campaignId?: string;
    sessionId?: string;
    leadId?: string;
  }
): Promise<string | undefined> {
  if (hints.userId) return hints.userId;

  const calling = getCallingAgentRepository();
  if (hints.sessionId) {
    const session = await calling.getSession(hints.sessionId, scope);
    if (session?.campaignId) {
      const campaign = await calling.getCampaign(session.campaignId, scope);
      if (campaign?.createdBy) return campaign.createdBy;
    }
  }
  if (hints.campaignId) {
    const campaign = await calling.getCampaign(hints.campaignId, scope);
    if (campaign?.createdBy) return campaign.createdBy;
  }
  if (hints.leadId) {
    const contact = await getCrmRepository().getContact(hints.leadId, scope);
    if (contact?.ownerId) return contact.ownerId;
  }
  return undefined;
}
