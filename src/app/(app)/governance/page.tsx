import { Shield } from "lucide-react";
import { ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getGovernanceStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function GovernancePage() {
  const scope = await getTenantScope();
  const auditLog = await getGovernanceStore().list(scope);

  const orderedEntries = [...auditLog].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  return (
    <ModulePageShell
      icon={Shield}
      title="Governance"
      description="Review audit actions, actor history, and policy-sensitive events."
    >
      <div className="space-y-8">
        <StatGrid
          items={[
            { label: "Events", value: orderedEntries.length, sub: "Total audit entries" },
            {
              label: "Unique actors",
              value: new Set(orderedEntries.map((entry) => entry.actorId)).size,
              sub: "Users and agents",
            },
            {
              label: "Agent actions",
              value: orderedEntries.filter((entry) => entry.action === "agent_run").length,
              sub: "Automated operations",
            },
            {
              label: "Permission changes",
              value: orderedEntries.filter((entry) => entry.action === "permission_change").length,
              sub: "Access updates",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Audit timeline</h3>
          <ol className="space-y-3">
            {orderedEntries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-xl border border-[#243656] bg-[#0D1524] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-[#FFFFFF]">
                    {entry.actorName} · {entry.action.replaceAll("_", " ")}
                  </p>
                  <span className="rounded-full bg-[#B8965D]/15 px-2 py-0.5 text-[10px] text-[#C9AA72] ring-1 ring-[#B8965D]/30">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#9AABC4]">{entry.detail}</p>
                <p className="mt-1 text-[10px] text-[#9AABC4]/70">Resource: {entry.resource}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Governance" };
