import { Users } from "lucide-react";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getPortalStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function PortalPage() {
  const scope = await getTenantScope();
  const accessList = await getPortalStore().list(scope);

  return (
    <ModulePageShell
      icon={Users}
      title="Client Portal"
      description="Monitor external client access and latest portal activity."
    >
      <div className="space-y-8">
        <StatGrid
          items={[
            { label: "Portal users", value: accessList.length, sub: "Client accounts" },
            {
              label: "Enabled",
              value: accessList.filter((record) => record.enabled).length,
              sub: "Active access",
            },
            {
              label: "Disabled",
              value: accessList.filter((record) => !record.enabled).length,
              sub: "Access suspended",
            },
            {
              label: "Projects linked",
              value: accessList.reduce((count, record) => count + record.projectIds.length, 0),
              sub: "Project memberships",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Access directory</h3>
          <CardList
            items={accessList.map((record) => ({
              id: record.id,
              title: `${record.clientName} · ${record.email}`,
              body: `Projects: ${record.projectIds.join(", ") || "None"}`,
              meta: record.lastLoginAt
                ? `Last login ${new Date(record.lastLoginAt).toLocaleString()}`
                : "No login recorded",
              badge: record.enabled ? "enabled" : "disabled",
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Portal" };
