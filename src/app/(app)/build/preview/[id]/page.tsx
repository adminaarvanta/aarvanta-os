import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GeneratedSitePreview } from "@/components/build/generated-site-preview";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";
import { getTenantScope } from "@/lib/tenant/context";

type PageProps = { params: Promise<{ id: string }> };

export default async function BuildPreviewPage({ params }: PageProps) {
  const { id } = await params;
  let scope;
  try {
    scope = await getTenantScope();
  } catch {
    notFound();
  }

  const job = await getSiteBuildRepository().get(id, scope);
  if (!job?.generatedSite) notFound();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:px-6">
        <Link
          href={`/build?job=${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Build OS
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
        <Suspense fallback={null}>
          <GeneratedSitePreview site={job.generatedSite} />
        </Suspense>
      </div>
    </div>
  );
}

export const metadata = { title: "Site preview" };
