import { ScrollText } from "lucide-react";
import { SopsClient } from "@/components/platform/sops-client";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getSopStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function SopsPage() {
  const scope = await getTenantScope();
  const sops = await getSopStore().list(scope);

  return (
    <ModulePageShell
      icon={ScrollText}
      title="SOP Engine"
      description="Manage standard operating procedures with versioned records."
    >
      <div className="space-y-8">
        <SopsClient />

        <StatGrid
          items={[
            { label: "Total SOPs", value: sops.length, sub: "All procedures" },
            {
              label: "Published",
              value: sops.filter((sop) => sop.status === "published").length,
              sub: "Ready to execute",
            },
            {
              label: "Draft",
              value: sops.filter((sop) => sop.status === "draft").length,
              sub: "In progress",
            },
            {
              label: "Latest version",
              value: sops.reduce((max, sop) => Math.max(max, sop.version), 0),
              sub: "Highest current revision",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">SOP library</h3>
          <CardList
            items={sops.map((sop) => ({
              id: sop.id,
              title: sop.title,
              body: sop.question,
              meta: `Version ${sop.version} · Updated ${new Date(sop.updatedAt).toLocaleDateString()}`,
              badge: sop.status,
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "SOPs" };
