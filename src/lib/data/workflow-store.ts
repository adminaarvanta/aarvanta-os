import { isProductionMode } from "@/lib/config/app-mode";
import { workflowFirestoreRepository } from "@/lib/data/workflow-firestore-repository";
import { workflowMemoryRepository } from "@/lib/data/workflow-memory-repository";
import type { WorkflowRepository } from "@/lib/data/workflow-repository";

export function getWorkflowRepository(): WorkflowRepository {
  return isProductionMode()
    ? workflowFirestoreRepository
    : workflowMemoryRepository;
}
