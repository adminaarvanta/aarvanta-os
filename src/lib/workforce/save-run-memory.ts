import { getAgentMemoryRepository } from "@/lib/data/agent-memory-store";
import type { TenantScope } from "@/types/communication";
import type { AgentRun, AgentType } from "@/types/workforce";

export async function saveRunToAgentMemory(
  run: AgentRun,
  scope: TenantScope
): Promise<void> {
  if (run.status !== "completed" || !run.summary) return;

  const repo = getAgentMemoryRepository();

  await repo.addMemory(
    {
      agentType: run.agentType,
      category: "insight",
      content: run.summary,
      source: "run",
      sourceRunId: run.id,
    },
    scope
  );

  for (const rec of run.recommendations.slice(0, 2)) {
    await repo.addMemory(
      {
        agentType: run.agentType,
        category: "fact",
        content: rec,
        source: "run",
        sourceRunId: run.id,
      },
      scope
    );
  }
}

export async function saveChatInsightToMemory(
  agentType: AgentType,
  content: string,
  scope: TenantScope
): Promise<void> {
  if (content.length < 40) return;

  await getAgentMemoryRepository().addMemory(
    {
      agentType,
      category: "insight",
      content: content.slice(0, 500),
      source: "chat",
    },
    scope
  );
}
