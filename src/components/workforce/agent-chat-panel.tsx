"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Trash2 } from "lucide-react";
import {
  WfPrimaryButton,
  WfPanel,
} from "@/components/workforce/workforce-shell";
import type { AgentChatMessage, AgentType } from "@/types/workforce";
import { scrollContainerToBottom } from "@/lib/scroll";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/workforce/agents/${agentType}/chat`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages ?? []))
      .finally(() => setInitialLoading(false));
  }, [agentType]);

  useEffect(() => {
    scrollContainerToBottom(
      scrollRef.current,
      messages.length > 0 ? "smooth" : "auto"
    );
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
    <WfPanel className="flex h-[min(560px,65vh)] min-h-[320px] flex-col overflow-hidden !p-0">
      <div
        className="flex items-center justify-between border-b px-5 py-3"
        style={{ borderColor: "var(--wf-line)" }}
      >
        <div>
          <h3 className="text-sm font-bold" style={{ color: "var(--wf-ink)" }}>
            Chat with {agentName}
          </h3>
          <p className="text-xs" style={{ color: "var(--wf-muted)" }}>
            Ask about priorities, pipeline, or next actions
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            className="inline-flex items-center gap-1 text-xs font-semibold"
            style={{ color: "var(--wf-muted)" }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        data-chat-scroll
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-5"
        style={{ background: "var(--wf-bg)" }}
      >
        {initialLoading ? (
          <p className="text-sm" style={{ color: "var(--wf-muted)" }}>
            Loading conversation…
          </p>
        ) : messages.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--wf-muted)" }}>
            Ask {agentName} anything — pipeline status, priorities,
            recommendations.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
                msg.role === "user" ? "ml-auto text-white" : "bg-white"
              )}
              style={
                msg.role === "user"
                  ? { background: "var(--wf-accent)" }
                  : {
                      color: "var(--wf-ink)",
                      border: "1px solid var(--wf-line)",
                    }
              }
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))
        )}
        {loading && (
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: "var(--wf-muted)" }}
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {agentName} is thinking…
          </div>
        )}
      </div>

      <form
        onSubmit={sendMessage}
        className="flex gap-2 border-t p-3"
        style={{ borderColor: "var(--wf-line)" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${agentName}…`}
          className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none focus:border-[var(--wf-accent)]"
          style={{ borderColor: "var(--wf-line)", color: "var(--wf-ink)" }}
          disabled={loading}
        />
        <WfPrimaryButton
          type="submit"
          disabled={loading || !input.trim()}
          className="!rounded-full !px-4"
        >
          <Send className="h-4 w-4" />
        </WfPrimaryButton>
      </form>
    </WfPanel>
  );
}
