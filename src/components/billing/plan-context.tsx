"use client";

import { createContext, useContext, useMemo } from "react";
import type { FeatureAccess, PlanFeatureMatrix, PlanLimits } from "@/lib/billing/plan-catalog";
import {
  featureKeyForModuleId,
  featureKeyForPath,
  hasMinAccess,
  type PlanFeatureKey,
} from "@/lib/billing/module-access";
import type { EntitlementsClient } from "@/lib/billing/entitlements";
import type { PublicPlanId } from "@/types/platform-modules";

const PlanContext = createContext<EntitlementsClient | null>(null);

export function PlanProvider({
  value,
  children,
}: {
  value: EntitlementsClient | null;
  children: React.ReactNode;
}) {
  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): EntitlementsClient | null {
  return useContext(PlanContext);
}

export function useFeatureAccess(key: PlanFeatureKey): FeatureAccess {
  const plan = usePlan();
  if (!plan) return "full";
  return plan.features[key];
}

export function usePathAccess(pathname: string): {
  key: PlanFeatureKey | "ungated" | null;
  access: FeatureAccess | "ungated";
  locked: boolean;
  explore: boolean;
} {
  const plan = usePlan();
  const key = featureKeyForPath(pathname);
  if (!key || key === "ungated" || !plan) {
    return { key, access: "ungated", locked: false, explore: false };
  }
  const access = plan.features[key];
  return {
    key,
    access,
    locked: access === "none",
    explore: access === "explore",
  };
}

export function isModuleLocked(
  plan: EntitlementsClient | null,
  moduleId: string
): boolean {
  if (!plan) return false;
  const key = featureKeyForModuleId(moduleId);
  if (!key || key === "ungated") return false;
  return plan.features[key] === "none";
}

export function isNavHrefVisible(
  plan: EntitlementsClient | null,
  href: string
): boolean {
  if (!plan || href === "#all-tools") return true;
  const key = featureKeyForPath(href);
  if (!key || key === "ungated") return true;
  return plan.features[key] !== "none";
}

/** True when the nav destination is on the plan but locked (show with Pro badge). */
export function isNavHrefLocked(
  plan: EntitlementsClient | null,
  href: string
): boolean {
  if (!plan || href === "#all-tools") return false;
  const key = featureKeyForPath(href);
  if (!key || key === "ungated") return false;
  return plan.features[key] === "none";
}

export function canUseFeature(
  plan: EntitlementsClient | null,
  key: PlanFeatureKey,
  min: FeatureAccess = "lite"
): boolean {
  if (!plan) return true;
  return hasMinAccess(plan.features[key], min);
}

export function usePlanMeta(): {
  planId: PublicPlanId;
  planName: string;
  limits: PlanLimits;
  features: PlanFeatureMatrix;
} | null {
  const plan = usePlan();
  return useMemo(() => {
    if (!plan) return null;
    return {
      planId: plan.planId,
      planName: plan.planName,
      limits: plan.limits,
      features: plan.features,
    };
  }, [plan]);
}
