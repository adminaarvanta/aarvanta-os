import { Brain } from "lucide-react";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
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
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground sm:text-xl">
              <Brain className="h-5 w-5 text-gold" />
              Company Brain
            </h2>
            <p className="text-xs text-muted sm:text-sm">
              Upload SOPs and policies so Ask Aarvanta cites your documents —
              search, summaries, and tags. We do not invent missing sources.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AskAiButton module="knowledge" />
            <div className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-muted">
              RAG:{" "}
              <span className="font-medium text-gold-bright">
                {ai.status === "live"
                  ? `OpenAI · ${ai.model}`
                  : ai.status === "heuristic"
                    ? "Keyword (demo)"
                    : "Not configured"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-8 sm:p-6">
        <div id="upload">
          <KnowledgeUploadForm />
        </div>

        <section className="grid gap-6 xl:grid-cols-2">
          <KnowledgeAskPanel />
          <KnowledgeSearchBar />
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Document index
            </h3>
            <p className="text-xs text-muted">
              {documents.length} document{documents.length === 1 ? "" : "s"}
              {documents.length > 0
                ? ` · ${documents.filter((d) => d.status === "ready").length} ready · ${documents.filter((d) => d.status === "processing").length} indexing · ${documents.filter((d) => d.status === "failed").length} failed`
                : ""}
              {documents.length > 0
                ? ` · freshest ${documents
                    .slice()
                    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.updatedAt.slice(0, 10)}`
                : ""}
            </p>
          </div>
          <KnowledgeDocumentList documents={documents} />
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "Company Brain" };
