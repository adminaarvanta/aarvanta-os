import { isProductionMode } from "@/lib/config/app-mode";
import { notificationsFirestoreRepository } from "@/lib/data/notifications-firestore-repository";
import { notificationsMemoryRepository } from "@/lib/data/notifications-memory-repository";
import type { NotificationsRepository } from "@/lib/data/notifications-repository";

export function getNotificationsRepository(): NotificationsRepository {
  return isProductionMode()
    ? notificationsFirestoreRepository
    : notificationsMemoryRepository;
}
