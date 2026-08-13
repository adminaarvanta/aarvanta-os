"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeDocument } from "@/types/knowledge";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

const statusColors: Record<KnowledgeDocument["status"], string> = {
  ready: "bg-accent-cyan/15 text-accent-cyan ring-accent-cyan/30",
  processing: "bg-gold/10 text-gold-bright ring-gold/35",
  failed: "bg-danger/15 text-danger ring-danger/45",
};

const statusLabels: Record<KnowledgeDocument["status"], string> = {
  ready: "Ready",
  processing: "Processing",
  failed: "Failed",
};

export function KnowledgeDocumentList({
  documents,
}: {
  documents: KnowledgeDocument[];
}) {
  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const doc of documents) {
      for (const tag of doc.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);
  }, [documents]);

  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = activeTag
    ? documents.filter((d) => d.tags.includes(activeTag))
    : documents;

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-muted/50 px-6 py-10 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15 ring-1 ring-gold/30">
          <Upload className="h-5 w-5 text-gold" />
        </div>
        <p className="text-sm font-medium text-foreground">
          No documents yet — AI Team has nothing to ground on
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs text-muted leading-relaxed">
          Upload SOPs, policies, pricing sheets, or playbooks (PDF, DOCX, TXT).
          Ask AI and AI Team agents will cite these instead of inventing answers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Collections</span>
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={cn(
              "rounded-md px-2 py-1 text-xs ring-1 transition-colors",
              activeTag === null
                ? "bg-gold/15 text-gold-bright ring-gold/35"
                : "bg-surface-muted text-muted ring-border hover:text-foreground"
            )}
          >
            All ({documents.length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={cn(
                "rounded-md px-2 py-1 text-xs ring-1 transition-colors",
                activeTag === tag
                  ? "bg-gold/15 text-gold-bright ring-gold/35"
                  : "bg-surface-muted text-muted ring-border hover:text-foreground"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <ul className="grid gap-3 lg:grid-cols-2">
        {filtered.map((doc) => (
          <li key={doc.id}>
            <Link
              href={`/knowledge/${doc.id}`}
              className="flex gap-3 rounded-xl border border-border bg-surface-elevated p-4 transition-colors hover:border-gold/40"
            >
              <div className="rounded-lg bg-gold/15 p-2 ring-1 ring-gold/30 h-fit">
                <FileText className="h-4 w-4 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground truncate">
                    {doc.title}
                  </p>
                  <Badge className={statusColors[doc.status]}>
                    {statusLabels[doc.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {doc.fileName} · {doc.fileType.toUpperCase()} ·{" "}
                  {doc.chunkCount} chunks
                </p>
                {doc.status === "failed" && doc.error && (
                  <p className="mt-2 text-xs text-danger line-clamp-2">
                    {doc.error}
                  </p>
                )}
                {doc.summary && (
                  <p className="mt-2 text-xs text-muted line-clamp-2">
                    {doc.summary}
                  </p>
                )}
                {doc.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {doc.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-background text-muted ring-border"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-[10px] text-muted">
                  Updated {formatRelative(doc.updatedAt)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="text-sm text-muted">
          No documents with tag “{activeTag}”.
        </p>
      )}
    </div>
  );
}
