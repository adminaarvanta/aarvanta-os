import type { z } from "zod";
import type { SitePreferences } from "@/types/site-builder";
import type { sitePreferencesSchema } from "@/lib/site-builder/schemas";

export function normalizeSitePreferences(
  data: z.infer<typeof sitePreferencesSchema>
): SitePreferences {
  return {
    ...data,
    referenceUrl: data.referenceUrl || undefined,
    referenceScreenshots: data.referenceScreenshots ?? [],
    deployment: {
      hostingProvider: "aws_ec2",
      domain: {
        status: data.deployment.domain.status,
        selectedDomain: data.deployment.domain.selectedDomain,
        tld: data.deployment.domain.tld,
        priceAnnual: data.deployment.domain.priceAnnual,
        currency: data.deployment.domain.currency,
        autoRenew: data.deployment.domain.autoRenew,
        registrarOrderId: data.deployment.domain.registrarOrderId,
        purchasedAt: data.deployment.domain.purchasedAt,
        expiresAt: data.deployment.domain.expiresAt,
      },
      ec2: {
        region: data.deployment.ec2.region,
        instanceType: data.deployment.ec2.instanceType,
        stackName: data.deployment.ec2.stackName,
        sslEnabled: data.deployment.ec2.sslEnabled,
        autoDeployOnApprove: data.deployment.ec2.autoDeployOnApprove,
      },
    },
  };
}

export const DEFAULT_DEPLOYMENT: SitePreferences["deployment"] = {
  hostingProvider: "aws_ec2",
  domain: {
    status: "none",
    currency: "GBP",
    autoRenew: true,
  },
  ec2: {
    region: "eu-west-2",
    instanceType: "t3.small",
    sslEnabled: true,
    autoDeployOnApprove: false,
  },
};
