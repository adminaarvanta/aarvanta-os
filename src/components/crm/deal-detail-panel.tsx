"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AssignOwnerField } from "@/components/crm/crm-manual-forms";
import { DealManualActions } from "@/components/crm/deal-manual-actions";
import type { MemberOption } from "@/lib/crm/members";
import type { CrmDeal } from "@/types/crm";

export function DealDetailPanel({
  deal: initialDeal,
  members,
  currentUserId,
}: {
  deal: CrmDeal;
  members: MemberOption[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [deal, setDeal] = useState(initialDeal);

  return (
    <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5 space-y-4">
      <h3 className="text-sm font-semibold text-[#FFFFFF]">Manual deal actions</h3>
      <AssignOwnerField
        label="Owner"
        value={deal.ownerId}
        members={members}
        onSave={async (next) => {
          const response = await fetch(`/api/deals/${deal.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerId: next || undefined }),
          });
          if (response.ok) {
            const data = (await response.json()) as { deal: CrmDeal };
            setDeal(data.deal);
            router.refresh();
          }
        }}
      />
      <DealManualActions
        deal={deal}
        members={members}
        currentUserId={currentUserId}
        onUpdate={(updated) => {
          setDeal(updated);
          router.refresh();
        }}
      />
    </section>
  );
}
