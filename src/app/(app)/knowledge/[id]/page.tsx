import Link from "next/link";
import { notFound } from "next/navigation";
import { KnowledgeDocumentDetail } from "@/components/knowledge/knowledge-document-detail";
import { getKnowledgeRepository } from "@/lib/data/knowledge-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function KnowledgeDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scope = await getTenantScope();
  const repo = getKnowledgeRepository();

  const document = await repo.getDocument(id, scope);
  if (!document) notFound();

  const chunks = await repo.listChunks(scope, id);

  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/knowledge"
          className="text-xs text-[#D4AF37] hover:underline"
        >
          ← Knowledge Hub
        </Link>
      </header>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <KnowledgeDocumentDetail document={document} chunks={chunks} />
      </div>
    </>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scope = await getTenantScope();
  const doc = await getKnowledgeRepository().getDocument(id, scope);
  return { title: doc?.title ?? "Document" };
}
