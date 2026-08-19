"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MemberSelect } from "@/components/shared/member-select";
import type { MemberOption } from "@/lib/crm/members";

export function TaskFilters({ members }: { members: MemberOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignedTo = searchParams.get("assignedTo") ?? "";

  function updateAssignedTo(userId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (userId) {
      params.set("assignedTo", userId);
    } else {
      params.delete("assignedTo");
    }
    const query = params.toString();
    router.push(query ? `/crm/activity?${query}` : "/crm/activity");
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border/80 bg-surface-elevated/80 p-3">
      <div className="min-w-[12rem]">
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted">
          Filter by assignee
        </label>
        <MemberSelect
          members={members}
          value={assignedTo}
          onChange={updateAssignedTo}
          placeholder="All assignees"
        />
      </div>
      {assignedTo && (
        <button
          type="button"
          onClick={() => updateAssignedTo("")}
          className="text-xs text-gold hover:underline"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
