"use client";

import { PersonComposeForm } from "@/components/crm/person-compose-form";
import type { MemberOption } from "@/lib/crm/members";

export function CreateLeadForm({
  members,
  companies,
}: {
  members: MemberOption[];
  companies: Array<{ id: string; name: string }>;
}) {
  return (
    <PersonComposeForm mode="lead" members={members} companies={companies} />
  );
}
