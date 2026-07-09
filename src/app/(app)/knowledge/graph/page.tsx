import { Brain } from "lucide-react";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getKnowledgeGraphStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function KnowledgeGraphPage() {
  const scope = await getTenantScope();
  const graphStore = getKnowledgeGraphStore();
  const [nodes, edges] = await Promise.all([graphStore.listNodes(scope), graphStore.listEdges(scope)]);

  const nodeLookup = new Map(nodes.map((node) => [node.id, node.label]));

  return (
    <ModulePageShell
      icon={Brain}
      title="Knowledge Graph"
      description="Explore entity nodes and relationship edges across customer operations."
    >
      <div className="space-y-8">
        <StatGrid
          items={[
            { label: "Nodes", value: nodes.length, sub: "Graph entities" },
            { label: "Edges", value: edges.length, sub: "Entity relationships" },
            {
              label: "Customers",
              value: nodes.filter((node) => node.entityType === "customer").length,
              sub: "Customer entities",
            },
            {
              label: "Documents",
              value: nodes.filter((node) => node.entityType === "document").length,
              sub: "Document entities",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Nodes</h3>
          <CardList
            items={nodes.map((node) => ({
              id: node.id,
              title: node.label,
              body: node.refId ? `Reference: ${node.refId}` : undefined,
              badge: node.entityType,
            }))}
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Edges</h3>
          <CardList
            items={edges.map((edge) => ({
              id: edge.id,
              title: `${nodeLookup.get(edge.fromId) ?? edge.fromId} -> ${
                nodeLookup.get(edge.toId) ?? edge.toId
              }`,
              meta: `Relationship: ${edge.relationship}`,
              badge: edge.relationship,
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Knowledge Graph" };
