import {
  disableFirestoreFallback,
  isFirestoreQuotaError,
  useMemoryDatastore,
} from "@/lib/data/datastore";
import { isFirebaseConfigured } from "@/lib/firebase/admin";
import { projectFirestoreRepository } from "@/lib/data/project-firestore-repository";
import { projectMemoryRepository } from "@/lib/data/project-memory-repository";
import type { ProjectRepository } from "@/lib/data/project-repository";

async function readFromFirestore<T>(
  read: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!isFirebaseConfigured()) return fallback;
  try {
    return await read();
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      disableFirestoreFallback(
        error instanceof Error ? error.message : String(error)
      );
    }
    return fallback;
  }
}

const hybridProjectRepository: ProjectRepository = {
  async listProjects(scope) {
    const memoryProjects = await projectMemoryRepository.listProjects(scope);
    const firestoreProjects = await readFromFirestore(
      () => projectFirestoreRepository.listProjects(scope),
      [] as Awaited<ReturnType<typeof projectMemoryRepository.listProjects>>
    );

    const merged = new Map<string, (typeof memoryProjects)[number]>();
    for (const project of [...firestoreProjects, ...memoryProjects]) {
      merged.set(project.id, project);
    }

    return [...merged.values()].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getProject(id, scope) {
    const fromMemory = await projectMemoryRepository.getProject(id, scope);
    if (fromMemory) return fromMemory;

    return readFromFirestore(
      () => projectFirestoreRepository.getProject(id, scope),
      null
    );
  },

  createProject(input, scope) {
    return projectMemoryRepository.createProject(input, scope);
  },

  updateProject(id, patch, scope) {
    return projectMemoryRepository.updateProject(id, patch, scope);
  },

  listTasks(scope, projectId) {
    return projectMemoryRepository.listTasks(scope, projectId);
  },

  async getTask(id, scope) {
    const fromMemory = await projectMemoryRepository.getTask(id, scope);
    if (fromMemory) return fromMemory;

    return readFromFirestore(
      () => projectFirestoreRepository.getTask(id, scope),
      null
    );
  },

  createTask(input, scope) {
    return projectMemoryRepository.createTask(input, scope);
  },

  updateTask(id, patch, scope) {
    return projectMemoryRepository.updateTask(id, patch, scope);
  },
};

export function getProjectRepository(): ProjectRepository {
  return useMemoryDatastore() ? hybridProjectRepository : projectFirestoreRepository;
}
