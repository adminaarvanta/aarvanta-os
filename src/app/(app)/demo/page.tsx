import { Clapperboard } from "lucide-react";
import { NinetySecondDemoPanel } from "@/components/demo/ninety-second-demo-panel";

export default function DemoPage() {
  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#F5E6C8] sm:text-xl">
          <Clapperboard className="h-5 w-5 text-[#D4AF37]" />
          Live Demo
        </h2>
        <p className="text-xs text-[#A89878] sm:text-sm">
          Present the complete business journey in under 90 seconds — no channel setup required.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <NinetySecondDemoPanel />
      </div>
    </>
  );
}

export const metadata = { title: "90-Second Demo" };
