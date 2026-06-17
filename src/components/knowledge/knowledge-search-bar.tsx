"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeSearchHit } from "@/types/knowledge";

export function KnowledgeSearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<KnowledgeSearchHit[]>([]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setHits(data.hits ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5 space-y-4">
      <h3 className="text-sm font-semibold text-[#F5E6C8]">Semantic search</h3>
      <form onSubmit={onSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search policies, SOPs, playbooks…"
          className="flex-1 rounded-lg border border-[#3d3528] bg-[#141414] px-3 py-2 text-sm text-[#F5E6C8]"
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      {hits.length > 0 && (
        <ul className="space-y-3">
          {hits.map((hit) => (
            <li
              key={hit.chunk.id}
              className="rounded-lg border border-[#3d3528] bg-[#141414] p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/knowledge/${hit.chunk.documentId}`}
                  className="text-sm font-medium text-[#D4AF37] hover:underline"
                >
                  {hit.chunk.documentTitle}
                </Link>
                <Badge className="bg-[#0a0a0a] text-[#A89878] ring-[#3d3528]">
                  {hit.method}
                </Badge>
                <span className="text-[10px] text-[#A89878]">
                  score {(hit.score * 100).toFixed(0)}%
                </span>
              </div>
              <p className="mt-2 text-xs text-[#A89878] line-clamp-3">
                {hit.chunk.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
