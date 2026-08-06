import Link from "next/link";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function VoiceAgentsPage() {
  const scope = await getTenantScope();
  const agents = await getCallingAgentRepository().listAgents(scope);

  return (
    <>
      <header className="border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-foreground">AI Employees</h2>
        <p className="text-xs text-muted sm:text-sm">
          Voice agent personas and conversation flows
        </p>
      </header>
      <div className="divide-y divide-border">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"
          >
            <div>
              <p className="font-medium text-foreground">{agent.name}</p>
              <p className="text-xs text-muted">
                {agent.language}
                {agent.ttsProvider ? ` · ${agent.ttsProvider}` : ""} ·{" "}
                {agent.flowConfig.stages.length} stages
              </p>
            </div>
            <Link
              href={`/voice/agents/${agent.id}/flow`}
              className="text-sm text-gold hover:underline"
            >
              Edit flow
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}

export const metadata = { title: "Voice OS · AI Employees" };
