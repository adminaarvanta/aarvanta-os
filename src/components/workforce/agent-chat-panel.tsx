"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AgentChatMessage, AgentType } from "@/types/workforce";
import { cn } from "@/lib/utils";

export function AgentChatPanel({
  agentType,
  agentName,
}: {
  agentType: AgentType;
  agentName: string;
}) {
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/workforce/agents/${agentType}/chat`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages ?? []))
      .finally(() => setInitialLoading(false));
  }, [agentType]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    const optimistic: AgentChatMessage = {
      tenantId: "",
      workspaceId: "",
      companyId: "",
      id: `temp_${Date.now()}`,
      agentType,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/workforce/agents/${agentType}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Chat failed");
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          tenantId: "",
          workspaceId: "",
          companyId: "",
          id: `err_${Date.now()}`,
          agentType,
          role: "assistant",
          content:
            err instanceof Error ? err.message : "Something went wrong.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function clearChat() {
    if (!confirm("Clear chat history with this agent?")) return;
    await fetch(`/api/workforce/agents/${agentType}/chat`, { method: "DELETE" });
    setMessages([]);
  }

  return (
    <section className="flex flex-col rounded-xl border border-[#3d3528] bg-[#101010] overflow-hidden min-h-[420px]">
      <div className="flex items-center justify-between border-b border-[#3d3528] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-[#F5E6C8]">Agent chat</h3>
          <p className="text-xs text-[#A89878]">
            Talk to {agentName} about your business
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            className="inline-flex items-center gap-1 text-xs text-[#A89878] hover:text-red-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[480px]">
        {initialLoading ? (
          <p className="text-sm text-[#A89878]">Loading conversation…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[#A89878]">
            Ask {agentName} anything — pipeline status, priorities, recommendations.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                msg.role === "user"
                  ? "ml-auto bg-[#D4AF37]/15 text-[#F5E6C8] ring-1 ring-[#D4AF37]/25"
                  : "bg-[#141414] text-[#A89878] ring-1 ring-[#3d3528]"
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#A89878]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {agentName} is thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="flex gap-2 border-t border-[#3d3528] p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${agentName}…`}
          className="flex-1 rounded-lg border border-[#3d3528] bg-[#141414] px-3 py-2 text-sm text-[#F5E6C8] placeholder:text-[#A89878]/60"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </section>
  );
}
