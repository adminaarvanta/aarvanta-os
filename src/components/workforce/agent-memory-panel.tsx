"use client";

import { useEffect, useState } from "react";
import { Brain, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AgentMemoryEntry, AgentType } from "@/types/workforce";
import { formatRelative } from "@/lib/utils";

const categoryColors: Record<AgentMemoryEntry["category"], string> = {
  insight: "bg-[#1A2B48]/60 text-[#C9AA72] ring-[#B8965D]/30",
  decision: "bg-[#0D1A2E] text-[#4DA6FF] ring-[#4DA6FF]/30",
  preference: "bg-[#2A2210] text-[#C9AA72] ring-[#B8965D]/35",
  fact: "bg-[#0A2A33] text-[#4DA6FF] ring-[#4DA6FF]/30",
};

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
    <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#B8965D]/15 p-2 ring-1 ring-[#B8965D]/30">
          <Brain className="h-4 w-4 text-[#B8965D]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#FFFFFF]">Agent memory</h3>
          <p className="text-xs text-[#9AABC4]">
            Long-term context saved from runs, chat, and manual notes
          </p>
        </div>
      </div>

      <form onSubmit={addMemory} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a memory for this agent…"
          className="flex-1 rounded-lg border border-[#243656] bg-[#121E32] px-3 py-2 text-sm text-[#FFFFFF]"
        />
        <Button type="submit" disabled={adding || !content.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {memory.length === 0 ? (
        <p className="text-sm text-[#9AABC4]">
          No memories yet. Run the agent or chat to build context automatically.
        </p>
      ) : (
        <ul className="space-y-3">
          {memory.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-[#243656] bg-[#121E32] p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={categoryColors[entry.category]}>
                  {entry.category}
                </Badge>
                <Badge className="bg-[#040608] text-[#9AABC4] ring-[#243656]">
                  {entry.source}
                </Badge>
                <span className="text-[10px] text-[#9AABC4]">
                  {formatRelative(entry.createdAt)}
                </span>
                {entry.source === "manual" && (
                  <button
                    type="button"
                    onClick={() => deleteEntry(entry.id)}
                    className="ml-auto text-[#9AABC4] hover:text-red-300"
                    aria-label="Delete memory"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-[#FFFFFF]">{entry.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
