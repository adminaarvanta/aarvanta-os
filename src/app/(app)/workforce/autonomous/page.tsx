import { Sparkles } from "lucide-react";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getAutonomousStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function AutonomousPage() {
  const scope = await getTenantScope();
  const tasks = await getAutonomousStore().list(scope);

  return (
    <ModulePageShell
      icon={Sparkles}
      title="Autonomous Task Queue"
      description="Queued and executing autonomous tasks across AI workforce agents."
    >
      <div className="space-y-8">
        <StatGrid
          items={[
            { label: "Tasks", value: tasks.length, sub: "Total autonomous tasks" },
            {
              label: "Queued",
              value: tasks.filter((task) => task.status === "queued").length,
              sub: "Waiting to start",
            },
            {
              label: "Executing",
              value: tasks.filter((task) => task.status === "executing").length,
              sub: "Currently running",
            },
            {
              label: "Requires approval",
              value: tasks.filter((task) => task.requiresApproval).length,
              sub: "Human checkpoints",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Task queue</h3>
          <CardList
            items={tasks.map((task) => ({
              id: task.id,
              title: `${task.agentType} · ${task.goal}`,
              body: task.steps.join(" -> "),
              meta: `Created ${new Date(task.createdAt).toLocaleDateString()}`,
              badge: task.status,
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Autonomous" };
