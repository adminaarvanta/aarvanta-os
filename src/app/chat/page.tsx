"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat/session", { method: "POST" })
      .then((r) => r.json())
      .then((data) => setSessionId(data.sessionId))
      .catch(() => setError("Could not start chat session."));
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
      setError("Failed to send message.");
      return;
    }

    setContent("");
    const data = await fetch(`/api/chat/messages?sessionId=${sessionId}`).then(
      (r) => r.json()
    );
    setMessages(data.messages ?? []);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FCF9F2] p-4">
      <div className="flex h-[32rem] w-full max-w-md flex-col rounded-2xl border border-[#EDE6D6] bg-white shadow-sm">
        <header className="border-b border-[#EDE6D6] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#C29B40]">
            Aarvanta OS
          </p>
          <h1 className="text-sm font-semibold text-[#2A2418]">Website chat</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-[#6B6356]">
              Send a message — it will appear in the agent inbox.
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.direction === "inbound"
                  ? "ml-0 mr-8 rounded-xl bg-[#FCF9F2] px-3 py-2 text-sm"
                  : "ml-8 mr-0 rounded-xl bg-[#E8D4A8]/50 px-3 py-2 text-sm"
              }
            >
              {m.direction === "outbound" && (
                <p className="text-[10px] font-medium text-[#9A7A32] mb-0.5">
                  {m.authorName ?? "Agent"}
                </p>
              )}
              {m.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="border-t border-[#EDE6D6] p-3 space-y-2">
          {!visitorName && (
            <input
              type="text"
              placeholder="Your name (optional)"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className="w-full rounded-lg border border-[#EDE6D6] px-3 py-1.5 text-sm"
            />
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type a message…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 rounded-lg border border-[#EDE6D6] px-3 py-2 text-sm"
            />
            <Button type="submit" disabled={loading || !sessionId}>
              Send
            </Button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  );
}
