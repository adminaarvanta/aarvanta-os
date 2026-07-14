"use client";

import { useEffect, useState } from "react";
import { Brain, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AgentMemoryEntry, AgentType } from "@/types/workforce";
import { formatRelative } from "@/lib/utils";

const categoryColors: Record<AgentMemoryEntry["category"], string> = {
  insight: "bg-navy/60 text-gold-bright ring-gold/30",
  decision: "bg-accent-cyan/10 text-accent-cyan ring-accent-cyan/30",
  preference: "bg-gold/10 text-gold-bright ring-gold/35",
  fact: "bg-accent-cyan/15 text-accent-cyan ring-accent-cyan/30",
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
    <section className="rounded-xl border border-border bg-surface-elevated p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-gold/15 p-2 ring-1 ring-gold/30">
          <Brain className="h-4 w-4 text-gold" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Agent memory</h3>
          <p className="text-xs text-muted">
            Long-term context saved from runs, chat, and manual notes
          </p>
        </div>
      </div>

      <form onSubmit={addMemory} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a memory for this agent…"
          className="flex-1 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
        />
        <Button type="submit" disabled={adding || !content.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {memory.length === 0 ? (
        <p className="text-sm text-muted">
          No memories yet. Run the agent or chat to build context automatically.
        </p>
      ) : (
        <ul className="space-y-3">
          {memory.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-border bg-surface-muted p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={categoryColors[entry.category]}>
                  {entry.category}
                </Badge>
                <Badge className="bg-background text-muted ring-border">
                  {entry.source}
                </Badge>
                <span className="text-[10px] text-muted">
                  {formatRelative(entry.createdAt)}
                </span>
                {entry.source === "manual" && (
                  <button
                    type="button"
                    onClick={() => deleteEntry(entry.id)}
                    className="ml-auto text-muted hover:text-red-300"
                    aria-label="Delete memory"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-foreground">{entry.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
