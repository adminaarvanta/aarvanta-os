import { crmNow } from "@/lib/data/crm-helpers";
import { useMemoryDatastore } from "@/lib/data/datastore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type {
  WorkspaceSettings,
  WorkspaceSettingsPatch,
} from "@/types/workspace-settings";

const COLLECTION = "workspace_settings";

const memory = new Map<string, WorkspaceSettings>();

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured.");
  return db;
}

async function readFirestore(workspaceId: string): Promise<WorkspaceSettings | null> {
  const snap = await getDb().collection(COLLECTION).doc(workspaceId).get();
  return snap.exists ? (snap.data() as WorkspaceSettings) : null;
}

async function writeFirestore(settings: WorkspaceSettings): Promise<WorkspaceSettings> {
  await getDb().collection(COLLECTION).doc(settings.workspaceId).set(settings);
  return settings;
}

export async function loadWorkspaceSettingsRecord(
  workspaceId: string
): Promise<WorkspaceSettings | null> {
  if (useMemoryDatastore()) {
    return memory.get(workspaceId) ?? null;
  }
  return readFirestore(workspaceId);
}

export async function saveWorkspaceSettingsRecord(
  workspaceId: string,
  patch: WorkspaceSettingsPatch,
  defaults: WorkspaceSettings
): Promise<WorkspaceSettings> {
  const current =
    (useMemoryDatastore()
      ? memory.get(workspaceId)
      : await readFirestore(workspaceId)) ?? defaults;

  const next: WorkspaceSettings = {
    ...current,
    ...patch,
    workspaceId,
    updatedAt: crmNow(),
  };

  if (useMemoryDatastore()) {
    memory.set(workspaceId, next);
    return next;
  }

  return writeFirestore(next);
}
