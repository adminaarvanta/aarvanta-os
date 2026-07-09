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
    router.push(query ? `/crm/tasks?${query}` : "/crm/tasks");
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#243656] bg-[#0D1524] p-4">
      <div className="min-w-[12rem]">
        <label className="mb-1 block text-xs text-[#9AABC4]">Filter by assignee</label>
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
          className="text-xs text-[#B8965D] hover:underline"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
