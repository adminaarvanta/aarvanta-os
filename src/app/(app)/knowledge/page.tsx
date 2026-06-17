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
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#F5E6C8] sm:text-xl">
              <Brain className="h-5 w-5 text-[#D4AF37]" />
              Knowledge Hub
            </h2>
            <p className="text-xs text-[#A89878] sm:text-sm">
              Module 2 — Company Brain with upload, semantic search, AI Ask,
              summaries, and tags.
            </p>
          </div>
          <div className="rounded-lg border border-[#3d3528] bg-[#141414] px-3 py-2 text-xs text-[#A89878]">
            RAG:{" "}
            <span className="font-medium text-[#F9E076]">
              {ai.status === "live"
                ? `OpenAI · ${ai.model}`
                : ai.status === "heuristic"
                  ? "Keyword (demo)"
                  : "Not configured"}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 sm:p-6">
        <KnowledgeUploadForm />

        <section className="grid gap-6 xl:grid-cols-2">
          <KnowledgeAskPanel />
          <KnowledgeSearchBar />
        </section>

        <section>
          <h3 className="mb-4 text-sm font-semibold text-[#F5E6C8]">
            Knowledge library ({documents.length})
          </h3>
          <KnowledgeDocumentList documents={documents} />
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "Knowledge Hub" };
