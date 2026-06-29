import type { MemberRole } from "@/types/tenant";

/** Every actor in the system — human or AI. */
export type ActorType =
  | "user"
  | "organization"
  | "employee"
  | "customer"
  | "partner"
  | "ai_agent"
  | "system";

export type ActorRef = {
  type: ActorType;
  id: string;
  name?: string;
  email?: string;
  role?: MemberRole;
};
