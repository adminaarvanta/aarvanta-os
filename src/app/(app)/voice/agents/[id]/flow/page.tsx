import Link from "next/link";
import { notFound } from "next/navigation";
import { FlowBuilder } from "@/components/voice/flow-builder";
import { VoicePageShell } from "@/components/voice/voice-ui";
import { getUserPrimaryAgentId } from "@/lib/calling/resolve-voice-agent";
import { canViewVoiceAgent } from "@/lib/calling/voice-agent-access";
import { isDefaultCatalogAgent } from "@/lib/channels/cloned-voice";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getSessionContext } from "@/lib/tenant/context";

type Params = { params: Promise<{ id: string }> };

export default async function AgentFlowPage({ params }: Params) {
  const { id } = await params;
  const ctx = await getSessionContext();
  const [agent, primaryId] = await Promise.all([
    getCallingAgentRepository().getAgent(id, ctx.scope),
    getUserPrimaryAgentId(ctx.scope, ctx.userId),
  ]);
  if (!agent || !canViewVoiceAgent(agent, ctx.userId)) notFound();
  const catalogDefault = isDefaultCatalogAgent(agent);
  const isPrimary = primaryId === agent.id;

  return (
    <VoicePageShell
      title={agent.name}
      subtitle={
        catalogDefault
          ? "Catalog template — create your own agent to clone a custom voice."
          : isPrimary
            ? "Your primary agent for Dialer, inbound, and scheduled calls."
            : "Set how they sound, then mark as primary so your calls use this agent."
      }
      tone="navy"
      actions={
        <Link
          href="/voice/agents"
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
        >
          ← Voice Agents
        </Link>
      }
    >
      <FlowBuilder agent={agent} isPrimary={isPrimary} />
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Voice Agent" };
