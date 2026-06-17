import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { KnowledgeDocument } from "@/types/knowledge";
import { formatRelative } from "@/lib/utils";

const statusColors: Record<KnowledgeDocument["status"], string> = {
  ready: "bg-emerald-950/60 text-emerald-300 ring-emerald-700/50",
  processing: "bg-amber-950/60 text-amber-300 ring-amber-700/50",
  failed: "bg-red-950/60 text-red-300 ring-red-700/50",
};

export function KnowledgeDocumentList({
  documents,
}: {
  documents: KnowledgeDocument[];
}) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-[#A89878]">
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
            className="flex gap-3 rounded-xl border border-[#3d3528] bg-[#101010] p-4 transition-colors hover:border-[#D4AF37]/40"
          >
            <div className="rounded-lg bg-[#D4AF37]/15 p-2 ring-1 ring-[#D4AF37]/30">
              <FileText className="h-4 w-4 text-[#D4AF37]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-[#F5E6C8] truncate">{doc.title}</p>
                <Badge className={statusColors[doc.status]}>{doc.status}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-[#A89878]">
                {doc.fileName} · {doc.fileType.toUpperCase()} · {doc.chunkCount}{" "}
                chunks
              </p>
              {doc.summary && (
                <p className="mt-2 text-xs text-[#A89878] line-clamp-2">
                  {doc.summary}
                </p>
              )}
              {doc.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {doc.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-[#0a0a0a] text-[#A89878] ring-[#3d3528]"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[10px] text-[#A89878]">
                Updated {formatRelative(doc.updatedAt)}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
