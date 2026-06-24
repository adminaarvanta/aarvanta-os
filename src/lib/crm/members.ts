import type { WorkspaceMember } from "@/types/tenant";

export type MemberOption = {
  userId: string;
  name: string;
  email: string;
};

export function activeMemberOptions(members: WorkspaceMember[]): MemberOption[] {
  return members
    .filter((m) => m.status === "active")
    .map((m) => ({ userId: m.userId, name: m.name, email: m.email }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function memberNameByUserId(
  members: WorkspaceMember[],
  userId?: string | null
): string {
  if (!userId) return "Unassigned";
  return members.find((m) => m.userId === userId)?.name ?? userId;
}
