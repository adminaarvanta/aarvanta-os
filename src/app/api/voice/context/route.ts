import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@/lib/api/request";
import { buildCallMemorySummary } from "@/lib/calling/call-memory";
import { resolveCallVoiceAgent } from "@/lib/calling/resolve-voice-agent";
import { liveClonedVoiceId } from "@/lib/channels/cloned-voice";
import { resolveVoiceCallingConfig } from "@/lib/channels/voice-calling-config";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getKnowledgeRepository } from "@/lib/data/knowledge-store";
import { searchKnowledgeChunks } from "@/lib/knowledge/search";
import { getWorkspaceSettings } from "@/lib/settings/workspace-settings";
import { getWebhookTenantScope } from "@/lib/tenant/context";
import { DEFAULT_FLOW_CONFIG } from "@/types/calling-agent";
import { contactDisplayName } from "@/types/crm";

/**
 * Voice relay (EC2) fetches company knowledge + campaign/contact memory at setup.
 * Auth: X-Voice-Relay-Secret === VOICE_RELAY_CALLBACK_SECRET
 */
const schema = z.object({
  conversationId: z.string().optional(),
  direction: z.string().optional(),
  topic: z.string().max(2000).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  contactId: z.string().optional(),
  queueId: z.string().optional(),
  sessionId: z.string().optional(),
  campaignId: z.string().optional(),
  voiceAgentId: z.string().optional(),
});

const DIGEST_MAX_CHARS = 1800;
const DEFAULT_TOPIC =
  "company overview products services pricing FAQ hours support what we do";

export async function POST(req: Request) {
  const expected = process.env.VOICE_RELAY_CALLBACK_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "VOICE_RELAY_CALLBACK_SECRET not configured" },
      { status: 503 }
    );
  }

  const secret = req.headers.get("x-voice-relay-secret")?.trim();
  if (!secret || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseJsonBody<unknown>(req);
  if (body instanceof NextResponse) return body;

  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const scope = getWebhookTenantScope();
  const settings = await getWorkspaceSettings(scope.workspaceId);
  const businessName = settings.businessName?.trim() || "Aarvanta";
  const voicePrefs = resolveVoiceCallingConfig(settings);

  const knowledgeRepo = getKnowledgeRepository();
  const chunks = await knowledgeRepo.listChunks(scope);
  const topic = parsed.data.topic?.trim() || DEFAULT_TOPIC;

  let knowledgeDigest = "";
  if (chunks.length) {
    const hits = await searchKnowledgeChunks(chunks, topic, 6);
    if (hits.length) {
      const parts: string[] = [];
      let used = 0;
      for (const hit of hits) {
        const title = hit.chunk.documentTitle?.trim() || "Document";
        const content = hit.chunk.content.trim().replace(/\s+/g, " ");
        const block = `[${title}] ${content}`;
        if (used + block.length + 2 > DIGEST_MAX_CHARS) {
          const room = DIGEST_MAX_CHARS - used - 2;
          if (room > 80) {
            parts.push(block.slice(0, room) + "…");
          }
          break;
        }
        parts.push(block);
        used += block.length + 2;
      }
      knowledgeDigest = parts.join("\n\n");
    }
  }

  const calling = getCallingAgentRepository();
  let contactId = parsed.data.contactId;
  let voiceAgentId = parsed.data.voiceAgentId;
  let campaignGoal = "";
  let memorySummary = "";
  let contactName = "";
  let contactTitle = "";
  let companyName = "";

  if (parsed.data.sessionId) {
    const session = await calling.getSession(parsed.data.sessionId, scope);
    if (session) {
      contactId = contactId || session.contactId;
      voiceAgentId = voiceAgentId || session.voiceAgentId;
      memorySummary = session.memorySummary ?? "";
      if (session.callSid == null && parsed.data.from) {
        /* noop — sid set later */
      }
    }
  }

  if (parsed.data.campaignId) {
    const campaign = await calling.getCampaign(parsed.data.campaignId, scope);
    if (campaign) {
      campaignGoal = campaign.goal;
      voiceAgentId = voiceAgentId || campaign.voiceAgentId;
    }
  }

  const agent = await resolveCallVoiceAgent(scope, {
    voiceAgentId,
    campaignId: parsed.data.campaignId,
  });

  if (contactId) {
    const contact = await getCrmRepository().getContact(contactId, scope);
    if (contact) {
      contactName = contactDisplayName(contact);
      contactTitle = contact.jobTitle ?? "";
      if (contact.accountId) {
        const company = await getCrmRepository().getCompany(
          contact.accountId,
          scope
        );
        companyName = company?.name ?? "";
      }
      if (!memorySummary) {
        memorySummary = await buildCallMemorySummary(contactId, scope);
      }
    }
  }

  const flowConfig = agent?.flowConfig ?? DEFAULT_FLOW_CONFIG;
  const stageBrief = flowConfig.stages
    .map(
      (s) =>
        `${s.id}: ${s.objective} (transitions: ${s.transitions
          .map((t) => `${t.when}→${t.to}`)
          .join(", ") || "end"})`
    )
    .join("\n");

  const clonedVoiceId = liveClonedVoiceId(agent);
  const recordingNotice =
    clonedVoiceId &&
    voicePrefs.callRecordingEnabled &&
    voicePrefs.callRecordingAnnounce
      ? voicePrefs.recordingNotice
      : "";

  return NextResponse.json({
    businessName,
    knowledgeDigest,
    chunkCount: chunks.length,
    contactId,
    contactName,
    contactTitle,
    companyName,
    campaignGoal,
    memorySummary,
    voiceAgentName: agent?.greetingName ?? agent?.name ?? "Ava",
    language: agent?.language ?? "en-US",
    entryStage: flowConfig.entryStage,
    flowStages: stageBrief,
    sessionId: parsed.data.sessionId,
    campaignId: parsed.data.campaignId,
    queueId: parsed.data.queueId,
    clonedVoiceId: clonedVoiceId ?? "",
    recordingNotice,
  });
}
