import type { PlatformModule } from "@/lib/platform/modules";
import { CORE_MODULES, PLATFORM_MODULES } from "@/lib/platform/modules";

/** Modules retired from primary nav that should not reappear under More. */
export const HIDDEN_FROM_ALL_TOOLS = new Set([
  "help",
  "projects",
  "inbox",
  "launch",
  "whatsapp",
  "whatsapp-manage",
  "finance",
]);

/** All navigable modules, deduped by path. */
export function getAllToolsModules(): PlatformModule[] {
  const seen = new Set<string>();
  const merged = [...CORE_MODULES, ...PLATFORM_MODULES];

  return merged.filter((tool) => {
    if (HIDDEN_FROM_ALL_TOOLS.has(tool.id)) return false;
    const key = tool.href.split("?")[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const FREQUENT_TOOL_IDS = [
  "dashboard",
  "crm",
  "workforce",
  "hr",
  "workflows",
  "analytics",
] as const;

export const TOOL_GROUP_ORDER = [
  "Core",
  "Revenue",
  "Intelligence",
  "Operations",
  "Enterprise",
] as const;

export const TOOL_GROUP_LABELS: Record<string, string> = {
  Core: "Manage",
  Revenue: "Revenue",
  Intelligence: "Intelligence",
  Operations: "Operations",
  Enterprise: "Enterprise",
};

export function groupToolsByCategory(
  modules: PlatformModule[]
): Record<string, PlatformModule[]> {
  const groups: Record<string, PlatformModule[]> = {};
  for (const tool of modules) {
    if (!groups[tool.group]) groups[tool.group] = [];
    groups[tool.group].push(tool);
  }
  return groups;
}

export function filterTools(
  modules: PlatformModule[],
  query: string
): PlatformModule[] {
  const q = query.trim().toLowerCase();
  if (!q) return modules;
  return modules.filter(
    (module) =>
      module.label.toLowerCase().includes(q) ||
      module.description.toLowerCase().includes(q) ||
      module.group.toLowerCase().includes(q)
  );
}

export function getFrequentTools(modules: PlatformModule[]): PlatformModule[] {
  const byId = new Map(modules.map((m) => [m.id, m]));
  return FREQUENT_TOOL_IDS.map((id) => byId.get(id)).filter(
    (m): m is PlatformModule => Boolean(m)
  );
}
