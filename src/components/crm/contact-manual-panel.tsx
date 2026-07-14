"use client";

import { useRouter } from "next/navigation";
import { AssignOwnerField, LogActivityForm } from "@/components/crm/crm-manual-forms";
import { CreateTaskForm } from "@/components/crm/create-task-form";
import { EditContactForm } from "@/components/crm/edit-entity-forms";
import type { MemberOption } from "@/lib/crm/members";
import type { CrmContact } from "@/types/crm";

export function ContactManualPanel({
  contact,
  companies,
  members,
  currentUserId,
}: {
  contact: CrmContact;
  companies: Array<{ id: string; name: string }>;
  members: MemberOption[];
  currentUserId: string;
}) {
  const router = useRouter();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-surface-elevated p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Manual CRM actions</h3>
          <EditContactForm contact={contact} companies={companies} />
        </div>
        <AssignOwnerField
          label="Owner"
          value={contact.ownerId}
          members={members}
          onSave={async (next) => {
            await fetch(`/api/contacts/${contact.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ownerId: next || undefined }),
            });
            router.refresh();
          }}
        />
        <CreateTaskForm members={members} contactId={contact.id} />
      </section>
      <LogActivityForm
        contactId={contact.id}
        members={members}
        defaultAuthorId={currentUserId}
      />
    </div>
  );
}
