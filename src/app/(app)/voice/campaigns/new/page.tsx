import { CampaignWizard } from "@/components/voice/campaign-wizard";
import { VoicePageShell } from "@/components/voice/voice-ui";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getWorkspaceSettings } from "@/lib/settings/workspace-settings";
import { getTenantScope } from "@/lib/tenant/context";

export default async function NewCampaignPage() {
  const scope = await getTenantScope();
  const [agents, settings] = await Promise.all([
    getCallingAgentRepository().listAgents(scope),
    getWorkspaceSettings(scope.workspaceId),
  ]);

  return (
    <VoicePageShell
      title="Campaign builder"
      subtitle="Campaign → Leads → Voice Agent → Working Hours → Retry Rules → Launch"
      tone="gold"
    >
      <CampaignWizard
        initialAgents={agents}
        initialPrimaryAgentId={settings.voicePrimaryAgentId}
      />
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · New Campaign" };
