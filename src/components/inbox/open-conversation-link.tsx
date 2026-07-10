"use client";

import { PendingLink } from "@/components/layout/navigation-provider";

export function OpenConversationLink({
  conversationId,
  label,
}: {
  conversationId: string;
  label: string;
}) {
  return (
    <PendingLink
      href={`/inbox/${conversationId}`}
      className="inline-flex rounded-lg bg-[#B8965D] px-4 py-2 text-sm font-semibold text-black hover:bg-[#C9AA72]"
    >
      Open {label}
    </PendingLink>
  );
}
