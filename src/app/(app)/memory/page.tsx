import { Brain } from "lucide-react";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getMemoryLayersStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

const ORDERED_LAYERS = ["user", "team", "company", "customer"] as const;

export default async function MemoryPage() {
  const scope = await getTenantScope();
  const entries = await getMemoryLayersStore().list(scope);

  const byLayer = entries.reduce<Record<string, typeof entries>>((acc, entry) => {
    acc[entry.layer] = acc[entry.layer] ?? [];
    acc[entry.layer].push(entry);
    return acc;
  }, {});

  return (
    <ModulePageShell
      icon={Brain}
      title="Memory Layers"
      description="Persistent memory grouped by user, team, company, and customer context."
    >
      <div className="space-y-8">
        <StatGrid
          items={[
            { label: "Entries", value: entries.length, sub: "Total memory records" },
            { label: "User", value: byLayer.user?.length ?? 0, sub: "Personal memory" },
            { label: "Team", value: byLayer.team?.length ?? 0, sub: "Shared team memory" },
            { label: "Customer", value: byLayer.customer?.length ?? 0, sub: "Account context" },
          ]}
        />

        {ORDERED_LAYERS.map((layer) => (
          <section key={layer}>
            <h3 className="mb-3 text-sm font-semibold capitalize text-[#FFFFFF]">
              {layer} layer ({byLayer[layer]?.length ?? 0})
            </h3>
            <CardList
              items={(byLayer[layer] ?? []).map((entry) => ({
                id: entry.id,
                title: entry.key,
                body: entry.content,
                meta: `Source: ${entry.source ?? "manual"} · Created ${new Date(
                  entry.createdAt
                ).toLocaleDateString()}`,
              }))}
            />
          </section>
        ))}
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Memory" };
