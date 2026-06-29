import {
  getWorkspaceSettings,
  getWorkspaceSettingsSync,
  hydrateWorkspaceSettingsCache,
  primeWorkspaceSettingsCache,
  setWorkspaceSettings,
} from "@/lib/settings/workspace-settings";
import type { HrWorkspaceSettings } from "@/lib/hr/settings.types";

export type { HrWorkspaceSettings } from "@/lib/hr/settings.types";

export async function getHrWorkspaceSettings(
  workspaceId: string
): Promise<HrWorkspaceSettings> {
  const settings = await getWorkspaceSettings(workspaceId);
  primeWorkspaceSettingsCache(settings);
  return { inboxAutomationEnabled: settings.inboxAutomationEnabled };
}

export function getHrWorkspaceSettingsSync(workspaceId: string): HrWorkspaceSettings {
  const settings = getWorkspaceSettingsSync(workspaceId);
  return { inboxAutomationEnabled: settings.inboxAutomationEnabled };
}

export async function setHrWorkspaceSettings(
  workspaceId: string,
  patch: Partial<HrWorkspaceSettings>
): Promise<HrWorkspaceSettings> {
  const settings = await setWorkspaceSettings(workspaceId, patch);
  primeWorkspaceSettingsCache(settings);
  return { inboxAutomationEnabled: settings.inboxAutomationEnabled };
}

export { hydrateWorkspaceSettingsCache };
