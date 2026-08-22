import { CreateVoiceAgentForm } from "@/components/voice/create-voice-agent-form";
import { VoiceAgentCard } from "@/components/voice/voice-agent-card";
import { VoicePageShell } from "@/components/voice/voice-ui";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getWorkspaceSettings } from "@/lib/settings/workspace-settings";
import { getTenantScope } from "@/lib/tenant/context";

export default async function VoiceAgentsPage() {
  const scope = await getTenantScope();
  const [agents, settings] = await Promise.all([
    getCallingAgentRepository().listAgents(scope),
    getWorkspaceSettings(scope.workspaceId),
  ]);
  const primaryId = settings.voicePrimaryAgentId?.trim() ?? "";

  return (
    <VoicePageShell
      title="Voice Agents"
      subtitle="Create a new persona, then clone a custom voice. Set one as primary for Dialer, inbound, and scheduled calls."
      tone="navy"
    >
      <div className="space-y-4 p-4 sm:p-6">
        <CreateVoiceAgentForm />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <VoiceAgentCard
              key={agent.id}
              agent={agent}
              isPrimary={agent.id === primaryId}
            />
          ))}
        </div>
      </div>
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Voice Agents" };
