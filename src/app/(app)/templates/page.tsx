import { BookOpen } from "lucide-react";
import { CardList, ModulePageShell } from "@/components/platform/module-page-shell";
import { getTemplatesStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function TemplatesPage() {
  const scope = await getTenantScope();
  const templates = await getTemplatesStore().list(scope);

  const grouped = templates.reduce<Record<string, typeof templates>>((acc, template) => {
    const key = template.category;
    acc[key] = acc[key] ?? [];
    acc[key].push(template);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

  return (
    <ModulePageShell
      icon={BookOpen}
      title="Templates"
      description="Reusable templates grouped by category for faster execution."
    >
      <div className="space-y-8">
        {categories.map((category) => (
          <section key={category}>
            <h3 className="mb-3 text-sm font-semibold capitalize text-[#FFFFFF]">
              {category} templates ({grouped[category].length})
            </h3>
            <CardList
              items={grouped[category].map((template) => ({
                id: template.id,
                title: template.name,
                body: template.description,
                meta: `Tags: ${template.tags.join(", ") || "None"}`,
                badge: template.category,
              }))}
            />
          </section>
        ))}
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Templates" };
