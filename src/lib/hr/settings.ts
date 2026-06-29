const workspaceSettings = new Map<
  string,
  { inboxAutomationEnabled: boolean }
>();

export type HrWorkspaceSettings = {
  inboxAutomationEnabled: boolean;
};

export function getHrWorkspaceSettings(workspaceId: string): HrWorkspaceSettings {
  return (
    workspaceSettings.get(workspaceId) ?? {
      inboxAutomationEnabled: true,
    }
  );
}

export function setHrWorkspaceSettings(
  workspaceId: string,
  patch: Partial<HrWorkspaceSettings>
): HrWorkspaceSettings {
  const current = getHrWorkspaceSettings(workspaceId);
  const next = { ...current, ...patch };
  workspaceSettings.set(workspaceId, next);
  return next;
}
