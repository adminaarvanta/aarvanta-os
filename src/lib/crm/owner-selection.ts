import type { MemberOption } from "@/lib/crm/members";

export type OwnerSelection =
  | { kind: "none" }
  | { kind: "existing"; id: string; name: string }
  | { kind: "new"; name: string };

export function emptyOwnerSelection(): OwnerSelection {
  return { kind: "none" };
}

export function selectionFromOwnerId(
  ownerId: string | undefined,
  members: MemberOption[]
): OwnerSelection {
  if (!ownerId) return { kind: "none" };
  const match = members.find((member) => member.userId === ownerId);
  return match
    ? { kind: "existing", id: match.userId, name: match.name }
    : { kind: "none" };
}

export function findMemberByName(
  members: MemberOption[],
  name: string
): MemberOption | undefined {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  return members.find((member) => member.name.trim().toLowerCase() === needle);
}

export async function ensureOwnerId(
  members: MemberOption[],
  selection: OwnerSelection
): Promise<string | undefined> {
  if (selection.kind === "none") return undefined;
  if (selection.kind === "existing") return selection.id;

  const existing = findMemberByName(members, selection.name);
  if (existing) return existing.userId;

  const res = await fetch("/api/crm/owners", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: selection.name.trim() }),
  });
  if (!res.ok) {
    throw new Error("Could not add that owner. Try again.");
  }
  const data = (await res.json()) as { owner: { userId: string } };
  return data.owner.userId;
}
