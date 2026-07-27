"use client";

import { useEffect, useState } from "react";
import { Brain, Plus, Trash2 } from "lucide-react";
import {
  WfPanel,
  WfPrimaryButton,
} from "@/components/workforce/workforce-shell";
import type { AgentMemoryEntry, AgentType } from "@/types/workforce";
import { formatRelative } from "@/lib/utils";

export function AgentMemoryPanel({
  agentType,
  initialMemory,
}: {
  agentType: AgentType;
  initialMemory: AgentMemoryEntry[];
}) {
  const [memory, setMemory] = useState(initialMemory);
  const [content, setContent] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setMemory(initialMemory);
  }, [initialMemory]);

  async function addMemory(e: React.FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;

    setAdding(true);
    try {
      const res = await fetch(`/api/workforce/agents/${agentType}/memory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, category: "fact" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMemory((prev) => [data.entry, ...prev]);
        setContent("");
      }
    } finally {
      setAdding(false);
    }
  }

  async function deleteEntry(id: string) {
    const res = await fetch(
      `/api/workforce/agents/${agentType}/memory?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setMemory((prev) => prev.filter((m) => m.id !== id));
    }
  }

  return (
    <WfPanel className="space-y-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "var(--wf-accent-soft)" }}
        >
          <Brain className="h-4 w-4" style={{ color: "var(--wf-accent)" }} />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: "var(--wf-ink)" }}>
            Agent memory
          </h3>
          <p className="text-xs" style={{ color: "var(--wf-muted)" }}>
            Context from runs, chat, and notes
          </p>
        </div>
      </div>

      <form onSubmit={addMemory} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a memory for this agent…"
          className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none focus:border-[var(--wf-accent)]"
          style={{ borderColor: "var(--wf-line)", color: "var(--wf-ink)" }}
        />
        <WfPrimaryButton
          type="submit"
          disabled={adding || !content.trim()}
          className="!rounded-full !px-4"
        >
          <Plus className="h-4 w-4" />
        </WfPrimaryButton>
      </form>

      {memory.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--wf-muted)" }}>
          No memories yet. Run the agent or chat to build context automatically.
        </p>
      ) : (
        <ul className="space-y-2">
          {memory.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border p-3"
              style={{ borderColor: "var(--wf-line)", background: "var(--wf-bg)" }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                  style={{
                    background: "var(--wf-accent-soft)",
                    color: "var(--wf-accent)",
                  }}
                >
                  {entry.category}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: "#fff",
                    color: "var(--wf-muted)",
                    border: "1px solid var(--wf-line)",
                  }}
                >
                  {entry.source}
                </span>
                <span className="text-[10px]" style={{ color: "var(--wf-muted)" }}>
                  {formatRelative(entry.createdAt)}
                </span>
                {entry.source === "manual" && (
                  <button
                    type="button"
                    onClick={() => deleteEntry(entry.id)}
                    className="ml-auto"
                    style={{ color: "var(--wf-muted)" }}
                    aria-label="Delete memory"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm" style={{ color: "var(--wf-ink)" }}>
                {entry.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </WfPanel>
  );
}
