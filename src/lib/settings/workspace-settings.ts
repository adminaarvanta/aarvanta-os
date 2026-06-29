import { getAiConfig } from "@/lib/ai/config";
import { crmNow } from "@/lib/data/crm-helpers";
import {
  loadWorkspaceSettingsRecord,
  saveWorkspaceSettingsRecord,
} from "@/lib/settings/workspace-settings-store";
import type {
  WorkspaceSettings,
  WorkspaceSettingsPatch,
} from "@/types/workspace-settings";

export function buildDefaultWorkspaceSettings(workspaceId: string): WorkspaceSettings {
  const ai = getAiConfig();
  return {
    workspaceId,
    inboxAutomationEnabled: true,
    aiAutoSummarize: ai.autoSummarize,
    crmQualificationThreshold: ai.crmQualificationThreshold,
    updatedAt: crmNow(),
  };
}

export async function getWorkspaceSettings(
  workspaceId: string
): Promise<WorkspaceSettings> {
  const defaults = buildDefaultWorkspaceSettings(workspaceId);
  const stored = await loadWorkspaceSettingsRecord(workspaceId);
  if (!stored) return defaults;

  return {
    ...defaults,
    ...stored,
    workspaceId,
  };
}

export async function setWorkspaceSettings(
  workspaceId: string,
  patch: WorkspaceSettingsPatch
): Promise<WorkspaceSettings> {
  const defaults = buildDefaultWorkspaceSettings(workspaceId);
  const settings = await saveWorkspaceSettingsRecord(workspaceId, patch, defaults);
  primeWorkspaceSettingsCache(settings);
  return settings;
}

/** Sync read for in-memory/demo hot paths (falls back to env defaults). */
const syncCache = new Map<string, WorkspaceSettings>();

export function primeWorkspaceSettingsCache(settings: WorkspaceSettings): void {
  syncCache.set(settings.workspaceId, settings);
}

export function getWorkspaceSettingsSync(workspaceId: string): WorkspaceSettings {
  const cached = syncCache.get(workspaceId);
  if (cached) return cached;

  const defaults = buildDefaultWorkspaceSettings(workspaceId);
  syncCache.set(workspaceId, defaults);
  return defaults;
}

export async function hydrateWorkspaceSettingsCache(
  workspaceId: string
): Promise<WorkspaceSettings> {
  const settings = await getWorkspaceSettings(workspaceId);
  primeWorkspaceSettingsCache(settings);
  return settings;
}
