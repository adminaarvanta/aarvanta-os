import { FOUNDER_COMMANDS } from "@/lib/founder/commands";
import { AGENT_DEFINITIONS } from "@/lib/workforce/agents";
import { CORE_MODULES, PLATFORM_MODULES } from "@/lib/platform/modules";
import type { GlobalSearchResult } from "@/types/search";

function moduleToResult(
  module: { id: string; label: string; description: string; href: string },
  keywords: string[] = []
): GlobalSearchResult {
  return {
    id: `module_${module.id}`,
    kind: "feature",
    group: "Features",
    title: module.label,
    subtitle: module.description,
    href: module.href,
    keywords: [module.label, module.description, ...keywords].map((k) =>
      k.toLowerCase()
    ),
  };
}

/** Static navigation and module index for global search. */
export function buildFeatureSearchIndex(): GlobalSearchResult[] {
  const seen = new Set<string>();
  const results: GlobalSearchResult[] = [];

  function add(result: GlobalSearchResult) {
    const key = `${result.href}:${result.title}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(result);
  }

  for (const cmd of FOUNDER_COMMANDS) {
    add({
      id: cmd.id,
      kind: "feature",
      group: "Features",
      title: cmd.label,
      subtitle: cmd.group,
      href: cmd.href,
      keywords: [cmd.label, ...cmd.keywords].map((k) => k.toLowerCase()),
    });
  }

  for (const module of [...CORE_MODULES, ...PLATFORM_MODULES]) {
    add(moduleToResult(module, [module.group, String(module.phase)]));
  }

  for (const agent of AGENT_DEFINITIONS) {
    add({
      id: `agent_${agent.type}`,
      kind: "feature",
      group: "Features",
      title: agent.name,
      subtitle: `${agent.title} — AI Workforce`,
      href: `/workforce/${agent.type}`,
      keywords: [
        agent.name,
        agent.title,
        agent.type,
        "agent",
        "workforce",
        "ai",
      ].map((k) => k.toLowerCase()),
    });
  }

  return results;
}

const FEATURE_INDEX = buildFeatureSearchIndex();

export function searchFeatures(query: string, limit = 8): GlobalSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    const priority = [
      "/dashboard",
      "/inbox",
      "/crm",
      "/workforce",
      "/knowledge",
      "/projects",
      "/workflows",
      "/demo",
    ];
    const picked: GlobalSearchResult[] = [];
    for (const href of priority) {
      const match = FEATURE_INDEX.find((item) => item.href === href);
      if (match) picked.push(match);
    }
    return picked.slice(0, limit);
  }

  return FEATURE_INDEX.filter((item) => {
    const haystack = [item.title, item.subtitle ?? "", ...(item.keywords ?? [])]
      .join(" ")
      .toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    return tokens.every((token) => haystack.includes(token));
  }).slice(0, limit);
}
