"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CHANNEL_LABELS } from "@/lib/constants";
import { apiFetch } from "@/lib/api/client-fetch";
import type { Channel, ContactRef } from "@/types/communication";

const ALL_CHANNELS = Object.keys(CHANNEL_LABELS) as Channel[];

function channelHint(channel: Channel, contact: ContactRef): string | null {
  if (channel === "email" && !contact.email) {
    return "Add an email address to this contact to send email.";
  }
  if (
    (channel === "whatsapp" || channel === "sms" || channel === "voice") &&
    !contact.phone
  ) {
    return "Add a phone number to this contact for this channel.";
  }
  if (channel === "website_chat" && !contact.chatSessionId) {
    return "Website chat replies work when the visitor started via /chat.";
  }
  return null;
}

export function ReplyForm({
  conversationId,
  contact,
  channels,
}: {
  conversationId: string;
  contact: ContactRef;
  channels: Channel[];
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [channel, setChannel] = useState<Channel>(
    channels.includes("email")
      ? "email"
      : channels[0] ?? ALL_CHANNELS[0]
  );
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hint = channelHint(channel, contact);

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
        body: JSON.stringify({
          content: content.trim(),
          channel,
          subject: channel === "email" ? subject.trim() || "Message from Aarvanta" : undefined,
        }),
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      if (result.data.warning?.message) {
        setWarning(result.data.warning.message);
      }

      setContent("");
      setSubject("");
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
          {ALL_CHANNELS.map((ch) => (
            <option key={ch} value={ch}>
              {CHANNEL_LABELS[ch]}
            </option>
          ))}
        </select>
      </div>
      {hint && (
        <p className="text-xs text-amber-700" role="status">
          {hint}
        </p>
      )}
      {channel === "email" && (
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject"
          className="w-full rounded-lg border border-[#EDE6D6] px-3 py-1.5 text-sm"
        />
      )}
      {channel === "voice" ? (
        <p className="text-xs text-[#6B6356]">
          Initiates a voice call and speaks your message to the contact.
        </p>
      ) : null}
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            channel === "voice"
              ? "Message to speak on the call…"
              : "Reply via selected channel…"
          }
          rows={2}
          className="flex-1 resize-none rounded-xl border border-[#EDE6D6] px-3 py-2 text-sm text-[#2A2418] placeholder:text-[#6B6356]/60 focus:border-[#C29B40] focus:outline-none focus:ring-1 focus:ring-[#C29B40]/30"
        />
        <Button type="submit" disabled={pending || !content.trim()}>
          {pending ? "Sending…" : channel === "voice" ? "Call" : "Send"}
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
