import { CampaignWizard } from "@/components/voice/campaign-wizard";
import { VoicePageShell } from "@/components/voice/voice-ui";
import {
  getUserPrimaryAgentId,
  listVoiceAgentsForUser,
} from "@/lib/calling/resolve-voice-agent";
import { getSessionContext } from "@/lib/tenant/context";

export default async function NewCampaignPage() {
  const ctx = await getSessionContext();
  const [agents, primaryAgentId] = await Promise.all([
    listVoiceAgentsForUser(ctx.scope, ctx.userId),
    getUserPrimaryAgentId(ctx.scope, ctx.userId),
  ]);

  return (
    <VoicePageShell
      title="Campaign builder"
      subtitle="Campaign → Leads → Voice Agent → Working Hours → Retry Rules → Launch"
      tone="gold"
    >
      <CampaignWizard
        initialAgents={agents}
        initialPrimaryAgentId={primaryAgentId}
      />
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · New Campaign" };
