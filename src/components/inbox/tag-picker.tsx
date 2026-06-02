"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { ALL_TAGS, TAG_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ConversationTag } from "@/types/communication";

export function TagPicker({
  conversationId,
  selected,
}: {
  conversationId: string;
  selected: ConversationTag[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle(tag: ConversationTag) {
    const next = selected.includes(tag)
      ? selected.filter((t) => t !== tag)
      : [...selected, tag];

    startTransition(async () => {
      await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: next }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_TAGS.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            disabled={pending}
            onClick={() => toggle(tag)}
            className="disabled:opacity-50"
          >
            <Badge
              className={cn(
                "cursor-pointer transition-colors",
                active
                  ? "bg-[#C29B40]/15 text-[#9A7A32] ring-[#C29B40]/40"
                  : "bg-white text-[#6B6356] ring-[#EDE6D6] hover:bg-[#FCF9F2]"
              )}
            >
              {TAG_LABELS[tag]}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
