"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WorkforceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[workforce]", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-lg font-semibold text-[#F5E6C8]">
        AI Workforce failed to load
      </h2>
      <p className="max-w-md text-sm text-[#A89878]">
        This is usually a temporary server or database issue. Try again, or return
        to the overview.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Link
          href="/workforce"
          className="inline-flex items-center rounded-lg border border-[#3d3528] px-4 py-2 text-sm text-[#A89878] hover:text-[#F5E6C8]"
        >
          Back to overview
        </Link>
      </div>
    </div>
  );
}
