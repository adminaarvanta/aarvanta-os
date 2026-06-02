"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CHANNEL_LABELS } from "@/lib/constants";
import { apiFetch } from "@/lib/api/client-fetch";
import type { Channel } from "@/types/communication";

export function ReplyForm({
  conversationId,
  channels,
}: {
  conversationId: string;
  channels: Channel[];
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState<Channel>(channels[0] ?? "whatsapp");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      setError(null);
      setWarning(null);

      const result = await apiFetch<{
        conversation?: unknown;
        warning?: { message?: string };
      }>(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), channel }),
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      if (result.data.warning?.message) {
        setWarning(result.data.warning.message);
      }

      setContent("");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={send}
      className="border-t border-[#EDE6D6] bg-white p-4 space-y-2"
    >
      <div className="flex gap-2">
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as Channel)}
          className="rounded-lg border border-[#EDE6D6] bg-[#FCF9F2] px-2 py-1.5 text-xs text-[#2A2418]"
        >
          {(Object.keys(CHANNEL_LABELS) as Channel[]).map((ch) => (
            <option key={ch} value={ch}>
              {CHANNEL_LABELS[ch]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Reply via selected channel…"
          rows={2}
          className="flex-1 resize-none rounded-xl border border-[#EDE6D6] px-3 py-2 text-sm text-[#2A2418] placeholder:text-[#6B6356]/60 focus:border-[#C29B40] focus:outline-none focus:ring-1 focus:ring-[#C29B40]/30"
        />
        <Button type="submit" disabled={pending || !content.trim()}>
          {pending ? "Sending…" : "Send"}
        </Button>
      </div>
      {warning && (
        <p className="text-xs text-amber-700" role="status">
          Saved to inbox, but delivery failed: {warning}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
