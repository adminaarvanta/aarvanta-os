"use client";

import type { MemberOption } from "@/lib/crm/members";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8] outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30";

export function MemberSelect({
  members,
  value,
  onChange,
  placeholder = "Assign to…",
  allowUnassigned = true,
  className,
  id,
}: {
  members: MemberOption[];
  value: string;
  onChange: (userId: string) => void;
  placeholder?: string;
  allowUnassigned?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputClass, className)}
    >
      {allowUnassigned && <option value="">{placeholder}</option>}
      {members.map((member) => (
        <option key={member.userId} value={member.userId}>
          {member.name}
        </option>
      ))}
    </select>
  );
}
