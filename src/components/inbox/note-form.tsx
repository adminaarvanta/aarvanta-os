"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function NoteForm({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      await fetch(`/api/conversations/${conversationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      setContent("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="text-xs font-medium text-[#6B6356]">Internal note</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Visible to team only…"
        rows={2}
        className="w-full resize-none rounded-lg border border-[#EDE6D6] bg-[#FCF9F2] px-3 py-2 text-sm focus:border-[#C29B40] focus:outline-none"
      />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Add note"}
      </Button>
    </form>
  );
}
