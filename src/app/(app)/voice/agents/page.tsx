import Link from "next/link";
import { CreateVoiceAgentForm } from "@/components/voice/create-voice-agent-form";
import { VoicePageShell } from "@/components/voice/voice-ui";
import { isDefaultCatalogAgent } from "@/lib/channels/cloned-voice";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function VoiceAgentsPage() {
  const scope = await getTenantScope();
  const agents = await getCallingAgentRepository().listAgents(scope);

  return (
    <VoicePageShell
      title="Voice Agents"
      subtitle="Create a new persona, then clone a custom voice. The default agent stays on the catalog voice."
      tone="navy"
    >
      <div className="space-y-4 p-4 sm:p-6">
        <CreateVoiceAgentForm />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const catalogDefault = isDefaultCatalogAgent(agent);
            return (
              <div
                key={agent.id}
                className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-sm font-bold text-[var(--navy)] dark:text-gold">
                  {agent.name.slice(0, 1)}
                </div>
                <p className="font-semibold text-foreground">{agent.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {agent.language}
                  {catalogDefault
                    ? " · Default catalog"
                    : agent.clonedVoice?.status === "ready"
                      ? " · Custom clone"
                      : agent.ttsProvider
                        ? ` · ${agent.ttsProvider}`
                        : ""}{" "}
                  · {agent.flowConfig.stages.length} stages
                </p>
                <Link
                  href={`/voice/agents/${agent.id}/flow`}
                  className="mt-4 inline-flex text-sm font-medium text-gold hover:underline"
                >
                  {catalogDefault ? "Edit flow →" : "Voice & flow →"}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Voice Agents" };
