"use client";

import { PendingLink } from "@/components/layout/navigation-provider";

export function OpenConversationLink({
  conversationId,
  label,
  basePath = "/inbox",
}: {
  conversationId: string;
  label: string;
  basePath?: string;
}) {
  return (
    <PendingLink
      href={`${basePath}/${conversationId}`}
      className="inline-flex rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-gold-bright"
    >
      Open {label}
    </PendingLink>
  );
}
