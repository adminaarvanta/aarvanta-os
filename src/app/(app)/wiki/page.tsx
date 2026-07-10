import { BookCopy } from "lucide-react";
import { CardList, ModulePageShell } from "@/components/platform/module-page-shell";
import { getWikiStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

const SECTION_ORDER = ["handbook", "department", "sop_library", "training"] as const;

export default async function WikiPage() {
  const scope = await getTenantScope();
  const pages = await getWikiStore().list(scope);

  const bySection = pages.reduce<Record<string, typeof pages>>((acc, page) => {
    acc[page.section] = acc[page.section] ?? [];
    acc[page.section].push(page);
    return acc;
  }, {});

  return (
    <ModulePageShell
      icon={BookCopy}
      title="Internal Wiki"
      description="Browse knowledge pages grouped by section and access role."
    >
      <div className="space-y-8">
        {SECTION_ORDER.map((section) => (
          <section key={section}>
            <h3 className="mb-3 text-sm font-semibold capitalize text-[#FFFFFF]">
              {section.replaceAll("_", " ")} ({bySection[section]?.length ?? 0})
            </h3>
            <CardList
              items={(bySection[section] ?? []).map((page) => ({
                id: page.id,
                title: page.title,
                body: page.content,
                meta: `Version ${page.version} · Updated ${new Date(
                  page.updatedAt
                ).toLocaleDateString()}`,
                badge: page.accessRole,
              }))}
            />
          </section>
        ))}
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Wiki" };
