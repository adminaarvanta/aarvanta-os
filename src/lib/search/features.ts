import { FOUNDER_COMMANDS } from "@/lib/founder/commands";
import { AGENT_DEFINITIONS } from "@/lib/workforce/agents";
import { HIDDEN_FROM_ALL_TOOLS } from "@/lib/navigation/all-tools";
import { CORE_MODULES, PLATFORM_MODULES } from "@/lib/platform/modules";
import type { GlobalSearchResult } from "@/types/search";

const WHATSAPP_TOOL_IDS = new Set(["whatsapp", "whatsapp-manage"]);
const OUTREACH_TOOL_IDS = new Set(["outreach"]);

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

  for (const tool of [...CORE_MODULES, ...PLATFORM_MODULES]) {
    if (HIDDEN_FROM_ALL_TOOLS.has(tool.id)) continue;
    add(moduleToResult(tool, [tool.group, String(tool.phase)]));
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
const WHATSAPP_FEATURE_INDEX = [...CORE_MODULES, ...PLATFORM_MODULES]
  .filter((tool) => WHATSAPP_TOOL_IDS.has(tool.id))
  .map((tool) => moduleToResult(tool, [tool.group, String(tool.phase)]));

const OUTREACH_FEATURE_INDEX = [...CORE_MODULES, ...PLATFORM_MODULES]
  .filter((tool) => OUTREACH_TOOL_IDS.has(tool.id))
  .map((tool) => moduleToResult(tool, [tool.group, String(tool.phase), "brevo", "email"]));

export function searchFeatures(
  query: string,
  limit = 8,
  options?: { includeWhatsApp?: boolean; includeOutreach?: boolean }
): GlobalSearchResult[] {
  const extras = [
    ...(options?.includeWhatsApp ? WHATSAPP_FEATURE_INDEX : []),
    ...(options?.includeOutreach ? OUTREACH_FEATURE_INDEX : []),
  ];
  const index = extras.length ? [...FEATURE_INDEX, ...extras] : FEATURE_INDEX;
  const q = query.trim().toLowerCase();
  if (!q) {
    const priority = [
      "/dashboard",
      "/crm",
      "/automation",
      "/knowledge",
      "/voice",
      ...(options?.includeWhatsApp ? ["/whatsapp"] : []),
      ...(options?.includeOutreach ? ["/outreach"] : []),
      "/automation?view=ask",
      "/dashboard?help=open",
    ];
    const picked: GlobalSearchResult[] = [];
    for (const href of priority) {
      const match = index.find((item) => item.href === href);
      if (match) picked.push(match);
    }
    return picked.slice(0, limit);
  }

  return index
    .filter((item) => {
      const haystack = [item.title, item.subtitle ?? "", ...(item.keywords ?? [])]
        .join(" ")
        .toLowerCase();
      const tokens = q.split(/\s+/).filter(Boolean);
      return tokens.every((token) => haystack.includes(token));
    })
    .slice(0, limit);
}
