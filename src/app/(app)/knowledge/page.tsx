import { Brain } from "lucide-react";
import { KnowledgeAskPanel } from "@/components/knowledge/knowledge-ask-panel";
import { KnowledgeDocumentList } from "@/components/knowledge/knowledge-document-list";
import { KnowledgeSearchBar } from "@/components/knowledge/knowledge-search-bar";
import { KnowledgeUploadForm } from "@/components/knowledge/knowledge-upload-form";
import { getAiRuntimeStatus } from "@/lib/ai/config";
import { getKnowledgeRepository } from "@/lib/data/knowledge-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function KnowledgePage() {
  const scope = await getTenantScope();
  const [documents, ai] = await Promise.all([
    getKnowledgeRepository().listDocuments(scope),
    Promise.resolve(getAiRuntimeStatus()),
  ]);

  return (
    <>
      <header className="shrink-0 border-b border-[#243656] bg-[#0D1524] px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#FFFFFF] sm:text-xl">
              <Brain className="h-5 w-5 text-[#B8965D]" />
              Knowledge Hub
            </h2>
            <p className="text-xs text-[#9AABC4] sm:text-sm">
              Module 2 — Company Brain with upload, semantic search, AI Ask,
              summaries, and tags.
            </p>
          </div>
          <div className="rounded-lg border border-[#243656] bg-[#121E32] px-3 py-2 text-xs text-[#9AABC4]">
            RAG:{" "}
            <span className="font-medium text-[#C9AA72]">
              {ai.status === "live"
                ? `OpenAI · ${ai.model}`
                : ai.status === "heuristic"
                  ? "Keyword (demo)"
                  : "Not configured"}
            </span>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-8 sm:p-6">
        <KnowledgeUploadForm />

        <section className="grid gap-6 xl:grid-cols-2">
          <KnowledgeAskPanel />
          <KnowledgeSearchBar />
        </section>

        <section>
          <h3 className="mb-4 text-sm font-semibold text-[#FFFFFF]">
            Knowledge library ({documents.length})
          </h3>
          <KnowledgeDocumentList documents={documents} />
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "Knowledge Hub" };
