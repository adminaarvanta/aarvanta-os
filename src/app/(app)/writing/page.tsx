import { PenLine } from "lucide-react";
import { WritingClient } from "@/components/platform/writing-client";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getWritingStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function WritingPage() {
  const scope = await getTenantScope();
  const drafts = await getWritingStore().list(scope);

  const byType = drafts.reduce<Record<string, number>>((acc, draft) => {
    acc[draft.type] = (acc[draft.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <ModulePageShell
      icon={PenLine}
      title="AI Writing Studio"
      description="Generate and manage proposals, emails, blogs, and operational drafts."
    >
      <div className="space-y-8">
        <WritingClient />

        <StatGrid
          items={[
            { label: "Total drafts", value: drafts.length, sub: "All content types" },
            { label: "Proposals", value: byType.proposal ?? 0, sub: "Proposal drafts" },
            { label: "Emails", value: byType.email ?? 0, sub: "Email drafts" },
            { label: "LinkedIn", value: byType.linkedin ?? 0, sub: "Social drafts" },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Recent drafts</h3>
          <CardList
            items={drafts.map((draft) => ({
              id: draft.id,
              title: draft.title,
              body: draft.content,
              meta: `Type: ${draft.type} · Created ${new Date(draft.createdAt).toLocaleDateString()}`,
              badge: draft.type,
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Writing" };
