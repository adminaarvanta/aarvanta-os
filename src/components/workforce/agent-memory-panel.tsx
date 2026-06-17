"use client";

import { useEffect, useState } from "react";
import { Brain, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AgentMemoryEntry, AgentType } from "@/types/workforce";
import { formatRelative } from "@/lib/utils";

const categoryColors: Record<AgentMemoryEntry["category"], string> = {
  insight: "bg-violet-950/60 text-violet-300 ring-violet-700/50",
  decision: "bg-blue-950/60 text-blue-300 ring-blue-700/50",
  preference: "bg-amber-950/60 text-amber-300 ring-amber-700/50",
  fact: "bg-emerald-950/60 text-emerald-300 ring-emerald-700/50",
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
    <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#D4AF37]/15 p-2 ring-1 ring-[#D4AF37]/30">
          <Brain className="h-4 w-4 text-[#D4AF37]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#F5E6C8]">Agent memory</h3>
          <p className="text-xs text-[#A89878]">
            Long-term context saved from runs, chat, and manual notes
          </p>
        </div>
      </div>

      <form onSubmit={addMemory} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a memory for this agent…"
          className="flex-1 rounded-lg border border-[#3d3528] bg-[#141414] px-3 py-2 text-sm text-[#F5E6C8]"
        />
        <Button type="submit" disabled={adding || !content.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {memory.length === 0 ? (
        <p className="text-sm text-[#A89878]">
          No memories yet. Run the agent or chat to build context automatically.
        </p>
      ) : (
        <ul className="space-y-3">
          {memory.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-[#3d3528] bg-[#141414] p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={categoryColors[entry.category]}>
                  {entry.category}
                </Badge>
                <Badge className="bg-[#0a0a0a] text-[#A89878] ring-[#3d3528]">
                  {entry.source}
                </Badge>
                <span className="text-[10px] text-[#A89878]">
                  {formatRelative(entry.createdAt)}
                </span>
                {entry.source === "manual" && (
                  <button
                    type="button"
                    onClick={() => deleteEntry(entry.id)}
                    className="ml-auto text-[#A89878] hover:text-red-300"
                    aria-label="Delete memory"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-[#F5E6C8]">{entry.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
