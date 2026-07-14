import { Sparkles } from "lucide-react";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getAutonomousStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";
import { getAgentDefinition, isAgentType } from "@/lib/workforce/agents";

function agentDisplayName(agentType: string) {
  if (isAgentType(agentType)) return getAgentDefinition(agentType).name;
  return "AI agent";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    queued: "Waiting",
    executing: "In progress",
    completed: "Done",
    failed: "Needs attention",
    awaiting_approval: "Needs approval",
  };
  return map[status] ?? status.replace(/_/g, " ");
}

export default async function AutonomousPage() {
  const scope = await getTenantScope();
  const tasks = await getAutonomousStore().list(scope);

  return (
    <ModulePageShell
      icon={Sparkles}
      title="Autonomous Task Queue"
      description="Queued and running tasks across your AI workforce."
    >
      <div className="space-y-8">
        <StatGrid
          items={[
            { label: "Tasks", value: tasks.length, sub: "Total autonomous tasks" },
            {
              label: "Waiting",
              value: tasks.filter((task) => task.status === "queued").length,
              sub: "Waiting to start",
            },
            {
              label: "In progress",
              value: tasks.filter((task) => task.status === "executing").length,
              sub: "Currently running",
            },
            {
              label: "Needs approval",
              value: tasks.filter((task) => task.requiresApproval).length,
              sub: "Human checkpoints",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Task queue</h3>
          <CardList
            items={tasks.map((task) => ({
              id: task.id,
              title: `${agentDisplayName(task.agentType)} · ${task.goal}`,
              body: task.steps.join(" → "),
              meta: `Created ${new Date(task.createdAt).toLocaleDateString()}`,
              badge: statusLabel(task.status),
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Autonomous" };
