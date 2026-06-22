import { useMemoryDatastore } from "@/lib/data/datastore";
import { workflowFirestoreRepository } from "@/lib/data/workflow-firestore-repository";
import { workflowMemoryRepository } from "@/lib/data/workflow-memory-repository";
import type { WorkflowRepository } from "@/lib/data/workflow-repository";

export function getWorkflowRepository(): WorkflowRepository {
  return useMemoryDatastore() ? workflowMemoryRepository : workflowFirestoreRepository;
}
