"use client";

import { usePathname } from "next/navigation";
import { FeatureGate } from "@/components/billing/plan-ui";
import { usePathAccess, usePlan } from "@/components/billing/plan-context";
import { UpgradeBanner } from "@/components/billing/plan-ui";

const PATH_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp OS",
  voice: "Voice OS",
  calling: "Calling",
  crm: "CRM",
  workforce: "AI Workforce",
  projects: "Projects",
  workflows: "Workflows",
  hr: "HR",
  finance: "Finance",
  payroll: "Payroll",
  analytics: "Analytics",
  knowledge: "Knowledge Hub",
  build: "Build",
  portal: "Client portal",
  writing: "Writing",
};

export function PlanAwareMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const plan = usePlan();
  const { locked, explore, key } = usePathAccess(pathname);
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  const label = PATH_LABELS[segment] ?? segment;

  const lowCredits =
    plan &&
    plan.creditsPercent !== null &&
    plan.creditsPercent >= 85 &&
    !locked;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {lowCredits ? (
        <div className="shrink-0 border-b border-border-subtle px-4 py-2">
          <UpgradeBanner
            variant="warning"
            title="AI credits running low"
            message={`You've used ${plan.creditsPercent}% of this month's Business Capacity on ${plan.planName}.`}
            href="/billing"
          />
        </div>
      ) : null}
      <FeatureGate
        locked={locked}
        explore={explore}
        featureLabel={label}
        planName={plan?.planName}
      >
        {children}
      </FeatureGate>
    </div>
  );
}
