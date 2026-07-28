import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
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
    <div className="relative min-h-[100dvh]">
      <Link
        href={`/build?job=${id}`}
        className="fixed bottom-4 left-4 z-50 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur hover:bg-black/70"
      >
        ← Build OS
      </Link>
      <Suspense fallback={null}>
        <GeneratedSitePreview site={job.generatedSite} fullscreen />
      </Suspense>
    </div>
  );
}

export const metadata = { title: "Site preview" };
