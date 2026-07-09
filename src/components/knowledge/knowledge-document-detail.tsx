"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { KnowledgeChunk, KnowledgeDocument } from "@/types/knowledge";
import { formatRelative } from "@/lib/utils";

export function KnowledgeDocumentDetail({
  document,
  chunks,
}: {
  document: KnowledgeDocument;
  chunks: KnowledgeChunk[];
}) {
  const router = useRouter();
  const [tags, setTags] = useState(document.tags.join(", "));
  const [busy, setBusy] = useState<string | null>(null);

  async function saveTags() {
    setBusy("tags");
    try {
      const parsed = tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      await fetch(`/api/knowledge/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: parsed }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function regenerateSummary() {
    setBusy("summary");
    try {
      await fetch(`/api/knowledge/documents/${document.id}/summarize`, {
        method: "POST",
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function deleteDocument() {
    if (!confirm(`Delete "${document.title}"?`)) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/knowledge/documents/${document.id}`, {
        method: "DELETE",
      });
      if (res.ok) router.push("/knowledge");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[#FFFFFF]">{document.title}</h3>
            <p className="text-xs text-[#9AABC4]">
              {document.fileName} · {document.fileType.toUpperCase()} ·{" "}
              {document.charCount.toLocaleString()} chars · Updated{" "}
              {formatRelative(document.updatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!!busy}
              onClick={regenerateSummary}
            >
              {busy === "summary" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Regenerate summary
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!!busy}
              onClick={deleteDocument}
              className="text-red-300 hover:text-red-200"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {document.summary && (
          <div>
            <p className="text-xs font-medium text-[#9AABC4]">Summary</p>
            <p className="mt-1 text-sm text-[#FFFFFF]">{document.summary}</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[#9AABC4]">Tags</label>
          <div className="mt-1 flex gap-2">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="flex-1 rounded-lg border border-[#243656] bg-[#121E32] px-3 py-2 text-sm text-[#FFFFFF]"
              placeholder="sop, onboarding, sales"
            />
            <Button type="button" disabled={busy === "tags"} onClick={saveTags}>
              Save
            </Button>
          </div>
          {document.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {document.tags.map((tag) => (
                <Badge
                  key={tag}
                  className="bg-[#040608] text-[#9AABC4] ring-[#243656]"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {document.status === "failed" && document.error && (
          <p className="text-sm text-red-300">{document.error}</p>
        )}
      </section>

      <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5">
        <h3 className="text-sm font-semibold text-[#FFFFFF]">
          Indexed chunks ({chunks.length})
        </h3>
        <ul className="mt-4 space-y-3 max-h-[480px] overflow-y-auto">
          {chunks.map((chunk) => (
            <li
              key={chunk.id}
              className="rounded-lg border border-[#243656] bg-[#121E32] p-3"
            >
              <p className="text-[10px] text-[#9AABC4]">Chunk {chunk.index + 1}</p>
              <p className="mt-1 text-xs text-[#9AABC4] whitespace-pre-wrap">
                {chunk.content}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
