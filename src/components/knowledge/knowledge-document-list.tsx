import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeDocument } from "@/types/knowledge";
import { formatRelative } from "@/lib/utils";

const statusColors: Record<KnowledgeDocument["status"], string> = {
  ready: "bg-accent-cyan/15 text-accent-cyan ring-accent-cyan/30",
  processing: "bg-gold/10 text-gold-bright ring-gold/35",
  failed: "bg-danger/15 text-danger ring-danger/45",
};

export function KnowledgeDocumentList({
  documents,
}: {
  documents: KnowledgeDocument[];
}) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted">
        No documents yet. Upload your first PDF, DOCX, or TXT file above.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {documents.map((doc) => (
        <li key={doc.id}>
          <Link
            href={`/knowledge/${doc.id}`}
            className="flex gap-3 rounded-xl border border-border bg-surface-elevated p-4 transition-colors hover:border-gold/40"
          >
            <div className="rounded-lg bg-gold/15 p-2 ring-1 ring-gold/30">
              <FileText className="h-4 w-4 text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground truncate">{doc.title}</p>
                <Badge className={statusColors[doc.status]}>{doc.status}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {doc.fileName} · {doc.fileType.toUpperCase()} · {doc.chunkCount}{" "}
                chunks
              </p>
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
  );
}
