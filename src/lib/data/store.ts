/** @deprecated Use getRepository() from @/lib/data/repository */
export {
  memoryRepository as store,
  resetDemoData,
} from "@/lib/data/memory-repository";

export {
  getRepository,
  type ConversationRepository,
} from "@/lib/data/repository";
