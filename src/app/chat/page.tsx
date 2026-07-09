"use client";

import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { scrollContainerToBottom } from "@/lib/scroll";

type ChatMessage = {
  id: string;
  direction: "inbound" | "outbound";
  content: string;
  occurredAt: string;
  authorName?: string;
};

export default function WebsiteChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat/session", { method: "POST" })
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(`Session failed (${r.status})`);
        }
        return r.json();
      })
      .then((data) => {
        if (!data.sessionId) throw new Error("Missing session");
        setSessionId(data.sessionId);
      })
      .catch(() => setError("Could not start chat session. Please refresh and try again."));
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const poll = async () => {
      const res = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
    };

    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [sessionId]);

  useEffect(() => {
    scrollContainerToBottom(scrollRef.current, messages.length > 0 ? "smooth" : "auto");
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId || !content.trim()) return;

    setLoading(true);
    setError(null);

    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        content: content.trim(),
        visitorName: visitorName.trim() || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as {
        error?: { code?: string; message?: string };
      } | null;
      setError(
        res.status === 401
          ? "Chat is unavailable — please try again in a moment."
          : res.status === 503
            ? payload?.error?.message ??
              "Website chat is not configured. Contact your administrator."
            : "Failed to send message."
      );
      return;
    }

    setContent("");
    const data = await fetch(`/api/chat/messages?sessionId=${sessionId}`).then(
      (r) => r.json()
    );
    setMessages(data.messages ?? []);
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-black p-3 sm:items-center sm:justify-center sm:p-4">
      <div className="flex min-h-0 flex-1 w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#243656] bg-[#040608] shadow-lg shadow-[#B8965D]/5 sm:h-[32rem] sm:flex-none">
        <header className="shrink-0 border-b border-[#243656] px-4 py-4">
          <div className="flex justify-center">
            <BrandLogo size="sm" />
          </div>
          <h1 className="mt-2 text-center text-sm font-medium text-[#9AABC4]">Website chat</h1>
        </header>

        <div
          ref={scrollRef}
          data-chat-scroll
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-3"
        >
          {messages.length === 0 && (
            <p className="text-sm text-[#9AABC4]">
              Send a message — it will appear in the agent inbox.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.direction === "inbound"
                  ? "mr-4 rounded-xl bg-[#121E32] ring-1 ring-[#243656] px-3 py-2 text-sm text-[#FFFFFF] sm:mr-8"
                  : "ml-4 rounded-xl bg-[#B8965D]/20 ring-1 ring-[#B8965D]/40 px-3 py-2 text-sm text-[#FFFFFF] sm:ml-8"
              }
            >
              {m.direction === "outbound" && (
                <p className="text-[10px] font-medium text-[#C9AA72] mb-0.5">
                  {m.authorName ?? "Agent"}
                </p>
              )}
              {m.content}
            </div>
          ))}
        </div>

        <form
          onSubmit={send}
          className="shrink-0 border-t border-[#243656] p-3 space-y-2"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          {messages.length === 0 && (
            <input
              type="text"
              placeholder="Your name (optional)"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className="w-full rounded-lg border border-[#243656] bg-[#121E32] px-3 py-2 text-base text-[#FFFFFF] sm:text-sm"
            />
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              placeholder="Type a message…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-[#243656] bg-[#121E32] px-3 py-2.5 text-base text-[#FFFFFF] sm:text-sm"
            />
            <Button type="submit" disabled={loading || !sessionId} className="w-full sm:w-auto">
              Send
            </Button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>
      </div>
    </div>
  );
}
