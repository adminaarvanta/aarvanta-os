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
  forcedChannel,
}: {
  conversationId: string;
  contact: ContactRef;
  channels: Channel[];
  /** Lock reply to one channel (WhatsApp OS / Voice OS). */
  forcedChannel?: Channel;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [channel, setChannel] = useState<Channel>(
    forcedChannel ??
      (channels.includes("email")
        ? "email"
        : channels[0] ?? ALL_CHANNELS[0])
  );
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const activeChannel = forcedChannel ?? channel;
  const hint = channelHint(activeChannel, contact);

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
          channel: activeChannel,
          subject:
            activeChannel === "email"
              ? subject.trim() || "Message from Aarvanta"
              : undefined,
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
      className="shrink-0 border-t border-border bg-background p-3 space-y-2 sm:p-4"
    >
      {forcedChannel ? (
        <p className="text-xs font-medium text-gold">
          Sending via {CHANNEL_LABELS[forcedChannel]}
        </p>
      ) : (
        <select
          value={activeChannel}
          onChange={(e) => setChannel(e.target.value as Channel)}
          className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground sm:w-auto sm:text-xs"
        >
          {ALL_CHANNELS.map((ch) => (
            <option key={ch} value={ch}>
              {CHANNEL_LABELS[ch]}
            </option>
          ))}
        </select>
      )}
      {hint && (
        <p className="text-xs text-gold-bright" role="status">
          {hint}
        </p>
      )}
      {activeChannel === "email" && (
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject"
          className="w-full rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-sm text-foreground"
        />
      )}
      {activeChannel === "voice" ? (
        <p className="text-xs text-muted">
          Starts a Twilio call. With Voice Relay (EC2) configured, the AI holds a
          two-way conversation using your message as the call goal / greeting.
          Otherwise it speaks the message once (TTS).
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            activeChannel === "voice"
              ? "Call goal / opening line for the AI agent…"
              : "Reply via selected channel…"
          }
          rows={3}
          className="min-h-[4.5rem] flex-1 resize-none rounded-xl border border-border bg-surface-muted px-3 py-2 text-base text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 sm:min-h-0 sm:text-sm"
        />
        <Button
          type="submit"
          disabled={pending || !content.trim()}
          className="w-full shrink-0 sm:w-auto"
        >
          {pending ? "Sending…" : activeChannel === "voice" ? "Call" : "Send"}
        </Button>
      </div>
      {warning && (
        <p className="text-xs text-gold-bright" role="status">
          Saved to inbox, but delivery failed: {warning}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
