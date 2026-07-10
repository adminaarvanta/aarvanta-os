"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2, Play, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { DemoJourneyResult } from "@/lib/demo/ninety-second-journey";

const FLOW = [
  "Lead enters",
  "AI Sales Manager qualifies",
  "AI Marketing Manager nurtures",
  "Human closer receives notification",
  "Deal closes",
  "Invoice generated",
  "Customer onboarded",
  "Project assigned",
  "AI COO monitors delivery",
];

function StepIcon({ status }: { status: "completed" | "skipped" | "failed" | "pending" }) {
  if (status === "completed") {
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4DA6FF]" />;
  }
  if (status === "failed") {
    return <XCircle className="h-4 w-4 shrink-0 text-red-400" />;
  }
  if (status === "pending") {
    return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#B8965D]" />;
  }
  return <Circle className="h-4 w-4 shrink-0 text-[#243656]" />;
}

export function NinetySecondDemoPanel({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoJourneyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runDemo() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/demo/journey", { method: "POST" });
      if (res.status === 401) {
        throw new Error(
          "Sign in to run the live demo in production mode, or set APP_MODE=demo (or ENABLE_LIVE_DEMO=true) for a no-login presentation."
        );
      }
      const data = (await res.json()) as DemoJourneyResult & { error?: string };
      if (!res.ok && !data.steps) {
        throw new Error(data.error ?? "Demo journey failed");
      }
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo journey failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-[#243656] bg-[#0D1524] p-5"
          : "space-y-8"
      }
    >
      <div className={compact ? undefined : "rounded-xl border border-[#243656] bg-[#0D1524] p-5 sm:p-6"}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#FFFFFF] sm:text-base">
              90-Second Business Journey
            </h3>
            <p className="mt-1 max-w-2xl text-xs text-[#9AABC4] sm:text-sm">
              One click runs the full story: inbound lead → AI sales &amp; marketing →
              human alert → deal won → invoice → portal → project → COO monitoring.
            </p>
          </div>
          <Button
            type="button"
            onClick={runDemo}
            disabled={loading}
            className="bg-[#B8965D] text-black hover:bg-[#C9AA72]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run live demo
              </>
            )}
          </Button>
        </div>

        {!result && !loading && (
          <ol className="mt-5 space-y-2 border-t border-[#243656] pt-4">
            {FLOW.map((step, index) => (
              <li key={step} className="flex items-center gap-2 text-sm text-[#9AABC4]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#243656] text-[10px] text-[#B8965D]">
                  {index + 1}
                </span>
                {step}
                {index < FLOW.length - 1 && (
                  <span className="ml-auto hidden text-[#243656] sm:inline">↓</span>
                )}
              </li>
            ))}
          </ol>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-[#8B3A45]/45 bg-[#2A1218] px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>

      {result && (
        <div className="space-y-4">
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              result.ok
                ? "border-[#4DA6FF]/30 bg-[#0A2A33] text-[#4DA6FF]"
                : "border-[#8B3A45]/45 bg-[#2A1218] text-[#F0A0A8]"
            }`}
          >
            {result.ok
              ? "Journey complete — open any step below to present the story."
              : "Journey stopped before completion. Review the steps below."}
          </div>

          <ol className="space-y-3">
            {result.steps.map((step) => (
              <li
                key={step.id}
                className="rounded-lg border border-[#243656] bg-[#040608] px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <StepIcon
                    status={loading ? "pending" : step.status}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#FFFFFF]">{step.label}</p>
                    <p className="mt-1 text-xs text-[#9AABC4]">{step.summary}</p>
                    {step.href && (
                      <Link
                        href={step.href}
                        className="mt-2 inline-block text-xs font-medium text-[#B8965D] hover:underline"
                      >
                        Open →
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {result.ok && result.links && (
            <div className="flex flex-wrap gap-2 border-t border-[#243656] pt-4">
              {Object.entries(result.links).map(([key, href]) =>
                href ? (
                  <Link
                    key={key}
                    href={href}
                    className="rounded-lg border border-[#243656] px-3 py-1.5 text-xs text-[#FFFFFF] hover:border-[#B8965D]/40"
                  >
                    {key.replace(/_/g, " ")}
                  </Link>
                ) : null
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
