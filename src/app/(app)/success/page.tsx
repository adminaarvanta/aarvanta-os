import { HeartPulse } from "lucide-react";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getCustomerSuccessStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function SuccessPage() {
  const scope = await getTenantScope();
  const healthRecords = await getCustomerSuccessStore().list(scope);

  const avgHealth =
    healthRecords.length > 0
      ? Math.round(
          healthRecords.reduce((sum, record) => sum + record.healthScore, 0) / healthRecords.length
        )
      : 0;

  return (
    <ModulePageShell
      icon={HeartPulse}
      title="Customer Success"
      description="Track customer health, renewal windows, NPS, and churn risk."
    >
      <div className="space-y-8">
        <StatGrid
          items={[
            { label: "Accounts", value: healthRecords.length, sub: "Tracked customers" },
            { label: "Average health", value: `${avgHealth}%`, sub: "Mean health score" },
            {
              label: "High risk",
              value: healthRecords.filter((record) => record.churnRisk === "high").length,
              sub: "Needs intervention",
            },
            {
              label: "Open tickets",
              value: healthRecords.reduce((sum, record) => sum + record.openTickets, 0),
              sub: "Across all accounts",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Health scorecards</h3>
          <CardList
            items={healthRecords.map((record) => ({
              id: record.id,
              title: `${record.clientName} · ${record.healthScore}% health`,
              body: `NPS ${record.nps ?? "-"} · ${record.openTickets} open tickets`,
              meta: record.renewalDate
                ? `Renewal ${new Date(record.renewalDate).toLocaleDateString()}`
                : "No renewal date",
              badge: record.churnRisk,
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Success" };
