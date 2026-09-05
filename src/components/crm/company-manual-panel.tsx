"use client";

import { useRouter } from "next/navigation";
import { AssignOwnerField, LogActivityForm } from "@/components/crm/crm-manual-forms";
import { CreateTaskForm } from "@/components/crm/create-task-form";
import { DeleteEntityButton } from "@/components/crm/delete-entity-button";
import { EditCompanyForm } from "@/components/crm/edit-entity-forms";
import type { MemberOption } from "@/lib/crm/members";
import type { CrmCompany } from "@/types/crm";

export function CompanyManualPanel({
  company,
  members,
  currentUserId,
}: {
  company: CrmCompany;
  members: MemberOption[];
  currentUserId: string;
}) {
  const router = useRouter();

  return (
    <section className="space-y-4 rounded-2xl border border-border/80 bg-surface-elevated p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Actions</h3>
        <div className="flex flex-wrap gap-2">
          <CreateTaskForm members={members} accountId={company.id} />
          <LogActivityForm
            accountId={company.id}
            members={members}
            defaultAuthorId={currentUserId}
          />
          <EditCompanyForm company={company} />
          <DeleteEntityButton
            entity="companies"
            id={company.id}
            label="company"
            redirectTo="/crm/companies"
          />
        </div>
      </div>
      <AssignOwnerField
        label="Owner"
        value={company.ownerId}
        members={members}
        onSave={async (next) => {
          await fetch(`/api/companies/${company.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerId: next || undefined }),
          });
          router.refresh();
        }}
      />
    </section>
  );
}
