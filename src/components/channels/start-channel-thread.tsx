"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client-fetch";
import type { Channel, Conversation } from "@/types/communication";

export function StartChannelThread({
  channel,
  basePath,
}: {
  channel: Extract<Channel, "whatsapp" | "voice">;
  basePath: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const actionLabel = channel === "voice" ? "Start call thread" : "New WhatsApp";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;

    startTransition(async () => {
      setError(null);
      const result = await apiFetch<{ conversation: Conversation }>(
        "/api/channels/start",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: phone.trim(),
            contactName: contactName.trim() || undefined,
            channel,
          }),
        }
      );

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setOpen(false);
      setPhone("");
      setContactName("");
      router.push(`${basePath}/${result.data.conversation.id}`);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0"
      >
        {actionLabel}
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-md flex-col gap-2 rounded-xl border border-border bg-surface-muted p-3 sm:min-w-[18rem]"
    >
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+447700900123"
        required
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
      <input
        type="text"
        value={contactName}
        onChange={(e) => setContactName(e.target.value)}
        placeholder="Contact name (optional)"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || !phone.trim()}>
          {pending ? "Opening…" : actionLabel}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
