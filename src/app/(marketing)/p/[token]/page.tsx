import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GeneratedSitePreview } from "@/components/build/generated-site-preview";
import { getSiteBuildRepository } from "@/lib/data/site-build-store";

type PageProps = { params: Promise<{ token: string }> };

export default async function PublicSitePreviewPage({ params }: PageProps) {
  const { token } = await params;
  const job = await getSiteBuildRepository().getByShareToken(token);
  if (!job?.generatedSite) notFound();

  const site = job.generatedSite;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
          Aarvanta Build OS
        </p>
        <h1 className="mt-0.5 text-sm font-medium text-foreground">
          {site.siteName}
          {site.tagline ? (
            <span className="text-muted"> — {site.tagline}</span>
          ) : null}
        </h1>
      </div>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
            Loading preview…
          </div>
        }
      >
        <GeneratedSitePreview site={site} interactive={false} />
      </Suspense>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  const job = await getSiteBuildRepository().getByShareToken(token);
  const name = job?.generatedSite?.siteName ?? "Site preview";
  return {
    title: `${name} · Shared preview`,
    description: job?.generatedSite?.tagline ?? "Shared website preview from Aarvanta Build OS",
  };
}
