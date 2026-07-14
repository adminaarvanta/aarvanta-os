"use client";

import { useRouter } from "next/navigation";
import { AssignOwnerField, LogActivityForm } from "@/components/crm/crm-manual-forms";
import { CreateTaskForm } from "@/components/crm/create-task-form";
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
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-surface-elevated p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Manual CRM actions</h3>
          <EditCompanyForm company={company} />
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
        <CreateTaskForm members={members} accountId={company.id} />
      </section>
      <LogActivityForm
        accountId={company.id}
        members={members}
        defaultAuthorId={currentUserId}
      />
    </div>
  );
}
