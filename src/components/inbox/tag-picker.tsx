"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { ALL_TAGS, TAG_LABELS } from "@/lib/constants";
import { apiFetch } from "@/lib/api/client-fetch";
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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(tag: ConversationTag) {
    const next = selected.includes(tag)
      ? selected.filter((t) => t !== tag)
      : [...selected, tag];

    startTransition(async () => {
      setError(null);
      const result = await apiFetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: next }),
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-1.5">
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
                    ? "bg-[#D4AF37]/20 text-[#F9E076] ring-[#D4AF37]/50"
                    : "bg-[#141414] text-[#A89878] ring-[#3d3528] hover:bg-[#1a1714] hover:text-[#F5E6C8]"
                )}
              >
                {TAG_LABELS[tag]}
              </Badge>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
