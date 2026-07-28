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
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center text-sm text-muted">
          Loading preview…
        </div>
      }
    >
      <GeneratedSitePreview site={site} fullscreen />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  const job = await getSiteBuildRepository().getByShareToken(token);
  const name = job?.generatedSite?.siteName ?? "Site preview";
  return {
    title: `${name} · Preview`,
    description:
      job?.generatedSite?.tagline ?? "Website preview from Aarvanta Build OS",
  };
}
