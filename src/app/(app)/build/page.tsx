import { Suspense } from "react";
import { BuildOsClient } from "@/components/build/build-os-client";
import { PageFrame } from "@/components/layout/page-scroll";

export default function BuildPage() {
  return (
    <PageFrame>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
              Loading Build OS…
            </div>
          }
        >
          <BuildOsClient />
        </Suspense>
      </div>
    </PageFrame>
  );
}

export const metadata = { title: "Build OS" };
