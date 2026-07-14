"use client";

import type { MemberOption } from "@/lib/crm/members";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30";

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
