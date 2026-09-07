import { CreateVoiceAgentForm } from "@/components/voice/create-voice-agent-form";
import { VoiceAgentCard } from "@/components/voice/voice-agent-card";
import { VoicePageShell } from "@/components/voice/voice-ui";
import {
  getUserPrimaryAgentId,
  listVoiceAgentsForUser,
} from "@/lib/calling/resolve-voice-agent";
import { getSessionContext } from "@/lib/tenant/context";

export default async function VoiceAgentsPage() {
  const ctx = await getSessionContext();
  const [agents, primaryId] = await Promise.all([
    listVoiceAgentsForUser(ctx.scope, ctx.userId),
    getUserPrimaryAgentId(ctx.scope, ctx.userId),
  ]);

  return (
    <VoicePageShell
      title="Voice Agents"
      subtitle="Your private personas. Create one, clone a custom voice, and set it as primary for your Dialer, inbound, and scheduled calls. Other teammates cannot see these agents."
      tone="navy"
    >
      <div className="space-y-4 p-4 sm:p-6">
        <CreateVoiceAgentForm />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <VoiceAgentCard
              key={agent.id}
              agent={agent}
              isPrimary={agent.id === (primaryId ?? "")}
            />
          ))}
        </div>
      </div>
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Voice Agents" };
