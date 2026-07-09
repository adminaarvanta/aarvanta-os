"use client";

import { useState } from "react";
import { Loader2, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { KnowledgeAskResult } from "@/types/knowledge";

export function KnowledgeAskPanel() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KnowledgeAskResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/knowledge/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? "Ask failed");
      setResult(data.result);
    } catch (err) {
      setResult({
        answer: err instanceof Error ? err.message : "Ask failed",
        citations: [],
        method: "heuristic",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#B8965D]/15 p-2 ring-1 ring-[#B8965D]/30">
          <Sparkles className="h-4 w-4 text-[#B8965D]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#FFFFFF]">AI Ask — Company Brain</h3>
          <p className="text-xs text-[#9AABC4]">
            Ask questions across your entire knowledge base with source citations
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What is our customer onboarding process?"
          className="flex-1 rounded-lg border border-[#243656] bg-[#121E32] px-3 py-2 text-sm text-[#FFFFFF]"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !question.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
        </Button>
      </form>

      {result && (
        <div className="rounded-lg border border-[#243656] bg-[#121E32] p-4 space-y-3">
          <p className="text-sm leading-relaxed text-[#FFFFFF] whitespace-pre-wrap">
            {result.answer}
          </p>
          {result.citations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#9AABC4]">Sources</p>
              <ul className="mt-2 space-y-2">
                {result.citations.map((cite) => (
                  <li
                    key={`${cite.documentId}-${cite.chunkIndex}`}
                    className="text-xs text-[#9AABC4]"
                  >
                    <span className="text-[#B8965D]">{cite.documentTitle}</span>
                    {" — "}
                    {cite.excerpt}…
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
