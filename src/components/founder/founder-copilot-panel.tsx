"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, Sun, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FounderChatMessage } from "@/types/founder";
import { scrollContainerToBottom } from "@/lib/scroll";
import { cn } from "@/lib/utils";

export function FounderCopilotPanel({
  initialMessages = [],
}: {
  initialMessages?: FounderChatMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollContainerToBottom(scrollRef.current, messages.length > 0 ? "smooth" : "auto");
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setInput("");
    setLoading(true);

    const optimistic: FounderChatMessage = {
      tenantId: "",
      workspaceId: "",
      companyId: "",
      id: `temp_${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/founder/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Failed");
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          tenantId: "",
          workspaceId: "",
          companyId: "",
          id: `err_${Date.now()}`,
          role: "assistant",
          content: err instanceof Error ? err.message : "Something went wrong.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function dailyBriefing() {
    setLoading(true);
    try {
      const res = await fetch("/api/founder/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefing: true }),
      });
      const data = await res.json();
      if (res.ok) setMessages((prev) => [...prev, data.message]);
    } finally {
      setLoading(false);
    }
  }

  async function clearChat() {
    if (!confirm("Clear Founder Copilot history?")) return;
    await fetch("/api/founder/copilot", { method: "DELETE" });
    setMessages([]);
  }

  const suggestions = [
    "What should I focus on today?",
    "Show my top opportunities.",
    "Which projects are delayed?",
    "Summarize this week.",
  ];

  return (
    <section className="flex h-[min(560px,65vh)] min-h-[320px] flex-col overflow-hidden rounded-xl border border-[#3d3528] bg-[#101010]">
      <div className="flex items-center justify-between border-b border-[#3d3528] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#D4AF37]/15 p-2 ring-1 ring-[#D4AF37]/30">
            <Sparkles className="h-4 w-4 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#F5E6C8]">Founder Copilot</h3>
            <p className="text-xs text-[#A89878]">
              Chat with your entire business — CRM, projects, inbox, AI workforce
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={dailyBriefing} disabled={loading}>
            <Sun className="h-3.5 w-3.5" />
            Daily briefing
          </Button>
          {messages.length > 0 && (
            <button type="button" onClick={clearChat} className="text-[#A89878] hover:text-red-300">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-3 border-b border-[#3d3528]">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => sendMessage(s)}
            disabled={loading}
            className="rounded-full border border-[#3d3528] px-3 py-1 text-xs text-[#A89878] hover:border-[#D4AF37]/40 hover:text-[#F5E6C8]"
          >
            {s}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        data-chat-scroll
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-[#A89878]">
            Ask anything about your business — or tap Daily briefing for an AI CEO summary.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                msg.role === "user"
                  ? "ml-auto bg-[#D4AF37]/15 text-[#F5E6C8] ring-1 ring-[#D4AF37]/25"
                  : "bg-[#141414] text-[#A89878] ring-1 ring-[#3d3528]"
              )}
            >
              {msg.content}
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#A89878]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Copilot is thinking…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-2 border-t border-[#3d3528] p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Founder Copilot…"
          className="flex-1 rounded-lg border border-[#3d3528] bg-[#141414] px-3 py-2 text-sm text-[#F5E6C8]"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </section>
  );
}
