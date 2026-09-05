import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/api/request";
import {
  classifyOpenSession,
  connectionNote,
} from "@/lib/calling/stale-call-session";
import { sweepStaleSessions } from "@/lib/calling/sweep-stale-sessions";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getRepository } from "@/lib/data/repository";
import { getTenantScope } from "@/lib/tenant/context";
import type { CallCampaign, CallSession, VoiceAgent } from "@/types/calling-agent";
import type { TenantScope } from "@/types/communication";
import { contactDisplayName, type CrmCompany, type CrmContact } from "@/types/crm";

export async function GET(req: Request) {
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    return unauthorized();
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const campaignId = url.searchParams.get("campaignId") ?? undefined;
  const live = status === "live";

  let closedCount = 0;
  let repairedCount = 0;
  if (live) {
    const sweep = await sweepStaleSessions({ scope });
    closedCount = sweep.closed;
    repairedCount = sweep.repaired;
  }

  const repo = getCallingAgentRepository();
  const sessions = live
    ? [
        ...(await repo.listSessions(scope, {
          status: "ringing",
          ...(campaignId ? { campaignId } : {}),
        })),
        ...(await repo.listSessions(scope, {
          status: "in_progress",
          ...(campaignId ? { campaignId } : {}),
        })),
      ].sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      )
    : await repo.listSessions(scope, {
        ...(status === "ringing" ||
        status === "in_progress" ||
        status === "completed" ||
        status === "failed"
          ? { status }
          : {}),
        ...(campaignId ? { campaignId } : {}),
      });

  const crm = getCrmRepository();
  const inbox = getRepository();
  const [contacts, companies, campaigns, agents] = await Promise.all([
    crm.listContacts(scope),
    crm.listCompanies(scope),
    repo.listCampaigns(scope),
    repo.listAgents(scope),
  ]);
  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const companyById = new Map(companies.map((c) => [c.id, c]));
  const campaignById = new Map(campaigns.map((c) => [c.id, c]));
  const agentById = new Map(agents.map((a) => [a.id, a]));

  const enriched = await Promise.all(
    sessions.map((session) =>
      enrichLiveSession(session, {
        scope,
        inbox,
        contactById,
        companyById,
        campaignById,
        agentById,
      })
    )
  );

  return NextResponse.json({
    sessions: enriched,
    ...(live ? { closedCount, repairedCount } : {}),
  });
}

async function enrichLiveSession(
  session: CallSession,
  ctx: {
    scope: TenantScope;
    inbox: ReturnType<typeof getRepository>;
    contactById: Map<string, CrmContact>;
    companyById: Map<string, CrmCompany>;
    campaignById: Map<string, CallCampaign>;
    agentById: Map<string, VoiceAgent>;
  }
) {
  const contact = session.contactId
    ? ctx.contactById.get(session.contactId)
    : undefined;
  const company = contact?.accountId
    ? ctx.companyById.get(contact.accountId)
    : undefined;
  const campaign = session.campaignId
    ? ctx.campaignById.get(session.campaignId)
    : undefined;
  const agent = session.voiceAgentId
    ? ctx.agentById.get(session.voiceAgentId)
    : undefined;

  let conversationPhone: string | undefined;
  if (!contact?.phone && session.conversationId) {
    const conversation = await ctx.inbox.getConversation(
      session.conversationId,
      ctx.scope
    );
    conversationPhone = conversation?.contact?.phone ?? undefined;
  }

  const verdict = classifyOpenSession(session);

  return {
    ...session,
    contactName: contact ? contactDisplayName(contact) : undefined,
    phone: contact?.phone ?? conversationPhone,
    jobTitle: contact?.jobTitle,
    companyName: company?.name,
    campaignName: campaign?.name,
    agentName: agent?.name ?? agent?.greetingName,
    phase: verdict.phase,
    stale: verdict.stale,
    connectionNote: connectionNote(session, verdict),
  };
}
