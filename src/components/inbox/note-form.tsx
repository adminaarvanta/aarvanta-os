"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client-fetch";

export function NoteForm({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      setError(null);
      const result = await apiFetch(`/api/conversations/${conversationId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setContent("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="text-xs font-medium text-muted">Internal note</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Visible to team only…"
        rows={2}
        className="w-full resize-none rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none"
      />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "Saving…" : "Add note"}
      </Button>
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
